using Moq;
using TurnoYa.Application.Interfaces;
using TurnoYa.Core.Entities;
using TurnoYa.Core.Interfaces;
using AutoMapper;
using Microsoft.AspNetCore.Identity;
using Microsoft.Extensions.Logging;
using System;
using System.Threading.Tasks;
using TurnoYa.Infrastructure.Services;
using Xunit;

namespace TurnoYa.Tests.UnitTests
{
    public class UserServiceLinkingCodeTests
    {
        private readonly Mock<IUserRepository> _userRepositoryMock;
        private readonly Mock<IMapper> _mapperMock;
        private readonly Mock<IPasswordHasher<User>> _passwordHasherMock;
        private readonly Mock<ILogger<UserService>> _loggerMock;
        private readonly UserService _userService;

        public UserServiceLinkingCodeTests()
        {
            _userRepositoryMock = new Mock<IUserRepository>();
            _mapperMock = new Mock<IMapper>();
            _passwordHasherMock = new Mock<IPasswordHasher<User>>();
            _loggerMock = new Mock<ILogger<UserService>>();

            _userService = new UserService(
                _userRepositoryMock.Object,
                _mapperMock.Object,
                _passwordHasherMock.Object,
                _loggerMock.Object
            );
        }

        [Fact]
        public async Task ValidateLinkingCodeAsync_WithExpiredCode_ReturnsFalse()
        {
            var code = "AB-12345";
            var user = new User
            {
                Id = Guid.NewGuid(),
                TelegramLinkingCode = code,
                TelegramLinkingCodeExpiry = DateTime.UtcNow.AddHours(-1)
            };

            _userRepositoryMock
                .Setup(x => x.FindByTelegramCodeAsync(code))
                .ReturnsAsync(user);

            var result = await _userService.ValidateLinkingCodeAsync(code);

            Assert.False(result);
        }

        [Fact]
        public async Task ValidateLinkingCodeAsync_WithValidCode_ReturnsTrue()
        {
            var code = "AB-12345";
            var user = new User
            {
                Id = Guid.NewGuid(),
                TelegramLinkingCode = code,
                TelegramLinkingCodeExpiry = DateTime.UtcNow.AddHours(24)
            };

            _userRepositoryMock
                .Setup(x => x.FindByTelegramCodeAsync(code))
                .ReturnsAsync(user);

            var result = await _userService.ValidateLinkingCodeAsync(code);

            Assert.True(result);
        }

        [Fact]
        public async Task ValidateLinkingCodeAsync_WithCodeExpiringSoon_ReturnsTrue()
        {
            var code = "AB-12345";
            var user = new User
            {
                Id = Guid.NewGuid(),
                TelegramLinkingCode = code,
                TelegramLinkingCodeExpiry = DateTime.UtcNow.AddMinutes(30)
            };

            _userRepositoryMock
                .Setup(x => x.FindByTelegramCodeAsync(code))
                .ReturnsAsync(user);

            var result = await _userService.ValidateLinkingCodeAsync(code);

            Assert.True(result);
        }

        [Fact]
        public async Task ValidateLinkingCodeAsync_WithNullExpiry_ReturnsFalse()
        {
            var code = "AB-12345";
            var user = new User
            {
                Id = Guid.NewGuid(),
                TelegramLinkingCode = code,
                TelegramLinkingCodeExpiry = null
            };

            _userRepositoryMock
                .Setup(x => x.FindByTelegramCodeAsync(code))
                .ReturnsAsync(user);

            var result = await _userService.ValidateLinkingCodeAsync(code);

            Assert.False(result);
        }

        [Fact]
        public async Task ValidateLinkingCodeAsync_WithNonExistentCode_ReturnsFalse()
        {
            var code = "XX-99999";

            _userRepositoryMock
                .Setup(x => x.FindByTelegramCodeAsync(code))
                .ReturnsAsync((User?)null);

            var result = await _userService.ValidateLinkingCodeAsync(code);

            Assert.False(result);
        }

        [Fact]
        public async Task ValidateLinkingCodeAsync_WithEmptyCode_ReturnsFalse()
        {
            var result = await _userService.ValidateLinkingCodeAsync("");

            Assert.False(result);
            _userRepositoryMock.Verify(x => x.FindByTelegramCodeAsync(It.IsAny<string>()), Times.Never);
        }

        [Fact]
        public async Task GenerateTelegramLinkingCodeAsync_CreatesCodeWith24HourExpiry()
        {
            var userId = Guid.NewGuid();
            var user = new User
            {
                Id = userId,
                FirstName = "Test",
                LastName = "User",
                Email = "test@test.com"
            };

            _userRepositoryMock
                .Setup(x => x.GetByIdAsync(userId))
                .ReturnsAsync(user);

            _userRepositoryMock
                .Setup(x => x.UpdateAsync(It.IsAny<User>()))
                .Returns(Task.CompletedTask);

            var code = await _userService.GenerateTelegramLinkingCodeAsync(userId.ToString());

            Assert.NotNull(code);
            Assert.Contains("-", code);
        }

        [Fact]
        public async Task CleanupExpiredLinkingCodesAsync_RemovesExpiredCodes()
        {
            var expiredUser1 = new User
            {
                Id = Guid.NewGuid(),
                TelegramLinkingCode = "AB-11111",
                TelegramLinkingCodeExpiry = DateTime.UtcNow.AddHours(-1)
            };
            var expiredUser2 = new User
            {
                Id = Guid.NewGuid(),
                TelegramLinkingCode = "CD-22222",
                TelegramLinkingCodeExpiry = DateTime.UtcNow.AddHours(-48)
            };

            _userRepositoryMock
                .Setup(x => x.GetUsersWithExpiredTelegramCodesAsync())
                .ReturnsAsync(new[] { expiredUser1, expiredUser2 });

            _userRepositoryMock
                .Setup(x => x.UpdateAsync(It.IsAny<User>()))
                .Returns(Task.CompletedTask);

            var count = await _userService.CleanupExpiredLinkingCodesAsync();

            Assert.Equal(2, count);
            _userRepositoryMock.Verify(x => x.UpdateAsync(It.IsAny<User>()), Times.Exactly(2));
        }

        [Fact]
        public async Task CleanupExpiredLinkingCodesAsync_WithNoExpiredCodes_ReturnsZero()
        {
            _userRepositoryMock
                .Setup(x => x.GetUsersWithExpiredTelegramCodesAsync())
                .ReturnsAsync(Array.Empty<User>());

            var count = await _userService.CleanupExpiredLinkingCodesAsync();

            Assert.Equal(0, count);
            _userRepositoryMock.Verify(x => x.UpdateAsync(It.IsAny<User>()), Times.Never);
        }
    }
}
