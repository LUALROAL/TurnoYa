using Moq;
using TurnoYa.Application.Interfaces;
using TurnoYa.Infrastructure.Data;
using Microsoft.EntityFrameworkCore;
using TurnoYa.Core.Entities;
using System;
using System.Threading.Tasks;
using TurnoYa.Infrastructure.Services;

namespace TurnoYa.Tests.UnitTests
{
    public class TelegramCallbackHandlerTests
    {
        private readonly Mock<IAppointmentService> _appointmentServiceMock;
        private readonly Mock<ITelegramBotService> _telegramBotServiceMock;
        private readonly ApplicationDbContext _context;
        private readonly TelegramCallbackHandler _handler;

        public TelegramCallbackHandlerTests()
        {
            var options = new DbContextOptionsBuilder<ApplicationDbContext>()
                .UseInMemoryDatabase(databaseName: Guid.NewGuid().ToString())
                .Options;
            _context = new ApplicationDbContext(options);

            _appointmentServiceMock = new Mock<IAppointmentService>();
            _telegramBotServiceMock = new Mock<ITelegramBotService>();

            _handler = new TelegramCallbackHandler(
                _context,
                _appointmentServiceMock.Object,
                _telegramBotServiceMock.Object
            );
        }

        [Fact]
        public async Task HandleCallbackAsync_WithValidConfirmData_ParsesCorrectly()
        {
            var appointmentId = Guid.NewGuid();
            var chatId = "123456789";
            var callbackData = $"confirm_{appointmentId}";

            var business = new Business
            {
                Id = Guid.NewGuid(),
                Name = "Test Business",
                OwnerId = Guid.NewGuid()
            };
            var user = new User
            {
                Id = Guid.NewGuid(),
                FirstName = "Test",
                LastName = "User",
                Email = "test@test.com"
            };
            var service = new Core.Entities.Service
            {
                Id = Guid.NewGuid(),
                Name = "Test Service",
                BusinessId = business.Id
            };
            var appointment = new Appointment
            {
                Id = appointmentId,
                UserId = user.Id,
                BusinessId = business.Id,
                ServiceId = service.Id,
                Status = AppointmentStatus.Pending,
                ScheduledDate = DateTime.UtcNow.AddHours(1)
            };

            _context.Businesses.Add(business);
            _context.Users.Add(user);
            _context.Services.Add(service);
            _context.Appointments.Add(appointment);
            await _context.SaveChangesAsync();

            _appointmentServiceMock
                .Setup(x => x.ConfirmAppointmentAsync(It.IsAny<Guid>(), It.IsAny<Guid>()))
                .ReturnsAsync(true);

            var result = await _handler.HandleCallbackAsync(callbackData, chatId);

            Assert.True(result.Success);
            Assert.Equal("Cita confirmada", result.Message);
            _appointmentServiceMock.Verify(
                x => x.ConfirmAppointmentAsync(appointmentId, business.OwnerId),
                Times.Once);
        }

        [Fact]
        public async Task HandleCallbackAsync_WithValidCancelData_ParsesCorrectly()
        {
            var appointmentId = Guid.NewGuid();
            var chatId = "123456789";
            var callbackData = $"cancel_{appointmentId}";

            var business = new Business
            {
                Id = Guid.NewGuid(),
                Name = "Test Business",
                OwnerId = Guid.NewGuid()
            };
            var user = new User
            {
                Id = Guid.NewGuid(),
                FirstName = "Test",
                LastName = "User",
                Email = "test@test.com"
            };
            var service = new Core.Entities.Service
            {
                Id = Guid.NewGuid(),
                Name = "Test Service",
                BusinessId = business.Id
            };
            var appointment = new Appointment
            {
                Id = appointmentId,
                UserId = user.Id,
                BusinessId = business.Id,
                ServiceId = service.Id,
                Status = AppointmentStatus.Pending,
                ScheduledDate = DateTime.UtcNow.AddHours(1)
            };

            _context.Businesses.Add(business);
            _context.Users.Add(user);
            _context.Services.Add(service);
            _context.Appointments.Add(appointment);
            await _context.SaveChangesAsync();

            _appointmentServiceMock
                .Setup(x => x.CancelAppointmentAsync(It.IsAny<Guid>(), It.IsAny<Guid>(), It.IsAny<string>()))
                .ReturnsAsync(true);

            var result = await _handler.HandleCallbackAsync(callbackData, chatId);

            Assert.True(result.Success);
            Assert.Equal("Cita cancelada", result.Message);
            _appointmentServiceMock.Verify(
                x => x.CancelAppointmentAsync(appointmentId, user.Id, It.IsAny<string>()),
                Times.Once);
        }

