using DomainLayer.Contracts;
using IntelliFit.Domain.Models;
using IntelliFit.Domain.Enums;
using ServiceAbstraction.Services;
using Shared.DTOs.Equipment;

namespace Service.Services
{
    public class EquipmentService : IEquipmentService
    {
        private readonly IUnitOfWork _unitOfWork;

        public EquipmentService(IUnitOfWork unitOfWork)
        {
            _unitOfWork = unitOfWork;
        }

        public async Task<IEnumerable<EquipmentDto>> GetAllEquipmentAsync()
        {
            var equipment = await _unitOfWork.Repository<Equipment>().GetAllAsync();
            var equipmentDtos = new List<EquipmentDto>();

            foreach (var item in equipment)
            {
                var dto = await MapToEquipmentDtoAsync(item);
                equipmentDtos.Add(dto);
            }

            return equipmentDtos;
        }

        public async Task<IEnumerable<EquipmentDto>> GetAvailableEquipmentAsync()
        {
            var equipment = await _unitOfWork.Repository<Equipment>()
                .FindAsync(e => e.Status == EquipmentStatus.Available);

            var equipmentDtos = new List<EquipmentDto>();
            foreach (var item in equipment)
            {
                var dto = await MapToEquipmentDtoAsync(item);
                equipmentDtos.Add(dto);
            }

            return equipmentDtos;
        }

        public async Task<EquipmentDto?> GetEquipmentByIdAsync(int equipmentId)
        {
            var equipment = await _unitOfWork.Repository<Equipment>().GetByIdAsync(equipmentId);
            return equipment == null ? null : await MapToEquipmentDtoAsync(equipment);
        }

        public async Task<EquipmentDto> UpdateEquipmentStatusAsync(int equipmentId, int status)
        {
            var equipment = await _unitOfWork.Repository<Equipment>().GetByIdAsync(equipmentId);

            if (equipment == null)
            {
                throw new KeyNotFoundException($"Equipment with ID {equipmentId} not found");
            }

            equipment.Status = (EquipmentStatus)status;
            equipment.UpdatedAt = DateTime.UtcNow;

            _unitOfWork.Repository<Equipment>().Update(equipment);
            await _unitOfWork.SaveChangesAsync();

            return await MapToEquipmentDtoAsync(equipment);
        }

        private async Task<EquipmentDto> MapToEquipmentDtoAsync(Equipment equipment)
        {
            var category = await _unitOfWork.Repository<EquipmentCategory>()
                .GetByIdAsync(equipment.CategoryId);

            return new EquipmentDto
            {
                EquipmentId = equipment.EquipmentId,
                Name = equipment.Name,
                CategoryId = equipment.CategoryId,
                CategoryName = category?.CategoryName,
                Status = (int)equipment.Status,
                StatusText = equipment.Status.ToString(),
                Location = equipment.Location,
                LastMaintenanceDate = equipment.LastMaintenanceDate,
                NextMaintenanceDate = equipment.NextMaintenanceDate,
                TokensCostPerHour = equipment.BookingCostTokens
            };
        }
        public async Task<EquipmentDto> CreateEquipmentAsync(CreateEquipmentDto dto)
        {
            var item = new Equipment
            {
                Name = dto.Name,
                CategoryId = dto.CategoryId ?? 1,
                Location = dto.Location,
                BookingCostTokens = dto.TokensCostPerHour,
                Status = EquipmentStatus.Available,
                ConditionRating = 5,
                IsActive = true,
                CreatedAt = DateTime.UtcNow,
                UpdatedAt = DateTime.UtcNow
            };

            await _unitOfWork.Repository<Equipment>().AddAsync(item);
            await _unitOfWork.SaveChangesAsync();

            return await MapToEquipmentDtoAsync(item);
        }

        public async Task<EquipmentDto> UpdateEquipmentAsync(int id, UpdateEquipmentDto dto)
        {
            var item = await _unitOfWork.Repository<Equipment>().GetByIdAsync(id);
            if (item == null)
            {
                throw new KeyNotFoundException($"Equipment with ID {id} not found");
            }

            item.Name = dto.Name;
            item.CategoryId = dto.CategoryId ?? item.CategoryId;
            item.Location = dto.Location;
            item.Status = (EquipmentStatus)dto.Status;
            item.LastMaintenanceDate = dto.LastMaintenanceDate;
            item.NextMaintenanceDate = dto.NextMaintenanceDate;
            item.BookingCostTokens = dto.TokensCostPerHour;
            item.UpdatedAt = DateTime.UtcNow;

            _unitOfWork.Repository<Equipment>().Update(item);
            await _unitOfWork.SaveChangesAsync();

            return await MapToEquipmentDtoAsync(item);
        }

        public async Task<bool> DeleteEquipmentAsync(int id)
        {
            var item = await _unitOfWork.Repository<Equipment>().GetByIdAsync(id);
            if (item == null) return false;

            _unitOfWork.Repository<Equipment>().Remove(item);
            await _unitOfWork.SaveChangesAsync();
            return true;
        }
    }
}
