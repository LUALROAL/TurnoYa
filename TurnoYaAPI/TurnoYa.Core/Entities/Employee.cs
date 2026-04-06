using System;
using System.Collections.Generic;

namespace TurnoYa.Core.Entities
{
    public class Employee : BaseEntity
    {
        public Guid BusinessId { get; set; }
        public Guid UserId { get; set; }
        public string Name { get; set; } = string.Empty;
        public string? Position { get; set; }
        public string? Bio { get; set; }
        public string? Email { get; set; }
        public string? Phone { get; set; }
        public string? PhotoUrl { get; set; }
        public byte[]? PhotoData { get; set; }
        public bool IsActive { get; set; }

        // Invitation system

        /// <summary>
        /// Código corto de 6 caracteres para compartir fácilmente (ej: ABC123)
        /// </summary>
        public string? InvitationCode { get; set; }

        /// <summary>
        /// Token único para invitación de empleado. Se genera cuando el owner crea un enlace de invitación.
        /// </summary>
        public string? InvitationToken { get; set; }

        /// <summary>
        /// Fecha de expiración del token de invitación. Por defecto, 7 días después de la generación.
        /// </summary>
        public DateTime? InvitationTokenExpiry { get; set; }

        /// <summary>
        /// Indica si el token de invitación ya fue utilizado por un empleado.
        /// </summary>
        public bool IsInvitationUsed { get; set; }

        public Business? Business { get; set; }
        public User? User { get; set; }
        public ICollection<Appointment> Appointments { get; set; } = new List<Appointment>();
        public ICollection<EmployeeServiceAssignment> EmployeeServices { get; set; } = new List<EmployeeServiceAssignment>();
        public EmployeeSchedule? Schedule { get; set; }
        public EmployeePermission? Permissions { get; set; }
    }
}