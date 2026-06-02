import 'dart:convert';
import 'package:flutter_bloc/flutter_bloc.dart';
import 'package:dio/dio.dart';
import 'package:one/core/api/api_client.dart';
import 'package:one/core/api/cache_helper.dart';
import 'generate_nutrition_state.dart';

class GenerateNutritionCubit extends Cubit<GenerateNutritionState> {
  GenerateNutritionCubit() : super(GenerateNutritionInitial());

  Future<void> generateNutritionPlan({
    required String planName,
    required String goal,
    required String activityLevel,
    required String dietType,
    required List<String> restrictions,
    required int dailyCalories,
    required int proteinGrams,
    required int carbsGrams,
    required int fatGrams,
  }) async {
    emit(GenerateNutritionLoading());
    try {
      final userId = CacheHelper.getData(key: 'userId') ?? 0;

      // 1. Fetch user profile to get gender and date of birth (for age)
      String gender = 'male';
      int age = 25;
      try {
        final userRes = await ApiClient.dio.get('/users/$userId');
        if (userRes.statusCode == 200 && userRes.data != null) {
          final data = userRes.data['data'] ?? userRes.data;
          final userGender = data['gender'];
          if (userGender == 1 || userGender.toString().toLowerCase() == 'female') {
            gender = 'female';
          }
          final dobStr = data['dateOfBirth'];
          if (dobStr != null && dobStr.toString().isNotEmpty) {
            final dob = DateTime.tryParse(dobStr.toString());
            if (dob != null) {
              age = DateTime.now().year - dob.year;
              if (DateTime.now().month < dob.month ||
                  (DateTime.now().month == dob.month && DateTime.now().day < dob.day)) {
                age--;
              }
            }
          }
        }
      } catch (_) {
        // Fallback to default gender/age
      }

      // 2. Fetch latest InBody measurement to get weight and height
      double weight = 70.0;
      double height = 170.0;
      Map<String, dynamic>? inbodyMap;
      try {
        final inbodyRes = await ApiClient.dio.get('/inbody/user/$userId/latest');
        if (inbodyRes.statusCode == 200 && inbodyRes.data != null) {
          final data = inbodyRes.data['data'] ?? inbodyRes.data;
          weight = (data['weight'] as num?)?.toDouble() ?? 70.0;
          height = (data['height'] as num?)?.toDouble() ?? 170.0;
          inbodyMap = {
            'body_fat_percentage': (data['bodyFatPercentage'] as num?)?.toDouble() ?? 20.0,
            'muscle_mass_kg': (data['muscleMass'] as num?)?.toDouble() ?? 30.0,
            'bmr_kcal': (data['bmr'] as num?)?.toDouble() ?? 1500.0,
            'visceral_fat_level': (data['visceralFat'] as num?)?.toInt() ?? 5,
          };
        }
      } catch (_) {
        // Fallback to default weight/height
      }

      // 3. Map goal & activity level to C# DTO / ML expected snake_case values
      String mlGoal = 'maintenance';
      final lowerGoal = goal.toLowerCase();
      if (lowerGoal.contains('loss')) {
        mlGoal = 'weight_loss';
      } else if (lowerGoal.contains('gain')) {
        mlGoal = 'muscle_gain';
      } else if (lowerGoal.contains('recomp')) {
        mlGoal = 'body_recomposition';
      }

      String mlActivity = 'moderate';
      final lowerActivity = activityLevel.toLowerCase();
      if (lowerActivity.contains('sedentary')) {
        mlActivity = 'sedentary';
      } else if (lowerActivity.contains('light')) {
        mlActivity = 'light';
      } else if (lowerActivity.contains('moderate')) {
        mlActivity = 'moderate';
      } else if (lowerActivity.contains('very')) {
        mlActivity = 'active';
      } else if (lowerActivity.contains('extreme')) {
        mlActivity = 'very_active';
      }

      // 4. Generate plan from Modal-based Nutrition AI via backend proxy
      final response = await ApiClient.dio.post(
        '/nutrition-ai/generate',
        data: {
          'member_id': userId.toString(),
          'gender': gender,
          'age': age,
          'weight_kg': weight,
          'height_cm': height,
          'goal': mlGoal,
          'activity_level': mlActivity,
          'cuisine_preference': 'egyptian',
          'health_conditions': restrictions.where((r) => r != 'None').toList(),
          'allergies': <String>[],
          'dietary_preferences': [dietType],
          if (inbodyMap != null) 'inbody': inbodyMap,
        },
      );

      if (response.statusCode == 200 || response.statusCode == 201) {
        final data = response.data;
        final success = data is Map<String, dynamic>
            ? (data['success'] as bool? ?? true)
            : true;
        if (!success) {
          final errMsg = data is Map<String, dynamic>
              ? (data['errorMessage'] ?? data['message'] ?? 'Generation failed')
              : 'Generation failed';
          emit(GenerateNutritionError(_friendlyMsg(errMsg.toString())));
          return;
        }

        // 5. Save the generated plan to the backend database!
        final saveRes = await ApiClient.dio.post(
          '/nutrition-plans/generate',
          data: {
            'memberId': userId,
            'planName': planName,
            'description': 'AI Generated Nutrition Plan',
            'fitnessGoal': goal,
            'dietaryRestrictions': restrictions.where((r) => r != 'None').join(','),
            'dailyCalories': dailyCalories,
            'proteinGrams': proteinGrams,
            'carbsGrams': carbsGrams,
            'fatGrams': fatGrams,
            'startDate': DateTime.now().toIso8601String(),
            'aiPlanJson': data is Map<String, dynamic> ? jsonEncode(data) : data.toString(),
          },
        );

        if (saveRes.statusCode == 200 || saveRes.statusCode == 201) {
          emit(GenerateNutritionSuccess('Nutrition plan generated and saved! 🥗'));
        } else {
          emit(GenerateNutritionError('Plan generated but failed to save in database.'));
        }
      } else {
        final msg =
            _extractMsg(response.data) ??
            'Generation failed (${response.statusCode})';
        emit(GenerateNutritionError(_friendlyMsg(msg)));
      }
    } on DioException catch (e) {
      emit(GenerateNutritionError(_friendlyMsg(_dioMsg(e))));
    } catch (e) {
      emit(GenerateNutritionError('Unexpected error: $e'));
    }
  }

  String _friendlyMsg(String msg) {
    final lower = msg.toLowerCase();
    if (lower.contains('token') ||
        lower.contains('insufficient') ||
        lower.contains('balance')) {
      return 'Not enough tokens. Subscribe from Profile → Tokens & Billing.';
    }
    if (lower.contains('ml service') ||
        lower.contains('unavailable') ||
        lower.contains('refused')) {
      return 'AI service is temporarily offline. Please try again later.';
    }
    return msg.isEmpty ? 'Generation failed. Please try again.' : msg;
  }

  String? _extractMsg(dynamic data) {
    if (data is Map<String, dynamic>) {
      return (data['message'] ??
              data['title'] ??
              data['errorMessage'] ??
              data['error'])
          ?.toString();
    }
    return null;
  }

  String _dioMsg(DioException e) {
    final d = e.response?.data;
    if (d is Map<String, dynamic>) {
      return (d['message'] ?? d['title'] ?? d['error'] ?? '').toString();
    }
    return 'Connection error (${e.response?.statusCode ?? "offline"})';
  }
}
