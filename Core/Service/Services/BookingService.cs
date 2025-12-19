using DomainLayer.Contracts;
using IntelliFit.Domain.Models;
using IntelliFit.Domain.Enums;
using ServiceAbstraction.Services;
using Shared.DTOs.Booking;
using IntelliFit.Shared.Constants;
using IntelliFit.Shared.DTOs.Payment;
using Microsoft.EntityFrameworkCore;
using AutoMapper;
using IntelliFit.ServiceAbstraction.Services;

namespace Service.Services
{
    /// <summary>
    /// Booking Service - Implements Clean Architecture booking business logic
    /// 
    /// 🎯 CORE BOOKING RULES:
    /// 
    /// RULE 1 - Users Can Book Coach AND Equipment Simultaneously:
    ///   ✅ User can book coach session at any time
    ///   ✅ User can book equipment at any time (even during coach session)
    ///   ✅ No restriction on booking both types together
    /// 
    /// RULE 2 - Equipment Availability Check:
    ///   ✅ Equipment must be available for the requested time slot
    ///   ❌ Cannot book equipment if already booked by another user
    ///   ✅ Each equipment can only be booked by one user at a time
    /// 
    /// RULE 3 - User-Specified Time Slots:
    ///   ✅ User selects start date and start time
    ///   ✅ User selects end date and end time
    ///   ✅ System validates: start time < end time
    ///   ❌ Cannot book in the past
    /// 
    /// RULE 4 - Equipment Availability & Visibility:
    ///   ✅ Booked equipment shows as unavailable to other users
    ///   ✅ APIs return: Free slots, Booked slots, Start/End times
    ///   ✅ GetEquipmentBookedSlotsAsync() returns all booked time slots
    /// 
    /// RULE 5 - Daily Equipment Slot Reset:
    ///   ✅ Background service runs every 24 hours
    ///   ✅ Expired slots are cleared automatically
    ///   ✅ No-show bookings are cancelled with token refund
    ///   ✅ Completed bookings are marked as such
    /// 
    /// RULE 6 - Validation Rules (Service Layer Only):
    ///   ✅ All business logic in Service layer (not Controllers)
    ///   ✅ Check: Equipment exists and is available
    ///   ✅ Check: Time slot is valid (future, start < end)
    ///   ✅ Check: User has sufficient tokens
    ///   ❌ Reject booking if any rule fails
    /// 
    /// RULE 7 - Architecture Constraints:
    ///   ✅ Clean Architecture mandatory
    ///   ✅ No business logic in Controllers
    ///   ✅ Services contain all booking logic
    ///   ✅ Repositories handle data access only
    ///   ✅ DTOs only (no entities exposed)
    ///   ✅ Async everywhere
    /// </summary>
    public class BookingService : IBookingService
    {
        private readonly IUnitOfWork _unitOfWork;
        private readonly IMapper _mapper;
        private readonly ITokenTransactionService _tokenTransactionService;

        public BookingService(IUnitOfWork unitOfWork, IMapper mapper, ITokenTransactionService tokenTransactionService)
        {
            _unitOfWork = unitOfWork;
            _mapper = mapper;
            _tokenTransactionService = tokenTransactionService;
        }

