using System;
using System.Linq;
using System.Threading.Tasks;
using TurnoYa.Core.Entities;
using TurnoYa.Core.Interfaces;
using TurnoYa.Application.DTOs.Business;
using TurnoYa.Application.Interfaces;

namespace TurnoYa.Application.Services
{
    public class EmployeeScheduleService : IEmployeeScheduleService
    {
        private readonly IEmployeeScheduleRepository _repository;
        public EmployeeScheduleService(IEmployeeScheduleRepository repository)
        {
            _repository = repository;
        }
        public async Task<WorkingHoursDto?> GetByEmployeeIdAsync(Guid employeeId)
        {
            var schedule = await _repository.GetByEmployeeIdAsync(employeeId);
            if (schedule == null)
                return null;
            return MapToDto(schedule);
        }
        public async Task CreateAsync(Guid employeeId, WorkingHoursDto dto)
        {
            var schedule = new EmployeeSchedule
            {
                Id = Guid.NewGuid(),
                EmployeeId = employeeId,
                Employee = null!,
                WorkingDays = MapWorkingDays(dto)
            };
            await _repository.AddAsync(schedule);
        }
        public async Task UpdateAsync(Guid employeeId, WorkingHoursDto dto)
        {
            var existing = await _repository.GetByEmployeeIdAsync(employeeId);
            if (existing == null)
                throw new Exception("No existe horario para el empleado");
            existing.WorkingDays.Clear();
            foreach (var wd in MapWorkingDays(dto))
                existing.WorkingDays.Add(wd);
            await _repository.UpdateAsync(existing);
        }
        public async Task DeleteAsync(Guid employeeId)
        {
            var schedule = await _repository.GetByEmployeeIdAsync(employeeId);
            if (schedule != null)
                await _repository.DeleteAsync(schedule);
        }
        private static WorkingHoursDto MapToDto(EmployeeSchedule schedule)
        {
            var dto = new WorkingHoursDto();
            foreach (var wd in schedule.WorkingDays)
            {
                var dayDto = new DayScheduleDto
                {
                    IsOpen = wd.IsOpen
                };
                var block = wd.TimeBlocks?.FirstOrDefault();
                if (block != null)
                {
                    dayDto.OpenTime = block.StartTime.ToString("hh:mm");
                    dayDto.CloseTime = block.EndTime.ToString("hh:mm");
                }
                var breakTime = wd.BreakTimes?.FirstOrDefault();
                if (breakTime != null)
                {
                    dayDto.BreakStartTime = breakTime.StartTime.ToString("hh:mm");
                    dayDto.BreakEndTime = breakTime.EndTime.ToString("hh:mm");
                }
                switch (wd.DayOfWeek)
                {
                    case 0: dto.Monday = dayDto; break;
                    case 1: dto.Tuesday = dayDto; break;
                    case 2: dto.Wednesday = dayDto; break;
                    case 3: dto.Thursday = dayDto; break;
                    case 4: dto.Friday = dayDto; break;
                    case 5: dto.Saturday = dayDto; break;
                    case 6: dto.Sunday = dayDto; break;
                }
            }
            return dto;
        }
        private static List<EmployeeWorkingDay> MapWorkingDays(WorkingHoursDto dto)
        {
            var days = new List<EmployeeWorkingDay>();
            var dayDtos = new[]
            {
                (0, dto.Monday),
                (1, dto.Tuesday),
                (2, dto.Wednesday),
                (3, dto.Thursday),
                (4, dto.Friday),
                (5, dto.Saturday),
                (6, dto.Sunday)
            };
            foreach (var (dayOfWeek, dayDto) in dayDtos)
            {
                var workingDay = new EmployeeWorkingDay
                {
                    Id = Guid.NewGuid(),
                    DayOfWeek = dayOfWeek,
                    IsOpen = dayDto.IsOpen,
                    EmployeeSchedule = null!,
                    TimeBlocks = new List<EmployeeTimeBlock>(),
                    BreakTimes = new List<EmployeeBreakTime>()
                };
                if (dayDto.IsOpen && !string.IsNullOrEmpty(dayDto.OpenTime) && !string.IsNullOrEmpty(dayDto.CloseTime))
                {
                    workingDay.TimeBlocks.Add(new EmployeeTimeBlock
                    {
                        Id = Guid.NewGuid(),
                        StartTime = TimeSpan.Parse(dayDto.OpenTime),
                        EndTime = TimeSpan.Parse(dayDto.CloseTime),
                        WorkingDay = null!
                    });
                }
                if (!string.IsNullOrEmpty(dayDto.BreakStartTime) && !string.IsNullOrEmpty(dayDto.BreakEndTime))
                {
                    workingDay.BreakTimes.Add(new EmployeeBreakTime
                    {
                        Id = Guid.NewGuid(),
                        StartTime = TimeSpan.Parse(dayDto.BreakStartTime),
                        EndTime = TimeSpan.Parse(dayDto.BreakEndTime),
                        WorkingDay = null!
                    });
                }
                days.Add(workingDay);
            }
            return days;
        }
    }
}
