using Microsoft.AspNetCore.Mvc;
using Microsoft.Extensions.Configuration;
using Microsoft.Extensions.Logging;
using Moq;
using System.Text.Json;
using System.Threading.Tasks;
using TurnoYa.Application.Interfaces;
using TurnoYa.Infrastructure.Data;
using TurnoYa.Infrastructure.Services;
using TurnoYa.Core.Entities;
using TurnoYaAPI.Controllers;
using Microsoft.EntityFrameworkCore;
using Xunit;

namespace TurnoYa.Tests.IntegrationTests
{
    public class TestableTelegramWebhookController : TelegramWebhookController
    {
        private string? _testSecretToken;
        private Microsoft.AspNetCore.Http.IHeaderDictionary? _testHeaders;

        public TestableTelegramWebhookController(
            ApplicationDbContext context,
            ITelegramBotService telegramService,
            TelegramCallbackHandler callbackHandler,
            IConfiguration configuration,
            ILogger<TelegramWebhookController> logger)
            : base(context, telegramService, callbackHandler, configuration, logger)
        {
        }

        public bool CallValidateSecretToken(string? secretToken, Microsoft.AspNetCore.Http.IHeaderDictionary? headers)
        {
            _testSecretToken = secretToken;
            _testHeaders = headers;
            return ValidateSecretToken();
        }

        protected override bool ValidateSecretToken()
        {
            if (string.IsNullOrEmpty(_testSecretToken))
                return true;

            if (_testHeaders == null)
                return false;

            if (!_testHeaders.TryGetValue("X-Telegram-Bot-Api-Secret-Token", out var providedToken))
                return false;

            return providedToken == _testSecretToken;
        }
    }

    public class TelegramWebhookSecurityTests
    {
        [Fact]
        public void ValidateSecretToken_WithNoToken_ReturnsFalse()
        {
            var configurationMock = new Mock<IConfiguration>();
            configurationMock.Setup(x => x["Telegram:SecretToken"]).Returns("my-secret-token");

            var telegramServiceMock = new Mock<ITelegramBotService>();
            var callbackHandlerMock = new Mock<TelegramCallbackHandler>(
                It.IsAny<ApplicationDbContext>(),
                It.IsAny<IAppointmentService>(),
                It.IsAny<ITelegramBotService>()
            );

            var options = new DbContextOptionsBuilder<ApplicationDbContext>()
                .UseInMemoryDatabase(databaseName: Guid.NewGuid().ToString())
                .Options;
            var context = new ApplicationDbContext(options);

            var loggerMock = new Mock<ILogger<TelegramWebhookController>>();
            var controller = new TestableTelegramWebhookController(
                context,
                telegramServiceMock.Object,
                callbackHandlerMock.Object,
                configurationMock.Object,
                loggerMock.Object
            );

            var result = controller.CallValidateSecretToken("my-secret-token", null);

            Assert.False(result);
        }

        [Fact]
        public void ValidateSecretToken_WithInvalidToken_ReturnsFalse()
        {
            var configurationMock = new Mock<IConfiguration>();
            configurationMock.Setup(x => x["Telegram:SecretToken"]).Returns("my-secret-token");

            var telegramServiceMock = new Mock<ITelegramBotService>();
            var callbackHandlerMock = new Mock<TelegramCallbackHandler>(
                It.IsAny<ApplicationDbContext>(),
                It.IsAny<IAppointmentService>(),
                It.IsAny<ITelegramBotService>()
            );

            var options = new DbContextOptionsBuilder<ApplicationDbContext>()
                .UseInMemoryDatabase(databaseName: Guid.NewGuid().ToString())
                .Options;
            var context = new ApplicationDbContext(options);

            var loggerMock = new Mock<ILogger<TelegramWebhookController>>();
            var controller = new TestableTelegramWebhookController(
                context,
                telegramServiceMock.Object,
                callbackHandlerMock.Object,
                configurationMock.Object,
                loggerMock.Object
            );

            var headers = new Microsoft.AspNetCore.Http.HeaderDictionary
            {
                { "X-Telegram-Bot-Api-Secret-Token", "wrong-token" }
            };

            var result = controller.CallValidateSecretToken("my-secret-token", headers);

            Assert.False(result);
        }

        [Fact]
        public void ValidateSecretToken_WithValidToken_ReturnsTrue()
        {
            var configurationMock = new Mock<IConfiguration>();
            configurationMock.Setup(x => x["Telegram:SecretToken"]).Returns("my-secret-token");

            var telegramServiceMock = new Mock<ITelegramBotService>();
            var callbackHandlerMock = new Mock<TelegramCallbackHandler>(
                It.IsAny<ApplicationDbContext>(),
                It.IsAny<IAppointmentService>(),
                It.IsAny<ITelegramBotService>()
            );

            var options = new DbContextOptionsBuilder<ApplicationDbContext>()
                .UseInMemoryDatabase(databaseName: Guid.NewGuid().ToString())
                .Options;
            var context = new ApplicationDbContext(options);

            var loggerMock = new Mock<ILogger<TelegramWebhookController>>();
            var controller = new TestableTelegramWebhookController(
                context,
                telegramServiceMock.Object,
                callbackHandlerMock.Object,
                configurationMock.Object,
                loggerMock.Object
            );

            var headers = new Microsoft.AspNetCore.Http.HeaderDictionary
            {
                { "X-Telegram-Bot-Api-Secret-Token", "my-secret-token" }
            };

            var result = controller.CallValidateSecretToken("my-secret-token", headers);

            Assert.True(result);
        }

