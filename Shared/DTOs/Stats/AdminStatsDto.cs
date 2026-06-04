using System;
using System.Collections.Generic;

namespace Shared.DTOs.Stats
{
    public class AdminStatsDto
    {
        public int TotalMembers { get; set; }
        public decimal MonthlyRevenue { get; set; }
        public int ActiveCoaches { get; set; }
        public int EquipmentCount { get; set; }
        public int TodayCheckIns { get; set; }
        public int PendingIssues { get; set; }
        public double SystemUptime { get; set; } = 99.9;
        public int TokensSold { get; set; }
        public List<RevenueTrendItemDto> RevenueTrend { get; set; } = new();
        public List<MembershipDistributionItemDto> MembershipDistribution { get; set; } = new();
        public List<PeakHourItemDto> PeakHours { get; set; } = new();
    }

    public class RevenueTrendItemDto
    {
        public string Month { get; set; } = null!;
        public decimal Revenue { get; set; }
        public int Members { get; set; }
    }

    public class MembershipDistributionItemDto
    {
        public string Type { get; set; } = null!;
        public int Count { get; set; }
        public double Percentage { get; set; }
        public string Color { get; set; } = null!;
    }

    public class PeakHourItemDto
    {
        public string Time { get; set; } = null!;
        public double Usage { get; set; }
        public string Color { get; set; } = null!;
    }
}
