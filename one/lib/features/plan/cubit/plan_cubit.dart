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

      final response = await ApiClient.dio.post(
        '/nutrition-ai/generate',

        data: {
          'memberId': userId,
          'planName': planName,
          'startDate': DateTime.now().toIso8601String(),
          if (dailyCalories != null) 'dailyCalories': dailyCalories,
          if (proteinGrams != null) 'proteinGrams': proteinGrams,
          if (carbsGrams != null) 'carbsGrams': carbsGrams,
          if (fatGrams != null) 'fatGrams': fatGrams,
          if (dietaryPreferences != null)
            'dietaryPreferences': dietaryPreferences,
        },
      );

      if (response.statusCode == 200 || response.statusCode == 201) {
        emit(NutritionPlanGenerateSuccess('Nutrition plan generated!'));
        await fetchNutritionPlan();
      } else {
        final msg = response.data?['message'] ?? 'Generation failed';
        emit(NutritionPlanError(msg));
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
