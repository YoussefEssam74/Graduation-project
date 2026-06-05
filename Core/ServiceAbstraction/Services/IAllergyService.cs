using System.Collections.Generic;
using System.Threading.Tasks;
using Shared.DTOs.Allergy;

namespace ServiceAbstraction.Services
{
    public interface IAllergyService
    {
        Task<IEnumerable<AllergyDto>> GetAllAllergiesAsync();
        Task<AllergyDto> CreateAllergyAsync(AllergyDto dto);
        Task<bool> DeleteAllergyAsync(int allergyId);
    }
}
