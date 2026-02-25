using System;
using System.Collections.Generic;

namespace TurnoYa.Core.Entities
{
    public class EmployeeWorkingDay
    {
        public Guid Id { get; set; }
        public Guid EmployeeScheduleId { get; set; }
        public int DayOfWeek { get; set; }
        public bool IsOpen { get; set; }
        public required EmployeeSchedule EmployeeSchedule { get; set; } = null!;
        public ICollection<EmployeeTimeBlock> TimeBlocks { get; set; } = new List<EmployeeTimeBlock>();
        public ICollection<EmployeeBreakTime> BreakTimes { get; set; } = new List<EmployeeBreakTime>();

        public EmployeeWorkingDay() {}
    }
}