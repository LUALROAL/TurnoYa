using System.Security.Claims;
using TurnoYa.Core.Entities;

namespace TurnoYa.Application.Interfaces;

/// <summary>
/// Servicio para generación y validación de tokens JWT
/// </summary>
public interface ITokenService
{
    /// <summary>
    /// Genera un token de acceso JWT para el usuario
    /// </summary>
    /// <param name="user">Usuario para el cual generar el token</param>
    /// <returns>Token JWT como string</returns>
    string GenerateAccessToken(User user);

    /// <summary>
    /// Genera un refresh token aleatorio
    /// </summary>
    /// <returns>Refresh token como string</returns>
    string GenerateRefreshToken();

    /// <summary>
    /// Valida un token JWT
    /// </summary>
    /// <param name="token">Token a validar</param>
    /// <returns>ClaimsPrincipal si el token es válido, null si no lo es</returns>
    ClaimsPrincipal? ValidateToken(string token);

    /// <summary>
    /// Obtiene el principal de un token expirado (para refresh)
    /// </summary>
    /// <param name="token">Token expirado</param>
    /// <returns>ClaimsPrincipal extraído del token</returns>
    ClaimsPrincipal? GetPrincipalFromExpiredToken(string token);
}
