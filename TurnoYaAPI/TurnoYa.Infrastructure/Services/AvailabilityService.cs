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
        private readonly ApplicationDbContext _context;

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
            if (date.Date < DateTime.Today)
                throw new Exception("No se puede consultar disponibilidad para fechas pasadas");

            var service = await _context.Services.FindAsync(serviceId);
            if (service == null)
                throw new Exception("Servicio no encontrado");

            var businessSettings = await _context.BusinessSettings
                .FirstOrDefaultAsync(bs => bs.BusinessId == businessId);
            int bufferTime = businessSettings?.BufferTime ?? 0;

            List<TimeRange> workingRanges;
            if (employeeId.HasValue)
            {
                var schedule = await _employeeScheduleRepository.GetByEmployeeIdAsync(employeeId.Value);
                if (schedule == null)
                    throw new Exception("El empleado no tiene horario configurado");
                workingRanges = GetWorkingRangesForEmployeeDate(schedule, date);
            }
            else
            {
                var schedule = await _businessScheduleRepository.GetByBusinessIdAsync(businessId);
                if (schedule == null)
                    throw new Exception("El negocio no tiene horario configurado");
                workingRanges = GetWorkingRangesForBusinessDate(schedule, date);
            }

            if (!workingRanges.Any())
                return new AvailabilityResponseDto { Date = date.ToString("yyyy-MM-dd"), AvailableSlots = new List<string>() };

            var startOfDay = date.Date;
            var endOfDay = startOfDay.AddDays(1).AddTicks(-1);
            var appointments = await _appointmentRepository.GetByBusinessIdAsync(businessId, startOfDay, endOfDay);

            if (employeeId.HasValue)
                appointments = appointments.Where(a => a.EmployeeId == employeeId.Value).ToList();
            else
                appointments = appointments.Where(a => a.ServiceId == serviceId).ToList();

            appointments = appointments.Where(a => a.Status != AppointmentStatus.Cancelled && a.Status != AppointmentStatus.Completed).ToList();

            var availableSlots = new List<string>();
            int slotDuration = service.Duration;

            foreach (var range in workingRanges)
            {
                var current = range.Start;
                while (current.AddMinutes(slotDuration) <= range.End)
                {
                    var slotStart = current;
                    var slotEnd = current.AddMinutes(slotDuration);

                    bool isFree = !appointments.Any(a =>
                        slotStart < a.EndDate && slotEnd > a.ScheduledDate);

                    if (isFree)
                        availableSlots.Add(slotStart.ToString("HH:mm"));

                    current = current.AddMinutes(slotDuration + bufferTime);
                }
            }

            return new AvailabilityResponseDto
            {
                Date = date.ToString("yyyy-MM-dd"),
                AvailableSlots = availableSlots
            };
        }

        public async Task<List<string>> GetAvailableDaysAsync(Guid businessId, Guid serviceId, Guid? employeeId, DateTime from, DateTime to)
        {
            var service = await _context.Services.FindAsync(serviceId);
            if (service == null)
                throw new Exception("Servicio no encontrado");

            var businessSettings = await _context.BusinessSettings
                .FirstOrDefaultAsync(bs => bs.BusinessId == businessId);
            int bufferTime = businessSettings?.BufferTime ?? 0;
            int slotDuration = service.Duration;

            object scheduleObj = null;
            bool useBusiness = !employeeId.HasValue;
            if (useBusiness)
                scheduleObj = await _businessScheduleRepository.GetByBusinessIdAsync(businessId);
            else
                scheduleObj = await _employeeScheduleRepository.GetByEmployeeIdAsync(employeeId.Value);

            if (scheduleObj == null)
                return new List<string>();

            var appointments = await _appointmentRepository.GetByBusinessIdAsync(businessId, from, to);
            if (employeeId.HasValue)
                appointments = appointments.Where(a => a.EmployeeId == employeeId.Value).ToList();
            else
                appointments = appointments.Where(a => a.ServiceId == serviceId).ToList();
            appointments = appointments.Where(a => a.Status != AppointmentStatus.Cancelled && a.Status != AppointmentStatus.Completed).ToList();

            var availableDays = new List<string>();

            for (var date = from.Date; date <= to.Date; date = date.AddDays(1))
            {
                List<TimeRange> ranges;
                if (useBusiness)
                    ranges = GetWorkingRangesForBusinessDate((BusinessSchedule)scheduleObj, date);
                else
                    ranges = GetWorkingRangesForEmployeeDate((EmployeeSchedule)scheduleObj, date);

                if (!ranges.Any()) continue;

                var appointmentsOfDay = appointments.Where(a => a.ScheduledDate.Date == date).ToList();
                bool hasAtLeastOneSlot = false;

                foreach (var range in ranges)
                {
                    var current = range.Start;
                    while (current.AddMinutes(slotDuration) <= range.End)
                    {
                        var slotStart = current;
                        var slotEnd = current.AddMinutes(slotDuration);

                        bool isFree = !appointmentsOfDay.Any(a =>
                            slotStart < a.EndDate && slotEnd > a.ScheduledDate);

                        if (isFree)
                        {
                            hasAtLeastOneSlot = true;
                            break;
                        }

                        current = current.AddMinutes(slotDuration + bufferTime);
                    }
                    if (hasAtLeastOneSlot) break;
                }

                if (hasAtLeastOneSlot)
                    availableDays.Add(date.ToString("yyyy-MM-dd"));
            }

            return availableDays;
        }

        private List<TimeRange> GetWorkingRangesForBusinessDate(BusinessSchedule schedule, DateTime date)
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