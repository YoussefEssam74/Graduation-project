using System;
using System.Collections.Generic;
using System.Linq;
using System.Threading.Tasks;
using DomainLayer.Contracts;
using IntelliFit.Domain.Models;
using IntelliFit.Infrastructure.Persistence;
using Microsoft.EntityFrameworkCore;
using ServiceAbstraction.Services;
using Shared.DTOs.Ingredient;

namespace Service.Services
{
    public class IngredientService : IIngredientService
    {
        private readonly IUnitOfWork _unitOfWork;
        private readonly IntelliFitDbContext _context;

        public IngredientService(IUnitOfWork unitOfWork, IntelliFitDbContext context)
        {
            _unitOfWork = unitOfWork;
            _context = context;
        }

        public async Task<IEnumerable<IngredientDto>> SearchIngredientsAsync(string? query, string? category, string? foodRole, bool onlyIncomplete, int page, int pageSize)
        {
            IQueryable<Ingredient> queryable = _context.Ingredients;

            if (!string.IsNullOrEmpty(query))
            {
                string queryLower = query.ToLower();
                queryable = queryable.Where(i => i.Name.ToLower().Contains(queryLower));
            }

            if (!string.IsNullOrEmpty(category))
            {
                string categoryLower = category.ToLower();
                queryable = queryable.Where(i => i.Category != null && i.Category.ToLower() == categoryLower);
            }

            if (!string.IsNullOrEmpty(foodRole))
            {
                string foodRoleLower = foodRole.ToLower();
                queryable = queryable.Where(i => i.FoodRole != null && i.FoodRole.ToLower() == foodRoleLower);
            }

            if (onlyIncomplete)
            {
                queryable = queryable.Where(i => i.Category == null || i.FoodRole == null || i.CaloriesPer100g == 0);
            }

            var ingredients = await queryable
                .OrderBy(i => i.IngredientId)
                .Skip((page - 1) * pageSize)
                .Take(pageSize)
                .ToListAsync();

            var ingredientIds = ingredients.Select(i => i.IngredientId).ToList();

            var ingredientAllergies = await _context.IngredientAllergies
                .Where(ia => ingredientIds.Contains(ia.IngredientId))
                .Include(ia => ia.Allergy)
                .ToListAsync();

            var allergiesGrouped = ingredientAllergies
                .GroupBy(ia => ia.IngredientId)
                .ToDictionary(g => g.Key, g => g.Select(ia => ia.Allergy.Name).ToList());

            return ingredients.Select(i => new IngredientDto
            {
                IngredientId = i.IngredientId,
                Name = i.Name,
                Category = i.Category,
                CaloriesPer100g = i.CaloriesPer100g,
                ProteinPer100g = i.ProteinPer100g,
                CarbsPer100g = i.CarbsPer100g,
                FatsPer100g = i.FatsPer100g,
                IsActive = i.IsActive,
                FoodRole = i.FoodRole,
                Allergies = allergiesGrouped.TryGetValue(i.IngredientId, out var list) ? list : new List<string>()
            }).ToList();
        }

        public async Task<IngredientDto?> GetIngredientByIdAsync(int id)
        {
            var i = await _context.Ingredients.FindAsync(id);
            if (i == null) return null;

            var allergies = await _context.IngredientAllergies
                .Where(ia => ia.IngredientId == id)
                .Select(ia => ia.Allergy.Name)
                .ToListAsync();

            return new IngredientDto
            {
                IngredientId = i.IngredientId,
                Name = i.Name,
                Category = i.Category,
                CaloriesPer100g = i.CaloriesPer100g,
                ProteinPer100g = i.ProteinPer100g,
                CarbsPer100g = i.CarbsPer100g,
                FatsPer100g = i.FatsPer100g,
                IsActive = i.IsActive,
                FoodRole = i.FoodRole,
                Allergies = allergies
            };
        }

        public async Task<IngredientDto?> UpdateIngredientAsync(int id, UpdateIngredientDto dto)
        {
            var i = await _context.Ingredients.FindAsync(id);
            if (i == null) return null;

            if (dto.Name != null) i.Name = dto.Name;
            if (dto.Category != null) i.Category = dto.Category;
            if (dto.CaloriesPer100g.HasValue) i.CaloriesPer100g = dto.CaloriesPer100g.Value;
            if (dto.ProteinPer100g.HasValue) i.ProteinPer100g = dto.ProteinPer100g.Value;
            if (dto.CarbsPer100g.HasValue) i.CarbsPer100g = dto.CarbsPer100g.Value;
            if (dto.FatsPer100g.HasValue) i.FatsPer100g = dto.FatsPer100g.Value;
            if (dto.IsActive.HasValue) i.IsActive = dto.IsActive.Value;
            if (dto.FoodRole != null) i.FoodRole = dto.FoodRole;

            if (dto.Allergies != null)
            {
                var existing = await _context.IngredientAllergies
                    .Where(ia => ia.IngredientId == id)
                    .ToListAsync();
                _context.IngredientAllergies.RemoveRange(existing);

                var trimmedAllergies = dto.Allergies
                    .Select(n => n.Trim())
                    .Where(n => !string.IsNullOrEmpty(n))
                    .ToList();

                foreach (var name in trimmedAllergies)
                {
                    var allergy = await _context.Allergies
                        .FirstOrDefaultAsync(a => a.Name.ToLower() == name.ToLower());
                    if (allergy == null)
                    {
                        allergy = new Allergy { Name = name };
                        await _context.Allergies.AddAsync(allergy);
                        await _context.SaveChangesAsync();
                    }

                    await _context.IngredientAllergies.AddAsync(new IngredientAllergy
                    {
                        IngredientId = id,
                        AllergyId = allergy.AllergyId
                    });
                }

                i.ContainsDairy = trimmedAllergies.Any(a => a.Equals("dairy", StringComparison.OrdinalIgnoreCase));
                i.ContainsGluten = trimmedAllergies.Any(a => a.Equals("gluten", StringComparison.OrdinalIgnoreCase));
                i.ContainsNuts = trimmedAllergies.Any(a => a.Equals("nuts", StringComparison.OrdinalIgnoreCase));
                i.ContainsSoy = trimmedAllergies.Any(a => a.Equals("soy", StringComparison.OrdinalIgnoreCase));
                i.ContainsEggs = trimmedAllergies.Any(a => a.Equals("eggs", StringComparison.OrdinalIgnoreCase));
                i.ContainsFish = trimmedAllergies.Any(a => a.Equals("fish", StringComparison.OrdinalIgnoreCase));
            }

            _context.Ingredients.Update(i);
            await _context.SaveChangesAsync();

            return await GetIngredientByIdAsync(id);
        }
    }
}
