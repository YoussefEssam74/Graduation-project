using System;
using System.Collections.Generic;

namespace IntelliFit.Domain.Models
{
    public class DiseaseRule
    {
        public int DiseaseRuleId { get; set; }
        public string DiseaseKey { get; set; } = null!;
        public string DiseaseName { get; set; } = null!;
        public int? MinKcal { get; set; }
        public int? MaxKcal { get; set; }
        public int? MedianKcal { get; set; }
        public string? CalorieSource { get; set; }
        public int? CalorieSampleSize { get; set; }
        public decimal? ProteinPct { get; set; }
        public decimal? CarbsPct { get; set; }
        public decimal? FatPct { get; set; }
        public decimal? ProteinGAvg { get; set; }
        public decimal? CarbsGAvg { get; set; }
        public decimal? FatGAvg { get; set; }
        public string? MacroSource { get; set; }
        public DateTime CreatedAt { get; set; } = DateTime.UtcNow;

        public virtual ICollection<DiseaseAvoidedIngredient> AvoidedIngredients { get; set; } = new List<DiseaseAvoidedIngredient>();
        public virtual ICollection<DiseaseRecommendedIngredient> RecommendedIngredients { get; set; } = new List<DiseaseRecommendedIngredient>();
    }
}
