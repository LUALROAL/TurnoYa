namespace TurnoYa.Application.Interfaces;

/// <summary>
/// Respuesta del envío de una notificación push.
/// </summary>
public class SendResponse
{
    public bool Success { get; set; }
    public string? MessageId { get; set; }
    public string? ErrorCode { get; set; }
    public string? ErrorMessage { get; set; }

    public static SendResponse Succeeded(string messageId) => new()
    {
        Success = true,
        MessageId = messageId
    };

    public static SendResponse Failed(string errorCode, string errorMessage) => new()
    {
        Success = false,
        ErrorCode = errorCode,
        ErrorMessage = errorMessage
    };
}

/// <summary>
/// Servicio para enviar notificaciones push via Firebase Cloud Messaging (FCM).
/// Patrón retry + circuit breaker replicado de TelegramBotService.
/// </summary>
public interface IPushNotificationService
{
    /// <summary>
    /// Envía una notificación push a un token de dispositivo específico.
    /// </summary>
    /// <param name="token">Token FCM del dispositivo destino.</param>
    /// <param name="title">Título de la notificación.</param>
    /// <param name="body">Cuerpo del mensaje.</param>
    /// <param name="data">Datos adicionales (pares key-value) para enviar en la notificación.</param>
    /// <returns>Resultado del envío.</returns>
    Task<SendResponse> SendPushAsync(string token, string title, string body, Dictionary<string, string>? data = null);

    /// <summary>
    /// Envía una notificación push a TODOS los dispositivos registrados del usuario.
    /// Fallos individuales no bloquean el envío a otros dispositivos.
    /// </summary>
    /// <param name="userId">ID del usuario destino.</param>
    /// <param name="title">Título de la notificación.</param>
    /// <param name="body">Cuerpo del mensaje.</param>
    /// <param name="data">Datos adicionales.</param>
    Task SendToUserAsync(Guid userId, string title, string body, Dictionary<string, string>? data = null);

    /// <summary>
    /// Elimina un token de dispositivo específico (llamado cuando FCM retorna InvalidRegistration/Unregistered).
    /// </summary>
    /// <param name="deviceId">ID del registro de dispositivo.</param>
    Task DeleteTokenAsync(Guid deviceId);

    /// <summary>
    /// Elimina TODOS los tokens de un usuario (ej: logout completo).
    /// </summary>
    /// <param name="userId">ID del usuario.</param>
    Task DeleteUserTokensAsync(Guid userId);
}
