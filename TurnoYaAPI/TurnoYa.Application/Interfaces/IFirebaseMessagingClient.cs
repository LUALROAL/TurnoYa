namespace TurnoYa.Application.Interfaces;

/// <summary>
/// Wrapper around Firebase Admin SDK messaging operations.
/// Permite mocking en unit tests sin depender de Firebase SDK estático.
/// </summary>
public interface IFirebaseMessagingClient
{
    /// <summary>
    /// Envía un mensaje FCM y retorna el MessageId o un error.
    /// </summary>
    /// <param name="token">Token FCM del dispositivo destino.</param>
    /// <param name="title">Título de la notificación.</param>
    /// <param name="body">Cuerpo del mensaje.</param>
    /// <param name="data">Datos adicionales.</param>
    /// <returns>Tupla con (success, messageId, errorCode, errorMessage).</returns>
    Task<(bool Success, string? MessageId, string? ErrorCode, string? ErrorMessage)> SendAsync(
        string token, string title, string body, Dictionary<string, string>? data);
}
