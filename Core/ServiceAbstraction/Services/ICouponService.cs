using System.Collections.Generic;
using System.Threading.Tasks;
using Shared.DTOs.Subscription;

namespace ServiceAbstraction.Services
{
    public interface ICouponService
    {
        Task<IEnumerable<CouponDto>> GetAllCouponsAsync();
        Task<CouponDto?> GetCouponByIdAsync(int id);
        Task<CouponDto?> GetCouponByCodeAsync(string code);
        Task<CouponDto> CreateCouponAsync(CreateCouponDto dto);
        Task<CouponDto> UpdateCouponAsync(int id, UpdateCouponDto dto);
        Task<bool> DeleteCouponAsync(int id);
        Task<CouponDto?> ValidateCouponAsync(string code);
    }
}
