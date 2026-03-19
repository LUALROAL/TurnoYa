namespace TurnoYa.Core.Entities;

/// <summary>
/// Representa un token de dispositivo FCM registrado por un usuario para recibir notificaciones push.
/// Relación 1:N con User — un usuario puede tener múltiples dispositivos.
/// </summary>
public class UserDeviceToken : BaseEntity
{
    /// <summary>
    /// FK al usuario propietario del token.
    /// </summary>
    public Guid UserId { get; set; }

    /// <summary>
    /// Token FCM opaque string entregado por Firebase.
    /// </summary>
    public string Token { get; set; } = string.Empty;

    /// <summary>
    /// Plataforma del dispositivo: "android" | "ios".
    /// </summary>
    public string Platform { get; set; } = string.Empty;

    /// <summary>
    /// Indica si el token está activo. Se marca inactivo cuando FCM retorna
    /// InvalidRegistration o Unregistered.
    /// </summary>
    public bool IsActive { get; set; } = true;

    // Navigation property
    public User? User { get; set; }
}
