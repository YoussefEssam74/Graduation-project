import 'package:flutter_bloc/flutter_bloc.dart';
import 'package:dio/dio.dart';
import 'package:one/core/api/api_client.dart';
import 'package:one/core/api/cache_helper.dart';
import 'profile_state.dart';
import '../models/profile_models.dart';

class ProfileCubit extends Cubit<ProfileState> {
  ProfileCubit() : super(ProfileInitial());

  Future<void> fetchUserProfile() async {
    emit(ProfileLoading());
    try {
      final userId = CacheHelper.getData(key: 'userId') ?? 0;

      // ── 1. User (required) ──────────────────────
      UserModel user;
      try {
        final res = await ApiClient.dio.get('/users/$userId');
        if (res.statusCode == 200 && res.data != null) {
          Map<String, dynamic> d;
          if (res.data is Map<String, dynamic>) {
            final raw = res.data as Map<String, dynamic>;
            d = raw['data'] is Map<String, dynamic>
                ? raw['data'] as Map<String, dynamic>
                : raw;
          } else {
            d = <String, dynamic>{};
          }
          user = UserModel.fromJson(d);
        } else {
          emit(ProfileError('Failed to load profile'));
          return;
        }
      } on DioException catch (e) {
        emit(
          ProfileError(
            e.response?.data?['message'] ?? 'Failed to load profile',
          ),
        );
        return;
      }

      // ── 2. InBody (optional — 404 = new user) ───
      InBodyModel? inBody;
      try {
        final res = await ApiClient.dio.get('/inbody/user/$userId/latest');
        if (res.statusCode == 200 &&
            res.data != null &&
            res.data is Map<String, dynamic>) {
          final raw = res.data as Map<String, dynamic>;
          final d = raw['data'] is Map<String, dynamic>
              ? raw['data'] as Map<String, dynamic>
              : raw;
          // only parse if it has the weight field
          if (d.containsKey('weight')) {
            inBody = InBodyModel.fromJson(d);
          }
        }
      } on DioException catch (_) {
        // 404 "No measurements found" = totally fine for new users
        inBody = null;
      } catch (_) {
        inBody = null;
      }

      // ── 3. Subscription (optional) ──────────────
      ActiveSubscriptionModel? subscription;
      try {
        final res = await ApiClient.dio.get(
          '/Subscription/user/$userId/active',
        );
        if (res.statusCode == 200 &&
            res.data != null &&
            res.data is Map<String, dynamic>) {
          final raw = res.data as Map<String, dynamic>;
          final d = raw['data'] is Map<String, dynamic>
              ? raw['data'] as Map<String, dynamic>
              : raw;
          if (d.containsKey('planId') || d.containsKey('planName')) {
            subscription = ActiveSubscriptionModel.fromJson(d);
          }
        }
      } on DioException catch (_) {
        // 404 = no subscription yet
        subscription = null;
      } catch (_) {
        subscription = null;
      }

      // ── 4. Workout summary (optional) ───────────
      int workoutsThisMonth = 0;
      double totalDistance = 0;
      try {
        final res = await ApiClient.dio.get('/users/$userId/workout-summary');
        if (res.statusCode == 200 &&
            res.data != null &&
            res.data is Map<String, dynamic>) {
          final raw = res.data as Map<String, dynamic>;
          final d = raw['data'] is Map<String, dynamic>
              ? raw['data'] as Map<String, dynamic>
              : raw;
          workoutsThisMonth = d['workoutsThisWeek'] ?? 0;
          totalDistance = (d['totalDistanceKm'] as num?)?.toDouble() ?? 0;
        }
      } on DioException catch (_) {
      } catch (_) {}

      // ── 5. Recent activity (optional) ───────────
      List<RecentActivityModel> activity = [];
      try {
        final res = await ApiClient.dio.get(
          '/activity-feed/recent',
          queryParameters: {'userId': userId, 'limit': 5},
        );
        if (res.statusCode == 200 && res.data is List) {
          activity = (res.data as List)
              .whereType<Map<String, dynamic>>()
              .map((e) => RecentActivityModel.fromJson(e))
              .toList();
        }
      } on DioException catch (_) {
      } catch (_) {}

      // ── Always succeed if user loaded ───────────
      emit(
        ProfileLoaded(
          user: user,
          inBody: inBody,
          subscription: subscription,
          recentActivity: activity,
          workoutsThisMonth: workoutsThisMonth,
          totalDistanceKm: totalDistance,
        ),
      );
    } catch (e) {
      emit(ProfileError('Unexpected error. Please try again.'));
    }
  }

  Future<void> updateProfile({String? name, String? phone}) async {
    emit(ProfileUpdating());
    try {
      final userId = CacheHelper.getData(key: 'userId') ?? 0;
      await ApiClient.dio.put(
        '/users/$userId',
        data: {
          if (name != null) 'name': name,
          if (phone != null) 'phone': phone,
        },
      );
      emit(ProfileUpdateSuccess('Profile updated successfully'));
      await fetchUserProfile();
    } on DioException catch (e) {
      emit(
        ProfileError(
          e.response?.data?['message'] ?? 'Failed to update profile',
        ),
      );
      await fetchUserProfile();
    } catch (_) {
      emit(ProfileError('Failed to update profile'));
      await fetchUserProfile();
    }
  }

  Future<void> saveInBodyMeasurement({
    required double weight,
    required double height,
    double? bodyFat,
    double? muscleMass,
    double? bodyWater,
  }) async {
    emit(ProfileUpdating());
    try {
      final userId = CacheHelper.getData(key: 'userId') ?? 0;
      await ApiClient.dio.post(
        '/inbody',
        data: {
          'userId': userId,
          'weight': weight,
          'height': height,
          if (bodyFat != null) 'bodyFatPercentage': bodyFat,
          if (muscleMass != null) 'muscleMass': muscleMass,
          if (bodyWater != null) 'bodyWaterPercentage': bodyWater,
        },
      );
      emit(ProfileUpdateSuccess('Measurements saved!'));
      await fetchUserProfile();
    } on DioException catch (e) {
      emit(
        ProfileError(
          e.response?.data?['message'] ?? 'Failed to save measurements',
        ),
      );
      await fetchUserProfile();
    } catch (_) {
      emit(ProfileError('Failed to save measurements'));
      await fetchUserProfile();
    }
  }
}


//-----------------------------------------------------------------------------------------//

