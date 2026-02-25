using System.Text.Json;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using TurnoYa.Application.DTOs.Payment;
using TurnoYa.Application.Interfaces;

namespace TurnoYaAPI.Controllers;

/// <summary>
/// Controlador para gestión de pagos y transacciones (Wompi)
/// </summary>
[ApiController]
[Route("api/[controller]")]
public class PaymentsController : ControllerBase
{
    private readonly IWompiService _wompiService;

    public PaymentsController(IWompiService wompiService)
    {
        _wompiService = wompiService;
    }

    [HttpPost("intent")]
    [Authorize]
    public async Task<ActionResult<PaymentDto>> CreateIntent([FromBody] CreatePaymentIntentDto dto)
    {
        var payment = await _wompiService.CreateTransactionAsync(dto);
        return Ok(payment);
    }

    [HttpGet("{appointmentId}/status")]
    [Authorize]
    public async Task<ActionResult<PaymentDto?>> GetStatus(string appointmentId)
    {
        var status = await _wompiService.GetTransactionStatusAsync(appointmentId);
        if (status == null) return NotFound();
        return Ok(status);
    }

    [HttpPost("wompi/webhook")]
    [AllowAnonymous]
    public ActionResult Webhook()
    {
        using var reader = new StreamReader(Request.Body);
        var payload = reader.ReadToEnd();
        var signature = Request.Headers["X-Wompi-Signature"].FirstOrDefault();
        var valid = _wompiService.ValidateWebhookSignature(payload, signature ?? string.Empty);
        if (!valid) return Unauthorized();
        var dto = JsonSerializer.Deserialize<WompiWebhookDto>(payload);
        // TODO: procesar evento y actualizar transacción/cita
        return Ok();
    }
}
