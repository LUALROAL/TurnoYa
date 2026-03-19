using System;
using System.Threading.Tasks;
using Microsoft.EntityFrameworkCore;
using TurnoYa.Application.DTOs.Appointment;
using TurnoYa.Application.Interfaces;
using TurnoYa.Core.Entities;
using TurnoYa.Infrastructure.Data;

namespace TurnoYa.Infrastructure.Services
{
    public class TelegramCallbackHandler
    {
        private readonly ApplicationDbContext _context;
        private readonly IAppointmentService _appointmentService;
        private readonly ITelegramBotService _telegramBotService;

        public TelegramCallbackHandler(
            ApplicationDbContext context,
            IAppointmentService appointmentService,
            ITelegramBotService telegramBotService)
        {
            _context = context;
            _appointmentService = appointmentService;
            _telegramBotService = telegramBotService;
        }

        public async Task<CallbackResult> HandleCallbackAsync(string data, string chatId)
        {
            if (string.IsNullOrEmpty(data))
            {
                return new CallbackResult
                {
                    Success = false,
                    Message = "Datos de callback inválidos"
                };
            }

            var parts = data.Split('_', 2);
            if (parts.Length < 2)
            {
                return new CallbackResult
                {
                    Success = false,
                    Message = "Formato de callback inválido"
                };
            }

            var action = parts[0];
            var appointmentIdStr = parts[1];

            if (!Guid.TryParse(appointmentIdStr, out var appointmentId))
            {
                return new CallbackResult
                {
                    Success = false,
                    Message = "ID de cita inválido"
                };
            }

            var appointment = await _context.Appointments
                .Include(a => a.User)
                .Include(a => a.Business)
                .Include(a => a.Service)
                .FirstOrDefaultAsync(a => a.Id == appointmentId);

            if (appointment == null)
            {
                return new CallbackResult
                {
                    Success = false,
                    Message = "Cita no encontrada"
                };
            }

            bool success;
            string statusMessage;
            string? cancellationReason = null;

            switch (action.ToLower())
            {
                case "confirm":
                    success = await _appointmentService.ConfirmAppointmentAsync(appointmentId, appointment.Business.OwnerId);
                    statusMessage = success ? "Cita confirmada" : "No se pudo confirmar la cita";
                    break;
                case "cancel":
                    cancellationReason = "Cancelado por el cliente via Telegram";
                    success = await _appointmentService.CancelAppointmentAsync(appointmentId, appointment.UserId, cancellationReason);
                    statusMessage = success ? "Cita cancelada" : "No se pudo cancelar la cita";
                    break;
                default:
                    return new CallbackResult
                    {
                        Success = false,
                        Message = "Acción desconocida"
                    };
            }

            return new CallbackResult
            {
                Success = success,
                Message = statusMessage
            };
        }

        public (string? action, Guid? appointmentId) ParseCallbackData(string data)
        {
            if (string.IsNullOrEmpty(data))
                return (null, null);

            var parts = data.Split('_', 2);
            if (parts.Length < 2)
                return (null, null);

            if (!Guid.TryParse(parts[1], out var appointmentId))
                return (null, null);

            return (parts[0], appointmentId);
        }
    }

    public class CallbackResult
    {
        public bool Success { get; set; }
        public string Message { get; set; } = string.Empty;
    }
}