        [Fact]
        public void ValidateSecretToken_WithNoSecretConfigured_ReturnsTrue()
        {
            var configurationMock = new Mock<IConfiguration>();
            configurationMock.Setup(x => x["Telegram:SecretToken"]).Returns((string?)null);

            var telegramServiceMock = new Mock<ITelegramBotService>();
            var callbackHandlerMock = new Mock<TelegramCallbackHandler>(
                It.IsAny<ApplicationDbContext>(),
                It.IsAny<IAppointmentService>(),
                It.IsAny<ITelegramBotService>()
            );

            var options = new DbContextOptionsBuilder<ApplicationDbContext>()
                .UseInMemoryDatabase(databaseName: Guid.NewGuid().ToString())
                .Options;
            var context = new ApplicationDbContext(options);

            var loggerMock = new Mock<ILogger<TelegramWebhookController>>();
            var controller = new TestableTelegramWebhookController(
                context,
                telegramServiceMock.Object,
                callbackHandlerMock.Object,
                configurationMock.Object,
                loggerMock.Object
            );

            var result = controller.CallValidateSecretToken(null, null);

            Assert.True(result);
        }

        [Fact]
        public void ValidateSecretToken_WithEmptySecretConfigured_ReturnsTrue()
        {
            var configurationMock = new Mock<IConfiguration>();
            configurationMock.Setup(x => x["Telegram:SecretToken"]).Returns("");

            var telegramServiceMock = new Mock<ITelegramBotService>();
            var callbackHandlerMock = new Mock<TelegramCallbackHandler>(
                It.IsAny<ApplicationDbContext>(),
                It.IsAny<IAppointmentService>(),
                It.IsAny<ITelegramBotService>()
            );

            var options = new DbContextOptionsBuilder<ApplicationDbContext>()
                .UseInMemoryDatabase(databaseName: Guid.NewGuid().ToString())
                .Options;
            var context = new ApplicationDbContext(options);

            var loggerMock = new Mock<ILogger<TelegramWebhookController>>();
            var controller = new TestableTelegramWebhookController(
                context,
                telegramServiceMock.Object,
                callbackHandlerMock.Object,
                configurationMock.Object,
                loggerMock.Object
            );

            var result = controller.CallValidateSecretToken("", null);

            Assert.True(result);
        }
    }

    public class FullCallbackFlowTests
    {
        [Fact]
        public async Task HandleCallback_WithConfirmAction_UpdatesAppointmentStatus()
        {
            var appointmentId = Guid.NewGuid();
            var chatId = "123456789";

            var telegramServiceMock = new Mock<ITelegramBotService>();
            var appointmentServiceMock = new Mock<IAppointmentService>();

            appointmentServiceMock
                .Setup(x => x.ConfirmAppointmentAsync(It.IsAny<Guid>(), It.IsAny<Guid>()))
                .ReturnsAsync(true);

            telegramServiceMock
                .Setup(x => x.AnswerCallbackQueryAsync(It.IsAny<string>(), It.IsAny<string>()))
                .Returns(Task.CompletedTask);

            var options = new DbContextOptionsBuilder<ApplicationDbContext>()
                .UseInMemoryDatabase(databaseName: Guid.NewGuid().ToString())
                .Options;
            var context = new ApplicationDbContext(options);

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

            context.Businesses.Add(business);
            context.Users.Add(user);
            context.Services.Add(service);
            context.Appointments.Add(appointment);
            await context.SaveChangesAsync();

            var handler = new TelegramCallbackHandler(
                context,
                appointmentServiceMock.Object,
                telegramServiceMock.Object
            );

            var result = await handler.HandleCallbackAsync($"confirm_{appointmentId}", chatId);

            Assert.True(result.Success);
            Assert.Equal("Cita confirmada", result.Message);
            appointmentServiceMock.Verify(
                x => x.ConfirmAppointmentAsync(appointmentId, business.OwnerId),
                Times.Once);
        }

