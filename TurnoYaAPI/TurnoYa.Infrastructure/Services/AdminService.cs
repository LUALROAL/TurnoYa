using AutoMapper;
using Microsoft.EntityFrameworkCore;
using TurnoYa.Application.DTOs.Admin;
using TurnoYa.Application.DTOs.Auth;
using TurnoYa.Application.Interfaces;
using TurnoYa.Infrastructure.Data;

namespace TurnoYa.Infrastructure.Services;

/// <summary>
/// Implementación del servicio de administración
/// </summary>
public class AdminService : IAdminService
{
    private readonly ApplicationDbContext _context;
    private readonly IMapper _mapper;

    public AdminService(ApplicationDbContext context, IMapper mapper)
    {
        _context = context;
        _mapper = mapper;
    }

    public async Task<PagedUsersResponseDto> SearchUsersAsync(SearchUsersDto searchDto)
    {
        var query = _context.Users.AsQueryable();

        // Filtrar por término de búsqueda (email, nombre o apellido)
        if (!string.IsNullOrWhiteSpace(searchDto.SearchTerm))
        {
            var searchLower = searchDto.SearchTerm.ToLower();
            query = query.Where(u => 
                u.Email.ToLower().Contains(searchLower) ||
                u.FirstName.ToLower().Contains(searchLower) ||
                u.LastName.ToLower().Contains(searchLower));
        }

        // Filtrar por rol
        if (!string.IsNullOrWhiteSpace(searchDto.Role))
        {
            query = query.Where(u => u.Role == searchDto.Role);
        }

        // Obtener total de registros
        var totalCount = await query.CountAsync();

        // Aplicar paginación
        var users = await query
            .OrderBy(u => u.Email)
            .Skip((searchDto.Page - 1) * searchDto.PageSize)
            .Take(searchDto.PageSize)
            .ToListAsync();

        var userDtos = _mapper.Map<List<UserDto>>(users);

        return new PagedUsersResponseDto
        {
            Users = userDtos,
            TotalCount = totalCount,
            Page = searchDto.Page,
            PageSize = searchDto.PageSize
        };
    }
}
