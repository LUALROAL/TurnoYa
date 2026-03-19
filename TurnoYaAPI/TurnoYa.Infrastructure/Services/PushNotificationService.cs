using Microsoft.Extensions.Configuration;
using Microsoft.Extensions.Logging;
using TurnoYa.Application.Interfaces;
using TurnoYa.Core.Interfaces;

namespace TurnoYa.Infrastructure.Services;

/// <summary>
/// Implementación de IPushNotificationService usando Firebase Admin SDK via IFirebaseMessagingClient.
/// Patrón retry + circuit breaker replicado de TelegramBotService para consistencia.
/// La inicialización de Firebase se delega a FirebaseMessagingClient.
/// </summary>
public class PushNotificationService : IPushNotificationService
{
    private readonly IUserDeviceTokenRepository _deviceTokenRepository;
    private readonly IFirebaseMessagingClient _firebaseClient;
    private readonly ILogger<PushNotificationService> _logger;
    
    // Patrón retry
    private const int MaxRetries = 3;
    private const int BaseDelayMs = 1000;
    
    // Patrón circuit breaker
    private static int _failureCount = 0;
    private static int _successCount = 0;
    private const int CircuitBreakerThreshold = 5;
    private const int CircuitBreakerRecoveryThreshold = 3;
    private static bool _circuitBreakerOpen = false;

    public PushNotificationService(
        IUserDeviceTokenRepository deviceTokenRepository,
        IFirebaseMessagingClient firebaseClient,
        IConfiguration configuration,
        ILogger<PushNotificationService> logger)
    {
        _deviceTokenRepository = deviceTokenRepository;
        _firebaseClient = firebaseClient;
        _logger = logger;
        // Firebase initialization is handled by FirebaseMessagingClient
    }

    public async Task<SendResponse> SendPushAsync(string token, string title, string body, Dictionary<string, string>? data = null)
    {
        if (_circuitBreakerOpen)
        {
            _logger.LogWarning("Circuit breaker está abierto. Saltando notificación push.");
            return SendResponse.Failed("CIRCUIT_OPEN", "Circuit breaker está abierto. Notificaciones temporalmente deshabilitadas.");
        }

        return await ExecuteWithRetryAndCircuitBreakerAsync(async () =>
        {
            var (success, messageId, errorCode, errorMessage) = 
                await _firebaseClient.SendAsync(token, title, body, data);

            if (success)
            {
                _logger.LogInformation("Notificación push enviada exitosamente. MessageId: {MessageId}", messageId);
                return SendResponse.Succeeded(messageId!);
            }

            // Return failure response from Firebase
            return SendResponse.Failed(errorCode ?? "UNKNOWN", errorMessage ?? "Error desconocido");
        });
    }

    public async Task SendToUserAsync(Guid userId, string title, string body, Dictionary<string, string>? data = null)
    {
        var devices = await _deviceTokenRepository.GetByUserIdAsync(userId);
        var deviceList = devices.ToList();
        
        if (!deviceList.Any())
        {
            _logger.LogDebug("Usuario {UserId} no tiene dispositivos registrados. No se envía notificación.", userId);
            return;
        }
        
        _logger.LogInformation("Enviando notificación push a {Count} dispositivos para usuario {UserId}.", deviceList.Count, userId);
        
        var tasks = deviceList.Select(async device =>
        {
            try
            {
                var result = await SendPushAsync(device.Token, title, body, data);
                
                // Si FCM indica token inválido, eliminarlo
                if (!result.Success && IsInvalidTokenError(result.ErrorCode))
                {
                    _logger.LogWarning("Token inválido detectado para DeviceId {DeviceId}, eliminando. Error: {Error}", 
                        device.Id, result.ErrorMessage);
                    await _deviceTokenRepository.DeleteAsync(device.Id);
                }
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error al enviar notificación a dispositivo {DeviceId}", device.Id);
                // No lanzar — errores individuales no deben afectar otros dispositivos
            }
        });
        
        await Task.WhenAll(tasks);
    }

