import { apiFetch, type ApiResponse } from './client';

export interface CreateBookingDto {
  userId: number;
  equipmentId?: number;
  coachId?: number;
  bookingType: string;
  startTime: string;
  endTime: string;
  notes?: string;
}

export interface BookingDto {
  bookingId: number;
  userId: number;
  userName: string;
  equipmentId?: number;
  equipmentName?: string;
  coachId?: number;
  coachName?: string;
  bookingType: string;
  startTime: string;
  endTime: string;
  status: number;
  statusText: string;
  tokensCost: number;
  notes?: string;
  createdAt: string;
}

export const bookingsApi = {
  /**
   * Create a new booking
   */
  async createBooking(data: CreateBookingDto): Promise<ApiResponse<BookingDto>> {
    return apiFetch<BookingDto>('/bookings', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  },

  /**
   * Get booking by ID
   */
  async getBooking(id: number): Promise<ApiResponse<BookingDto>> {
    return apiFetch<BookingDto>(`/bookings/${id}`);
  },

  /**
   * Get all bookings for a user
   */
  async getUserBookings(userId: number): Promise<ApiResponse<BookingDto[]>> {
    return apiFetch<BookingDto[]>(`/bookings/user/${userId}`);
  },

  /**
   * Cancel a booking
   */
  async cancelBooking(id: number, reason: string): Promise<ApiResponse<BookingDto>> {
    return apiFetch<BookingDto>(`/bookings/${id}/cancel`, {
      method: 'PUT',
      body: JSON.stringify(reason),
    });
  },

  /**
   * Check in to a booking
   */
  async checkIn(id: number): Promise<ApiResponse<BookingDto>> {
    return apiFetch<BookingDto>(`/bookings/${id}/checkin`, {
      method: 'PUT',
    });
  },

  /**
   * Check out from a booking
   */
  async checkOut(id: number): Promise<ApiResponse<BookingDto>> {
    return apiFetch<BookingDto>(`/bookings/${id}/checkout`, {
      method: 'PUT',
    });
  },
};
