using System;
using System.Collections.Generic;
using System.Linq;
using System.Threading.Tasks;
using DomainLayer.Contracts;
using IntelliFit.Domain.Models;
using IntelliFit.Domain.Enums;
using Shared.Enums;
using ServiceAbstraction.Services;
using Shared.DTOs.Subscription;

namespace Service.Services
{
    public class CouponService : ICouponService
    {
        private readonly IUnitOfWork _unitOfWork;

        public CouponService(IUnitOfWork unitOfWork)
        {
            _unitOfWork = unitOfWork;
        }

        public async Task<IEnumerable<CouponDto>> GetAllCouponsAsync()
        {
            var coupons = await _unitOfWork.Repository<Coupon>().GetAllAsync();
            return coupons.Select(MapToCouponDto);
        }

        public async Task<CouponDto?> GetCouponByIdAsync(int id)
        {
            var coupon = await _unitOfWork.Repository<Coupon>().GetByIdAsync(id);
            return coupon == null ? null : MapToCouponDto(coupon);
        }

        public async Task<CouponDto?> GetCouponByCodeAsync(string code)
        {
            var coupons = await _unitOfWork.Repository<Coupon>().FindAsync(c => c.Code == code);
            var coupon = coupons.FirstOrDefault();
            return coupon == null ? null : MapToCouponDto(coupon);
        }

        public async Task<CouponDto> CreateCouponAsync(CreateCouponDto dto)
        {
            var existing = await _unitOfWork.Repository<Coupon>().FindAsync(c => c.Code == dto.Code);
            if (existing.Any())
            {
                throw new InvalidOperationException($"A coupon with code {dto.Code} already exists.");
            }

            var coupon = new Coupon
            {
                Code = dto.Code.ToUpperInvariant(),
                DiscountType = dto.DiscountType,
                DiscountValue = dto.DiscountValue,
                ExpiryDate = dto.ExpiryDate,
                MaxUsage = dto.MaxUsage,
                CurrentUsage = 0,
                IsActive = true,
                CreatedAt = DateTime.UtcNow,
                UpdatedAt = DateTime.UtcNow
            };

            await _unitOfWork.Repository<Coupon>().AddAsync(coupon);
            await _unitOfWork.SaveChangesAsync();

            return MapToCouponDto(coupon);
        }

        public async Task<CouponDto> UpdateCouponAsync(int id, UpdateCouponDto dto)
        {
            var coupon = await _unitOfWork.Repository<Coupon>().GetByIdAsync(id);
            if (coupon == null)
            {
                throw new KeyNotFoundException($"Coupon with ID {id} not found.");
            }

            var duplicate = await _unitOfWork.Repository<Coupon>().FindAsync(c => c.Code == dto.Code && c.CouponId != id);
            if (duplicate.Any())
            {
                throw new InvalidOperationException($"A coupon with code {dto.Code} already exists.");
            }

            coupon.Code = dto.Code.ToUpperInvariant();
            coupon.DiscountType = dto.DiscountType;
            coupon.DiscountValue = dto.DiscountValue;
            coupon.ExpiryDate = dto.ExpiryDate;
            coupon.MaxUsage = dto.MaxUsage;
            coupon.IsActive = dto.IsActive;
            coupon.UpdatedAt = DateTime.UtcNow;

            _unitOfWork.Repository<Coupon>().Update(coupon);
            await _unitOfWork.SaveChangesAsync();

            return MapToCouponDto(coupon);
        }

        public async Task<bool> DeleteCouponAsync(int id)
        {
            var coupon = await _unitOfWork.Repository<Coupon>().GetByIdAsync(id);
            if (coupon == null) return false;

            _unitOfWork.Repository<Coupon>().Remove(coupon);
            await _unitOfWork.SaveChangesAsync();
            return true;
        }

        public async Task<CouponDto?> ValidateCouponAsync(string code)
        {
            var coupons = await _unitOfWork.Repository<Coupon>().FindAsync(c => c.Code == code.ToUpperInvariant());
            var coupon = coupons.FirstOrDefault();

            if (coupon == null) return null;

            // Check expiry and status
            if (!coupon.IsActive || coupon.ExpiryDate < DateTime.UtcNow) return null;

            // Check usage limit
            if (coupon.MaxUsage.HasValue && coupon.CurrentUsage >= coupon.MaxUsage.Value) return null;

            return MapToCouponDto(coupon);
        }

        private static CouponDto MapToCouponDto(Coupon coupon)
        {
            return new CouponDto
            {
                CouponId = coupon.CouponId,
                Code = coupon.Code,
                DiscountType = coupon.DiscountType,
                DiscountValue = coupon.DiscountValue,
                ExpiryDate = coupon.ExpiryDate,
                MaxUsage = coupon.MaxUsage,
                CurrentUsage = coupon.CurrentUsage,
                IsActive = coupon.IsActive,
                CreatedAt = coupon.CreatedAt,
                UpdatedAt = coupon.UpdatedAt
            };
        }
    }
}
