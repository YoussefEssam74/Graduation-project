import 'package:flutter_bloc/flutter_bloc.dart';
import 'package:dio/dio.dart';
import 'package:one/core/api/api_client.dart';
import 'package:one/core/api/cache_helper.dart';
import 'bookings_state.dart';
import '../models/equipment_model.dart';
import '../models/coach_model.dart';

class BookingsCubit extends Cubit<BookingsState> {
  BookingsCubit() : super(BookingsInitial());

  List<EquipmentModel> _allEquipment = [];
  String _currentCategory = 'All Equipment';
  DateTime _currentDate = DateTime.now();
  int _tokenBalance = 0;

  // ══════════════════════════════════════════════════
  // EQUIPMENT
  // ══════════════════════════════════════════════════
  Future<void> fetchEquipment() async {
    emit(BookingsLoading());
    try {
      final userId = CacheHelper.getData(key: 'userId') ?? 0;
      final results = await Future.wait([
        ApiClient.dio.get('/Equipment/available'),
        ApiClient.dio.get('/users/$userId/tokens'),
      ]);

      List<dynamic> raw = [];
      final eqData = results[0].data;
      if (eqData is List) {
        raw = eqData;
      } else if (eqData is Map && eqData['data'] is List) {
        raw = eqData['data'];
      }
      _allEquipment = raw.map((e) => EquipmentModel.fromJson(e)).toList();

      try {
        final t = results[1].data;
        _tokenBalance = t is int ? t : ((t is Map ? t['balance'] : null) ?? 0);
      } catch (_) {}

      _emitEquipmentLoaded();
    } on DioException catch (e) {
      emit(BookingsError(_dioMsg(e, 'Failed to load equipment')));
    } catch (_) {
      emit(BookingsError('Unexpected error loading equipment'));
    }
  }

  void filterByCategory(String category) {
    _currentCategory = category;
    _emitEquipmentLoaded();
  }

  void selectDate(DateTime date) {
    _currentDate = date;
    _emitEquipmentLoaded();
  }

  void _emitEquipmentLoaded() {
    final filtered = _currentCategory == 'All Equipment'
        ? _allEquipment
        : _allEquipment
              .where(
                (eq) => eq.categoryName.toLowerCase().contains(
                  _currentCategory.toLowerCase(),
                ),
              )
              .toList();
    emit(
      BookingsLoaded(
        allEquipment: _allEquipment,
        filteredEquipment: filtered,
        selectedCategory: _currentCategory,
        selectedDate: _currentDate,
        userTokenBalance: _tokenBalance,
      ),
    );
  }

  // ── Create Equipment Booking + send notification ───
  Future<String?> createEquipmentBooking(
    int equipmentId,
    String equipmentName,
    DateTime start,
    DateTime end,
    int cost,
  ) async {
    emit(BookingCreating());
    try {
      final userId = CacheHelper.getData(key: 'userId') ?? 0;

      final response = await ApiClient.dio.post(
        '/bookings',
        data: {
          "userId": userId,
          "equipmentId": equipmentId,
          "bookingType": "Equipment",
          "startTime": start.toIso8601String(),
          "endTime": end.toIso8601String(),
          "notes": "Booked via IntelliFit",
        },
      );

      if (response.statusCode == 200 || response.statusCode == 201) {
        // خصم التوكنز
        _tokenBalance -= cost;
        if (_tokenBalance < 0) _tokenBalance = 0;

        // إرسال نوتيفيكيشن للمستخدم
        await _sendNotification(
          userId: userId,
          title: 'Equipment Booking Confirmed ✅',
          message:
              'You booked $equipmentName from ${_fmtTime(start)} to ${_fmtTime(end)}. Cost: $cost tokens.',
          notificationType: 'Booking',
          referenceType: 'Equipment',
          referenceId: equipmentId,
        );

        return null; // success
      }
      return _extractMsg(response.data) ?? 'Booking failed';
    } on DioException catch (e) {
      return _dioMsg(e, 'Could not complete booking');
    } catch (_) {
      return 'Unexpected error';
    }
  }

  void finishBookingSuccess(int cost) {
    emit(BookingSuccessState('Booking confirmed! 🎉', tokensCost: cost));
    _emitEquipmentLoaded();
  }

  void finishBookingError(String msg) {
    emit(BookingsError(msg));
    _emitEquipmentLoaded();
  }