    public async Task DeleteTokenAsync(Guid deviceId)
    {
        await _deviceTokenRepository.DeleteAsync(deviceId);
        _logger.LogInformation("Token de dispositivo {DeviceId} eliminado.", deviceId);
    }

    public async Task DeleteUserTokensAsync(Guid userId)
    {
        await _deviceTokenRepository.DeleteByUserIdAsync(userId);
        _logger.LogInformation("Todos los tokens del usuario {UserId} eliminados.", userId);
    }

    private async Task<SendResponse> ExecuteWithRetryAndCircuitBreakerAsync(Func<Task<SendResponse>> action)
    {
        if (_circuitBreakerOpen)
        {
            return SendResponse.Failed("CIRCUIT_OPEN", "Circuit breaker está abierto.");
        }

        int attempt = 0;
        Exception? lastException = null;

        while (attempt < MaxRetries)
        {
            try
            {
                var result = await action();
                
                if (result.Success)
                {
                    RecordSuccess();
                    return result;
                }
                
                // Error de Firebase pero no de red — no hacer retry para errores de token
                if (IsInvalidTokenError(result.ErrorCode))
                {
                    RecordFailure();
                    return result;
                }
                
                // Otros errores — throw para activar retry
                throw new InvalidOperationException($"FCM error: {result.ErrorCode} - {result.ErrorMessage}");
            }
            catch (InvalidOperationException ex) when (ex.Message.StartsWith("FCM error:"))
            {
                lastException = ex;
                attempt++;
                _logger.LogWarning(ex, "Firebase messaging falló. Intento {Attempt} de {MaxRetries}", attempt, MaxRetries);

                if (attempt < MaxRetries)
                {
                    var delay = BaseDelayMs * (int)Math.Pow(2, attempt - 1);
                    _logger.LogInformation("Reintentando después de {Delay}ms", delay);
                    await Task.Delay(delay);
                }
            }
            catch (Exception ex)
            {
                lastException = ex;
                attempt++;
                _logger.LogWarning(ex, "Error al enviar notificación push. Intento {Attempt} de {MaxRetries}", attempt, MaxRetries);

                if (attempt < MaxRetries)
                {
                    var delay = BaseDelayMs * (int)Math.Pow(2, attempt - 1);
                    _logger.LogInformation("Reintentando después de {Delay}ms", delay);
                    await Task.Delay(delay);
                }
            }
        }

        RecordFailure();
        _logger.LogError(lastException, "Falló el envío de notificación push después de {MaxRetries} intentos.", MaxRetries);
        return SendResponse.Failed("MAX_RETRIES_EXCEEDED", $"Falló después de {MaxRetries} intentos: {lastException?.Message}");
    }

    private void RecordSuccess()
    {
        _successCount++;
        _failureCount = 0;

        if (_successCount >= CircuitBreakerRecoveryThreshold && _circuitBreakerOpen)
        {
            _circuitBreakerOpen = false;
            _successCount = 0;
            _logger.LogInformation("Circuit breaker cerrado. Notificaciones push reactivadas.");
        }
    }

    private void RecordFailure()
    {
        _failureCount++;
        _successCount = 0;

        if (_failureCount >= CircuitBreakerThreshold)
        {
            _circuitBreakerOpen = true;
            _logger.LogError("Circuit breaker abierto debido a fallos consecutivos. Notificaciones push serán pausadas.");
        }
    }

    /// <summary>
    /// Determina si el código de error de FCM indica un token inválido que debe ser eliminado.
    /// </summary>
    private static bool IsInvalidTokenError(string? errorCode)
    {
        if (string.IsNullOrWhiteSpace(errorCode)) return false;
        
        var normalizedCode = errorCode.ToUpperInvariant();
        return normalizedCode switch
        {
            "INVALID_ARGUMENT" => true, // Token malformado
            "UNREGISTERED" => true, // Token expirado o dado de baja
            "INVALIDARGUMENT" => true, // Firebase SDK naming
            _ => false
        };
    }
}
