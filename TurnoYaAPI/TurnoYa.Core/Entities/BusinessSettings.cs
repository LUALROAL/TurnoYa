namespace TurnoYa.Core.Entities;

public class BusinessSettings : BaseEntity
{
    public Guid BusinessId { get; set; }
    public string NoShowPolicyType { get; set; } = "None"; // None | Block | Deposit
    public decimal NoShowDepositAmount { get; set; }
    public int MaxNoShows { get; set; } = 3;
    public int BlockDurationDays { get; set; } = 30;
    public bool AllowCancellation { get; set; } = true;
    public int FreeCancellationHours { get; set; } = 24;
    public decimal LateCancellationFee { get; set; }
    public int SlotDuration { get; set; } = 30;
    public int BufferTime { get; set; } = 15;
    public int MaxAdvanceBookingDays { get; set; } = 90;
    public int MinAdvanceBookingMinutes { get; set; } = 60;
    public int SimultaneousBookings { get; set; } = 1;
    public bool AcceptWompi { get; set; } = true;
    public bool AcceptCash { get; set; } = true;
    public bool AcceptCards { get; set; } = true;
    public bool AcceptNequi { get; set; } = true;
    public bool AcceptDaviplata { get; set; } = true;
    public bool AcceptPSE { get; set; } = true;
    
    /// <summary>
    /// Horarios de trabajo del negocio en formato JSON
    /// </summary>
    public string? WorkingHours { get; set; }

    public Business? Business { get; set; }
}