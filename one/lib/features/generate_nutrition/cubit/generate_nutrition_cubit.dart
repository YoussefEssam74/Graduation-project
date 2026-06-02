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

      final response = await ApiClient.dio.post(
        // ✅ Call Modal-based Nutrition AI through backend proxy
        '/nutrition-ai/generate',

        data: {
          'memberId': userId,
          'planName': planName,
          'startDate': DateTime.now().toIso8601String(),
          'dailyCalories': dailyCalories,
          'proteinGrams': proteinGrams,
          'carbsGrams': carbsGrams,
          'fatGrams': fatGrams,
          'dietaryPreferences':
              '$goal, $activityLevel, $dietType'
              '${restrictions.isNotEmpty ? ", ${restrictions.join(", ")}" : ""}',
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
        } else {
          emit(GenerateNutritionSuccess('Nutrition plan generated! 🥗'));
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
