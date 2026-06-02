import 'package:flutter_bloc/flutter_bloc.dart';
import 'package:one/core/api/cache_helper.dart';
import '../services/auth_service.dart';
import 'auth_state.dart';

class AuthCubit extends Cubit<AuthState> {
  final AuthService authService;

  AuthCubit(this.authService) : super(AuthInitial());

  // ==========================================
  // 1. استدعاء تسجيل الدخول وحفظ التوكن
  // ==========================================
  Future<void> login(String email, String password) async {
    emit(AuthLoading());
    try {
      final response = await authService.login(email, password);

      // حفظ التوكن في الموبايل
      await CacheHelper.saveData(key: 'token', value: response.token);
      await CacheHelper.saveData(
        key: 'userId',
        value: response.user?.userId ?? 1,
      );

      emit(AuthSuccess());
    } catch (e) {
      emit(AuthError(e.toString()));
    }
  }

  // ==========================================
  // 2. استدعاء إنشاء الحساب وحفظ التوكن
  // ==========================================
  Future<void> register(String name, String email, String password) async {
    emit(AuthLoading());
    try {
      final response = await authService.register(name, email, password);

      // حفظ التوكن في الموبايل عشان يدخل على التطبيق مباشرة بعد التسجيل
      await CacheHelper.saveData(key: 'token', value: response.token);
      await CacheHelper.saveData(key: 'userId', value: response.user.userId);

      emit(AuthSuccess());
    } catch (e) {
      emit(AuthError(e.toString()));
    }
  }
}
