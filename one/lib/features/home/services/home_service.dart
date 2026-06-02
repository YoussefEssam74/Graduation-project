import 'package:dio/dio.dart';
import '../../../core/api/api_client.dart';

class HomeService {
  final Dio _dio = ApiClient.dio;

  // جلب ملخص تمرين اليوم
  Future<Map<String, dynamic>> getTodayWorkoutPlan() async {
    try {
      final response = await _dio.get('/WorkoutPlan/today');
      return response.data;
    } catch (e) {
      throw Exception('فشل في جلب تمرين اليوم');
    }
  }

  // جلب إحصائيات المستخدم
  Future<Map<String, dynamic>> getUserStats() async {
    try {
      final response = await _dio.get('/Stats/member/summary');
      return response.data;
    } catch (e) {
      throw Exception('فشل في جلب الإحصائيات');
    }
  }
}
