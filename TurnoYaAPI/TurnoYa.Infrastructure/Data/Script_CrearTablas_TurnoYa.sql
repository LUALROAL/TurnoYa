-- Script para crear todas las tablas y relaciones de TurnoYa
-- Incluye DROP TABLE IF EXISTS y comentarios en español

-- IMPORTANTE: Ejecuta esto en la base de datos correcta

-- El orden de borrado es importante por las claves foráneas
IF OBJECT_ID('RefreshTokens', 'U') IS NOT NULL DROP TABLE RefreshTokens;
IF OBJECT_ID('WompiTransactions', 'U') IS NOT NULL DROP TABLE WompiTransactions;
IF OBJECT_ID('Reviews', 'U') IS NOT NULL DROP TABLE Reviews;
IF OBJECT_ID('AppointmentStatusHistory', 'U') IS NOT NULL DROP TABLE AppointmentStatusHistory;
IF OBJECT_ID('Appointments', 'U') IS NOT NULL DROP TABLE Appointments;
IF OBJECT_ID('Employees', 'U') IS NOT NULL DROP TABLE Employees;
IF OBJECT_ID('BusinessImages', 'U') IS NOT NULL DROP TABLE BusinessImages;
IF OBJECT_ID('BusinessSettings', 'U') IS NOT NULL DROP TABLE BusinessSettings;
IF OBJECT_ID('Services', 'U') IS NOT NULL DROP TABLE Services;
IF OBJECT_ID('Businesses', 'U') IS NOT NULL DROP TABLE Businesses;
IF OBJECT_ID('Users', 'U') IS NOT NULL DROP TABLE Users;

-- Tabla de usuarios
CREATE TABLE Users (
    Id UNIQUEIDENTIFIER PRIMARY KEY,
    Email NVARCHAR(256) NOT NULL UNIQUE,
    PasswordHash NVARCHAR(256) NOT NULL,
    PhoneNumber NVARCHAR(50),
    Phone NVARCHAR(50),
    FirstName NVARCHAR(100) NOT NULL,
    LastName NVARCHAR(100) NOT NULL,
    PhotoUrl NVARCHAR(512),
    DateOfBirth DATETIME,
    Gender NVARCHAR(20),
    NoShowCount INT NOT NULL,
    TotalNoShows INT NOT NULL,
    IsBlocked BIT NOT NULL,
    BlockReason NVARCHAR(256),
    BlockUntil DATETIME,
    AverageRating DECIMAL(3,2) NOT NULL,
    CompletedAppointments INT NOT NULL,
    LastLogin DATETIME,
    Role NVARCHAR(50) NOT NULL,
    IsEmailVerified BIT NOT NULL,
    IsActive BIT NOT NULL,
    CreatedAt DATETIME NOT NULL,
    UpdatedAt DATETIME NOT NULL
);

-- Tabla de negocios
CREATE TABLE Businesses (
    Id UNIQUEIDENTIFIER PRIMARY KEY,
    OwnerId UNIQUEIDENTIFIER NOT NULL,
    Name NVARCHAR(200) NOT NULL,
    Description NVARCHAR(1000),
    Category NVARCHAR(100) NOT NULL,
    Phone NVARCHAR(50),
    Email NVARCHAR(256),
    Website NVARCHAR(256),
    LogoUrl NVARCHAR(512),
    CoverPhotoUrl NVARCHAR(512),
    Address NVARCHAR(256) NOT NULL,
    City NVARCHAR(100) NOT NULL,
    Department NVARCHAR(100) NOT NULL,
    Country NVARCHAR(10) NOT NULL,
    Latitude DECIMAL(10,7),
    Longitude DECIMAL(10,7),
    IsActive BIT NOT NULL,
    IsVerified BIT NOT NULL,
    AverageRating DECIMAL(3,2) NOT NULL,
    TotalReviews INT NOT NULL,
    SubscriptionPlan NVARCHAR(50) NOT NULL,
    SubscriptionStatus NVARCHAR(50) NOT NULL,
    TrialEnds DATETIME,
    CreatedAt DATETIME NOT NULL,
    UpdatedAt DATETIME NOT NULL,
    CONSTRAINT FK_Businesses_Users_OwnerId FOREIGN KEY (OwnerId) REFERENCES Users(Id) ON DELETE NO ACTION
);

