using System.Net.Http;
using System.Net.Http.Json;
using System.Security.Cryptography;
using System.Text;
using System.Threading.Tasks;
using Microsoft.Extensions.Configuration;
using TurnoYa.Application.DTOs.Payment;
using TurnoYa.Application.Interfaces;

namespace TurnoYa.Infrastructure.Services;

public class WompiService : IWompiService
{
    private readonly HttpClient _http;
    private readonly IConfiguration _config;

    public WompiService(HttpClient httpClient, IConfiguration config)
    {
        _http = httpClient;
        _config = config;
        var baseUrl = _config["Wompi:BaseUrl"] ?? "https://sandbox.wompi.co";
        _http.BaseAddress = new Uri(baseUrl);
    }

    public async Task<PaymentDto> CreateTransactionAsync(CreatePaymentIntentDto intent)
    {
        // Minimal payload — real Wompi requires structured data
        var payload = new
        {
            amount_in_cents = (int)(intent.Amount * 100),
            currency = intent.Currency,
            reference = $"PAY-{DateTime.UtcNow:yyyyMMddHHmmss}-{Guid.NewGuid().ToString()[..6].ToUpper()}"
        };

        var response = await _http.PostAsJsonAsync("/v1/transactions", payload);
        response.EnsureSuccessStatusCode();
        var id = Guid.NewGuid().ToString();
        return new PaymentDto
        {
            Id = id,
            Reference = payload.reference,
            Amount = intent.Amount,
            Currency = intent.Currency,
            Status = "PENDING",
            PaymentMethod = intent.PaymentMethod
        };
    }

    public async Task<PaymentDto?> GetTransactionStatusAsync(string transactionId)
    {
        var response = await _http.GetAsync($"/v1/transactions/{transactionId}");
        if (!response.IsSuccessStatusCode) return null;
        // Simplified: return a placeholder
        return new PaymentDto
        {
            Id = transactionId,
            Reference = transactionId,
            Amount = 0,
            Currency = "COP",
            Status = "PENDING",
            PaymentMethod = "Wompi"
        };
    }

    public bool ValidateWebhookSignature(string payload, string signature)
    {
        var secret = _config["Wompi:EventsSecret"] ?? string.Empty;
        if (string.IsNullOrEmpty(secret) || string.IsNullOrEmpty(signature)) return false;
        using var hmac = new HMACSHA256(Encoding.UTF8.GetBytes(secret));
        var hash = hmac.ComputeHash(Encoding.UTF8.GetBytes(payload));
        var computed = Convert.ToHexString(hash).ToLowerInvariant();
        return computed == signature.ToLowerInvariant();
    }
}
