using System;

namespace TurnoYa.Core.Entities
{
    public class EmployeeBreakTime
    {
        public Guid Id { get; set; }
        public Guid WorkingDayId { get; set; }
        public TimeSpan StartTime { get; set; }
        public TimeSpan EndTime { get; set; }
        public EmployeeWorkingDay? WorkingDay { get; set; }

        public EmployeeBreakTime() {}
    }
}