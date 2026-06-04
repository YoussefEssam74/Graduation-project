namespace Shared.DTOs.User
{
    public class CoachProfileDto
    {
        public int Id { get; set; }
        public int UserId { get; set; }
        public string? Specialization { get; set; }
        public string[]? Certifications { get; set; }
        public int? ExperienceYears { get; set; }
        public string? Bio { get; set; }
        public decimal? HourlyRate { get; set; }
        public string? AvailabilitySchedule { get; set; }
        public bool IsAvailable { get; set; }
    }
}
