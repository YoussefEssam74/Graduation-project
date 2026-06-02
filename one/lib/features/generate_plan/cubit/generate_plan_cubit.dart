import 'package:flutter_bloc/flutter_bloc.dart';
import 'package:dio/dio.dart';
import 'package:one/core/api/api_client.dart';
import 'package:one/core/api/cache_helper.dart';
import 'generate_plan_state.dart';

class GeneratePlanCubit extends Cubit<GeneratePlanState> {
  GeneratePlanCubit() : super(GeneratePlanInitial());

  Future<void> generatePlan({
    required String goal,
    required String level,
    required int daysPerWeek,
    List<String> equipment = const ['Full Gym'],
    List<String> injuries = const [],
  }) async {
    emit(GeneratePlanLoading());
    try {
      final userId = CacheHelper.getData(key: 'userId') ?? 0;

      // ── STEP 1: Generate ──────────────────────────────
      Response genRes;
      try {
        genRes = await ApiClient.dio.post(
          '/workout-ai/generate',
          data: {
            'userId': userId,
            'fitnessLevel': level,
            'goal': goal,
            'daysPerWeek': daysPerWeek,
            'equipment': equipment,
            'injuries': injuries,
            'includeUserContext': true,
            'forceRegenerate': true,
          },
        );
      } on DioException catch (e) {
        emit(GeneratePlanError(_friendlyDioError(e)));
        return;
      }

      // ── STEP 2: Parse generate response ──────────────
      final genData = genRes.data;
      if (genData is! Map<String, dynamic>) {
        emit(GeneratePlanError('Unexpected response. Please try again.'));
        return;
      }

      final success = genData['success'] as bool? ?? true;
      final errMsg = (genData['errorMessage'] ?? '').toString().trim();

      if (!success || errMsg.isNotEmpty) {
        emit(GeneratePlanError(_friendlyMsg(errMsg)));
        return;
      }

      // If planId already returned → server saved it automatically
      final directPlanId = genData['planId'];
      if (directPlanId != null && directPlanId != 0) {
        emit(GeneratePlanSuccess(planId: directPlanId));
        return;
      }

      // ── STEP 3: Build save request ────────────────────
      final planData = genData['planData'] as Map<String, dynamic>?;
      if (planData == null) {
        // No planData and no planId → treat as success anyway
        // (some server versions save internally)
        emit(GeneratePlanSuccess(planId: null));
        return;
      }

      final daysForSave = _buildDaysForSave(planData);

      // ── STEP 4: Save plan ─────────────────────────────
      Response saveRes;
      try {
        saveRes = await ApiClient.dio.post(
          '/workout-ai/save-plan',
          data: {
            'userId': userId,
            'planName': (planData['planName'] ?? '$goal Plan').toString(),
            'fitnessLevel': level,
            'goal': goal,
            'daysPerWeek': daysPerWeek,
            'programDurationWeeks':
                (planData['programDurationWeeks'] as num?)?.toInt() ?? 4,
            'days': daysForSave,
            'notes': planData['notes']?.toString(),
            'generationLatencyMs':
                (genData['generationLatencyMs'] as num?)?.toInt() ?? 0,
            'modelVersion': genData['modelVersion']?.toString(),
            'aiGenerated': true,
          },
        );
      } on DioException catch (e) {
        // If save fails but generate succeeded → still a partial success
        // Show warning but don't block user
        emit(
          GeneratePlanError(
            'Plan generated but failed to save: ${_friendlyDioError(e)}',
          ),
        );
        return;
      }

      final saveData = saveRes.data;
      if (saveRes.statusCode == 200 || saveRes.statusCode == 201) {
        final saveOk = saveData is Map<String, dynamic>
            ? (saveData['success'] as bool? ?? true)
            : true;

        if (!saveOk) {
          final saveErr = saveData is Map<String, dynamic>
              ? (saveData['error'] ?? saveData['message'] ?? '').toString()
              : '';
          emit(
            GeneratePlanError(
              saveErr.isNotEmpty ? saveErr : 'Failed to save plan',
            ),
          );
          return;
        }

        final savedId = saveData is Map<String, dynamic>
            ? saveData['planId']
            : null;
        emit(GeneratePlanSuccess(planId: savedId));
      } else {
        final msg =
            _extractMsg(saveData) ??
            'Failed to save plan (${saveRes.statusCode})';
        emit(GeneratePlanError(msg));
      }
    } catch (e) {
      emit(GeneratePlanError('Unexpected error: $e'));
    }
  }

  // ── Build WorkoutDayData list ─────────────────────────
  // AIExercise.sets is int, WorkoutExerciseData.sets is String
  List<Map<String, dynamic>> _buildDaysForSave(Map<String, dynamic> planData) {
    final List<Map<String, dynamic>> days = [];
    final rawDays = planData['days'];
    if (rawDays is! List) return days;

    for (final day in rawDays) {
      if (day is! Map<String, dynamic>) continue;

      final List<Map<String, dynamic>> exercises = [];
      final rawExs = day['exercises'];
      if (rawExs is List) {
        for (final ex in rawExs) {
          if (ex is! Map<String, dynamic>) continue;

          // ← sets comes as int from AI, must be String for save
          final setsVal = ex['sets'];
          final repsVal = ex['reps'];

          exercises.add({
            'name': ex['name']?.toString(),
            'sets': setsVal?.toString(), // int → String
            'reps': repsVal?.toString(), // already String or int
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
        'dayNumber': (day['dayNumber'] as num?)?.toInt() ?? (days.length + 1),
        'dayName': day['dayName']?.toString(),
        'focusAreas': day['focusAreas'] is List
            ? List<String>.from(day['focusAreas'].map((e) => e.toString()))
            : day['focus'] != null
            ? [day['focus'].toString()]
            : <String>[],
        'estimatedDurationMinutes': (day['estimatedDurationMinutes'] as num?)
            ?.toInt(),
        'exercises': exercises,
      });
    }

    return days;
  }

  // ── Helpers ───────────────────────────────────────────
  String _friendlyMsg(String msg) {
    if (msg.isEmpty) return 'Generation failed. Please try again.';
    final lower = msg.toLowerCase();
    if (lower.contains('token') ||
        lower.contains('insufficient') ||
        lower.contains('balance')) {
      return 'Not enough tokens. Subscribe from Profile → Tokens & Billing.';
    }
    if (lower.contains('subscription')) {
      return 'Active subscription required. Please subscribe first.';
    }
    if (lower.contains('ml service') ||
        lower.contains('unavailable') ||
        lower.contains('refused') ||
        lower.contains('localhost') ||
        lower.contains('connection could be made') ||
        lower.contains('service unavailable')) {
      return 'AI service is temporarily offline. Please try again in a few minutes.';
    }
    return msg;
  }

  String _friendlyDioError(DioException e) {
    final d = e.response?.data;
    String msg = '';
    if (d is Map<String, dynamic>) {
      msg = (d['message'] ?? d['title'] ?? d['error'] ?? '').toString();
    } else if (d is String) {
      msg = d;
    }
    if (msg.isEmpty) {
      msg = 'Connection error (${e.response?.statusCode ?? "offline"})';
    }
    return _friendlyMsg(msg);
  }

  String? _extractMsg(dynamic data) {
    if (data is Map<String, dynamic>) {
      return (data['message'] ??
              data['title'] ??
              data['errorMessage'] ??
              data['error'])
          ?.toString();
    }
    if (data is String && data.isNotEmpty) return data;
    return null;
  }
}
