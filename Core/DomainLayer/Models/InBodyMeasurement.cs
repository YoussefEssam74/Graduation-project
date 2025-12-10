using System;

namespace IntelliFit.Domain.Models
{
    public class InBodyMeasurement
    {
        public int MeasurementId { get; set; }
        public int UserId { get; set; }
        public DateTime MeasurementDate { get; set; } = DateTime.UtcNow; public decimal Weight { get; set; }
        public decimal? Height { get; set; }
        public decimal? BodyFatPercentage { get; set; }
        public decimal? MuscleMass { get; set; }
        public decimal? BodyWaterPercentage { get; set; }
        public decimal? BoneMass { get; set; }
        public int? VisceralFatLevel { get; set; }
        public int? Bmr { get; set; }
        public int? MetabolicAge { get; set; }
        public decimal? ProteinPercentage { get; set; }
        public string? BodyType { get; set; }
        public string? Notes { get; set; }
        public int? MeasuredBy { get; set; }
        public DateTime CreatedAt { get; set; } = DateTime.UtcNow;

        public virtual User User { get; set; } = null!; public virtual User? MeasuredByUser { get; set; }
    }
}
