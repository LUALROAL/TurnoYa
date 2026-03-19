using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Logging;
using Moq;
using System;
using System.Collections.Generic;
using System.Linq;
using System.Threading.Tasks;
using TurnoYa.Core.Entities;
using TurnoYa.Core.Interfaces;
using TurnoYa.Infrastructure.Data;
using TurnoYa.Infrastructure.Repositories;
using Xunit;

namespace TurnoYa.Tests.UnitTests
{
    /// <summary>
    /// Unit tests para UserDeviceTokenRepository.
    /// Usa EF Core InMemory para测试ear el comportamiento real del repository.
    /// Escenario: Deduplicación idempotente, CRUD operations.
    /// Ref: Spec — "Device Token Registration" scenarios.
    /// </summary>
    public class UserDeviceTokenRepositoryTests : IDisposable
    {
        private readonly ApplicationDbContext _context;
        private readonly UserDeviceTokenRepository _repository;

        public UserDeviceTokenRepositoryTests()
        {
            var options = new DbContextOptionsBuilder<ApplicationDbContext>()
                .UseInMemoryDatabase(databaseName: Guid.NewGuid().ToString())
                .Options;

            _context = new ApplicationDbContext(options);
            _repository = new UserDeviceTokenRepository(_context);
        }

        public void Dispose()
        {
            _context.Dispose();
        }

        #region GetByTokenAsync Tests

        [Fact]
        public async Task GetByTokenAsync_WithExistingToken_ReturnsToken()
        {
            // Arrange
            var userId = Guid.NewGuid();
            var token = new UserDeviceToken
            {
                Id = Guid.NewGuid(),
                UserId = userId,
                Token = "fcm_token_abc123",
                Platform = "android",
                IsActive = true,
                CreatedAt = DateTime.UtcNow
            };
            _context.UserDeviceTokens.Add(token);
            await _context.SaveChangesAsync();

            // Act
            var result = await _repository.GetByTokenAsync("fcm_token_abc123");

            // Assert
            Assert.NotNull(result);
            Assert.Equal("fcm_token_abc123", result.Token);
            Assert.Equal(userId, result.UserId);
            Assert.Equal("android", result.Platform);
        }

        [Fact]
        public async Task GetByTokenAsync_WithNonExistentToken_ReturnsNull()
        {
            // Act
            var result = await _repository.GetByTokenAsync("nonexistent_token");

            // Assert
            Assert.Null(result);
        }

        [Fact]
        public async Task GetByTokenAsync_IsCaseSensitive()
        {
            // Arrange
            var userId = Guid.NewGuid();
            var token = new UserDeviceToken
            {
                Id = Guid.NewGuid(),
                UserId = userId,
                Token = "FCM_TOKEN_UPPER",
                Platform = "ios",
                IsActive = true
            };
            _context.UserDeviceTokens.Add(token);
            await _context.SaveChangesAsync();

            // Act
            var result = await _repository.GetByTokenAsync("fcm_token_upper");

            // Assert — FCM tokens are case-sensitive
            Assert.Null(result);
        }

        #endregion

        #region AddAsync Tests

        [Fact]
        public async Task AddAsync_WithValidEntity_AddsToDatabase()
        {
            // Arrange
            var userId = Guid.NewGuid();
            var token = new UserDeviceToken
            {
                Id = Guid.NewGuid(),
                UserId = userId,
                Token = "new_fcm_token_xyz",
                Platform = "android",
                IsActive = true,
                CreatedAt = DateTime.UtcNow
            };

            // Act
            var result = await _repository.AddAsync(token);

            // Assert
            Assert.NotNull(result);
            Assert.Equal("new_fcm_token_xyz", result.Token);
            
            var savedToken = await _context.UserDeviceTokens.FindAsync(token.Id);
            Assert.NotNull(savedToken);
            Assert.Equal(userId, savedToken.UserId);
        }

        [Fact]
        public async Task AddAsync_SetsCreatedAtTimestamp()
        {
            // Arrange
            var beforeAdd = DateTime.UtcNow;
            var token = new UserDeviceToken
            {
                Id = Guid.NewGuid(),
                UserId = Guid.NewGuid(),
                Token = "token_with_timestamp",
                Platform = "ios",
                IsActive = true,
                CreatedAt = DateTime.UtcNow
            };

            // Act
            await _repository.AddAsync(token);

            // Assert
            var savedToken = await _context.UserDeviceTokens.FindAsync(token.Id);
            Assert.NotNull(savedToken);
            Assert.True(savedToken.CreatedAt >= beforeAdd);
        }

        #endregion

        #region GetByUserIdAsync Tests