        public async Task<BookingDto> CreateBookingAsync(CreateBookingDto createDto)
        {
            // ========== VALIDATION PHASE ==========
            
            // 1. Basic time validation
            if (createDto.StartTime >= createDto.EndTime)
            {
                throw new InvalidOperationException("Start time must be before end time");
            }

            if (createDto.StartTime < DateTime.UtcNow)
            {
                throw new InvalidOperationException("Cannot book a time slot in the past");
            }

            // 2. InBody bookings (special case - no equipment/coach needed)
            if (createDto.BookingType == BookingTypes.InBody)
            {
                if (createDto.EquipmentId.HasValue || createDto.CoachId.HasValue)
                {
                    throw new InvalidOperationException("InBody booking should not have equipment or coach");
                }
                // Skip further validation for InBody
            }
            else
            {
                // 3. Validate XOR: Either Equipment OR Coach, not both, not neither
                if ((createDto.EquipmentId.HasValue && createDto.CoachId.HasValue) ||
                    (!createDto.EquipmentId.HasValue && !createDto.CoachId.HasValue))
                {
                    throw new InvalidOperationException("Booking must be either for Equipment or Coach, not both or neither");
                }

                // 4. Validate BookingType matches the FK
                if (createDto.BookingType == BookingTypes.Equipment && !createDto.EquipmentId.HasValue)
                {
                    throw new InvalidOperationException("Equipment booking requires EquipmentId");
                }

                if (createDto.BookingType == BookingTypes.Session && !createDto.CoachId.HasValue)
                {
                    throw new InvalidOperationException("Session booking requires CoachId");
                }

                // ========== EQUIPMENT AVAILABILITY CHECK ==========
                if (createDto.EquipmentId.HasValue)
                {
                    // Check if equipment is available for the time slot
                    if (!await IsEquipmentAvailableAsync(createDto.EquipmentId.Value, createDto.StartTime, createDto.EndTime))
                    {
                        throw new InvalidOperationException("Equipment is not available for the selected time slot. It may be booked by another user.");
                    }
                }

                // ========== COACH BOOKING VALIDATION ==========
                if (createDto.CoachId.HasValue)
                {
                    // Convert User ID to CoachProfile ID
                    var coachProfile = await _unitOfWork.Repository<CoachProfile>()
                        .FirstOrDefaultAsync(cp => cp.UserId == createDto.CoachId.Value);

                    if (coachProfile == null)
                    {
                        throw new InvalidOperationException("Coach profile not found");
                    }

                    if (!await IsCoachAvailableAsync(coachProfile.Id, createDto.StartTime, createDto.EndTime))
                    {
                        throw new InvalidOperationException("Coach is not available for the selected time slot. They may be booked with another client.");
                    }

                    // Store the actual CoachProfile ID
                    createDto.CoachId = coachProfile.Id;
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
                Status = BookingStatus.Pending, // Start as pending for receptionist confirmation
                Notes = createDto.Notes,
                CreatedAt = DateTime.UtcNow,
                UpdatedAt = DateTime.UtcNow,
            };

            // Calculate Token Cost
            int tokensCost = 0;
            if (createDto.EquipmentId.HasValue)
            {
                var equipment = await _unitOfWork.Repository<Equipment>().GetByIdAsync(createDto.EquipmentId.Value);
                if (equipment != null)
                {
                    tokensCost = equipment.BookingCostTokens;
                }
            }
            else if (createDto.CoachId.HasValue)
            {
               // CoachId in DTO was updated to be CoachProfile.Id
               var coachProfile = await _unitOfWork.Repository<CoachProfile>().GetByIdAsync(createDto.CoachId.Value);
               if (coachProfile != null) 
               {
                   // Fallback to 30 if HourlyRate is null
                   tokensCost = (int)(coachProfile.HourlyRate ?? 30);
               }
            }
            
            booking.TokensCost = tokensCost;

            // Deduct Tokens and create transaction record
            if (tokensCost > 0)
            {
                var user = await _unitOfWork.Repository<User>().GetByIdAsync(createDto.UserId);
                if (user == null)
                {
                    throw new InvalidOperationException("User not found");
                }

                if (user.TokenBalance < tokensCost)
                {
                    throw new InvalidOperationException($"Insufficient tokens. Required: {tokensCost}, Available: {user.TokenBalance}");
                }

                // Create transaction record for the deduction
                string description = "";
                if (createDto.EquipmentId.HasValue)
                {
                    var equipment = await _unitOfWork.Repository<Equipment>().GetByIdAsync(createDto.EquipmentId.Value);
                    description = $"Booked {equipment?.Name ?? "Equipment"} - {(createDto.EndTime - createDto.StartTime).TotalHours:0.#}h";
                }
                else if (createDto.CoachId.HasValue)
                {
                    var coachProfile = await _unitOfWork.Repository<CoachProfile>().GetByIdAsync(createDto.CoachId.Value);
                    if (coachProfile != null)
                    {
                        var coach = await _unitOfWork.Repository<User>().GetByIdAsync(coachProfile.UserId);
                        description = $"Personal Training Session with {coach?.Name ?? "Coach"} - {(createDto.EndTime - createDto.StartTime).TotalHours:0.#}h";
                    }
                    else
                    {
                        description = $"Personal Training Session - {(createDto.EndTime - createDto.StartTime).TotalHours:0.#}h";
                    }
                }

                await _tokenTransactionService.CreateTransactionAsync(createDto.UserId, new CreateTokenTransactionDto
                {
                    Amount = -tokensCost,
                    TransactionType = "Deduction",
                    Description = description
                });
            }

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
            foreach (var booking in bookings.OrderByDescending(b => b.StartTime))
            {
                var dto = await GetBookingDtoAsync(booking.BookingId);
                if (dto != null)
                {
                    bookingDtos.Add(dto);
                }
            }

            return bookingDtos;
        }

        public async Task<IEnumerable<BookingDto>> GetAllBookingsAsync()
        {
            var bookings = await _unitOfWork.Repository<Booking>().GetAllAsync();

            var bookingDtos = new List<BookingDto>();
            foreach (var booking in bookings.OrderByDescending(b => b.StartTime))
            {
                var dto = await GetBookingDtoAsync(booking.BookingId);
                if (dto != null)
                {
                    bookingDtos.Add(dto);
                }
            }

            return bookingDtos;
        }

        public async Task<IEnumerable<BookingDto>> GetBookingsByStatusAsync(string status)
        {
            BookingStatus bookingStatus;
            if (!Enum.TryParse<BookingStatus>(status, true, out bookingStatus))
            {
                throw new ArgumentException($"Invalid booking status: {status}");
            }

            var bookings = await _unitOfWork.Repository<Booking>()
                .FindAsync(b => b.Status == bookingStatus);

            var bookingDtos = new List<BookingDto>();
            foreach (var booking in bookings.OrderByDescending(b => b.StartTime))
            {
                var dto = await GetBookingDtoAsync(booking.BookingId);
                if (dto != null)
                {
                    bookingDtos.Add(dto);
                }
            }

            return bookingDtos;
        }

        public async Task<IEnumerable<BookingDto>> GetTodaysBookingsAsync()
        {
            var today = DateTime.UtcNow.Date;
            var tomorrow = today.AddDays(1);

            var bookings = await _unitOfWork.Repository<Booking>()
                .FindAsync(b => b.StartTime >= today && b.StartTime < tomorrow);

            var bookingDtos = new List<BookingDto>();
            foreach (var booking in bookings.OrderBy(b => b.StartTime))
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
            // Convert User ID to CoachProfile ID
            var coachProfile = await _unitOfWork.Repository<CoachProfile>()
                .FirstOrDefaultAsync(cp => cp.UserId == coachId);

            if (coachProfile == null)
            {
                // If no coach profile found, return empty list instead of throwing error
                return new List<BookingDto>();
            }

            var bookings = await _unitOfWork.Repository<Booking>()
                .FindAsync(b => b.CoachId == coachProfile.Id &&
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

            // Refund Tokens if applicable
            if (booking.TokensCost > 0 && booking.Status != BookingStatus.Cancelled)
            {
                var user = await _unitOfWork.Repository<User>().GetByIdAsync(booking.UserId);
                if (user != null)
                {
                    user.TokenBalance += booking.TokensCost;
                    _unitOfWork.Repository<User>().Update(user);
                }
            }

            booking.Status = BookingStatus.Cancelled;
            booking.CancellationReason = cancellationReason;
            booking.UpdatedAt = DateTime.UtcNow;

            _unitOfWork.Repository<Booking>().Update(booking);
            await _unitOfWork.SaveChangesAsync();

            return await GetBookingDtoAsync(bookingId);
        }

        public async Task<BookingDto> ConfirmBookingAsync(int bookingId)
        {
            var booking = await _unitOfWork.Repository<Booking>().GetByIdAsync(bookingId);

            if (booking == null)
            {
                throw new KeyNotFoundException($"Booking with ID {bookingId} not found");
            }

            booking.Status = BookingStatus.Confirmed;
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
                              b.Status != BookingStatus.Completed &&
                              ((b.StartTime < endTime && b.EndTime > startTime)));

            return !overlappingBookings;
        }

        public async Task<bool> IsCoachAvailableAsync(int coachId, DateTime startTime, DateTime endTime)
        {
            var overlappingBookings = await _unitOfWork.Repository<Booking>()
                .AnyAsync(b => b.CoachId == coachId &&
                              b.Status != BookingStatus.Cancelled &&
                              b.Status != BookingStatus.Completed &&
                              ((b.StartTime < endTime && b.EndTime > startTime)));

            return !overlappingBookings;
        }

        /// <summary>
        /// Get equipment availability with booked time slots for a specific date range
        /// RULE 4 & 5: Equipment Availability & Visibility
        /// </summary>
        public async Task<IEnumerable<BookingDto>> GetEquipmentBookedSlotsAsync(int equipmentId, DateTime startDate, DateTime endDate)
        {
            var bookings = await _unitOfWork.Repository<Booking>()
                .FindAsync(b => b.EquipmentId == equipmentId &&
                              b.Status != BookingStatus.Cancelled &&
                              b.Status != BookingStatus.Completed &&
                              b.StartTime >= startDate &&
                              b.EndTime <= endDate);

            var bookingDtos = new List<BookingDto>();
            foreach (var booking in bookings.OrderBy(b => b.StartTime))
            {
                var dto = await GetBookingDtoAsync(booking.BookingId);
                if (dto != null)
                {
                    bookingDtos.Add(dto);
                }
            }

            return bookingDtos;
        }

        /// <summary>
        /// Check if user has any active coach bookings
        /// RULE 1: Used to block manual equipment booking when user has coach session
        /// </summary>
        public async Task<bool> UserHasActiveCoachBookingAsync(int userId, DateTime startTime, DateTime endTime)
        {
            return await _unitOfWork.Repository<Booking>()
                .AnyAsync(b => b.UserId == userId &&
                              b.CoachId.HasValue &&
                              b.Status != BookingStatus.Cancelled &&
                              b.Status != BookingStatus.Completed &&
                              ((b.StartTime < endTime && b.EndTime > startTime)));
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
                // Booking.CoachId is CoachProfile.Id
                var coachProfile = await _unitOfWork.Repository<CoachProfile>().GetByIdAsync(booking.CoachId.Value);
                if (coachProfile != null)
                {
                     var coachUser = await _unitOfWork.Repository<User>().GetByIdAsync(coachProfile.UserId);
                     dto.CoachName = coachUser?.Name;
                }
            }

            return dto;
        }
    }
}
