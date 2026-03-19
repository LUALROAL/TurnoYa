using Microsoft.Extensions.Configuration;
using Microsoft.Extensions.Logging;
using System.Net.Http;
using System.Text;
using System.Text.Json;
using System.Threading.Tasks;
using TurnoYa.Application.DTOs.Appointment;
using TurnoYa.Application.Interfaces;

namespace TurnoYa.Infrastructure.Services
{
    public class TelegramBotService : ITelegramBotService
    {
        private readonly HttpClient _httpClient;
        private readonly ILogger<TelegramBotService> _logger;
        private readonly string _botToken;
        private const int MaxRetries = 3;
        private const int BaseDelayMs = 1000;

        private static int _failureCount = 0;
        private static int _successCount = 0;
        private const int CircuitBreakerThreshold = 5;
        private const int CircuitBreakerRecoveryThreshold = 3;
        private static bool _circuitBreakerOpen = false;

        public TelegramBotService(HttpClient httpClient, IConfiguration configuration, ILogger<TelegramBotService> logger)
        {
            _httpClient = httpClient;
            _botToken = configuration["Telegram:BotToken"] ?? throw new System.ArgumentNullException("Telegram:BotToken no está configurado.");
            _logger = logger;
        }

        public async Task SendMessageAsync(string chatId, string text)
        {
            await ExecuteWithRetryAndCircuitBreakerAsync(() => SendMessageInternalAsync(chatId, text));
        }

        private async Task SendMessageInternalAsync(string chatId, string text)
        {
            var url = $"https://api.telegram.org/bot{_botToken}/sendMessage";
            var payload = new
            {
                chat_id = chatId,
                text = text,
                parse_mode = "Markdown"
            };

            var jsonPayload = JsonSerializer.Serialize(payload);
            var content = new StringContent(jsonPayload, Encoding.UTF8, "application/json");

            var response = await _httpClient.PostAsync(url, content);
            response.EnsureSuccessStatusCode();
        }

        public async Task SendMessageWithButtonsAsync(string chatId, string text, string appointmentId)
        {
            await ExecuteWithRetryAndCircuitBreakerAsync(() => SendMessageWithButtonsInternalAsync(chatId, text, appointmentId));
        }

        private async Task SendMessageWithButtonsInternalAsync(string chatId, string text, string appointmentId)
        {
            var url = $"https://api.telegram.org/bot{_botToken}/sendMessage";
            var payload = new
            {
                chat_id = chatId,
                text = text,
                parse_mode = "Markdown",
                reply_markup = new
                {
                    inline_keyboard = new[]
                    {
                        new[]
                        {
                            new { text = "✅ Aceptar", callback_data = $"confirm_{appointmentId}" },
                            new { text = "❌ Rechazar", callback_data = $"cancel_{appointmentId}" }
                        }
                    }
                }
            };

            var jsonPayload = JsonSerializer.Serialize(payload);
            var content = new StringContent(jsonPayload, Encoding.UTF8, "application/json");

            var response = await _httpClient.PostAsync(url, content);
            response.EnsureSuccessStatusCode();
        }

        public async Task SendStatusNotificationAsync(string chatId, string status, AppointmentDto appointment)
        {
            await ExecuteWithRetryAndCircuitBreakerAsync(() => SendStatusNotificationInternalAsync(chatId, status, appointment));
        }

        private async Task SendStatusNotificationInternalAsync(string chatId, string status, AppointmentDto appointment)
        {
            var statusText = GetStatusText(status);
            var message = $"*Tu cita ha sido {statusText}*\n\n" +
                          $"📅 *Fecha:* {appointment.ScheduledDate:dd/MM/yyyy}\n" +
                          $"⏰ *Hora:* {appointment.ScheduledDate:HH:mm}\n" +
                          $"🏪 *Negocio:* {appointment.BusinessName}\n" +
                          $"💇 *Servicio:* {appointment.ServiceName}";

            await SendMessageInternalAsync(chatId, message);
        }

        public async Task AnswerCallbackQueryAsync(string callbackId, string? message = null)
        {
            await ExecuteWithRetryAndCircuitBreakerAsync(() => AnswerCallbackQueryInternalAsync(callbackId, message));
        }

