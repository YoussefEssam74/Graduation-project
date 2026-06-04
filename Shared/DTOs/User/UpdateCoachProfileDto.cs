using System.ComponentModel.DataAnnotations;

namespace Shared.DTOs.User
{
    public class UpdateCoachProfileDto
    {
        [MaxLength(100)]
        public string? Specialization { get; set; }

        public string[]? Certifications { get; set; }

        [Range(0, 50)]
        public int? ExperienceYears { get; set; }

        [MaxLength(1000)]
        public string? Bio { get; set; }

        [Range(0, 10000)]
        public decimal? HourlyRate { get; set; }

        [MaxLength(200)]
        public string? AvailabilitySchedule { get; set; }

        public bool? IsAvailable { get; set; }
    }
}
