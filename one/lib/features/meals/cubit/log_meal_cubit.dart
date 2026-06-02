import 'package:flutter_bloc/flutter_bloc.dart';
import 'package:dio/dio.dart';
import 'package:one/features/meals/models/meal_request_model.dart';
import 'log_meal_state.dart';

import '../../../../core/api/api_client.dart';

class LogMealCubit extends Cubit<LogMealState> {
  LogMealCubit() : super(LogMealInitial());

  Future<void> submitMeal(MealRequestDto meal) async {
    if (!isClosed) emit(LogMealLoading());
    try {
      final response = await ApiClient.dio.post('/meals', data: meal.toJson());
      if (response.statusCode == 200 || response.statusCode == 201) {
        if (!isClosed) emit(LogMealSuccess());
      } else {
        if (!isClosed) emit(LogMealError("Failed to log meal."));
      }
    } on DioException catch (e) {
      if (!isClosed)
        emit(LogMealError(e.response?.data['message'] ?? "Connection error"));
    } catch (e) {
      if (!isClosed) emit(LogMealError("An unexpected error occurred."));
    }
  }
}
