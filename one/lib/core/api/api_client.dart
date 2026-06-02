import 'package:dio/dio.dart';
import 'package:one/core/api/cache_helper.dart';

class ApiClient {
  static late Dio dio;

  // تأكد إن الرابط ده هو اللي اشتغل معاك على المحاكي (127.0.0.1 أو 10.0.2.2 أو IP اللاب توب)
  // ✅ Production backend (Render)
  // Change this to your Render service URL (the one you deployed the .NET backend on).
  // Example: https://intellifit-api.onrender.com/api
  static const String baseUrl = 'https://pulsgym-api.onrender.com/api';


  static void init() {
    dio = Dio(BaseOptions(baseUrl: baseUrl, receiveDataWhenStatusError: true));

    // إضافة الـ Interceptor (ده الحارس اللي بيحط التوكن في أي طلب طالع للسيرفر)
    dio.interceptors.add(
      InterceptorsWrapper(
        onRequest: (options, handler) {
          // بنجيب التوكن من التخزين المحلي
          final token = CacheHelper.getData(key: 'token');
          if (token != null) {
            options.headers['Authorization'] = 'Bearer $token';
          }
          return handler.next(options); // كمل الطلب
        },
      ),
    );
  }
}
