using System.Threading.Tasks;
using TurnoYa.Application.DTOs.Appointment;

namespace TurnoYa.Application.Interfaces
{
    public interface ITelegramBotService
    {
        Task SendMessageAsync(string chatId, string text);
        Task SendMessageWithButtonsAsync(string chatId, string text, string appointmentId);
        Task SendStatusNotificationAsync(string chatId, string status, AppointmentDto appointment);
        Task AnswerCallbackQueryAsync(string callbackId, string? message = null);
        Task SendReminderNotificationAsync(string chatId, AppointmentDto appointment);
    }
}
