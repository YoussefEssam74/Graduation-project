using System;
using Shared.Enums;

namespace Shared.DTOs.Subscription
{
    public class CouponDto
    {
        public int CouponId { get; set; }
        public string Code { get; set; } = null!;
        public DiscountType DiscountType { get; set; }
        public decimal DiscountValue { get; set; }
        public DateTime ExpiryDate { get; set; }
        public int? MaxUsage { get; set; }
        public int CurrentUsage { get; set; }
        public bool IsActive { get; set; }
        public DateTime CreatedAt { get; set; }
        public DateTime UpdatedAt { get; set; }
    }

    public class CreateCouponDto
    {
        public string Code { get; set; } = null!;
        public DiscountType DiscountType { get; set; }
        public decimal DiscountValue { get; set; }
        public DateTime ExpiryDate { get; set; }
        public int? MaxUsage { get; set; }
    }

    public class UpdateCouponDto
    {
        public string Code { get; set; } = null!;
        public DiscountType DiscountType { get; set; }
        public decimal DiscountValue { get; set; }
        public DateTime ExpiryDate { get; set; }
        public int? MaxUsage { get; set; }
        public bool IsActive { get; set; }
    }
}
