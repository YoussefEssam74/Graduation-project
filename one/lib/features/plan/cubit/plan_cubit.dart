import 'dart:convert';
import 'package:flutter_bloc/flutter_bloc.dart';
import 'package:dio/dio.dart';
import 'package:one/core/api/api_client.dart';
import 'package:one/core/api/cache_helper.dart';
import '../model/plan_model.dart';
import '../model/nutrition_plan_model.dart';
import 'plan_state.dart';

class PlanCubit extends Cubit<PlanState> {
  PlanCubit() : super(PlanInitial());

  // ─── Fetch workout plans ──────────────────────
  Future<void> fetchPlans() async {
    emit(PlanLoading());
    try {
      final res = await ApiClient.dio.get('/workout-ai/my-plans');

      List<dynamic> raw = [];
      if (res.data is List) {
        raw = res.data as List;
      } else if (res.data is Map<String, dynamic>) {
        final d = res.data as Map<String, dynamic>;
        raw = (d['data'] ?? d['plans'] ?? []) is List
            ? d['data'] ?? d['plans'] ?? []
            : [];
      }

      if (raw.isEmpty) {
        emit(PlanLoaded(allPlans: [], activePlan: null));
        return;
      }

      final plans = raw
          .whereType<Map<String, dynamic>>()
          .map((j) => PlanModel.fromJson(j))
          .toList();

      PlanModel? active;
      if (plans.isNotEmpty) {
        // prefer plan with isActive=true
        active = plans.firstWhere((p) => p.isActive, orElse: () => plans.first);
      }

      emit(PlanLoaded(allPlans: plans, activePlan: active));
    } on DioException catch (e) {
      final status = e.response?.statusCode ?? 0;
      // 404 = no plans yet → show empty
      if (status == 404 || status == 400) {
        emit(PlanLoaded(allPlans: [], activePlan: null));
      } else {
        final msg = _dioMsg(e, 'Failed to load plans');
        emit(PlanError(msg));
      }
    } catch (_) {
      emit(PlanLoaded(allPlans: [], activePlan: null));
    }
  }

  void selectDay(int index) {
    final s = state;
    if (s is PlanLoaded) emit(s.copyWith(selectedDayIndex: index));
  }

  Future<void> deletePlan(int planId) async {
    final prev = state;
    emit(PlanDeleting());
    try {
      await ApiClient.dio.delete('/workout-ai/my-plans/$planId');
      emit(PlanDeleteSuccess('Plan deleted successfully'));
      await fetchPlans();
    } on DioException catch (e) {
      emit(PlanError(_dioMsg(e, 'Failed to delete plan')));
      if (prev is PlanLoaded) emit(prev);
    } catch (_) {
      if (prev is PlanLoaded) emit(prev);
    }
  }

  // ─── Generate workout plan ────────────────────
  Future<void> generateWorkoutPlan({
    required String fitnessLevel,
    required String goal,
    required int daysPerWeek,
    List<String>? equipment,
    List<String>? injuries,
    bool forceRegenerate = true,
  }) async {
    emit(WorkoutPlanGenerating());
    try {
      final userId = CacheHelper.getData(key: 'userId') ?? 0;

      final response = await ApiClient.dio.post(
        '/workout-ai/generate',
        data: {
          'userId': userId,
          'fitnessLevel': fitnessLevel,
          'goal': goal,
          'daysPerWeek': daysPerWeek,
          'includeUserContext': true,
          'forceRegenerate': forceRegenerate,
          if (equipment != null && equipment.isNotEmpty) 'equipment': equipment,
          if (injuries != null && injuries.isNotEmpty) 'injuries': injuries,
        },
      );

      final data = response.data;

      // Check success field first
      if (data is Map<String, dynamic>) {
        final success = data['success'] as bool? ?? true;
        final errMsg = (data['errorMessage'] ?? '').toString().trim();

        if (!success || errMsg.isNotEmpty) {
          final lower = errMsg.toLowerCase();
          final friendly =
              (lower.contains('token') ||
                  lower.contains('insufficient') ||
                  lower.contains('balance'))
              ? 'Not enough tokens. Subscribe from Profile → Tokens & Billing.'
              : errMsg.isNotEmpty
              ? errMsg
              : 'Generation failed. Please check your token balance.';
          emit(PlanError(friendly));
          await fetchPlans();
          return;
        }

        // planId returned → already saved
        final planId = data['planId'];
        if (planId != null && planId != 0) {
          emit(WorkoutPlanGenerateSuccess('Workout plan generated! 💪'));
          await fetchPlans();
          return;
        }

        // Has planData → need to save
        final planData = data['planData'] as Map<String, dynamic>?;
        if (planData != null) {
          await _savePlan(
            userId,
            planData,
            data,
            fitnessLevel,
            goal,
            daysPerWeek,
          );
          return;
        }

        // Fallback
        emit(WorkoutPlanGenerateSuccess('Workout plan generated! 💪'));
        await fetchPlans();
      } else {
        emit(WorkoutPlanGenerateSuccess('Workout plan generated! 💪'));
        await fetchPlans();
      }
    } on DioException catch (e) {
      final msg = _dioMsg(e, 'Failed to generate workout plan');
      final lower = msg.toLowerCase();
      final friendly =
          (lower.contains('token') || lower.contains('insufficient'))
          ? 'Not enough tokens. Subscribe from Profile → Tokens & Billing.'
          : msg;
      emit(PlanError(friendly));
      await fetchPlans();
    } catch (e) {
      emit(PlanError('Unexpected error: $e'));
      await fetchPlans();
    }
  }

