using System;

namespace TurnoYa.Core.Entities
{
    /// <summary>
    /// Permisos granulares para cada empleado por negocio.
    /// Permite al owner configurar qué acciones puede realizar cada empleado.
    /// </summary>
    public class EmployeePermission : BaseEntity
    {
        /// <summary>
        /// ID del empleado asociado a estos permisos.
        /// </summary>
        public Guid EmployeeId { get; set; }
        
        // Appointment permissions
        
        /// <summary>
        /// Permite ver las citas asignadas al empleado.
        /// </summary>
        public bool CanViewAppointments { get; set; }
        
        /// <summary>
        /// Permite aceptar citas pendientes asignadas al empleado.
        /// </summary>
        public bool CanAcceptAppointments { get; set; }
        
        /// <summary>
        /// Permite rechazar citas asignadas al empleado.
        /// </summary>
        public bool CanRejectAppointments { get; set; }
        
        /// <summary>
        /// Permite cancelar citas asignadas al empleado.
        /// </summary>
        public bool CanCancelAppointments { get; set; }
        
        /// <summary>
        /// Permite reprogramar citas asignadas al empleado.
        /// </summary>
        public bool CanRescheduleAppointments { get; set; }
        
        // Schedule permissions
        
        /// <summary>
        /// Permite gestionar el horario del empleado (disponibilidad, bloqueos).
        /// </summary>
        public bool CanManageSchedule { get; set; }
        
        // Services permissions
        
        /// <summary>
        /// Permite ver los servicios disponibles del negocio.
        /// </summary>
        public bool CanViewServices { get; set; }
        
        /// <summary>
        /// Permite gestionar los servicios del negocio (agregar, modificar, eliminar).
        /// </summary>
        public bool CanManageServices { get; set; }

        /// <summary>
        /// Navigation property al empleado.
        /// </summary>
        public Employee? Employee { get; set; }
    }
}
