import 'package:flutter_bloc/flutter_bloc.dart';
import 'package:dio/dio.dart';
import 'package:one/core/api/cache_helper.dart';
import 'physical_metrics_state.dart';
import '../models/in_body_model.dart';
import '../../../core/api/api_client.dart';

class PhysicalMetricsCubit extends Cubit<PhysicalMetricsState> {
  PhysicalMetricsCubit() : super(PhysicalMetricsInitial());

  Future<void> fetchLatestMetrics() async {
    if (!isClosed) emit(PhysicalMetricsLoading());
    try {
      int userId = CacheHelper.getData(key: 'userId') ?? 1;

      final response = await ApiClient.dio.get('/inbody/user/$userId/latest');

      if (response.statusCode == 200 && response.data != null) {
        final data = response.data['data'] ?? response.data;
        if (!isClosed) emit(PhysicalMetricsLoaded(InBodyModel.fromJson(data)));
      } else {
        if (!isClosed) emit(PhysicalMetricsError("No metrics found."));
      }
    } on DioException catch (e) {
      if (e.response?.statusCode == 404) {
        if (!isClosed)
          emit(PhysicalMetricsError("No InBody scans recorded yet."));
      } else {
        if (!isClosed) emit(PhysicalMetricsError("Connection error."));
      }
    } catch (e) {
      if (!isClosed)
        emit(PhysicalMetricsError("An unexpected error occurred."));
    }
  }
}
