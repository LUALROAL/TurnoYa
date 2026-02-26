using System;
using System.Collections.Generic;

namespace TurnoYa.Core.Entities
{
    public class EmployeeSchedule
    {
        public Guid Id { get; set; }
        public Guid EmployeeId { get; set; }
        public int AppointmentDuration { get; set; } = 30;
        public Employee? Employee { get; set; }
        public ICollection<EmployeeWorkingDay> WorkingDays { get; set; } = new List<EmployeeWorkingDay>();

        public EmployeeSchedule() {}
    }
}