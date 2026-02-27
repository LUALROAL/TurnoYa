using Microsoft.EntityFrameworkCore;
using System;
using System.Collections.Generic;
using System.Linq;
using System.Threading.Tasks;
using TurnoYa.Application.DTOs.Availability;
using TurnoYa.Application.Interfaces;
using TurnoYa.Core.Entities;
using TurnoYa.Core.Interfaces;
using TurnoYa.Infrastructure.Data;

namespace TurnoYa.Infrastructure.Services
{
    public class AvailabilityService : IAvailabilityService
    {
        private readonly IBusinessScheduleRepository _businessScheduleRepository;
        private readonly IEmployeeScheduleRepository _employeeScheduleRepository;
        private readonly IAppointmentRepository _appointmentRepository;
        private readonly ApplicationDbContext _context; // Para acceder a servicios y configuraciones

        public AvailabilityService(
            IBusinessScheduleRepository businessScheduleRepository,
            IEmployeeScheduleRepository employeeScheduleRepository,
            IAppointmentRepository appointmentRepository,
            ApplicationDbContext context)
        {
            _businessScheduleRepository = businessScheduleRepository;
            _employeeScheduleRepository = employeeScheduleRepository;
            _appointmentRepository = appointmentRepository;
            _context = context;
        }

        public async Task<AvailabilityResponseDto> GetAvailableSlotsAsync(Guid businessId, Guid serviceId, Guid? employeeId, DateTime date)
        {
            // 1. Obtener el servicio para conocer su duración
            var service = await _context.Services.FindAsync(serviceId);
            if (service == null)
                throw new Exception("Servicio no encontrado");

            // 2. Obtener la configuración del negocio (para buffer y otras reglas)
            var businessSettings = await _context.BusinessSettings
                .FirstOrDefaultAsync(bs => bs.BusinessId == businessId);
            int bufferTime = businessSettings?.BufferTime ?? 0; // minutos entre citas

            // 3. Determinar qué horario usar (negocio o empleado)
            List<TimeRange> workingRanges = new List<TimeRange>();
            if (employeeId.HasValue)
            {
                // Usar horario del empleado
                var employeeSchedule = await _employeeScheduleRepository.GetByEmployeeIdAsync(employeeId.Value);
                if (employeeSchedule == null)
                    throw new Exception("El empleado no tiene horario configurado");
                workingRanges = GetWorkingRangesForDate(employeeSchedule, date);
            }
            else
            {
                // Usar horario del negocio
                var businessSchedule = await _businessScheduleRepository.GetByBusinessIdAsync(businessId);
                if (businessSchedule == null)
                    throw new Exception("El negocio no tiene horario configurado");
                workingRanges = GetWorkingRangesForDate(businessSchedule, date);
            }

            if (!workingRanges.Any())
                return new AvailabilityResponseDto { Date = date.ToString("yyyy-MM-dd"), AvailableSlots = new List<string>() };

            // 4. Obtener citas ya agendadas para ese día (servicio o empleado)
            var startOfDay = date.Date;
            var endOfDay = startOfDay.AddDays(1).AddTicks(-1);
            var appointments = await _appointmentRepository.GetByBusinessIdAsync(businessId, startOfDay, endOfDay);
            if (employeeId.HasValue)
            {
                appointments = appointments.Where(a => a.EmployeeId == employeeId.Value).ToList();
            }
            else
            {
                // Si no hay empleado, considerar todas las citas del negocio? Depende de la lógica.
                // Podría ser que el servicio no requiera empleado, entonces las citas de cualquier empleado afectan.
                // Asumimos que si no hay empleado, las citas de todos los empleados (para ese servicio) afectan.
                appointments = appointments.Where(a => a.ServiceId == serviceId).ToList();
            }

            // 5. Generar slots disponibles
            var availableSlots = new List<string>();
            int slotDuration = service.Duration;
            foreach (var range in workingRanges)
            {
                var current = range.Start;
                while (current.AddMinutes(slotDuration) <= range.End)
                {
                    var slotStart = current;
                    var slotEnd = current.AddMinutes(slotDuration);
                    // Verificar si el slot está libre (sin conflicto con citas existentes)
                    bool isFree = !appointments.Any(a =>
                        a.Status != AppointmentStatus.Cancelled && a.Status != AppointmentStatus.Completed &&
                        slotStart < a.EndDate && slotEnd > a.ScheduledDate);
                    if (isFree)
                    {
                        availableSlots.Add(slotStart.ToString("HH:mm"));
                    }
                    // Avanzar según duración + buffer
                    current = current.AddMinutes(slotDuration + bufferTime);
                }
            }

            return new AvailabilityResponseDto
            {
                Date = date.ToString("yyyy-MM-dd"),
                AvailableSlots = availableSlots
            };
        }

