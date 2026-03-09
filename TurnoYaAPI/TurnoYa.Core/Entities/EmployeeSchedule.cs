using System;
using System.Collections.Generic;
using System.Text.Json;

namespace TurnoYa.Core.Entities
{
    public class EmployeeSchedule
    {
        public Guid Id { get; set; }
        public Guid EmployeeId { get; set; }
        public int AppointmentDuration { get; set; } = 30;
        public string? BlockedDatesJson { get; set; } // JSON array of dates

        public List<DateTime> BlockedDates
        {
            get => string.IsNullOrEmpty(BlockedDatesJson) ? new List<DateTime>() : JsonSerializer.Deserialize<List<DateTime>>(BlockedDatesJson) ?? new List<DateTime>();
            set => BlockedDatesJson = value.Count == 0 ? null : JsonSerializer.Serialize(value);
        }

        public Employee? Employee { get; set; }
        public ICollection<EmployeeWorkingDay> WorkingDays { get; set; } = new List<EmployeeWorkingDay>();

        public EmployeeSchedule() {}
    }
}