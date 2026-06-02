import 'package:dio/dio.dart';
import '../models/auth_models.dart';
import '../../../core/api/api_client.dart';

class AuthService {
  final Dio _dio;
  // Uses ApiClient.baseUrl (production Render URL)

  AuthService(this._dio);

  // ==========================================
  // 1. دالة تسجيل الدخول (Login)
  // ==========================================
  Future<AuthResponseModel> login(String email, String password) async {
    try {
      print('====== Sending Login Request ======');
      print('Email: $email');

      final response = await _dio.post(
        '${ApiClient.baseUrl}/Auth/login',
        data: {'email': email, 'password': password},
      );

      print('====== Server Response (Login) ======');
      print('Status Code: ${response.statusCode}');
      print('Data: ${response.data}');
      print('=============================');

      if (response.statusCode == 200) {
        if (response.data is Map &&
            response.data['success'] == true &&
            response.data['data'] != null) {
          return AuthResponseModel.fromJson(response.data['data']);
        } else {
          return AuthResponseModel.fromJson(response.data);
        }
      } else {
        throw Exception('Login failed: ${response.statusCode}');
      }
    } on DioException catch (e) {
      print('====== Dio Error (Login) ======');
      print('Status Code: ${e.response?.statusCode}');
      print('Error Data: ${e.response?.data}');

      String errorMessage = 'Connection error occurred';
      if (e.response != null && e.response?.data != null) {
        if (e.response?.data is Map && e.response?.data['message'] != null) {
          errorMessage = e.response?.data['message'];
        } else {
          errorMessage = e.response!.data.toString();
        }
      }
      throw Exception(errorMessage);
    } catch (e) {
      throw Exception('Unexpected error occurred');
    }
  }

  // ==========================================
  // 2. دالة إنشاء حساب جديد (Register)
  // ==========================================
  Future<AuthResponseModel> register(
    String name,
    String email,
    String password,
  ) async {
    try {
      print('====== Sending Register Request ======');

      final response = await _dio.post(
        '${ApiClient.baseUrl}/Auth/register',
        data: {'name': name, 'email': email, 'password': password},
      );

      print('====== Server Response (Register) ======');
      print('Status Code: ${response.statusCode}');
      print('Data: ${response.data}');
      print('=============================');

      if (response.statusCode == 200) {
        if (response.data is Map &&
            response.data['success'] == true &&
            response.data['data'] != null) {
          return AuthResponseModel.fromJson(response.data['data']);
        } else {
          return AuthResponseModel.fromJson(response.data);
        }
      } else {
        throw Exception('Registration failed: ${response.statusCode}');
      }
    } on DioException catch (e) {
      print('====== Dio Error (Register) ======');
      print(e.response?.data);

      String errorMessage = 'Connection error occurred';
      if (e.response != null && e.response?.data != null) {
        if (e.response?.data is Map && e.response?.data['message'] != null) {
          errorMessage = e.response?.data['message'];
        } else {
          errorMessage = e.response!.data.toString();
        }
      }
      throw Exception(errorMessage);
    } catch (e) {
      throw Exception('Unexpected error occurred');
    }
  }
}
