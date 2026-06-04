using System;
using Shared.Enums;

namespace IntelliFit.Domain.Models
{
    public class Coupon
    {
        public int CouponId { get; set; }
        public string Code { get; set; } = null!;
        public DiscountType DiscountType { get; set; }
        public decimal DiscountValue { get; set; }
        public DateTime ExpiryDate { get; set; }
        public int? MaxUsage { get; set; }
        public int CurrentUsage { get; set; } = 0;
        public bool IsActive { get; set; } = true;
        public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
        public DateTime UpdatedAt { get; set; } = DateTime.UtcNow;
    }
}