  // ══════════════════════════════════════════════════
  // COACHES
  // ══════════════════════════════════════════════════
  Future<void> fetchCoaches() async {
    emit(CoachesLoading());
    try {
      final userId = CacheHelper.getData(key: 'userId') ?? 0;
      final results = await Future.wait([
        ApiClient.dio.get('/users/coaches/details'),
        ApiClient.dio.get('/users/$userId/tokens'),
      ]);

      List<dynamic> raw = [];
      final cData = results[0].data;
      if (cData is List) {
        raw = cData;
      } else if (cData is Map && cData['data'] is List) {
        raw = cData['data'];
      }
      final coaches = raw.map((c) => CoachModel.fromJson(c)).toList();

      try {
        final t = results[1].data;
        _tokenBalance = t is int ? t : ((t is Map ? t['balance'] : null) ?? 0);
      } catch (_) {}

      emit(
        CoachesLoaded(
          coaches: coaches,
          selectedDate: _currentDate,
          userTokenBalance: _tokenBalance,
        ),
      );
    } on DioException catch (e) {
      emit(BookingsError(_dioMsg(e, 'Failed to load coaches')));
    } catch (_) {
      emit(BookingsError('Unexpected error loading coaches'));
    }
  }

  void selectCoachDate(DateTime date) {
    _currentDate = date;
    final s = state;
    if (s is CoachesLoaded) emit(s.copyWith(selectedDate: date));
  }

  // ── Create Coach Booking + send notification ──────
  Future<String?> createCoachBooking(
    int coachProfileId,
    String coachName,
    DateTime start,
    DateTime end,
    String? notes,
  ) async {
    emit(BookingCreating());
    try {
      final userId = CacheHelper.getData(key: 'userId') ?? 0;

      final body = <String, dynamic>{
        "userId": userId,
        "coachId": coachProfileId,
        "bookingType": "Session",
        "startTime": start.toIso8601String(),
        "endTime": end.toIso8601String(),
      };
      if (notes != null && notes.isNotEmpty) body["notes"] = notes;

      final response = await ApiClient.dio.post('/bookings', data: body);

      if (response.statusCode == 200 || response.statusCode == 201) {
        // إرسال نوتيفيكيشن
        await _sendNotification(
          userId: userId,
          title: 'Coach Session Booked ✅',
          message:
              'Your session with $coachName is confirmed from ${_fmtTime(start)} to ${_fmtTime(end)}.',
          notificationType: 'Booking',
          referenceType: 'Coach',
          referenceId: coachProfileId,
        );

        return null; // success
      }
      return _extractMsg(response.data) ?? 'Coach booking failed';
    } on DioException catch (e) {
      return _dioMsg(e, 'Could not book coach. Please try again.');
    } catch (e) {
      return 'Unexpected error: ${e.toString()}';
    }
  }

  // ══════════════════════════════════════════════════
  // NOTIFICATIONS
  // ══════════════════════════════════════════════════
  Future<void> _sendNotification({
    required int userId,
    required String title,
    required String message,
    String? notificationType,
    String? referenceType,
    int? referenceId,
  }) async {
    try {
      await ApiClient.dio.post(
        '/notifications',
        data: {
          "userId": userId,
          "title": title,
          "message": message,
          "notificationType": notificationType ?? "Booking",
          "priority": "High",
          if (referenceType != null) "referenceType": referenceType,
          if (referenceId != null) "referenceId": referenceId,
        },
      );
    } catch (_) {
      // Notification failure shouldn't break the booking flow
    }
  }

  // ══════════════════════════════════════════════════
  // Helpers
  // ══════════════════════════════════════════════════
  String _dioMsg(DioException e, String fallback) {
    final data = e.response?.data;
    if (data is Map) {
      return (data['message'] ?? data['title'] ?? data['error'] ?? fallback)
          .toString();
    }
    if (data is String && data.isNotEmpty) return data;
    if (e.response?.statusCode != null) {
      return '$fallback (${e.response!.statusCode})';
    }
    return e.message?.isNotEmpty == true ? e.message! : fallback;
  }

  String? _extractMsg(dynamic data) {
    if (data is Map) {
      return (data['message'] ?? data['title'])?.toString();
    }
    if (data is String && data.isNotEmpty) return data;
    return null;
  }

  String _fmtTime(DateTime dt) {
    final h = dt.hour.toString().padLeft(2, '0');
    final m = dt.minute.toString().padLeft(2, '0');
    return '$h:$m';
  }
}