  Future<void> _savePlan(
    int userId,
    Map<String, dynamic> planData,
    Map<String, dynamic> genData,
    String level,
    String goal,
    int daysPerWeek,
  ) async {
    try {
      final List<Map<String, dynamic>> days = [];
      final rawDays = planData['days'];
      if (rawDays is List) {
        for (final day in rawDays) {
          if (day is! Map<String, dynamic>) continue;
          final List<Map<String, dynamic>> exercises = [];
          final rawExs = day['exercises'];
          if (rawExs is List) {
            for (final ex in rawExs) {
              if (ex is! Map<String, dynamic>) continue;
              exercises.add({
                'name': ex['name']?.toString(),
                'sets': ex['sets']?.toString(),
                'reps': ex['reps']?.toString(),
                'rest': ex['rest']?.toString(),
                'targetMuscles': ex['targetMuscles'] is List
                    ? List<String>.from(
                        ex['targetMuscles'].map((e) => e.toString()),
                      )
                    : <String>[],
                'equipment': ex['equipment']?.toString(),
                'movementPattern': ex['movementPattern']?.toString(),
                'exerciseType': ex['exerciseType']?.toString(),
                'notes': ex['notes']?.toString(),
              });
            }
          }
          days.add({
            'dayNumber':
                (day['dayNumber'] as num?)?.toInt() ?? (days.length + 1),
            'dayName': day['dayName']?.toString(),
            'focusAreas': day['focusAreas'] is List
                ? List<String>.from(day['focusAreas'].map((e) => e.toString()))
                : day['focus'] != null
                ? [day['focus'].toString()]
                : <String>[],
            'estimatedDurationMinutes':
                (day['estimatedDurationMinutes'] as num?)?.toInt(),
            'exercises': exercises,
          });
        }
      }

      final saveRes = await ApiClient.dio.post(
        '/workout-ai/save-plan',
        data: {
          'userId': userId,
          'planName': (planData['planName'] ?? '$goal Plan').toString(),
          'fitnessLevel': level,
          'goal': goal,
          'daysPerWeek': daysPerWeek,
          'programDurationWeeks':
              (planData['programDurationWeeks'] as num?)?.toInt() ?? 4,
          'days': days,
          'notes': planData['notes']?.toString(),
          'generationLatencyMs':
              (genData['generationLatencyMs'] as num?)?.toInt() ?? 0,
          'modelVersion': genData['modelVersion']?.toString(),
          'aiGenerated': true,
        },
      );

      final saveOk = saveRes.data is Map<String, dynamic>
          ? (saveRes.data['success'] as bool? ?? true)
          : true;

      if ((saveRes.statusCode == 200 || saveRes.statusCode == 201) && saveOk) {
        emit(WorkoutPlanGenerateSuccess('Workout plan generated! 💪'));
      } else {
        final msg = saveRes.data is Map<String, dynamic>
            ? (saveRes.data['error'] ??
                  saveRes.data['message'] ??
                  'Failed to save')
            : 'Failed to save plan';
        emit(PlanError(msg.toString()));
      }
      await fetchPlans();
    } on DioException catch (e) {
      emit(PlanError(_dioMsg(e, 'Failed to save plan')));
      await fetchPlans();
    }
  }

  // ─── Fetch nutrition plan ─────────────────────
  Future<void> fetchNutritionPlan() async {
    emit(NutritionPlanLoading());
    try {
      final userId = CacheHelper.getData(key: 'userId') ?? 0;
      final res = await ApiClient.dio.get('/nutrition-plans/member/$userId');

      List<dynamic> raw = [];
      if (res.data is List) {
        raw = res.data as List;
      } else if (res.data is Map<String, dynamic>) {
        final d = res.data as Map<String, dynamic>;
        raw = (d['data'] ?? d['plans'] ?? []) is List
            ? d['data'] ?? d['plans'] ?? []
            : [];
        if (raw.isEmpty && d.containsKey('planId')) raw = [d];
      }

      if (raw.isEmpty) {
        emit(NutritionPlanLoaded(allPlans: [], activePlan: null));
        return;
      }

      final plans = raw
          .whereType<Map<String, dynamic>>()
          .map((j) => NutritionPlanModel.fromJson(j))
          .toList();

      final active = plans.isNotEmpty
          ? plans.firstWhere((p) => p.isActive, orElse: () => plans.first)
          : null;

      emit(NutritionPlanLoaded(allPlans: plans, activePlan: active));
    } on DioException catch (e) {
      final status = e.response?.statusCode ?? 0;
      if (status == 404 || status == 400) {
        emit(NutritionPlanLoaded(allPlans: [], activePlan: null));
      } else {
        emit(NutritionPlanError(_dioMsg(e, 'Failed to load nutrition plan')));
      }
    } catch (_) {
      emit(NutritionPlanLoaded(allPlans: [], activePlan: null));
    }
  }

