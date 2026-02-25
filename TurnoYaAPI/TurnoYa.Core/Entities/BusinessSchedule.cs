using System;
using System.Collections.Generic;

namespace TurnoYa.Core.Entities
{
    public class BusinessSchedule
    {
        public Guid Id { get; set; }
        public Guid BusinessId { get; set; }
        public int AppointmentDuration { get; set; } = 30;
        public Business? Business { get; set; }
        public ICollection<BusinessWorkingDay> WorkingDays { get; set; } = new List<BusinessWorkingDay>();

        public BusinessSchedule() { }
    }
}