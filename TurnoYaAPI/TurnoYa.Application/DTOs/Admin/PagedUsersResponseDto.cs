using TurnoYa.Application.DTOs.Auth;

namespace TurnoYa.Application.DTOs.Admin;

/// <summary>
/// Respuesta paginada de usuarios
/// </summary>
public class PagedUsersResponseDto
{
    public IEnumerable<UserDto> Users { get; set; } = new List<UserDto>();
    public int TotalCount { get; set; }
    public int Page { get; set; }
    public int PageSize { get; set; }
    public int TotalPages => (int)Math.Ceiling((double)TotalCount / PageSize);
}