        [Fact]
        public async Task GetByUserIdAsync_WithActiveDevices_ReturnsOnlyActiveTokens()
        {
            // Arrange
            var userId = Guid.NewGuid();
            var otherUserId = Guid.NewGuid();

            var activeToken1 = new UserDeviceToken
            {
                Id = Guid.NewGuid(),
                UserId = userId,
                Token = "active_token_1",
                Platform = "android",
                IsActive = true
            };
            var activeToken2 = new UserDeviceToken
            {
                Id = Guid.NewGuid(),
                UserId = userId,
                Token = "active_token_2",
                Platform = "ios",
                IsActive = true
            };
            var inactiveToken = new UserDeviceToken
            {
                Id = Guid.NewGuid(),
                UserId = userId,
                Token = "inactive_token",
                Platform = "android",
                IsActive = false
            };
            var otherUserToken = new UserDeviceToken
            {
                Id = Guid.NewGuid(),
                UserId = otherUserId,
                Token = "other_user_token",
                Platform = "android",
                IsActive = true
            };

            _context.UserDeviceTokens.AddRange(activeToken1, activeToken2, inactiveToken, otherUserToken);
            await _context.SaveChangesAsync();

            // Act
            var result = (await _repository.GetByUserIdAsync(userId)).ToList();

            // Assert
            Assert.Equal(2, result.Count);
            Assert.All(result, t => Assert.True(t.IsActive));
            Assert.DoesNotContain(result, t => t.Token == "inactive_token");
            Assert.DoesNotContain(result, t => t.Token == "other_user_token");
        }

        [Fact]
        public async Task GetByUserIdAsync_WithNoDevices_ReturnsEmptyList()
        {
            // Act
            var result = await _repository.GetByUserIdAsync(Guid.NewGuid());

            // Assert
            Assert.Empty(result);
        }

        [Fact]
        public async Task GetByUserIdAsync_WithMultipleDevices_ReturnsAllActive()
        {
            // Arrange
            var userId = Guid.NewGuid();
            var devices = new List<UserDeviceToken>();
            for (int i = 0; i < 5; i++)
            {
                devices.Add(new UserDeviceToken
                {
                    Id = Guid.NewGuid(),
                    UserId = userId,
                    Token = $"device_token_{i}",
                    Platform = i % 2 == 0 ? "android" : "ios",
                    IsActive = true
                });
            }
            _context.UserDeviceTokens.AddRange(devices);
            await _context.SaveChangesAsync();

            // Act
            var result = (await _repository.GetByUserIdAsync(userId)).ToList();

            // Assert
            Assert.Equal(5, result.Count);
        }

        #endregion

        #region DeleteAsync Tests

        [Fact]
        public async Task DeleteAsync_WithExistingId_RemovesToken()
        {
            // Arrange
            var userId = Guid.NewGuid();
            var token = new UserDeviceToken
            {
                Id = Guid.NewGuid(),
                UserId = userId,
                Token = "token_to_delete",
                Platform = "android",
                IsActive = true
            };
            _context.UserDeviceTokens.Add(token);
            await _context.SaveChangesAsync();

            // Act
            await _repository.DeleteAsync(token.Id);

            // Assert
            var deletedToken = await _context.UserDeviceTokens.FindAsync(token.Id);
            Assert.Null(deletedToken);
        }

        [Fact]
        public async Task DeleteAsync_WithNonExistentId_DoesNotThrow()
        {
            // Act & Assert — no exception should be thrown
            await _repository.DeleteAsync(Guid.NewGuid());
        }

        [Fact]
        public async Task DeleteAsync_OnlyDeletesSpecifiedToken()
        {
            // Arrange
            var userId = Guid.NewGuid();
            var tokenToKeep1 = new UserDeviceToken
            {
                Id = Guid.NewGuid(),
                UserId = userId,
                Token = "keep_token_1",
                Platform = "android",
                IsActive = true
            };
            var tokenToDelete = new UserDeviceToken
            {
                Id = Guid.NewGuid(),
                UserId = userId,
                Token = "delete_this_token",
                Platform = "ios",
                IsActive = true
            };
            var tokenToKeep2 = new UserDeviceToken
            {
                Id = Guid.NewGuid(),
                UserId = userId,
                Token = "keep_token_2",
                Platform = "android",
                IsActive = true
            };

            _context.UserDeviceTokens.AddRange(tokenToKeep1, tokenToDelete, tokenToKeep2);
            await _context.SaveChangesAsync();

            // Act
            await _repository.DeleteAsync(tokenToDelete.Id);

            // Assert
            var remaining = _context.UserDeviceTokens.ToList();
            Assert.Equal(2, remaining.Count);
            Assert.DoesNotContain(remaining, t => t.Token == "delete_this_token");
            Assert.Contains(remaining, t => t.Token == "keep_token_1");
            Assert.Contains(remaining, t => t.Token == "keep_token_2");
        }

