using Moq;
using Microsoft.Extensions.Configuration;
using Microsoft.Extensions.Logging;
using System;
using System.Net;
using System.Net.Http;
using System.Threading.Tasks;
using TurnoYa.Infrastructure.Services;
using TurnoYa.Application.DTOs.Appointment;
using Xunit;
using System.Linq;

namespace TurnoYa.Tests.UnitTests
{
    public class TelegramBotServiceRetryTests
    {
        private readonly Mock<IConfiguration> _configurationMock;
        private readonly Mock<ILogger<TelegramBotService>> _loggerMock;

        public TelegramBotServiceRetryTests()
        {
            _configurationMock = new Mock<IConfiguration>();
            _configurationMock.Setup(x => x["Telegram:BotToken"]).Returns("test-token");

            _loggerMock = new Mock<ILogger<TelegramBotService>>();
        }

        [Fact]
        public async Task SendMessageAsync_WithSuccessfulRequest_SendsMessage()
        {
            var httpMessageHandler = new FakeHttpMessageHandler(new HttpResponseMessage(HttpStatusCode.OK));
            var httpClient = new HttpClient(httpMessageHandler);

            var service = new TelegramBotService(httpClient, _configurationMock.Object, _loggerMock.Object);

            await service.SendMessageAsync("123456", "Test message");

            Assert.Equal(1, httpMessageHandler.CallCount);
            Assert.True(httpMessageHandler.LastRequest?.RequestUri.ToString().Contains("sendMessage"));
        }

        [Fact]
        public async Task SendMessageAsync_RetriesOnFailure_ThenSucceeds()
        {
            var callCount = 0;
            var httpMessageHandler = new FailingHttpMessageHandler(3, () =>
            {
                callCount++;
                if (callCount < 3)
                    return new HttpResponseMessage(HttpStatusCode.InternalServerError);
                return new HttpResponseMessage(HttpStatusCode.OK);
            });
            var httpClient = new HttpClient(httpMessageHandler);

            var service = new TelegramBotService(httpClient, _configurationMock.Object, _loggerMock.Object);

            await service.SendMessageAsync("123456", "Test message");

            Assert.Equal(3, callCount);
        }

        [Fact]
        public async Task SendMessageAsync_AllRetriesFail_ThrowsException()
        {
            var httpMessageHandler = new FailingHttpMessageHandler(10, () => new HttpResponseMessage(HttpStatusCode.InternalServerError));
            var httpClient = new HttpClient(httpMessageHandler);

            var service = new TelegramBotService(httpClient, _configurationMock.Object, _loggerMock.Object);

            await Assert.ThrowsAsync<InvalidOperationException>(
                async () => await service.SendMessageAsync("123456", "Test message"));
        }

        [Fact]
        public async Task SendStatusNotificationAsync_RetriesOnFailure()
        {
            var callCount = 0;
            var httpMessageHandler = new FailingHttpMessageHandler(2, () =>
            {
                callCount++;
                if (callCount < 2)
                    return new HttpResponseMessage(HttpStatusCode.InternalServerError);
                return new HttpResponseMessage(HttpStatusCode.OK);
            });
            var httpClient = new HttpClient(httpMessageHandler);

            var service = new TelegramBotService(httpClient, _configurationMock.Object, _loggerMock.Object);

            var appointment = new AppointmentDto
            {
                Id = Guid.NewGuid(),
                ScheduledDate = DateTime.UtcNow.AddHours(1),
                BusinessName = "Test Business",
                ServiceName = "Test Service"
            };

            await service.SendStatusNotificationAsync("123456", "confirmed", appointment);

            Assert.Equal(2, callCount);
        }

        [Fact]
        public async Task AnswerCallbackQueryAsync_RetriesOnFailure()
        {
            var callCount = 0;
            var httpMessageHandler = new FailingHttpMessageHandler(2, () =>
            {
                callCount++;
                if (callCount < 2)
                    return new HttpResponseMessage(HttpStatusCode.InternalServerError);
                return new HttpResponseMessage(HttpStatusCode.OK);
            });
            var httpClient = new HttpClient(httpMessageHandler);

            var service = new TelegramBotService(httpClient, _configurationMock.Object, _loggerMock.Object);

            await service.AnswerCallbackQueryAsync("callback-id", "Test message");

            Assert.Equal(2, callCount);
        }

        [Fact]
        public async Task SendReminderNotificationAsync_RetriesOnFailure()
        {
            var callCount = 0;
            var httpMessageHandler = new FailingHttpMessageHandler(2, () =>
            {
                callCount++;
                if (callCount < 2)
                    return new HttpResponseMessage(HttpStatusCode.InternalServerError);
                return new HttpResponseMessage(HttpStatusCode.OK);
            });
            var httpClient = new HttpClient(httpMessageHandler);

            var service = new TelegramBotService(httpClient, _configurationMock.Object, _loggerMock.Object);

            var appointment = new AppointmentDto
            {
                Id = Guid.NewGuid(),
                ScheduledDate = DateTime.UtcNow.AddHours(1),
                BusinessName = "Test Business",
                ServiceName = "Test Service"
            };

            await service.SendReminderNotificationAsync("123456", appointment);

            Assert.Equal(2, callCount);
        }
    }

    public class FakeHttpMessageHandler : HttpMessageHandler
    {
        public HttpRequestMessage? LastRequest { get; private set; }
        public int CallCount { get; private set; }

        private readonly HttpResponseMessage _response;

        public FakeHttpMessageHandler(HttpResponseMessage response)
        {
            _response = response;
        }

        protected override Task<HttpResponseMessage> SendAsync(HttpRequestMessage request, CancellationToken cancellationToken)
        {
            LastRequest = request;
            CallCount++;
            return Task.FromResult(_response);
        }
    }

    public class FailingHttpMessageHandler : HttpMessageHandler
    {
        private readonly Func<HttpResponseMessage> _responseFactory;
        private int _maxCalls;

        public FailingHttpMessageHandler(int maxCalls, Func<HttpResponseMessage> responseFactory)
        {
            _maxCalls = maxCalls;
            _responseFactory = responseFactory;
        }

        protected override Task<HttpResponseMessage> SendAsync(HttpRequestMessage request, CancellationToken cancellationToken)
        {
            var response = _responseFactory();
            if (!response.IsSuccessStatusCode && _maxCalls > 0)
            {
                _maxCalls--;
                if (_maxCalls <= 0)
                {
                    throw new HttpRequestException("Too many attempts");
                }
            }
            return Task.FromResult(response);
        }
    }
}
