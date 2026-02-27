using System.Collections.Generic;

namespace TurnoYa.Application.DTOs.Availability
{
    public class AvailabilityResponseDto
    {
        public string Date { get; set; } = string.Empty; // YYYY-MM-DD
        public List<string> AvailableSlots { get; set; } = new(); // HH:mm
    }
}