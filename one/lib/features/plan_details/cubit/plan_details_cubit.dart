import 'package:flutter_bloc/flutter_bloc.dart';
import 'package:dio/dio.dart';
import 'plan_details_state.dart';
import '../models/plan_details_model.dart';
import '../../../../core/api/api_client.dart';

class PlanDetailsCubit extends Cubit<PlanDetailsState> {
  PlanDetailsCubit() : super(PlanDetailsInitial());

  Future<void> fetchPlanDetails(int planId) async {
    if (!isClosed) emit(PlanDetailsLoading());
    try {
      final response = await ApiClient.dio.get(
        '/workout-plans/$planId',
      ); // المسار من الـ API

      if (response.statusCode == 200 && response.data != null) {
        final data = response.data['data'] ?? response.data;
        if (!isClosed) emit(PlanDetailsLoaded(PlanDetailsModel.fromJson(data)));
      } else {
        if (!isClosed) emit(PlanDetailsError("Plan details not found."));
      }
    } on DioException catch (e) {
      if (!isClosed) emit(PlanDetailsError("Connection error."));
    } catch (e) {
      if (!isClosed) emit(PlanDetailsError("An error occurred."));
    }
  }
}