        private async Task AnswerCallbackQueryInternalAsync(string callbackId, string? message = null)
        {
            var url = $"https://api.telegram.org/bot{_botToken}/answerCallbackQuery";
            var payload = new
            {
                callback_query_id = callbackId,
                text = message
            };

            var jsonPayload = JsonSerializer.Serialize(payload);
            var content = new StringContent(jsonPayload, Encoding.UTF8, "application/json");

            var response = await _httpClient.PostAsync(url, content);
            response.EnsureSuccessStatusCode();
        }

        public async Task SendReminderNotificationAsync(string chatId, AppointmentDto appointment)
        {
            await ExecuteWithRetryAndCircuitBreakerAsync(() => SendReminderNotificationInternalAsync(chatId, appointment));
        }

        private async Task SendReminderNotificationInternalAsync(string chatId, AppointmentDto appointment)
        {
            var timeRemaining = appointment.ScheduledDate - DateTime.Now;
            var hoursRemaining = (int)timeRemaining.TotalHours;
            var minutesRemaining = timeRemaining.Minutes;

            var timeText = hoursRemaining > 0 
                ? $"{hoursRemaining} hora(s) y {minutesRemaining} minutos"
                : $"{minutesRemaining} minutos";

            var message = $"⏰ *Recordatorio de tu cita*\n\n" +
                          $"Tu cita comienza en {timeText}\n\n" +
                          $"📅 *Fecha:* {appointment.ScheduledDate:dd/MM/yyyy}\n" +
                          $"⏰ *Hora:* {appointment.ScheduledDate:HH:mm}\n" +
                          $"🏪 *Negocio:* {appointment.BusinessName}\n" +
                          $"💇 *Servicio:* {appointment.ServiceName}\n\n" +
                          $"¡No olvides asistir!";

            await SendMessageInternalAsync(chatId, message);
        }

        private async Task ExecuteWithRetryAndCircuitBreakerAsync(Func<Task> action)
        {
            if (_circuitBreakerOpen)
            {
                _logger.LogWarning("Circuit breaker is open. Skipping Telegram notification.");
                throw new InvalidOperationException("Circuit breaker is open. Telegram notifications are temporarily disabled.");
            }

            int attempt = 0;
            Exception? lastException = null;

            while (attempt < MaxRetries)
            {
                try
                {
                    await action();
                    RecordSuccess();
                    return;
                }
                catch (Exception ex)
                {
                    lastException = ex;
                    attempt++;
                    _logger.LogWarning(ex, "Telegram API call failed. Attempt {Attempt} of {MaxRetries}", attempt, MaxRetries);

                    if (attempt < MaxRetries)
                    {
                        var delay = BaseDelayMs * (int)Math.Pow(2, attempt - 1);
                        _logger.LogInformation("Retrying after {Delay}ms", delay);
                        await Task.Delay(delay);
                    }
                }
            }

            RecordFailure();
            throw new InvalidOperationException($"Failed to send Telegram notification after {MaxRetries} attempts.", lastException);
        }

        private void RecordSuccess()
        {
            _successCount++;
            _failureCount = 0;

            if (_successCount >= CircuitBreakerRecoveryThreshold && _circuitBreakerOpen)
            {
                _circuitBreakerOpen = false;
                _successCount = 0;
                _logger.LogInformation("Circuit breaker closed. Telegram notifications resumed.");
            }
        }

        private void RecordFailure()
        {
            _failureCount++;
            _successCount = 0;

            if (_failureCount >= CircuitBreakerThreshold)
            {
                _circuitBreakerOpen = true;
                _logger.LogError("Circuit breaker opened due to consecutive failures. Telegram notifications will be paused.");
            }
        }

        private string GetStatusText(string status)
        {
            return status.ToLower() switch
            {
                "confirmed" or "confirmada" => "confirmada",
                "cancelled" or "cancelada" => "cancelada",
                "completed" or "completada" => "completada",
                "noshow" or "no-show" or "no se presentó" => "no asistida",
                _ => status
            };
        }
    }
}
