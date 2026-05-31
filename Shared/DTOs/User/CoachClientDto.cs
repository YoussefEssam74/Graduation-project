using System;

namespace Shared.DTOs.User
{
    public class CoachClientDto
    {
        public int UserId { get; set; }
        public string Name { get; set; } = null!;
        public string Email { get; set; } = null!;
        public string? Phone { get; set; }
        public string? MembershipType { get; set; }
        public DateTime JoinDate { get; set; }
        public int ActiveProgramsCount { get; set; }
        public DateTime? LastSessionDate { get; set; }
        public int Progress { get; set; }
        public string? ProfileImageUrl { get; set; }
    }
}
