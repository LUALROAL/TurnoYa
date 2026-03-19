using FirebaseAdmin;
using FirebaseAdmin.Messaging;
using Google.Apis.Auth.OAuth2;
using Microsoft.Extensions.Logging;
using System.Text.Json;
using TurnoYa.Application.Interfaces;

namespace TurnoYa.Infrastructure.Services;

/// <summary>
/// Implementación real de IFirebaseMessagingClient usando Firebase Admin SDK.
/// </summary>
public class FirebaseMessagingClient : IFirebaseMessagingClient
{
    private readonly ILogger<FirebaseMessagingClient> _logger;
    private readonly string? _credentialsPath;
    private static bool _initialized = false;
    private static readonly object _initLock = new();

    public FirebaseMessagingClient(
        Microsoft.Extensions.Configuration.IConfiguration configuration,
        ILogger<FirebaseMessagingClient> logger)
    {
        _logger = logger;
        _credentialsPath = configuration["Firebase:CredentialsPath"];
        InitializeFirebase();
    }

    private void InitializeFirebase()
    {
        if (_initialized) return;

        lock (_initLock)
        {
            if (_initialized) return;

            if (string.IsNullOrWhiteSpace(_credentialsPath))
            {
                _logger.LogWarning("Firebase:CredentialsPath no está configurado. Notificaciones push deshabilitadas.");
                _initialized = true;
                return;
            }

            if (!File.Exists(_credentialsPath))
            {
                _logger.LogWarning("Archivo de credenciales Firebase no encontrado en: {Path}", _credentialsPath);
                _initialized = true;
                return;
            }

            try
            {
                var credential = GoogleCredential.FromFile(_credentialsPath);
                FirebaseApp.Create(new AppOptions
                {
                    Credential = credential
                });
                _initialized = true;
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error al inicializar Firebase Admin SDK.");
                _initialized = true;
            }
        }
    }

    public async Task<(bool Success, string? MessageId, string? ErrorCode, string? ErrorMessage)> SendAsync(
        string token, string title, string body, Dictionary<string, string>? data)
    {
        try
        {
            var message = new Message
            {
                Token = token,
                Notification = new Notification
                {
                    Title = title,
                    Body = body
                },
                Data = data ?? new Dictionary<string, string>()
            };

            var messageId = await FirebaseMessaging.DefaultInstance.SendAsync(message);
            return (Success: true, MessageId: messageId, ErrorCode: null, ErrorMessage: null);
        }
        catch (FirebaseMessagingException ex)
        {
            _logger.LogWarning(ex, "FirebaseMessagingException: Code={ErrorCode}, Message={ErrorMessage}",
                ex.MessagingErrorCode, ex.Message);
            return (Success: false, MessageId: null, ErrorCode: ex.MessagingErrorCode.ToString(), ErrorMessage: ex.Message);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error inesperado al enviar notificación push.");
            return (Success: false, MessageId: null, ErrorCode: "UNKNOWN", ErrorMessage: ex.Message);
        }
    }
}
