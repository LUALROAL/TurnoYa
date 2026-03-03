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
        private readonly IEmployeeRepository _employeeRepository;
        private readonly IEmployeeScheduleRepository _employeeScheduleRepository;
        private readonly IAppointmentRepository _appointmentRepository;
        private readonly ApplicationDbContext _context;

        public AvailabilityService(
            IEmployeeRepository employeeRepository,
            IEmployeeScheduleRepository employeeScheduleRepository,
            IAppointmentRepository appointmentRepository,
            ApplicationDbContext context)
        {
            _employeeRepository = employeeRepository;
            _employeeScheduleRepository = employeeScheduleRepository;
            _appointmentRepository = appointmentRepository;
            _context = context;
        }

        public async Task<AvailabilityResponseDto> GetAvailableSlotsAsync(Guid businessId, Guid serviceId, Guid? employeeId, DateTime date)
        {
            if (date.Date < DateTime.Today)
                throw new Exception("No se puede consultar disponibilidad para fechas pasadas");

            var service = await _context.Services
                .AsNoTracking()
                .FirstOrDefaultAsync(s => s.Id == serviceId && s.BusinessId == businessId && s.IsActive);
            if (service == null)
                throw new Exception("Servicio no encontrado");

            var businessSettings = await _context.BusinessSettings
                .AsNoTracking()
                .FirstOrDefaultAsync(bs => bs.BusinessId == businessId);
            int bufferTime = businessSettings?.BufferTime ?? 0;

            var dayStart = date.Date;
            var dayEnd = dayStart.AddDays(1);
            var employeeIds = await ResolveTargetEmployeesAsync(businessId, employeeId);

            if (!employeeIds.Any())
                return new AvailabilityResponseDto { Date = date.ToString("yyyy-MM-dd"), AvailableSlots = new List<string>() };

            var appointmentsByEmployee = await _appointmentRepository.GetActiveAppointmentsByEmployeesAsync(
                businessId,
                employeeIds,
                dayStart,
                dayEnd);

            var slotStarts = new SortedSet<DateTime>();
            foreach (var targetEmployeeId in employeeIds)
            {
                var schedule = await _employeeScheduleRepository.GetByEmployeeIdAsync(targetEmployeeId);
                if (schedule == null)
                    continue;

                var ranges = GetWorkingRangesForEmployeeDate(schedule, date);
                if (!ranges.Any())
                    continue;

                var employeeAppointments = appointmentsByEmployee.TryGetValue(targetEmployeeId, out var list)
                    ? list
                    : new List<Appointment>();

                foreach (var slotStart in BuildAvailableSlotStarts(ranges, employeeAppointments, service.Duration, bufferTime))
                    slotStarts.Add(slotStart);
            }

            var availableSlots = slotStarts
                .Select(start => $"{start:HH:mm} - {start.AddMinutes(service.Duration):HH:mm}")
                .ToList();

            return new AvailabilityResponseDto
            {
                Date = date.ToString("yyyy-MM-dd"),
                AvailableSlots = availableSlots
            };
        }

        public async Task<List<string>> GetAvailableDaysAsync(Guid businessId, Guid serviceId, Guid? employeeId, DateTime from, DateTime to)
        {
            var service = await _context.Services
                .AsNoTracking()
                .FirstOrDefaultAsync(s => s.Id == serviceId && s.BusinessId == businessId && s.IsActive);
            if (service == null)
                throw new Exception("Servicio no encontrado");

            var businessSettings = await _context.BusinessSettings
                .AsNoTracking()
                .FirstOrDefaultAsync(bs => bs.BusinessId == businessId);
            int bufferTime = businessSettings?.BufferTime ?? 0;
            int slotDuration = service.Duration;

            var targetEmployeeIds = await ResolveTargetEmployeesAsync(businessId, employeeId);
            if (!targetEmployeeIds.Any())
                return new List<string>();

            var fromDate = from.Date;
            var toDate = to.Date.AddDays(1);

            var appointmentsByEmployee = await _appointmentRepository.GetActiveAppointmentsByEmployeesAsync(
                businessId,
                targetEmployeeIds,
                fromDate,
                toDate);

            var availableDays = new List<string>();

            for (var date = from.Date; date <= to.Date; date = date.AddDays(1))
            {
                bool hasAtLeastOneSlot = false;

                foreach (var targetEmployeeId in targetEmployeeIds)
                {
                    var schedule = await _employeeScheduleRepository.GetByEmployeeIdAsync(targetEmployeeId);
                    if (schedule == null)
                        continue;

                    var ranges = GetWorkingRangesForEmployeeDate(schedule, date);
                    if (!ranges.Any())
                        continue;

                    var appointmentsOfDay = appointmentsByEmployee.TryGetValue(targetEmployeeId, out var allAppointments)
                        ? allAppointments.Where(a => a.ScheduledDate.Date == date.Date).ToList()
                        : new List<Appointment>();

                    if (BuildAvailableSlotStarts(ranges, appointmentsOfDay, slotDuration, bufferTime).Any())
                    {
                        hasAtLeastOneSlot = true;
                        break;
                    }
                }

                if (hasAtLeastOneSlot)
                    availableDays.Add(date.ToString("yyyy-MM-dd"));
            }

            return availableDays;
        }

        private async Task<List<Guid>> ResolveTargetEmployeesAsync(Guid businessId, Guid? employeeId)
        {
            if (employeeId.HasValue)
            {
                var employee = await _context.Employees
                    .AsNoTracking()
                    .FirstOrDefaultAsync(e => e.Id == employeeId.Value && e.BusinessId == businessId && e.IsActive);

                if (employee == null)
                    return new List<Guid>();

                return new List<Guid> { employee.Id };
            }

            var employees = await _employeeRepository.GetByBusinessIdAsync(businessId);
            return employees.Where(e => e.IsActive).Select(e => e.Id).ToList();
        }

        private IEnumerable<DateTime> BuildAvailableSlotStarts(
            List<TimeRange> workingRanges,
            List<Appointment> appointments,
            int serviceDuration,
            int bufferTime)
        {
            var result = new List<DateTime>();

            foreach (var range in workingRanges)
            {
                var current = range.Start;
                while (current.AddMinutes(serviceDuration + bufferTime) <= range.End)
                {
                    var slotStart = current;
                    var slotEndWithBuffer = current.AddMinutes(serviceDuration + bufferTime);

                    bool isFree = !appointments.Any(a =>
                        slotStart < a.EndDate && slotEndWithBuffer > a.ScheduledDate);

                    if (isFree)
                        result.Add(slotStart);

                    current = current.AddMinutes(serviceDuration + bufferTime);
                }
            }

            return result;
        }

        private List<TimeRange> GetWorkingRangesForEmployeeDate(EmployeeSchedule schedule, DateTime date)
        {
            int mappedDay = MapDayOfWeek(date.DayOfWeek);
            var workingDay = schedule.WorkingDays.FirstOrDefault(wd => wd.DayOfWeek == mappedDay);
            if (workingDay == null || !workingDay.IsOpen)
                return new List<TimeRange>();

            var ranges = new List<TimeRange>();
            foreach (var block in workingDay.TimeBlocks)
            {
                var blockStart = date.Date.Add(block.StartTime);
                var blockEnd = date.Date.Add(block.EndTime);

                var breaks = workingDay.BreakTimes
                    .Where(b => b.StartTime >= block.StartTime && b.EndTime <= block.EndTime)
                    .OrderBy(b => b.StartTime)
                    .ToList();

                var currentStart = blockStart;
                foreach (var br in breaks)
                {
                    var breakStart = date.Date.Add(br.StartTime);
                    var breakEnd = date.Date.Add(br.EndTime);
                    if (currentStart < breakStart)
                        ranges.Add(new TimeRange { Start = currentStart, End = breakStart });
                    currentStart = breakEnd;
                }
                if (currentStart < blockEnd)
                    ranges.Add(new TimeRange { Start = currentStart, End = blockEnd });
            }
            return ranges;
        }

        private int MapDayOfWeek(DayOfWeek day)
        {
            return day switch
            {
                DayOfWeek.Monday => 0,
                DayOfWeek.Tuesday => 1,
                DayOfWeek.Wednesday => 2,
                DayOfWeek.Thursday => 3,
                DayOfWeek.Friday => 4,
                DayOfWeek.Saturday => 5,
                DayOfWeek.Sunday => 6,
                _ => 0
            };
        }

        private class TimeRange
        {
            public DateTime Start { get; set; }
            public DateTime End { get; set; }
        }
    }
}