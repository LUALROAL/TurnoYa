using System;

namespace TurnoYa.Core.Entities
{
    public class EmployeeTimeBlock
    {
        public Guid Id { get; set; }
        public Guid WorkingDayId { get; set; }
        public TimeSpan StartTime { get; set; }
        public TimeSpan EndTime { get; set; }
        public required EmployeeWorkingDay WorkingDay { get; set; } = null!;

        public EmployeeTimeBlock() {}
    }
}