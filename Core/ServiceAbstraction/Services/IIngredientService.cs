using System.Collections.Generic;
using System.Threading.Tasks;
using Shared.DTOs.Ingredient;

namespace ServiceAbstraction.Services
{
    public interface IIngredientService
    {
        Task<IEnumerable<IngredientDto>> SearchIngredientsAsync(string? query, string? category, string? foodRole, bool onlyIncomplete, int page, int pageSize);
        Task<IngredientDto?> GetIngredientByIdAsync(int id);
        Task<IngredientDto?> UpdateIngredientAsync(int id, UpdateIngredientDto dto);
    }
}
