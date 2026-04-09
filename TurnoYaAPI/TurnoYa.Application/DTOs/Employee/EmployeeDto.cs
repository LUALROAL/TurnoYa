using System;

namespace TurnoYa.Application.DTOs.Employee
{
    public class EmployeeDto
    {
        public Guid Id { get; set; }
        public Guid BusinessId { get; set; }
        public Guid? UserId { get; set; } // Nullable - null cuando no está vinculado
        public string FirstName { get; set; } = string.Empty;
        public string LastName { get; set; } = string.Empty;
        public string FullName => $"{FirstName} {LastName}";
        public string? Phone { get; set; }
        public string? Email { get; set; }
        public string? Position { get; set; }
        public string? Bio { get; set; }
        public string? ProfilePictureUrl { get; set; }
        public string? PhotoBase64 { get; set; } // Para enviar al frontend
        public List<Guid> ServiceIds { get; set; } = new();
        public bool IsActive { get; set; }
        public DateTime CreatedAt { get; set; }
        public DateTime UpdatedAt { get; set; }
        
        // Campo calculado que indica si el empleado está vinculado a un usuario
        public bool IsLinked => UserId.HasValue && UserId.Value != Guid.Empty;
    }
}