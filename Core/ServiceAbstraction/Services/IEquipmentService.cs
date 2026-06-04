using Shared.DTOs.Equipment;

namespace ServiceAbstraction.Services
{
    public interface IEquipmentService
    {
        Task<IEnumerable<EquipmentDto>> GetAllEquipmentAsync();
        Task<IEnumerable<EquipmentDto>> GetAvailableEquipmentAsync();
        Task<EquipmentDto?> GetEquipmentByIdAsync(int equipmentId);
        Task<EquipmentDto> UpdateEquipmentStatusAsync(int equipmentId, int status);
        Task<EquipmentDto> CreateEquipmentAsync(CreateEquipmentDto dto);
        Task<EquipmentDto> UpdateEquipmentAsync(int id, UpdateEquipmentDto dto);
        Task<bool> DeleteEquipmentAsync(int id);
    }
}