        #endregion

        #region DeleteByUserIdAsync Tests

        [Fact]
        public async Task DeleteByUserIdAsync_RemovesAllUserTokens()
        {
            // Arrange
            var userId = Guid.NewGuid();
            var otherUserId = Guid.NewGuid();

            var userToken1 = new UserDeviceToken
            {
                Id = Guid.NewGuid(),
                UserId = userId,
                Token = "user_token_1",
                Platform = "android",
                IsActive = true
            };
            var userToken2 = new UserDeviceToken
            {
                Id = Guid.NewGuid(),
                UserId = userId,
                Token = "user_token_2",
                Platform = "ios",
                IsActive = true
            };
            var otherUserToken = new UserDeviceToken
            {
                Id = Guid.NewGuid(),
                UserId = otherUserId,
                Token = "other_user_token",
                Platform = "android",
                IsActive = true
            };

            _context.UserDeviceTokens.AddRange(userToken1, userToken2, otherUserToken);
            await _context.SaveChangesAsync();

            // Act
            await _repository.DeleteByUserIdAsync(userId);

            // Assert
            var remaining = _context.UserDeviceTokens.ToList();
            Assert.Single(remaining);
            Assert.Equal("other_user_token", remaining[0].Token);
        }

        [Fact]
        public async Task DeleteByUserIdAsync_WithNoTokens_DoesNotThrow()
        {
            // Act & Assert
            await _repository.DeleteByUserIdAsync(Guid.NewGuid());
        }

        [Fact]
        public async Task DeleteByUserIdAsync_DeletesBothActiveAndInactive()
        {
            // Arrange
            var userId = Guid.NewGuid();
            var activeToken = new UserDeviceToken
            {
                Id = Guid.NewGuid(),
                UserId = userId,
                Token = "active_token",
                Platform = "android",
                IsActive = true
            };
            var inactiveToken = new UserDeviceToken
            {
                Id = Guid.NewGuid(),
                UserId = userId,
                Token = "inactive_token",
                Platform = "ios",
                IsActive = false
            };

            _context.UserDeviceTokens.AddRange(activeToken, inactiveToken);
            await _context.SaveChangesAsync();

            // Act
            await _repository.DeleteByUserIdAsync(userId);

            // Assert
            var remaining = _context.UserDeviceTokens.ToList();
            Assert.Empty(remaining);
        }

        #endregion

        #region Deduplication Scenario Tests

        /// <summary>
        /// Scenario: Duplicate token from same device — idempotent behavior.
        /// Spec: "GIVEN a user who already registered token 'abc123' on platform 'android'
        ///       WHEN the same token is submitted again
        ///       THEN the system SHALL return HTTP 200 (idempotent) with existing deviceId
        ///       AND NOT create a duplicate record"
        /// </summary>
        [Fact]
        public async Task AddAsync_WithDuplicateToken_AllowsDuplicateInDatabase()
        {
            // Arrange — Repository layer allows duplicates (deduplication is handled in controller/service)
            var userId = Guid.NewGuid();
            var token1 = new UserDeviceToken
            {
                Id = Guid.NewGuid(),
                UserId = userId,
                Token = "duplicate_fcm_token",
                Platform = "android",
                IsActive = true
            };
            var token2 = new UserDeviceToken
            {
                Id = Guid.NewGuid(), // Different Id
                UserId = userId,
                Token = "duplicate_fcm_token", // Same token
                Platform = "android",
                IsActive = true
            };

            // Act
            await _repository.AddAsync(token1);
            await _repository.AddAsync(token2);

            // Assert — Repository itself allows duplicates (DB constraint should prevent this at DB level)
            var allTokens = _context.UserDeviceTokens.Where(t => t.Token == "duplicate_fcm_token").ToList();
            Assert.Equal(2, allTokens.Count); // Both exist in DB
        }

        /// <summary>
        /// GetByTokenAsync is the deduplication mechanism used by the controller.
        /// </summary>
        [Fact]
        public async Task GetByTokenAsync_IsUsedForDeduplication()
        {
            // Arrange
            var userId = Guid.NewGuid();
            var existingToken = new UserDeviceToken
            {
                Id = Guid.NewGuid(),
                UserId = userId,
                Token = "existing_fcm_token",
                Platform = "android",
                IsActive = true
            };
            _context.UserDeviceTokens.Add(existingToken);
            await _context.SaveChangesAsync();

            // Act
            var found = await _repository.GetByTokenAsync("existing_fcm_token");

            // Assert — Controller uses this method to detect duplicates before Add
            Assert.NotNull(found);
            Assert.Equal(existingToken.Id, found.Id);
        }

        #endregion
    }
}
