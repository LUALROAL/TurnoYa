using System;

namespace TurnoYa.Core.Entities
{
    public class BusinessBreakTime
    {
        public Guid Id { get; set; }
        public Guid WorkingDayId { get; set; }
        public TimeSpan StartTime { get; set; }
        public TimeSpan EndTime { get; set; }
        public required BusinessWorkingDay WorkingDay { get; set; } = null!;

        public BusinessBreakTime() {}
    }
}