        [Fact]
        public async Task HandleCallbackAsync_WithInvalidAppointmentId_ReturnsError()
        {
            var invalidAppointmentId = "not-a-guid";
            var chatId = "123456789";
            var callbackData = $"confirm_{invalidAppointmentId}";

            var result = await _handler.HandleCallbackAsync(callbackData, chatId);

            Assert.False(result.Success);
            Assert.Equal("ID de cita inválido", result.Message);
        }

        [Fact]
        public async Task HandleCallbackAsync_WithNonExistentAppointment_ReturnsError()
        {
            var nonExistentAppointmentId = Guid.NewGuid();
            var chatId = "123456789";
            var callbackData = $"confirm_{nonExistentAppointmentId}";

            var result = await _handler.HandleCallbackAsync(callbackData, chatId);

            Assert.False(result.Success);
            Assert.Equal("Cita no encontrada", result.Message);
        }

        [Fact]
        public async Task HandleCallbackAsync_WithUnknownAction_ReturnsError()
        {
            var appointmentId = Guid.NewGuid();
            var chatId = "123456789";
            var callbackData = $"unknown_{appointmentId}";

            var business = new Business
            {
                Id = Guid.NewGuid(),
                Name = "Test Business",
                OwnerId = Guid.NewGuid()
            };
            var user = new User
            {
                Id = Guid.NewGuid(),
                FirstName = "Test",
                LastName = "User",
                Email = "test@test.com"
            };
            var service = new Core.Entities.Service
            {
                Id = Guid.NewGuid(),
                Name = "Test Service",
                BusinessId = business.Id
            };
            var appointment = new Appointment
            {
                Id = appointmentId,
                UserId = user.Id,
                BusinessId = business.Id,
                ServiceId = service.Id,
                Status = AppointmentStatus.Pending,
                ScheduledDate = DateTime.UtcNow.AddHours(1)
            };

            _context.Businesses.Add(business);
            _context.Users.Add(user);
            _context.Services.Add(service);
            _context.Appointments.Add(appointment);
            await _context.SaveChangesAsync();

            var result = await _handler.HandleCallbackAsync(callbackData, chatId);

            Assert.False(result.Success);
            Assert.Equal("Acción desconocida", result.Message);
        }

        [Fact]
        public async Task HandleCallbackAsync_WithEmptyData_ReturnsError()
        {
            var result = await _handler.HandleCallbackAsync("", "123456789");

            Assert.False(result.Success);
            Assert.Equal("Datos de callback inválidos", result.Message);
        }

        [Fact]
        public async Task HandleCallbackAsync_WithInvalidFormat_ReturnsError()
        {
            var result = await _handler.HandleCallbackAsync("invalidformat", "123456789");

            Assert.False(result.Success);
            Assert.Equal("Formato de callback inválido", result.Message);
        }

        [Fact]
        public void ParseCallbackData_WithValidData_ReturnsCorrectValues()
        {
            var appointmentId = Guid.NewGuid();
            var callbackData = $"confirm_{appointmentId}";

            var (action, parsedAppointmentId) = _handler.ParseCallbackData(callbackData);

            Assert.Equal("confirm", action);
            Assert.Equal(appointmentId, parsedAppointmentId);
        }

        [Fact]
        public void ParseCallbackData_WithInvalidData_ReturnsNull()
        {
            var result = _handler.ParseCallbackData("invalid");

            Assert.Null(result.action);
            Assert.Null(result.appointmentId);
        }

        [Fact]
        public void ParseCallbackData_WithEmptyData_ReturnsNull()
        {
            var result = _handler.ParseCallbackData("");

            Assert.Null(result.action);
            Assert.Null(result.appointmentId);
        }

        [Fact]
        public void ParseCallbackData_WithCancelAction_ReturnsCorrectAction()
        {
            var appointmentId = Guid.NewGuid();
            var callbackData = $"cancel_{appointmentId}";

            var (action, parsedAppointmentId) = _handler.ParseCallbackData(callbackData);

            Assert.Equal("cancel", action);
            Assert.Equal(appointmentId, parsedAppointmentId);
        }
    }
}
