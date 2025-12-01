using System;

namespace IntelliFit.Domain.Models
{
    /// <summary>
    /// TPT derived type for Receptionist users
    /// </summary>
    public class Receptionist : User
    {
        // Receptionist-specific properties
        public string? ShiftSchedule { get; set; }
        public DateTime? HireDate { get; set; }
        public string? Department { get; set; }
        public int TotalCheckIns { get; set; } = 0;
        public int TotalPaymentsProcessed { get; set; } = 0;

        // Navigation properties for activities performed by receptionist
        public virtual ICollection<InBodyMeasurement> InBodyMeasurementsConducted { get; set; } = new List<InBodyMeasurement>();
        public virtual ICollection<TokenTransaction> TokenTransactionsProcessed { get; set; } = new List<TokenTransaction>();
    }
}