-- Tabla de configuraciones de negocio
CREATE TABLE BusinessSettings (
    Id UNIQUEIDENTIFIER PRIMARY KEY,
    BusinessId UNIQUEIDENTIFIER NOT NULL UNIQUE,
    NoShowPolicyType NVARCHAR(20) NOT NULL,
    NoShowDepositAmount DECIMAL(10,2) NOT NULL,
    MaxNoShows INT NOT NULL,
    BlockDurationDays INT NOT NULL,
    AllowCancellation BIT NOT NULL,
    FreeCancellationHours INT NOT NULL,
    LateCancellationFee DECIMAL(10,2) NOT NULL,
    SlotDuration INT NOT NULL,
    BufferTime INT NOT NULL,
    MaxAdvanceBookingDays INT NOT NULL,
    MinAdvanceBookingMinutes INT NOT NULL,
    SimultaneousBookings INT NOT NULL,
    AcceptWompi BIT NOT NULL,
    AcceptCash BIT NOT NULL,
    AcceptCards BIT NOT NULL,
    AcceptNequi BIT NOT NULL,
    AcceptDaviplata BIT NOT NULL,
    AcceptPSE BIT NOT NULL,
    WorkingHours NVARCHAR(MAX),
    CreatedAt DATETIME NOT NULL,
    UpdatedAt DATETIME NOT NULL,
    CONSTRAINT FK_BusinessSettings_Businesses_BusinessId FOREIGN KEY (BusinessId) REFERENCES Businesses(Id) ON DELETE CASCADE
);

-- Tabla de imágenes de negocio
CREATE TABLE BusinessImages (
    Id UNIQUEIDENTIFIER PRIMARY KEY,
    BusinessId UNIQUEIDENTIFIER NOT NULL,
    ImagePath NVARCHAR(512),
    ImageData VARBINARY(MAX),
    CreatedAt DATETIME NOT NULL,
    CONSTRAINT FK_BusinessImages_Businesses_BusinessId FOREIGN KEY (BusinessId) REFERENCES Businesses(Id) ON DELETE CASCADE
);

-- Tabla de servicios
CREATE TABLE Services (
    Id UNIQUEIDENTIFIER PRIMARY KEY,
    BusinessId UNIQUEIDENTIFIER NOT NULL,
    Name NVARCHAR(200) NOT NULL,
    Description NVARCHAR(1000),
    Duration INT NOT NULL,
    Price DECIMAL(10,2) NOT NULL,
    Currency NVARCHAR(10) NOT NULL,
    Category NVARCHAR(100),
    IsActive BIT NOT NULL,
    RequiresDeposit BIT NOT NULL,
    DepositAmount DECIMAL(10,2) NOT NULL,
    CreatedAt DATETIME NOT NULL,
    UpdatedAt DATETIME NOT NULL,
    CONSTRAINT FK_Services_Businesses_BusinessId FOREIGN KEY (BusinessId) REFERENCES Businesses(Id) ON DELETE CASCADE
);

-- Tabla de empleados
CREATE TABLE Employees (
    Id UNIQUEIDENTIFIER PRIMARY KEY,
    BusinessId UNIQUEIDENTIFIER NOT NULL,
    UserId UNIQUEIDENTIFIER NOT NULL,
    Name NVARCHAR(200) NOT NULL,
    Position NVARCHAR(100),
    Bio NVARCHAR(1000),
    Email NVARCHAR(256),
    Phone NVARCHAR(50),
    PhotoUrl NVARCHAR(512),
    IsActive BIT NOT NULL,
    CreatedAt DATETIME NOT NULL,
    UpdatedAt DATETIME NOT NULL,
    CONSTRAINT FK_Employees_Businesses_BusinessId FOREIGN KEY (BusinessId) REFERENCES Businesses(Id) ON DELETE CASCADE,
    CONSTRAINT FK_Employees_Users_UserId FOREIGN KEY (UserId) REFERENCES Users(Id) ON DELETE NO ACTION
);

-- Tabla de citas
CREATE TABLE Appointments (
    Id UNIQUEIDENTIFIER PRIMARY KEY,
    ReferenceNumber NVARCHAR(50) NOT NULL UNIQUE,
    UserId UNIQUEIDENTIFIER NOT NULL,
    BusinessId UNIQUEIDENTIFIER NOT NULL,
    ServiceId UNIQUEIDENTIFIER NOT NULL,
    EmployeeId UNIQUEIDENTIFIER NULL,
    ScheduledDate DATETIME NOT NULL,
    EndDate DATETIME NOT NULL,
    Status NVARCHAR(20) NOT NULL,
    PaymentMethod NVARCHAR(20),
    PaymentStatus NVARCHAR(20) NOT NULL,
    TotalAmount DECIMAL(10,2) NOT NULL,
    DepositAmount DECIMAL(10,2) NOT NULL,
    DepositPaid BIT NOT NULL,
    Notes NVARCHAR(1000),
    WompiTransactionId NVARCHAR(100),
    WompiReference NVARCHAR(100),
    ReminderSent BIT NOT NULL,
    ConfirmationSent BIT NOT NULL,
    CreatedAt DATETIME NOT NULL,
    UpdatedAt DATETIME NOT NULL,
    CONSTRAINT FK_Appointments_Users_UserId FOREIGN KEY (UserId) REFERENCES Users(Id) ON DELETE NO ACTION,
    CONSTRAINT FK_Appointments_Businesses_BusinessId FOREIGN KEY (BusinessId) REFERENCES Businesses(Id) ON DELETE NO ACTION,
    CONSTRAINT FK_Appointments_Services_ServiceId FOREIGN KEY (ServiceId) REFERENCES Services(Id) ON DELETE NO ACTION,
    CONSTRAINT FK_Appointments_Employees_EmployeeId FOREIGN KEY (EmployeeId) REFERENCES Employees(Id) ON DELETE SET NULL
);

