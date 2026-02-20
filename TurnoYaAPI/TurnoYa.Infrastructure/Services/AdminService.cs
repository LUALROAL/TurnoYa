using AutoMapper;
using Microsoft.EntityFrameworkCore;
using TurnoYa.Application.DTOs.Admin;
using TurnoYa.Application.DTOs.Auth;
using TurnoYa.Application.Interfaces;
using TurnoYa.Core.Entities;
using TurnoYa.Infrastructure.Data;
using Microsoft.Extensions.Logging;

namespace TurnoYa.Infrastructure.Services;

/// <summary>
/// Implementación del servicio de administración
/// </summary>
public class AdminService : IAdminService
{
    private readonly ApplicationDbContext _context;
    private readonly IMapper _mapper;
    private readonly ILogger<AdminService> _logger;

    public AdminService(ApplicationDbContext context, IMapper mapper, ILogger<AdminService> logger)
    {
        _context = context;
        _mapper = mapper;
        _logger = logger;
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

        var userDtos = _mapper.Map<List<UserManageDto>>(users);

        return new PagedUsersResponseDto
        {
            Users = userDtos,
            TotalCount = totalCount,
            Page = searchDto.Page,
            PageSize = searchDto.PageSize
        };
    }

    public async Task<UserManageDto> GetUserAsync(string userId)
    {
        if (string.IsNullOrWhiteSpace(userId))
        {
            throw new ArgumentException("El ID del usuario es requerido");
        }

        var user = await _context.Users
            .FirstOrDefaultAsync(u => u.Id == new Guid(userId));

        if (user == null)
        {
            throw new InvalidOperationException($"Usuario con ID {userId} no encontrado");
        }

        return _mapper.Map<UserManageDto>(user);
    }

    public async Task<UserManageDto> UpdateUserStatusAsync(string userId, UpdateUserStatusDto updateStatusDto)
    {
        if (string.IsNullOrWhiteSpace(userId))
        {
            throw new ArgumentException("El ID del usuario es requerido");
        }

        var user = await _context.Users
            .FirstOrDefaultAsync(u => u.Id == new Guid(userId));

        if (user == null)
        {
            throw new InvalidOperationException($"Usuario con ID {userId} no encontrado");
        }

        user.IsBlocked = updateStatusDto.IsBlocked;
        user.BlockReason = updateStatusDto.BlockReason;
        user.BlockUntil = updateStatusDto.BlockUntil;

        try
        {
            _context.Users.Update(user);
            await _context.SaveChangesAsync();

            _logger.LogInformation("Estado del usuario actualizado: {UserId}, Blocked: {IsBlocked}", userId, user.IsBlocked);

            return _mapper.Map<UserManageDto>(user);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error al actualizar estado del usuario: {UserId}", userId);
            throw new InvalidOperationException("Error al actualizar el estado del usuario", ex);
        }
    }

    public async Task<UserDto> UpdateUserRoleAsync(string userId, string newRole)
    {
        if (string.IsNullOrWhiteSpace(userId))
        {
            throw new ArgumentException("El ID del usuario es requerido");
        }

        if (string.IsNullOrWhiteSpace(newRole))
        {
            throw new ArgumentException("El nuevo rol es requerido");
        }

        // Validar que sea un rol válido
        var validRoles = new[] { "Customer", "Owner", "Admin" };
        if (!validRoles.Contains(newRole))
        {
            throw new ArgumentException($"Rol inválido: {newRole}. Roles válidos: {string.Join(", ", validRoles)}");
        }

        var user = await _context.Users
            .FirstOrDefaultAsync(u => u.Id == new Guid(userId));

        if (user == null)
        {
            throw new InvalidOperationException($"Usuario con ID {userId} no encontrado");
        }

        var oldRole = user.Role;
        user.Role = newRole;

        try
        {
            _context.Users.Update(user);
            await _context.SaveChangesAsync();

            _logger.LogInformation("Rol del usuario actualizado: {UserId}, OldRole: {OldRole}, NewRole: {NewRole}", userId, oldRole, newRole);

            return _mapper.Map<UserDto>(user);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error al actualizar rol del usuario: {UserId}", userId);
            throw new InvalidOperationException("Error al actualizar el rol del usuario", ex);
        }
    }
}