  // ─── Generate nutrition plan ──────────────────
  Future<void> generateNutritionPlan({
    required String planName,
    int? dailyCalories,
    int? proteinGrams,
    int? carbsGrams,
    int? fatGrams,
    String? dietaryPreferences,
  }) async {
    emit(NutritionPlanGenerating());
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

      // 3. Fetch user metrics to get fitness goal, activity level, health conditions
      String goal = 'maintenance';
      String activityLevel = 'moderate';
      List<String> healthConditions = [];
      try {
        final metricsRes = await ApiClient.dio.get('/users/$userId/metrics');
        if (metricsRes.statusCode == 200 && metricsRes.data != null) {
          final data = metricsRes.data['data'] ?? metricsRes.data;
          goal = data['fitnessGoal']?.toString() ?? 'maintenance';
          activityLevel = data['fitnessLevel']?.toString() ?? 'moderate';
          final medConditions = data['medicalConditions']?.toString();
          if (medConditions != null && medConditions.isNotEmpty) {
            healthConditions = medConditions
                .split(',')
                .map((s) => s.trim())
                .where((s) => s.isNotEmpty && s != 'None')
                .toList();
          }
        }
      } catch (_) {
        // Fallback
      }

      // 4. Map goal & activity level to expected values
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

      // 5. Generate plan from Nutrition AI via backend proxy
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
          'health_conditions': healthConditions,
          'allergies': <String>[],
          'dietary_preferences': dietaryPreferences != null && dietaryPreferences.isNotEmpty
              ? [dietaryPreferences]
              : <String>[],
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
          emit(NutritionPlanError(_friendlyPlanMsg(errMsg.toString())));
          await fetchNutritionPlan();
          return;
        }

        // Calculate/retrieve macros for saving
        final finalCalories = dailyCalories ?? (data is Map<String, dynamic> ? (data['daily_calories'] as num?)?.toInt() : null) ?? 2000;
        final finalProtein = proteinGrams ?? ((finalCalories * 0.30) / 4).round();
        final finalCarbs = carbsGrams ?? ((finalCalories * 0.45) / 4).round();
        final finalFat = fatGrams ?? ((finalCalories * 0.25) / 9).round();

        // 6. Save the generated plan to the backend database!
        final saveRes = await ApiClient.dio.post(
          '/nutrition-plans/generate',
          data: {
            'memberId': userId,
            'planName': planName,
            'description': 'AI Generated Nutrition Plan',
            'fitnessGoal': goal,
            'dietaryRestrictions': dietaryPreferences ?? '',
            'dailyCalories': finalCalories,
            'proteinGrams': finalProtein,
            'carbsGrams': finalCarbs,
            'fatGrams': finalFat,
            'startDate': DateTime.now().toIso8601String(),
            'aiPlanJson': data is Map<String, dynamic> ? jsonEncode(data) : data.toString(),
          },
        );

        if (saveRes.statusCode == 200 || saveRes.statusCode == 201) {
          emit(NutritionPlanGenerateSuccess('Nutrition plan generated and saved! 🥗'));
        } else {
          emit(NutritionPlanError('Plan generated but failed to save in database.'));
        }
        await fetchNutritionPlan();
      } else {
        final msg = response.data?['message'] ?? 'Generation failed';
        emit(NutritionPlanError(_friendlyPlanMsg(msg.toString())));
        await fetchNutritionPlan();
      }
    } on DioException catch (e) {
      emit(NutritionPlanError(_dioMsg(e, 'Failed to generate nutrition plan')));
      await fetchNutritionPlan();
    } catch (e) {
      emit(NutritionPlanError('Unexpected error: $e'));
      await fetchNutritionPlan();
    }
  }

  String _dioMsg(DioException e, String fallback) {
    final d = e.response?.data;
    String msg = '';
    if (d is Map<String, dynamic>) {
      msg = (d['message'] ?? d['title'] ?? d['error'] ?? '').toString();
    } else if (d is String) {
      msg = d;
    }
    if (msg.isEmpty) {
      msg = '$fallback (${e.response?.statusCode ?? "no connection"})';
    }
    return _friendlyPlanMsg(msg);
  }

  String _friendlyPlanMsg(String msg) {
    final lower = msg.toLowerCase();
    if (lower.contains('ml service') ||
        lower.contains('unavailable') ||
        lower.contains('refused') ||
        lower.contains('service unavailable') ||
        lower.contains('localhost')) {
      return 'AI service is temporarily offline. Please try again in a few minutes.';
    }
    if (lower.contains('token') ||
        lower.contains('insufficient') ||
        lower.contains('balance')) {
      return 'Not enough tokens. Subscribe from Profile → Tokens & Billing.';
    }
    if (lower.contains('failed to generate')) {
      return 'AI service is temporarily offline. Please try again later.';
    }
    return msg;
  }
}
