using DomainLayer.Contracts;
using IntelliFit.Domain.Models;
using IntelliFit.Domain.Enums;
using ServiceAbstraction.Services;
using Shared.DTOs.Booking;
using IntelliFit.Shared.Constants;
using Microsoft.EntityFrameworkCore;
using AutoMapper;

namespace Service.Services
{
    public class BookingService : IBookingService
    {
        private readonly IUnitOfWork _unitOfWork;
        private readonly IMapper _mapper;

        public BookingService(IUnitOfWork unitOfWork, IMapper mapper)
        {
            _unitOfWork = unitOfWork;
            _mapper = mapper;
        }

        public async Task<BookingDto> CreateBookingAsync(CreateBookingDto createDto)
        {
            // Validate XOR: Either Equipment OR Coach, not both, not neither
            if ((createDto.EquipmentId.HasValue && createDto.CoachId.HasValue) ||
                (!createDto.EquipmentId.HasValue && !createDto.CoachId.HasValue))
            {
                throw new InvalidOperationException("Booking must be either for Equipment or Coach, not both or neither");
            }

            // Validate BookingType matches the FK
            if (createDto.BookingType == BookingTypes.Equipment && !createDto.EquipmentId.HasValue)
            {
                throw new InvalidOperationException("Equipment booking requires EquipmentId");
            }

            if (createDto.BookingType == BookingTypes.Session && !createDto.CoachId.HasValue)
            {
                throw new InvalidOperationException("Session booking requires CoachId");
            }

            // Check availability
            if (createDto.EquipmentId.HasValue)
            {
                if (!await IsEquipmentAvailableAsync(createDto.EquipmentId.Value, createDto.StartTime, createDto.EndTime))
                {
                    throw new InvalidOperationException("Equipment is not available for the selected time slot");
                }
            }

            if (createDto.CoachId.HasValue)
            {
                if (!await IsCoachAvailableAsync(createDto.CoachId.Value, createDto.StartTime, createDto.EndTime))
                {
                    throw new InvalidOperationException("Coach is not available for the selected time slot");
                }
            }

            var booking = new Booking
            {
                UserId = createDto.UserId,
                EquipmentId = createDto.EquipmentId,
                CoachId = createDto.CoachId,
                BookingType = createDto.BookingType,
                StartTime = createDto.StartTime,
                EndTime = createDto.EndTime,
                Status = BookingStatus.Confirmed,
                Notes = createDto.Notes,
                CreatedAt = DateTime.UtcNow,
                UpdatedAt = DateTime.UtcNow
            };

            await _unitOfWork.Repository<Booking>().AddAsync(booking);
            await _unitOfWork.SaveChangesAsync();

            return await GetBookingDtoAsync(booking.BookingId);
        }

        public async Task<BookingDto?> GetBookingByIdAsync(int bookingId)
        {
            return await GetBookingDtoAsync(bookingId);
        }

        public async Task<IEnumerable<BookingDto>> GetUserBookingsAsync(int userId)
        {
            var bookings = await _unitOfWork.Repository<Booking>()
                .FindAsync(b => b.UserId == userId);

            var bookingDtos = new List<BookingDto>();
            foreach (var booking in bookings)
            {
                var dto = await GetBookingDtoAsync(booking.BookingId);
                if (dto != null)
                {
                    bookingDtos.Add(dto);
                }
            }

            return bookingDtos;
        }

        public async Task<IEnumerable<BookingDto>> GetEquipmentBookingsAsync(int equipmentId, DateTime startDate, DateTime endDate)
        {
            var bookings = await _unitOfWork.Repository<Booking>()
                .FindAsync(b => b.EquipmentId == equipmentId &&
                               b.StartTime >= startDate &&
                               b.EndTime <= endDate);

            var bookingDtos = new List<BookingDto>();
            foreach (var booking in bookings)
            {
                var dto = await GetBookingDtoAsync(booking.BookingId);
                if (dto != null)
                {
                    bookingDtos.Add(dto);
                }
            }

            return bookingDtos;
        }