-- Tabla de historial de estado de citas
CREATE TABLE AppointmentStatusHistory (
    Id UNIQUEIDENTIFIER PRIMARY KEY,
    AppointmentId UNIQUEIDENTIFIER NOT NULL,
    OldStatus NVARCHAR(20),
    NewStatus NVARCHAR(20) NOT NULL,
    ChangedBy NVARCHAR(50) NOT NULL,
    Reason NVARCHAR(256),
    CreatedAt DATETIME NOT NULL,
    UpdatedAt DATETIME NOT NULL,
    CONSTRAINT FK_AppointmentStatusHistory_Appointments_AppointmentId FOREIGN KEY (AppointmentId) REFERENCES Appointments(Id) ON DELETE CASCADE
);

-- Tabla de reseñas
CREATE TABLE Reviews (
    Id UNIQUEIDENTIFIER PRIMARY KEY,
    AppointmentId UNIQUEIDENTIFIER NOT NULL UNIQUE,
    UserId UNIQUEIDENTIFIER NOT NULL,
    BusinessId UNIQUEIDENTIFIER NOT NULL,
    Rating INT NOT NULL,
    Comment NVARCHAR(1000),
    BusinessReply NVARCHAR(1000),
    RepliedAt DATETIME,
    IsActive BIT NOT NULL,
    Reported BIT NOT NULL,
    CreatedAt DATETIME NOT NULL,
    UpdatedAt DATETIME NOT NULL,
    CONSTRAINT FK_Reviews_Appointments_AppointmentId FOREIGN KEY (AppointmentId) REFERENCES Appointments(Id) ON DELETE NO ACTION,
    CONSTRAINT FK_Reviews_Businesses_BusinessId FOREIGN KEY (BusinessId) REFERENCES Businesses(Id) ON DELETE NO ACTION,
    CONSTRAINT FK_Reviews_Users_UserId FOREIGN KEY (UserId) REFERENCES Users(Id) ON DELETE NO ACTION
);
CREATE INDEX IX_Reviews_BusinessId_Rating ON Reviews (BusinessId, Rating);

-- Tabla de transacciones Wompi
CREATE TABLE WompiTransactions (
    Id UNIQUEIDENTIFIER PRIMARY KEY,
    AppointmentId UNIQUEIDENTIFIER NOT NULL UNIQUE,
    WompiId NVARCHAR(100) NOT NULL,
    Reference NVARCHAR(100) NOT NULL UNIQUE,
    Amount DECIMAL(10,2) NOT NULL,
    Currency NVARCHAR(10) NOT NULL,
    Status NVARCHAR(20) NOT NULL,
    PaymentMethodType NVARCHAR(50),
    CustomerEmail NVARCHAR(256),
    CustomerName NVARCHAR(256),
    WebhookReceived BIT NOT NULL,
    WebhookData NVARCHAR(MAX),
    CreatedAt DATETIME NOT NULL,
    UpdatedAt DATETIME NOT NULL,
    CONSTRAINT FK_WompiTransactions_Appointments_AppointmentId FOREIGN KEY (AppointmentId) REFERENCES Appointments(Id) ON DELETE CASCADE
);

-- Tabla de refresh tokens
CREATE TABLE RefreshTokens (
    Id UNIQUEIDENTIFIER PRIMARY KEY,
    UserId UNIQUEIDENTIFIER NOT NULL,
    Token NVARCHAR(256) NOT NULL UNIQUE,
    ExpiresAt DATETIME NOT NULL,
    RevokedAt DATETIME,
    CreatedAt DATETIME NOT NULL,
    UpdatedAt DATETIME NOT NULL,
    CONSTRAINT FK_RefreshTokens_Users_UserId FOREIGN KEY (UserId) REFERENCES Users(Id) ON DELETE CASCADE
);

-- Índices adicionales
CREATE INDEX IX_Users_Email ON Users (Email);
CREATE INDEX IX_Businesses_OwnerId ON Businesses (OwnerId);
CREATE INDEX IX_Services_BusinessId ON Services (BusinessId);
CREATE INDEX IX_Employees_BusinessId ON Employees (BusinessId);
CREATE INDEX IX_Employees_UserId ON Employees (UserId);
CREATE INDEX IX_Appointments_ReferenceNumber ON Appointments (ReferenceNumber);
CREATE INDEX IX_Appointments_UserId ON Appointments (UserId);
CREATE INDEX IX_Appointments_BusinessId ON Appointments (BusinessId);
CREATE INDEX IX_Appointments_ServiceId ON Appointments (ServiceId);
CREATE INDEX IX_Appointments_EmployeeId ON Appointments (EmployeeId);
CREATE INDEX IX_AppointmentStatusHistory_AppointmentId ON AppointmentStatusHistory (AppointmentId);
CREATE INDEX IX_BusinessImages_BusinessId ON BusinessImages (BusinessId);
CREATE INDEX IX_BusinessSettings_BusinessId ON BusinessSettings (BusinessId);

-- Fin del script
