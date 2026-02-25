using System;
using System.Collections.Generic;
using System.Linq;
using System.Threading.Tasks;
using TurnoYa.Core.Entities;
using TurnoYa.Application.Interfaces;
using TurnoYa.Core.Interfaces;
using TurnoYa.Application.DTOs.Business;

namespace TurnoYa.Application.Services
{
    public class BusinessScheduleService : IBusinessScheduleService
    {
        private readonly IBusinessScheduleRepository _repository;

        public BusinessScheduleService(IBusinessScheduleRepository repository)
        {
            _repository = repository;
        }

        public async Task<WorkingHoursDto?> GetByBusinessIdAsync(Guid businessId)
        {
            var schedule = await _repository.GetByBusinessIdAsync(businessId);
            if (schedule == null)
                return null;

            return MapToDto(schedule);
        }

        public async Task CreateAsync(Guid businessId, WorkingHoursDto dto)
        {
            var schedule = new BusinessSchedule
            {
                Id = Guid.NewGuid(),
                BusinessId = businessId
            };
            schedule.WorkingDays = MapWorkingDays(dto, schedule);
            await _repository.AddAsync(schedule);
        }

        public async Task UpdateAsync(Guid businessId, WorkingHoursDto dto)
        {
            var existing = await _repository.GetByBusinessIdAsync(businessId);
            if (existing == null)
                throw new Exception("No existe horario para el negocio");

            // Eliminar el horario existente (en cascada elimina días, bloques y descansos)
            await _repository.DeleteAsync(existing);

            // Crear uno nuevo con los datos actualizados
            await CreateAsync(businessId, dto);
        }

        public async Task DeleteAsync(Guid businessId)
        {
            var schedule = await _repository.GetByBusinessIdAsync(businessId);
            if (schedule != null)
                await _repository.DeleteAsync(schedule);
        }

        // ===== MÉTODOS PRIVADOS DE MAPEO =====

        private static WorkingHoursDto MapToDto(BusinessSchedule schedule)
        {
            var dto = new WorkingHoursDto();

            // Inicializar todos los días como cerrados por defecto
            var defaultDay = new DayScheduleDto { IsOpen = false };
            dto.Monday = defaultDay;
            dto.Tuesday = defaultDay;
            dto.Wednesday = defaultDay;
            dto.Thursday = defaultDay;
            dto.Friday = defaultDay;
            dto.Saturday = defaultDay;
            dto.Sunday = defaultDay;

            foreach (var wd in schedule.WorkingDays)
            {
                var dayDto = new DayScheduleDto
                {
                    IsOpen = wd.IsOpen
                };

                var block = wd.TimeBlocks?.FirstOrDefault();
                if (block != null)
                {
                    dayDto.OpenTime = block.StartTime.ToString(@"hh\:mm");
                    dayDto.CloseTime = block.EndTime.ToString(@"hh\:mm");
                }

                var breakTime = wd.BreakTimes?.FirstOrDefault();
                if (breakTime != null)
                {
                    dayDto.BreakStartTime = breakTime.StartTime.ToString(@"hh\:mm");
                    dayDto.BreakEndTime = breakTime.EndTime.ToString(@"hh\:mm");
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

        private static List<BusinessWorkingDay> MapWorkingDays(WorkingHoursDto dto, BusinessSchedule schedule)
        {
            var days = new List<BusinessWorkingDay>();
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
                var workingDay = new BusinessWorkingDay
                {
                    Id = Guid.NewGuid(),
                    DayOfWeek = dayOfWeek,
                    IsOpen = dayDto.IsOpen,
                    BusinessSchedule = schedule,
                    TimeBlocks = new List<BusinessTimeBlock>(),
                    BreakTimes = new List<BusinessBreakTime>()
                };

                if (dayDto.IsOpen && !string.IsNullOrEmpty(dayDto.OpenTime) && !string.IsNullOrEmpty(dayDto.CloseTime))
                {
                    workingDay.TimeBlocks.Add(new BusinessTimeBlock
                    {
                        Id = Guid.NewGuid(),
                        StartTime = TimeSpan.Parse(dayDto.OpenTime),
                        EndTime = TimeSpan.Parse(dayDto.CloseTime),
                        WorkingDay = workingDay
                    });
                }

                if (!string.IsNullOrEmpty(dayDto.BreakStartTime) && !string.IsNullOrEmpty(dayDto.BreakEndTime))
                {
                    workingDay.BreakTimes.Add(new BusinessBreakTime
                    {
                        Id = Guid.NewGuid(),
                        StartTime = TimeSpan.Parse(dayDto.BreakStartTime),
                        EndTime = TimeSpan.Parse(dayDto.BreakEndTime),
                        WorkingDay = workingDay
                    });
                }

                days.Add(workingDay);
            }

            return days;
        }
    }
}