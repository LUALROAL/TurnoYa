using System;
using System.Collections.Generic;

namespace TurnoYa.Core.Entities
{
    public class BusinessWorkingDay
    {
        public Guid Id { get; set; }
        public Guid BusinessScheduleId { get; set; }
        public int DayOfWeek { get; set; } // 0=Lunes ... 6=Domingo
        public bool IsOpen { get; set; }
        public required BusinessSchedule BusinessSchedule { get; set; } = null!;
        public ICollection<BusinessTimeBlock> TimeBlocks { get; set; } = new List<BusinessTimeBlock>();
        public ICollection<BusinessBreakTime> BreakTimes { get; set; } = new List<BusinessBreakTime>();

        public BusinessWorkingDay() {}
    }
}