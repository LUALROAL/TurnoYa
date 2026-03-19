-- Create UserDeviceTokens table only
-- This migration only adds what AddUserDeviceTokens was supposed to add
-- (TelegramLinkingCodeExpiry already exists from previous manual migration)

CREATE TABLE [UserDeviceTokens] (
    [Id] uniqueidentifier NOT NULL,
    [UserId] uniqueidentifier NOT NULL,
    [Token] nvarchar(500) NOT NULL,
    [Platform] nvarchar(10) NOT NULL,
    [IsActive] bit NOT NULL DEFAULT 1,
    [CreatedAt] datetime2 NOT NULL,
    [UpdatedAt] datetime2 NOT NULL,
    CONSTRAINT [PK_UserDeviceTokens] PRIMARY KEY ([Id]),
    CONSTRAINT [FK_UserDeviceTokens_Users_UserId] FOREIGN KEY ([UserId]) 
        REFERENCES [Users] ([Id]) ON DELETE CASCADE
);

CREATE UNIQUE INDEX [IX_UserDeviceTokens_UserId_Token] 
    ON [UserDeviceTokens] ([UserId], [Token]);

-- Mark migration as applied
INSERT INTO __EFMigrationsHistory (MigrationId, ProductVersion) 
VALUES ('20260319061933_AddUserDeviceTokens', '8.0.7');