        private List<TimeRange> GetWorkingRangesForDate(BusinessSchedule schedule, DateTime date)
        {
            // Implementar lógica para obtener los rangos de trabajo de un día específico
            // Considerando múltiples bloques de tiempo y descansos.
            // Por simplicidad, asumimos un solo bloque por día (el primero) y aplicamos descansos.
            // Esto debería mejorarse para soportar múltiples bloques.
            var dayOfWeek = (int)date.DayOfWeek; // 0=Sunday? Depende de la cultura. Ajustar según tu BD.
            // En tu BD, DayOfWeek va de 0=Lunes a 6=Domingo según veo en el código.
            // Convertir: .NET DayOfWeek: 0=Sunday, 1=Monday... 6=Saturday. Necesitas mapear.
            int mappedDay;
            switch (date.DayOfWeek)
            {
                case DayOfWeek.Monday: mappedDay = 0; break;
                case DayOfWeek.Tuesday: mappedDay = 1; break;
                case DayOfWeek.Wednesday: mappedDay = 2; break;
                case DayOfWeek.Thursday: mappedDay = 3; break;
                case DayOfWeek.Friday: mappedDay = 4; break;
                case DayOfWeek.Saturday: mappedDay = 5; break;
                case DayOfWeek.Sunday: mappedDay = 6; break;
                default: mappedDay = 0; break;
            }

            var workingDay = schedule.WorkingDays.FirstOrDefault(wd => wd.DayOfWeek == mappedDay);
            if (workingDay == null || !workingDay.IsOpen)
                return new List<TimeRange>();

            var ranges = new List<TimeRange>();
            // Por cada bloque de tiempo en el día
            foreach (var block in workingDay.TimeBlocks)
            {
                var start = date.Date.Add(block.StartTime);
                var end = date.Date.Add(block.EndTime);

                // Aplicar descansos (breaks) que interrumpen el bloque
                var breaks = workingDay.BreakTimes.Where(b => b.StartTime >= block.StartTime && b.EndTime <= block.EndTime)
                                                   .OrderBy(b => b.StartTime);
                var currentStart = start;
                foreach (var br in breaks)
                {
                    var breakStart = date.Date.Add(br.StartTime);
                    var breakEnd = date.Date.Add(br.EndTime);
                    if (currentStart < breakStart)
                    {
                        ranges.Add(new TimeRange { Start = currentStart, End = breakStart });
                    }
                    currentStart = breakEnd;
                }
                if (currentStart < end)
                {
                    ranges.Add(new TimeRange { Start = currentStart, End = end });
                }
            }
            return ranges;
        }

        private List<TimeRange> GetWorkingRangesForDate(EmployeeSchedule schedule, DateTime date)
        {
            // Similar a BusinessSchedule pero con EmployeeWorkingDay
            var dayOfWeek = MapearDia(date.DayOfWeek);
            var workingDay = schedule.WorkingDays.FirstOrDefault(wd => wd.DayOfWeek == dayOfWeek);
            if (workingDay == null || !workingDay.IsOpen)
                return new List<TimeRange>();

            var ranges = new List<TimeRange>();
            foreach (var block in workingDay.TimeBlocks)
            {
                var start = date.Date.Add(block.StartTime);
                var end = date.Date.Add(block.EndTime);
                var breaks = workingDay.BreakTimes.Where(b => b.StartTime >= block.StartTime && b.EndTime <= block.EndTime)
                                                   .OrderBy(b => b.StartTime);
                var currentStart = start;
                foreach (var br in breaks)
                {
                    var breakStart = date.Date.Add(br.StartTime);
                    var breakEnd = date.Date.Add(br.EndTime);
                    if (currentStart < breakStart)
                    {
                        ranges.Add(new TimeRange { Start = currentStart, End = breakStart });
                    }
                    currentStart = breakEnd;
                }
                if (currentStart < end)
                {
                    ranges.Add(new TimeRange { Start = currentStart, End = end });
                }
            }
            return ranges;
        }

        private int MapearDia(DayOfWeek day)
        {
            // Mapeo según tu BD (0=Lunes...6=Domingo)
            switch (day)
            {
                case DayOfWeek.Monday: return 0;
                case DayOfWeek.Tuesday: return 1;
                case DayOfWeek.Wednesday: return 2;
                case DayOfWeek.Thursday: return 3;
                case DayOfWeek.Friday: return 4;
                case DayOfWeek.Saturday: return 5;
                case DayOfWeek.Sunday: return 6;
                default: return 0;
            }
        }

        private class TimeRange
        {
            public DateTime Start { get; set; }
            public DateTime End { get; set; }
        }
    }
}