        public async Task<IEnumerable<BookingDto>> GetCoachBookingsAsync(int coachId, DateTime startDate, DateTime endDate)
        {
            var bookings = await _unitOfWork.Repository<Booking>()
                .FindAsync(b => b.CoachId == coachId &&
                               b.StartTime >= startDate &&
                               b.EndTime <= endDate);

            var bookingDtos = new List<BookingDto>();
            foreach (var booking in bookings)
            {
                var dto = await GetBookingDtoAsync(booking.BookingId);
                if (dto != null)
                {
                    bookingDtos.Add(dto);
                }
            }

            return bookingDtos;
        }

        public async Task<BookingDto> CancelBookingAsync(int bookingId, string cancellationReason)
        {
            var booking = await _unitOfWork.Repository<Booking>().GetByIdAsync(bookingId);

            if (booking == null)
            {
                throw new KeyNotFoundException($"Booking with ID {bookingId} not found");
            }

            booking.Status = BookingStatus.Cancelled;
            booking.CancellationReason = cancellationReason;
            booking.UpdatedAt = DateTime.UtcNow;

            _unitOfWork.Repository<Booking>().Update(booking);
            await _unitOfWork.SaveChangesAsync();

            return await GetBookingDtoAsync(bookingId);
        }

        public async Task<BookingDto> CheckInAsync(int bookingId)
        {
            var booking = await _unitOfWork.Repository<Booking>().GetByIdAsync(bookingId);

            if (booking == null)
            {
                throw new KeyNotFoundException($"Booking with ID {bookingId} not found");
            }

            booking.CheckInTime = DateTime.UtcNow;
            booking.UpdatedAt = DateTime.UtcNow;

            _unitOfWork.Repository<Booking>().Update(booking);
            await _unitOfWork.SaveChangesAsync();

            return await GetBookingDtoAsync(bookingId);
        }

        public async Task<BookingDto> CheckOutAsync(int bookingId)
        {
            var booking = await _unitOfWork.Repository<Booking>().GetByIdAsync(bookingId);

            if (booking == null)
            {
                throw new KeyNotFoundException($"Booking with ID {bookingId} not found");
            }

            booking.CheckOutTime = DateTime.UtcNow;
            booking.Status = BookingStatus.Completed;
            booking.UpdatedAt = DateTime.UtcNow;

            _unitOfWork.Repository<Booking>().Update(booking);
            await _unitOfWork.SaveChangesAsync();

            return await GetBookingDtoAsync(bookingId);
        }

        public async Task<bool> IsEquipmentAvailableAsync(int equipmentId, DateTime startTime, DateTime endTime)
        {
            var overlappingBookings = await _unitOfWork.Repository<Booking>()
                .AnyAsync(b => b.EquipmentId == equipmentId &&
                              b.Status != BookingStatus.Cancelled &&
                              ((b.StartTime < endTime && b.EndTime > startTime)));

            return !overlappingBookings;
        }

        public async Task<bool> IsCoachAvailableAsync(int coachId, DateTime startTime, DateTime endTime)
        {
            var overlappingBookings = await _unitOfWork.Repository<Booking>()
                .AnyAsync(b => b.CoachId == coachId &&
                              b.Status != BookingStatus.Cancelled &&
                              ((b.StartTime < endTime && b.EndTime > startTime)));

            return !overlappingBookings;
        }

        private async Task<BookingDto> GetBookingDtoAsync(int bookingId)
        {
            var booking = await _unitOfWork.Repository<Booking>().GetByIdAsync(bookingId);

            if (booking == null)
            {
                throw new KeyNotFoundException($"Booking with ID {bookingId} not found");
            }

            var dto = _mapper.Map<BookingDto>(booking);

            // Manually set navigation property names
            var user = await _unitOfWork.Repository<User>().GetByIdAsync(booking.UserId);
            dto.UserName = user?.Name ?? "Unknown";

            if (booking.EquipmentId.HasValue)
            {
                var equipment = await _unitOfWork.Repository<Equipment>().GetByIdAsync(booking.EquipmentId.Value);
                dto.EquipmentName = equipment?.Name;
            }

            if (booking.CoachId.HasValue)
            {
                var coach = await _unitOfWork.Repository<CoachProfile>().GetByIdAsync(booking.CoachId.Value);
                if (coach != null)
                {
                    var coachUser = await _unitOfWork.Repository<User>().GetByIdAsync(coach.UserId);
                    dto.CoachName = coachUser?.Name;
                }
            }

            return dto;
        }
    }
}
