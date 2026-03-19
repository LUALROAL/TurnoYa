namespace TurnoYa.Application.DTOs.Device;

/// <summary>
/// DTO de entrada para registrar un token de dispositivo FCM.
/// </summary>
public record RegisterDeviceDto(string Token, string Platform); // Platform: "android" | "ios"
