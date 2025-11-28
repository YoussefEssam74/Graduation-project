using System.ComponentModel.DataAnnotations;

namespace Shared.DTOs.InBody
{
    public class CreateInBodyMeasurementDto
    {
        [Required]
        public int UserId { get; set; }

        [Required]
        [Range(0.1, 500.0)]
        public decimal Weight { get; set; }

        [Required]
        [Range(0.1, 300.0)]
        public decimal Height { get; set; }

        public decimal? BodyFatPercentage { get; set; }

        public decimal? MuscleMass { get; set; }

        public decimal? BoneMass { get; set; }

        public decimal? BodyWater { get; set; }

        public decimal? VisceralFat { get; set; }

        public decimal? Bmi { get; set; }

        public decimal? BasalMetabolicRate { get; set; }

        public int? ConductedByReceptionId { get; set; }

        public string? Notes { get; set; }

        public DateTime? MeasurementDate { get; set; }
    }
}
