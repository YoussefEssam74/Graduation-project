using System;

namespace IntelliFit.Domain.Models
{
    // TPT derived type for Admin users
    public class Admin : User
    {
        public bool IsSuperAdmin { get; set; } = false;
        // Simple permissions store (comma-separated keys); consider normalizing later
        public string? Permissions { get; set; }
    }
}
