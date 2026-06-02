import 'package:flutter_bloc/flutter_bloc.dart';
import 'package:dio/dio.dart';
import 'package:one/features/workouts/models/workout_log_model.dart';
import 'workout_log_state.dart';

import '../../../../core/api/api_client.dart';

class WorkoutLogCubit extends Cubit<WorkoutLogState> {
  WorkoutLogCubit() : super(WorkoutLogInitial());

  Future<void> submitWorkoutLog(WorkoutLogRequest request) async {
    if (!isClosed) emit(WorkoutLogLoading());
    try {
      final response = await ApiClient.dio.post(
        '/workout-logs',
        data: request.toJson(),
      );

      if (response.statusCode == 200 || response.statusCode == 201) {
        if (!isClosed) emit(WorkoutLogSuccess());
      } else {
        if (!isClosed) emit(WorkoutLogError("Failed to save workout log."));
      }
    } on DioException catch (e) {
      if (!isClosed)
        emit(
          WorkoutLogError(e.response?.data['message'] ?? "Connection Error"),
        );
    } catch (e) {
      if (!isClosed) emit(WorkoutLogError("An unexpected error occurred."));
    }
  }
}
