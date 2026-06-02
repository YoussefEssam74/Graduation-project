import 'package:shared_preferences/shared_preferences.dart';

class CacheHelper {
  static late SharedPreferences sharedPreferences;

  // تهيئة المكتبة (بنستدعيها في main.dart)
  static Future<void> init() async {
    sharedPreferences = await SharedPreferences.getInstance();
  }

  // دالة لحفظ البيانات (زي الـ Token)
  static Future<bool> saveData({
    required String key,
    required dynamic value,
  }) async {
    if (value is String) return await sharedPreferences.setString(key, value);
    if (value is int) return await sharedPreferences.setInt(key, value);
    if (value is bool) return await sharedPreferences.setBool(key, value);
    if (value is double) return await sharedPreferences.setDouble(key, value);
    return false;
  }

  // دالة لاسترجاع البيانات
  static dynamic getData({required String key}) {
    return sharedPreferences.get(key);
  }

  // دالة لحذف البيانات (لما نعمل تسجيل خروج)
  static Future<bool> removeData({required String key}) async {
    return await sharedPreferences.remove(key);
  }
}
