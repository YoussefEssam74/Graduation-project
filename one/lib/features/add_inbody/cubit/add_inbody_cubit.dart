import 'package:flutter_bloc/flutter_bloc.dart';
import 'package:one/core/api/cache_helper.dart';
import 'add_inbody_state.dart';
import '../models/add_inbody_request_model.dart';
import '../../../../core/api/api_client.dart';

class AddInBodyCubit extends Cubit<AddInBodyState> {
  AddInBodyCubit() : super(AddInBodyInitial());

  Future<void> submitInBody(
    double weight,
    double height,
    double fat,
    double muscle,
  ) async {
    if (!isClosed) emit(AddInBodyLoading());
    try {
      int userId = CacheHelper.getData(key: 'userId') ?? 1;
      final request = AddInBodyRequestModel(
        weight: weight,
        height: height,
        bodyFatPercentage: fat,
        muscleMass: muscle,
        userId: userId,
      );

      final response = await ApiClient.dio.post(
        '/inbody',
        data: request.toJson(),
      );

      if (response.statusCode == 200 || response.statusCode == 201) {
        if (!isClosed) emit(AddInBodySuccess());
      } else {
        if (!isClosed) emit(AddInBodyError("Failed to save data."));
      }
    } catch (e) {
      if (!isClosed) emit(AddInBodyError("Connection error."));
    }
  }
}
