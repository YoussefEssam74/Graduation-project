namespace Shared.DTOs.InBody
{
    public class InBodyMeasurementDto
    {
        public int MeasurementId { get; set; }
        public int UserId { get; set; }
        public string UserName { get; set; } = null!;
        public decimal Weight { get; set; }
        public decimal Height { get; set; }
        public decimal? BodyFatPercentage { get; set; }
        public decimal? MuscleMass { get; set; }
        public decimal? BoneMass { get; set; }
        public decimal? BodyWater { get; set; }
        public decimal? VisceralFat { get; set; }
        public decimal? Bmi { get; set; }
        public decimal? BasalMetabolicRate { get; set; }
        public int? ConductedByReceptionId { get; set; }
        public string? ConductedByName { get; set; }
        public string? Notes { get; set; }
        public DateTime MeasurementDate { get; set; }
        public DateTime CreatedAt { get; set; }
    }
}
