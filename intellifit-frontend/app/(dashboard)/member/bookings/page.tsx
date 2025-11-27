'use client';

import { useState, useEffect } from 'react';
import { Calendar, Clock, Plus, X, CheckCircle } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card';
import Button from '@/components/ui/Button';
import Badge from '@/components/ui/Badge';
import { Booking, Equipment, BookingStatus, EquipmentStatus } from '@/types';

// Mock data
const MOCK_BOOKINGS: Booking[] = [
  {
    bookingID: 1,
    userID: 1,
    equipmentID: 1,
    startTime: new Date(Date.now() + 3600000).toISOString(), // 1 hour from now
    endTime: new Date(Date.now() + 7200000).toISOString(),
    status: BookingStatus.Confirmed,
    tokensCost: 10,
    equipment: {
      equipmentID: 1,
      name: 'Treadmill #3',
      category: 'Cardio',
      status: EquipmentStatus.Available,
      location: 'Cardio Zone',
      lastMaintenanceDate: new Date().toISOString(),
    },
  },
  {
    bookingID: 2,
    userID: 1,
    equipmentID: 2,
    startTime: new Date(Date.now() + 86400000).toISOString(), // Tomorrow
    endTime: new Date(Date.now() + 90000000).toISOString(),
    status: BookingStatus.Confirmed,
    tokensCost: 15,
    equipment: {
      equipmentID: 2,
      name: 'Smith Machine',
      category: 'Strength',
      status: EquipmentStatus.Available,
      location: 'Weights Area',
      lastMaintenanceDate: new Date().toISOString(),
    },
  },
  {
    bookingID: 3,
    userID: 1,
    equipmentID: 3,
    startTime: new Date(Date.now() - 86400000).toISOString(), // Yesterday
    endTime: new Date(Date.now() - 82800000).toISOString(),
    status: BookingStatus.Completed,
    tokensCost: 10,
    equipment: {
      equipmentID: 3,
      name: 'Rowing Machine #2',
      category: 'Cardio',
      status: EquipmentStatus.Available,
      location: 'Cardio Zone',
      lastMaintenanceDate: new Date().toISOString(),
    },
  },
];

const MOCK_AVAILABLE_EQUIPMENT: Equipment[] = [
  {
    equipmentID: 4,
    name: 'Bench Press',
    category: 'Strength',
    status: EquipmentStatus.Available,
    location: 'Weights Area',
    lastMaintenanceDate: new Date().toISOString(),
  },
  {
    equipmentID: 5,
    name: 'Leg Press Machine',
    category: 'Strength',
    status: EquipmentStatus.Available,
    location: 'Weights Area',
    lastMaintenanceDate: new Date().toISOString(),
  },
  {
    equipmentID: 6,
    name: 'Elliptical #1',
    category: 'Cardio',
    status: EquipmentStatus.Available,
    location: 'Cardio Zone',
    lastMaintenanceDate: new Date().toISOString(),
  },
];

export default function BookingsPage() {
  const [bookings, setBookings] = useState<Booking[]>(MOCK_BOOKINGS);
  const [availableEquipment] = useState<Equipment[]>(MOCK_AVAILABLE_EQUIPMENT);
  const [isLoading, setIsLoading] = useState(true);
  const [showNewBooking, setShowNewBooking] = useState(false);

  useEffect(() => {
    const loadData = async () => {
      await new Promise((resolve) => setTimeout(resolve, 500));
      setIsLoading(false);
    };
    loadData();
  }, []);

  const handleCancelBooking = (bookingId: number) => {
    setBookings((prev) =>
      prev.map((b) =>
        b.bookingID === bookingId ? { ...b, status: BookingStatus.Cancelled } : b
      )
    );
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
                  <select className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#0b4fd4]">
                    <option>Select equipment...</option>
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
                <Button className="flex-1">Confirm Booking</Button>
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