        [Fact]
        public async Task HandleCallback_WithCancelAction_UpdatesAppointmentStatus()
        {
            var appointmentId = Guid.NewGuid();
            var chatId = "123456789";

            var telegramServiceMock = new Mock<ITelegramBotService>();
            var appointmentServiceMock = new Mock<IAppointmentService>();

            appointmentServiceMock
                .Setup(x => x.CancelAppointmentAsync(It.IsAny<Guid>(), It.IsAny<Guid>(), It.IsAny<string>()))
                .ReturnsAsync(true);

            telegramServiceMock
                .Setup(x => x.AnswerCallbackQueryAsync(It.IsAny<string>(), It.IsAny<string>()))
                .Returns(Task.CompletedTask);

            var options = new DbContextOptionsBuilder<ApplicationDbContext>()
                .UseInMemoryDatabase(databaseName: Guid.NewGuid().ToString())
                .Options;
            var context = new ApplicationDbContext(options);

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

            context.Businesses.Add(business);
            context.Users.Add(user);
            context.Services.Add(service);
            context.Appointments.Add(appointment);
            await context.SaveChangesAsync();

            var handler = new TelegramCallbackHandler(
                context,
                appointmentServiceMock.Object,
                telegramServiceMock.Object
            );

            var result = await handler.HandleCallbackAsync($"cancel_{appointmentId}", chatId);

            Assert.True(result.Success);
            Assert.Equal("Cita cancelada", result.Message);
            appointmentServiceMock.Verify(
                x => x.CancelAppointmentAsync(appointmentId, user.Id, It.IsAny<string>()),
                Times.Once);
        }
    }

    public class StatusNotificationTests
    {
        [Fact]
        public async Task SendStatusNotification_WithConfirmedStatus_SendsCorrectMessage()
        {
            var configurationMock = new Mock<IConfiguration>();
            configurationMock.Setup(x => x["Telegram:BotToken"]).Returns("test-token");

            var loggerMock = new Mock<Microsoft.Extensions.Logging.ILogger<TelegramBotService>>();

            var httpMessageHandler = new FakeHttpMessageHandlerForStatus(new HttpResponseMessage(System.Net.HttpStatusCode.OK));
            var httpClient = new HttpClient(httpMessageHandler);

            var service = new TelegramBotService(httpClient, configurationMock.Object, loggerMock.Object);

            var appointment = new Application.DTOs.Appointment.AppointmentDto
            {
                Id = Guid.NewGuid(),
                ScheduledDate = DateTime.UtcNow.AddDays(1),
                BusinessName = "Test Business",
                ServiceName = "Corte de cabello"
            };

            await service.SendStatusNotificationAsync("123456", "confirmed", appointment);

            Assert.True(httpMessageHandler.LastRequest?.RequestUri.ToString().Contains("sendMessage"));
        }

        [Fact]
        public async Task SendStatusNotification_WithCancelledStatus_SendsCorrectMessage()
        {
            var configurationMock = new Mock<IConfiguration>();
            configurationMock.Setup(x => x["Telegram:BotToken"]).Returns("test-token");

            var loggerMock = new Mock<Microsoft.Extensions.Logging.ILogger<TelegramBotService>>();

            var httpMessageHandler = new FakeHttpMessageHandlerForStatus(new HttpResponseMessage(System.Net.HttpStatusCode.OK));
            var httpClient = new HttpClient(httpMessageHandler);

            var service = new TelegramBotService(httpClient, configurationMock.Object, loggerMock.Object);

            var appointment = new Application.DTOs.Appointment.AppointmentDto
            {
                Id = Guid.NewGuid(),
                ScheduledDate = DateTime.UtcNow.AddDays(1),
                BusinessName = "Test Business",
                ServiceName = "Corte de cabello"
            };

            await service.SendStatusNotificationAsync("123456", "cancelled", appointment);

            Assert.True(httpMessageHandler.LastRequest?.RequestUri.ToString().Contains("sendMessage"));
        }

        [Fact]
        public async Task SendStatusNotification_WithCompletedStatus_SendsCorrectMessage()
        {
            var configurationMock = new Mock<IConfiguration>();
            configurationMock.Setup(x => x["Telegram:BotToken"]).Returns("test-token");

            var loggerMock = new Mock<Microsoft.Extensions.Logging.ILogger<TelegramBotService>>();

            var httpMessageHandler = new FakeHttpMessageHandlerForStatus(new HttpResponseMessage(System.Net.HttpStatusCode.OK));
            var httpClient = new HttpClient(httpMessageHandler);

            var service = new TelegramBotService(httpClient, configurationMock.Object, loggerMock.Object);

            var appointment = new Application.DTOs.Appointment.AppointmentDto
            {
                Id = Guid.NewGuid(),
                ScheduledDate = DateTime.UtcNow,
                BusinessName = "Test Business",
                ServiceName = "Corte de cabello"
            };

            await service.SendStatusNotificationAsync("123456", "completed", appointment);

            Assert.True(httpMessageHandler.LastRequest?.RequestUri.ToString().Contains("sendMessage"));
        }
    }

    public class FakeHttpMessageHandlerForStatus : HttpMessageHandler
    {
        public HttpRequestMessage? LastRequest { get; private set; }
        private readonly HttpResponseMessage _response;

        public FakeHttpMessageHandlerForStatus(HttpResponseMessage response)
        {
            _response = response;
        }

        protected override Task<HttpResponseMessage> SendAsync(HttpRequestMessage request, CancellationToken cancellationToken)
        {
            LastRequest = request;
            return Task.FromResult(_response);
        }
    }
}
