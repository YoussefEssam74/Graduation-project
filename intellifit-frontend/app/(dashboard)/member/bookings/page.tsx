'use client';

import { useState, useEffect } from 'react';
import { useAuthStore } from '@/hooks/useAuth';
import { bookingApi, equipmentApi } from '@/lib/api/services';
import { Calendar, Clock, Plus, X, CheckCircle } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card';
import Button from '@/components/ui/Button';
import Badge from '@/components/ui/Badge';
import { Booking, Equipment, BookingStatus, EquipmentStatus } from '@/types';

export default function BookingsPage() {
  const { user } = useAuthStore();
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [availableEquipment, setAvailableEquipment] = useState<Equipment[]>([]);
  const [selectedEquipment, setSelectedEquipment] = useState<number | ''>('');
  const [selectedDate, setSelectedDate] = useState<string>('');
  const [selectedTime, setSelectedTime] = useState<string>('');
  const [selectedDuration, setSelectedDuration] = useState<number>(60);
  const [isLoading, setIsLoading] = useState(true);
  const [showNewBooking, setShowNewBooking] = useState(false);

  useEffect(() => {
    const loadData = async () => {
      if (!user?.userId) {
        setIsLoading(false);
        return;
      }

      try {
        const bookingsRes = await bookingApi.getMyBookings(user.userId);
        if (bookingsRes?.success && bookingsRes.data) setBookings(bookingsRes.data);

        const equipRes = await equipmentApi.getAvailable();
        if (equipRes?.success && equipRes.data) setAvailableEquipment(equipRes.data);
      } catch (err) {
        console.error('Failed to load bookings or equipment', err);
      } finally {
        setIsLoading(false);
      }
    };

    loadData();
  }, [user]);

  const handleCancelBooking = async (bookingId: number) => {
    try {
      const res = await bookingApi.cancel(bookingId);
      if (res?.success && res.data) {
        // update local state
        setBookings((prev) => prev.map((b) => (b.bookingID === bookingId ? res.data as Booking : b)));
      }
    } catch (err) {
      console.error('Failed to cancel booking', err);
    }
  };

  const handleCreateBooking = async () => {
    if (!user?.userId || !selectedEquipment || !selectedDate || !selectedTime) return;

    const start = new Date(`${selectedDate}T${selectedTime}`);
    const end = new Date(start.getTime() + selectedDuration * 60 * 1000);

    try {
      const payload = {
        userId: user.userId,
        equipmentId: Number(selectedEquipment),
        bookingType: 'Equipment',
        startTime: start.toISOString(),
        endTime: end.toISOString(),
      } as any;

      const res = await bookingApi.create(payload);
      if (res?.success && res.data) {
        setBookings((prev) => [res.data as Booking, ...prev]);
        setShowNewBooking(false);
        // reset form
        setSelectedEquipment('');
        setSelectedDate('');
        setSelectedTime('');
        setSelectedDuration(60);
      }
    } catch (err) {
      console.error('Failed to create booking', err);
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#0b4fd4]"></div>
      </div>
    );
  }

  const upcomingBookings = bookings.filter(
    (b) => b.status === BookingStatus.Confirmed && new Date(b.startTime) > new Date()
  );
  const pastBookings = bookings.filter(
    (b) =>
      b.status === BookingStatus.Completed ||
      b.status === BookingStatus.Cancelled ||
      new Date(b.endTime) < new Date()
  );

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">My Bookings</h1>
          <p className="text-gray-600 mt-1">Manage your equipment and session bookings</p>
        </div>
        <Button onClick={() => setShowNewBooking(!showNewBooking)}>
          <Plus className="h-4 w-4 mr-2" />
          New Booking
        </Button>
      </div>

      {/* New Booking Form */}
      {showNewBooking && (
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle>Create New Booking</CardTitle>
              <button
                onClick={() => setShowNewBooking(false)}
                className="text-gray-400 hover:text-gray-600"
              >
                <X className="h-5 w-5" />
              </button>
            </div>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="grid md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Equipment
                  </label>
                  <select value={selectedEquipment} onChange={(e) => setSelectedEquipment(e.target.value ? Number(e.target.value) : '')} className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#0b4fd4]">
                    <option value="">Select equipment...</option>
                    {availableEquipment.map((eq) => (
                      <option key={eq.equipmentID} value={eq.equipmentID}>
                        {eq.name} - {eq.category}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Date
                  </label>
                  <input
                    type="date"
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#0b4fd4]"
                    min={new Date().toISOString().split('T')[0]}
                  />
                </div>
              </div>
              <div className="grid md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Start Time
                  </label>
                  <input
                    type="time"
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#0b4fd4]"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Duration
                  </label>
                  <select className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#0b4fd4]">
                    <option value="30">30 minutes (5 tokens)</option>
                    <option value="60">1 hour (10 tokens)</option>
                    <option value="90">1.5 hours (15 tokens)</option>
                    <option value="120">2 hours (20 tokens)</option>
                  </select>
                </div>
              </div>
              <div className="flex gap-3">
                <Button className="flex-1" onClick={handleCreateBooking}>Confirm Booking</Button>
                <Button
                  variant="outline"
                  className="flex-1"
                  onClick={() => setShowNewBooking(false)}
                >
                  Cancel
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Upcoming Bookings */}
      <div>
        <h2 className="text-xl font-semibold text-gray-900 mb-4">
          Upcoming Bookings ({upcomingBookings.length})
        </h2>
        {upcomingBookings.length === 0 ? (
          <Card>
            <CardContent className="text-center py-12">
              <Calendar className="h-16 w-16 text-gray-300 mx-auto mb-4" />
              <h3 className="text-lg font-semibold text-gray-900 mb-2">
                No Upcoming Bookings
              </h3>
              <p className="text-gray-600 mb-6">Book equipment or sessions to get started</p>
              <Button onClick={() => setShowNewBooking(true)}>Create Booking</Button>
            </CardContent>
          </Card>
        ) : (
          <div className="grid gap-4 md:grid-cols-2">
            {upcomingBookings.map((booking) => (
              <Card key={booking.bookingID}>
                <CardContent className="pt-6">
                  <div className="flex items-start justify-between mb-4">
                    <div>
                      <h3 className="font-semibold text-gray-900">
                        {booking.equipment?.name}
                      </h3>
                      <p className="text-sm text-gray-600">{booking.equipment?.location}</p>
                    </div>
                    <Badge variant="success">{booking.status}</Badge>
                  </div>
                  <div className="space-y-2 mb-4">
                    <div className="flex items-center gap-2 text-sm text-gray-600">
                      <Calendar className="h-4 w-4" />
                      <span>{new Date(booking.startTime).toLocaleDateString()}</span>
                    </div>
                    <div className="flex items-center gap-2 text-sm text-gray-600">
                      <Clock className="h-4 w-4" />
                      <span>
                        {new Date(booking.startTime).toLocaleTimeString([], {
                          hour: '2-digit',
                          minute: '2-digit',
                        })}{' '}
                        -{' '}
                        {new Date(booking.endTime).toLocaleTimeString([], {
                          hour: '2-digit',
                          minute: '2-digit',
                        })}
                      </span>
                    </div>
                  </div>
                  <div className="flex items-center justify-between pt-4 border-t">
                    <span className="text-sm text-gray-600">
                      💎 {booking.tokensCost} tokens
                    </span>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleCancelBooking(booking.bookingID)}
                    >
                      Cancel
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>

      {/* Past Bookings */}
      {pastBookings.length > 0 && (
        <div>
          <h2 className="text-xl font-semibold text-gray-900 mb-4">
            Past Bookings ({pastBookings.length})
          </h2>
          <Card>
            <CardContent className="p-0">
              <div className="divide-y">
                {pastBookings.map((booking) => (
                  <div key={booking.bookingID} className="p-4 flex items-center justify-between">
                    <div className="flex items-center gap-4">
                      <div
                        className={`p-2 rounded-lg ${
                          booking.status === BookingStatus.Completed
                            ? 'bg-green-100'
                            : 'bg-gray-100'
                        }`}
                      >
                        {booking.status === BookingStatus.Completed ? (
                          <CheckCircle className="h-5 w-5 text-green-600" />
                        ) : (
                          <X className="h-5 w-5 text-gray-600" />
                        )}
                      </div>
                      <div>
                        <h4 className="font-semibold text-gray-900">
                          {booking.equipment?.name}
                        </h4>
                        <div className="flex items-center gap-3 text-sm text-gray-600 mt-1">
                          <span>{new Date(booking.startTime).toLocaleDateString()}</span>
                          <span>•</span>
                          <span>
                            {new Date(booking.startTime).toLocaleTimeString([], {
                              hour: '2-digit',
                              minute: '2-digit',
                            })}
                          </span>
                        </div>
                      </div>
                    </div>
                    <Badge
                      variant={
                        booking.status === BookingStatus.Completed ? 'success' : 'default'
                      }
                    >
                      {booking.status}
                    </Badge>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  );
}
