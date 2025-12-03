namespace TurnoYa.Application.DTOs.Admin;

/// <summary>
/// DTO para búsqueda y filtrado de usuarios
/// </summary>
public class SearchUsersDto
{
    /// <summary>
    /// Texto de búsqueda para email, nombre o apellido
    /// </summary>
    public string? SearchTerm { get; set; }

    /// <summary>
    /// Filtrar por rol específico
    /// </summary>
    public string? Role { get; set; }

    /// <summary>
    /// Número de página (base 1)
    /// </summary>
    public int Page { get; set; } = 1;

    /// <summary>
    /// Cantidad de elementos por página
    /// </summary>
    public int PageSize { get; set; } = 10;
}
