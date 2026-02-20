namespace TurnoYa.Application.DTOs.Admin;

/// <summary>
/// Respuesta paginada de usuarios
/// </summary>
public class PaginatedUsersDto
{
    public IEnumerable<UserManageDto> Users { get; set; } = new List<UserManageDto>();
    public int TotalCount { get; set; }
    public int PageNumber { get; set; }
    public int PageSize { get; set; }
    public int TotalPages => (TotalCount + PageSize - 1) / PageSize;
    public bool HasNextPage => PageNumber < TotalPages;
    public bool HasPreviousPage => PageNumber > 1;
}
