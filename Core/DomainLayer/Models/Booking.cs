using System;
using IntelliFit.Domain.Enums;

namespace IntelliFit.Domain.Models
{
    public class Booking
    {
        public int BookingId { get; set; }
        public int UserId { get; set; }
        public int? EquipmentId { get; set; }
        public int? CoachId { get; set; }
        public string BookingType { get; set; } = null!;
        public DateTime StartTime { get; set; }
        public DateTime EndTime { get; set; }
        public BookingStatus Status { get; set; } = BookingStatus.Pending;
        public int TokensCost { get; set; } = 0;
        public string? Notes { get; set; }
        public string? CancellationReason { get; set; }
        public DateTime? CheckInTime { get; set; }
        public DateTime? CheckOutTime { get; set; }
        public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
        public DateTime UpdatedAt { get; set; } = DateTime.UtcNow;

        public virtual User User { get; set; } = null!;
        public virtual Equipment? Equipment { get; set; }
        public virtual CoachProfile? Coach { get; set; }
    }
}
