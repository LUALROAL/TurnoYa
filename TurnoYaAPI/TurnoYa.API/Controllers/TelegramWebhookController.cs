using System;
using System.Text.Json;
using System.Threading.Tasks;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Configuration;
using Microsoft.Extensions.Logging;
using TurnoYa.Application.Interfaces;
using TurnoYa.Core.Entities;
using TurnoYa.Infrastructure.Data;
using TurnoYa.Infrastructure.Services;

namespace TurnoYaAPI.Controllers
{
    [ApiController]
    [Route("api/[controller]")]
    public class TelegramWebhookController : ControllerBase
    {
        private readonly ApplicationDbContext _context;
        private readonly ITelegramBotService _telegramService;
        private readonly TelegramCallbackHandler _callbackHandler;
        private readonly string _secretToken;
        private readonly ILogger<TelegramWebhookController> _logger;

        public TelegramWebhookController(
            ApplicationDbContext context, 
            ITelegramBotService telegramService,
            TelegramCallbackHandler callbackHandler,
            IConfiguration configuration,
            ILogger<TelegramWebhookController> logger)
        {
            _context = context;
            _telegramService = telegramService;
            _callbackHandler = callbackHandler;
            _secretToken = configuration["Telegram:SecretToken"] ?? "";
            _logger = logger;
        }

        protected virtual bool ValidateSecretToken()
        {
            if (string.IsNullOrEmpty(_secretToken))
                return true;

            if (!Request.Headers.TryGetValue("X-Telegram-Bot-Api-Secret-Token", out var providedToken))
                return false;

            return providedToken == _secretToken;
        }

        [HttpPost]
        public async Task<IActionResult> Post([FromBody] JsonElement update)
        {
            _logger.LogInformation("Telegram webhook request received");

            if (!ValidateSecretToken())
            {
                _logger.LogWarning("Telegram webhook request rejected: invalid or missing secret token");
                return Unauthorized("Invalid or missing secret token");
            }

            try
            {
                if (update.TryGetProperty("message", out var messageObj))
                {
                    _logger.LogDebug("Processing message update from Telegram");
                    
                    if (messageObj.TryGetProperty("text", out var textElement) && 
                        messageObj.TryGetProperty("chat", out var chatElement) && 
                        chatElement.TryGetProperty("id", out var chatIdElement))
                    {
                        var text = textElement.GetString() ?? "";
                        var chatId = chatIdElement.GetRawText();

                        _logger.LogInformation("Received message from chat {ChatId}: {Text}", chatId, text);

                        if (text.StartsWith("/start "))
                        {
                            var code = text.Substring(7).Trim();
                            _logger.LogInformation("Processing linking code: {Code}", code);
                            
                            var user = await _context.Users.FirstOrDefaultAsync(u => u.TelegramLinkingCode == code);
                            
                            if (user != null)
                            {
                                if (user.TelegramLinkingCodeExpiry.HasValue && user.TelegramLinkingCodeExpiry < DateTime.UtcNow)
                                {
                                    _logger.LogWarning("Linking code expired for user {UserId}", user.Id);
                                    await _telegramService.SendMessageAsync(chatId, "El código de vinculación ha expirado. Por favor, genera uno nuevo en la app de TurnoYa.");
                                    return Ok();
                                }

                                user.TelegramChatId = chatId;
                                user.TelegramLinkingCode = null;
                                user.TelegramLinkingCodeExpiry = null;
                                _context.Update(user);
                                await _context.SaveChangesAsync();
                                
                                _logger.LogInformation("Successfully linked Telegram account for user {UserId}", user.Id);
                                await _telegramService.SendMessageAsync(chatId, $"¡Hola {user.FirstName}! Has vinculado exitosamente tu cuenta de TurnoYa a este chat. A partir de ahora recibirás aquí tus notificaciones de citas.");
                            }
                            else
                            {
                                _logger.LogWarning("Invalid linking code attempted: {Code}", code);
                                await _telegramService.SendMessageAsync(chatId, "El código de vinculación es inválido o ya expiró. Por favor, genera uno nuevo en la app de TurnoYa.");
                            }
                        }
                    }
                }
                else if (update.TryGetProperty("callback_query", out var queryObj))
                {
                    _logger.LogDebug("Processing callback_query update from Telegram");
                    
                    if (queryObj.TryGetProperty("id", out var callbackIdElement) &&
                        queryObj.TryGetProperty("data", out var dataElement) &&
                        queryObj.TryGetProperty("message", out var messageObj2) &&
                        messageObj2.TryGetProperty("chat", out var chatElement2) &&
                        chatElement2.TryGetProperty("id", out var chatIdElement2))
                    {
                        var callbackId = callbackIdElement.GetRawText();
                        var data = dataElement.GetString() ?? "";
                        var chatId = chatIdElement2.GetRawText();

                        _logger.LogInformation("Processing callback from chat {ChatId} with data: {Data}", chatId, data);

                        var result = await _callbackHandler.HandleCallbackAsync(data, chatId);
                        
                        if (result.Success)
                        {
                            _logger.LogInformation("Callback processed successfully: {Message}", result.Message);
                        }
                        else
                        {
                            _logger.LogWarning("Callback processing failed: {Message}", result.Message);
                        }
                        
                        await _telegramService.AnswerCallbackQueryAsync(callbackId, result.Message);
                    }
                }
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error processing Telegram webhook request");
            }

            return Ok();
        }
    }
}
