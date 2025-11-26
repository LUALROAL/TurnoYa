using System.Text.Json;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Logging;
using TurnoYa.Application.DTOs.Appointment;
using TurnoYa.Application.DTOs.Business;
using TurnoYa.Application.Interfaces;
using TurnoYa.Infrastructure.Data;

namespace TurnoYa.Infrastructure.Services;

/// <summary>
/// Servicio para calcular disponibilidad de citas
/// </summary>
public class AvailabilityService : IAvailabilityService
{
    private readonly ApplicationDbContext _context;
    private readonly ILogger<AvailabilityService> _logger;

    public AvailabilityService(
        ApplicationDbContext context,
        ILogger<AvailabilityService> logger)
    {
        _context = context;
        _logger = logger;
    }

    public async Task<IEnumerable<TimeSlotDto>> GetAvailableSlotsAsync(AvailabilityQueryDto query)
    {
        try
        {
            // Validar que el negocio existe
            var business = await _context.Businesses
                .Include(b => b.Settings)
                .FirstOrDefaultAsync(b => b.Id == query.BusinessId);

            if (business == null)
                return Array.Empty<TimeSlotDto>();

            // Validar que el servicio existe y pertenece al negocio
            var service = await _context.Services
                .FirstOrDefaultAsync(s => s.Id == query.ServiceId && s.BusinessId == query.BusinessId);

            if (service == null)
                return Array.Empty<TimeSlotDto>();

            // Si se especifica un empleado, validar que existe
            if (query.EmployeeId.HasValue)
            {
                var employee = await _context.Employees
                    .FirstOrDefaultAsync(e => e.Id == query.EmployeeId.Value && e.BusinessId == query.BusinessId);

                if (employee == null)
                    return Array.Empty<TimeSlotDto>();
            }

            // Obtener configuración del negocio
            var settings = business.Settings ?? new Core.Entities.BusinessSettings
            {
                SlotDuration = 30,
                BufferTime = 0,
                MaxAdvanceBookingDays = 90,
                MinAdvanceBookingMinutes = 60
            };

            // Validar que la fecha esté dentro del rango permitido
            var now = DateTime.UtcNow;
            var minDate = now.AddMinutes(settings.MinAdvanceBookingMinutes);
            var maxDate = now.AddDays(settings.MaxAdvanceBookingDays);

            if (query.Date.Date < minDate.Date || query.Date.Date > maxDate.Date)
                return Array.Empty<TimeSlotDto>();

            // Obtener horarios de trabajo del día de la semana
            var dayOfWeek = query.Date.DayOfWeek;
            var workingHours = GetWorkingHoursForDay(business.Settings?.WorkingHours, dayOfWeek);

            if (workingHours == null || !workingHours.IsOpen)
                return Array.Empty<TimeSlotDto>();

            // Obtener citas existentes para ese día
            var existingAppointments = await _context.Appointments
                .Where(a => a.BusinessId == query.BusinessId
                    && a.ScheduledDate.Date == query.Date.Date
                    && (a.Status == Core.Entities.AppointmentStatus.Pending || a.Status == Core.Entities.AppointmentStatus.Confirmed)
                    && (!query.EmployeeId.HasValue || a.EmployeeId == query.EmployeeId.Value))
                .ToListAsync();

            // Generar slots de tiempo
            var slots = GenerateTimeSlots(
                query.Date,
                workingHours,
                service.Duration,
                settings.BufferTime,
                existingAppointments,
                now);

            return slots;
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error al calcular disponibilidad");
            return Array.Empty<TimeSlotDto>();
        }
    }

    private DayScheduleDto? GetWorkingHoursForDay(string? workingHoursJson, DayOfWeek dayOfWeek)
    {
        if (string.IsNullOrEmpty(workingHoursJson))
        {
            // Horario por defecto: Lunes a Viernes 9am-6pm
            if (dayOfWeek >= DayOfWeek.Monday && dayOfWeek <= DayOfWeek.Friday)
            {
                return new DayScheduleDto
                {
                    IsOpen = true,
                    OpenTime = "09:00",
                    CloseTime = "18:00"
                };
            }
            return new DayScheduleDto { IsOpen = false };
        }

        try
        {
            var workingHours = JsonSerializer.Deserialize<WorkingHoursDto>(workingHoursJson);
            if (workingHours == null) return null;

            return dayOfWeek switch
            {
                DayOfWeek.Monday => workingHours.Monday,
                DayOfWeek.Tuesday => workingHours.Tuesday,
                DayOfWeek.Wednesday => workingHours.Wednesday,
                DayOfWeek.Thursday => workingHours.Thursday,
                DayOfWeek.Friday => workingHours.Friday,
                DayOfWeek.Saturday => workingHours.Saturday,
                DayOfWeek.Sunday => workingHours.Sunday,
                _ => null
            };
        }
        catch
        {
            return null;
        }
    }

    private List<TimeSlotDto> GenerateTimeSlots(
        DateTime date,
        DayScheduleDto workingHours,
        int serviceDuration,
        int bufferTime,
        List<Core.Entities.Appointment> existingAppointments,
        DateTime now)
    {
        var slots = new List<TimeSlotDto>();

        // Parsear horarios de apertura y cierre
        if (!TimeSpan.TryParse(workingHours.OpenTime, out var openTime) ||
            !TimeSpan.TryParse(workingHours.CloseTime, out var closeTime))
        {
            return slots;
        }

        var currentSlot = date.Date.Add(openTime);
        var endOfDay = date.Date.Add(closeTime);

        while (currentSlot.Add(TimeSpan.FromMinutes(serviceDuration)) <= endOfDay)
        {
            var slotEnd = currentSlot.Add(TimeSpan.FromMinutes(serviceDuration));

            // Verificar si el slot está en el pasado
            if (currentSlot < now)
            {
                currentSlot = currentSlot.Add(TimeSpan.FromMinutes(serviceDuration + bufferTime));
                continue;
            }

            // Verificar si hay descanso/almuerzo
            var isDuringBreak = false;
            if (!string.IsNullOrEmpty(workingHours.BreakStartTime) &&
                !string.IsNullOrEmpty(workingHours.BreakEndTime))
            {
                if (TimeSpan.TryParse(workingHours.BreakStartTime, out var breakStart) &&
                    TimeSpan.TryParse(workingHours.BreakEndTime, out var breakEnd))
                {
                    var slotTime = currentSlot.TimeOfDay;
                    if (slotTime >= breakStart && slotTime < breakEnd)
                    {
                        isDuringBreak = true;
                    }
                }
            }

            // Verificar si hay conflicto con citas existentes
            var hasConflict = existingAppointments.Any(a =>
                (currentSlot >= a.ScheduledDate && currentSlot < a.EndDate) ||
                (slotEnd > a.ScheduledDate && slotEnd <= a.EndDate) ||
                (currentSlot <= a.ScheduledDate && slotEnd >= a.EndDate));

            var isAvailable = !isDuringBreak && !hasConflict;

            slots.Add(new TimeSlotDto
            {
                StartTime = currentSlot,
                EndTime = slotEnd,
                IsAvailable = isAvailable,
                Reason = isDuringBreak ? "Horario de descanso" : (hasConflict ? "Ocupado" : null)
            });

            currentSlot = currentSlot.Add(TimeSpan.FromMinutes(serviceDuration + bufferTime));
        }

        return slots;
    }
}
