import 'package:flutter_bloc/flutter_bloc.dart';
import 'package:dio/dio.dart';
import 'package:one/core/api/cache_helper.dart';
import 'personal_data_state.dart';
import '../../../core/api/api_client.dart';

class PersonalDataCubit extends Cubit<PersonalDataState> {
  PersonalDataCubit() : super(PersonalDataInitial());

  Future<void> updateProfile({
    required String name,
    required String phone,
    required String address,
  }) async {
    if (!isClosed) emit(PersonalDataLoading());

    try {
      int userId = CacheHelper.getData(key: 'userId') ?? 1;

      final response = await ApiClient.dio.put(
        '/users/$userId',
        data: {"name": name, "phone": phone, "address": address},
      );

      if (response.statusCode == 200) {
        if (!isClosed)
          emit(PersonalDataSuccess("Profile updated successfully!"));
      } else {
        if (!isClosed) emit(PersonalDataError("Failed to update profile."));
      }
    } on DioException catch (e) {
      if (!isClosed)
        emit(
          PersonalDataError(e.response?.data['message'] ?? "Connection error"),
        );
    } catch (e) {
      if (!isClosed) emit(PersonalDataError("An unexpected error occurred"));
    }
  }
}
