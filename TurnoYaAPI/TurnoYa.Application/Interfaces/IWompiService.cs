using System.Threading.Tasks;
using TurnoYa.Application.DTOs.Payment;

namespace TurnoYa.Application.Interfaces;

public interface IWompiService
{
    Task<PaymentDto> CreateTransactionAsync(CreatePaymentIntentDto intent);
    Task<PaymentDto?> GetTransactionStatusAsync(string transactionId);
    bool ValidateWebhookSignature(string payload, string signature);
}
