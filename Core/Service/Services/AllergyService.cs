using System;
using System.Collections.Generic;
using System.Linq;
using System.Threading.Tasks;
using DomainLayer.Contracts;
using IntelliFit.Domain.Models;
using IntelliFit.Infrastructure.Persistence;
using Microsoft.EntityFrameworkCore;
using ServiceAbstraction.Services;
using Shared.DTOs.Allergy;

namespace Service.Services
{
    public class AllergyService : IAllergyService
    {
        private readonly IUnitOfWork _unitOfWork;
        private readonly IntelliFitDbContext _context;

        public AllergyService(IUnitOfWork unitOfWork, IntelliFitDbContext context)
        {
            _unitOfWork = unitOfWork;
            _context = context;
        }

        public async Task<IEnumerable<AllergyDto>> GetAllAllergiesAsync()
        {
            var allergies = await _context.Allergies
                .OrderBy(a => a.Name)
                .ToListAsync();

            return allergies.Select(a => new AllergyDto
            {
                AllergyId = a.AllergyId,
                Name = a.Name,
                Description = a.Description
            }).ToList();
        }

        public async Task<AllergyDto> CreateAllergyAsync(AllergyDto dto)
        {
            var existing = await _context.Allergies
                .FirstOrDefaultAsync(a => a.Name.ToLower() == dto.Name.ToLower());
            if (existing != null)
            {
                return new AllergyDto
                {
                    AllergyId = existing.AllergyId,
                    Name = existing.Name,
                    Description = existing.Description
                };
            }

            var allergy = new Allergy
            {
                Name = dto.Name,
                Description = dto.Description
            };

            await _context.Allergies.AddAsync(allergy);
            await _context.SaveChangesAsync();

            return new AllergyDto
            {
                AllergyId = allergy.AllergyId,
                Name = allergy.Name,
                Description = allergy.Description
            };
        }

        public async Task<bool> DeleteAllergyAsync(int allergyId)
        {
            var allergy = await _context.Allergies.FindAsync(allergyId);
            if (allergy == null) return false;

            _context.Allergies.Remove(allergy);
            await _context.SaveChangesAsync();
            return true;
        }
    }
}
