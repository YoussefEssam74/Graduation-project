import 'package:flutter_bloc/flutter_bloc.dart';
import 'package:dio/dio.dart';
import 'package:one/core/api/api_client.dart';
import 'package:one/core/api/cache_helper.dart';
import 'home_state.dart';

class HomeCubit extends Cubit<HomeState> {
  HomeCubit() : super(HomeInitial());

  int toIntSafe(dynamic v, {int fallback = 0}) {
    if (v == null) return fallback;
    if (v is int) return v;
    if (v is num) return v.toInt();
    if (v is String) return int.tryParse(v.trim()) ?? fallback;
    return fallback;
  }

  Future<void> fetchHomeData() async {
    emit(HomeLoading());
    try {
      final userId = CacheHelper.getData(key: 'userId') ?? 0;

      // نجيب كل البيانات بالتوازي
      final results = await Future.wait([
        ApiClient.dio.get('/users/$userId'), // بيانات المستخدم
        ApiClient.dio.get(
          '/users/$userId/ai-context',
        ), // metrics + workoutSummary
        ApiClient.dio.get('/users/$userId/tokens'), // رصيد التوكن
        ApiClient.dio.get(
          '/notifications/user/$userId/unread-count',
        ), // الإشعارات
        ApiClient.dio.get('/workout-ai/my-plans'), // الخطط
      ]);

      final userRes = results[0];
      final contextRes = results[1];
      final tokenRes = results[2];
      final notifRes = results[3];
      final plansRes = results[4];

      // استخراج بيانات المستخدم
      final userData = userRes.data is Map ? userRes.data : {};
      final userName = userData['name'] ?? 'Champion';
      final profileImageUrl = userData['profileImageUrl'];

      // استخراج الـ metrics
      final context = contextRes.data is Map
          ? (contextRes.data['data'] ?? contextRes.data)
          : {};
      final metrics = context['metrics'] ?? {};
      final summary = context['workoutSummary'] ?? {};

      final totalCalories = metrics['totalCaloriesBurned'];
      final workoutsThisWeek = metrics['workoutsThisWeek'];
      final currentStreak = summary['currentStreak'];

      // رصيد التوكن
      // API may return a number or a map; handle both
      dynamic tokenData = tokenRes.data;
      final tokenBalanceValue = tokenData is Map
          ? (tokenData['balance'] ?? tokenData['tokenBalance'] ?? 0)
          : tokenData;

      // الإشعارات
      final unreadNotifs = notifRes.data;

      // الخطة النشطة
      String? activePlanName;
      int? activePlanDays;
      final plansData = plansRes.data;
      List<dynamic> plansList = plansData is List
          ? plansData
          : (plansData is Map ? (plansData['data'] ?? []) : []);
      if (plansList.isNotEmpty) {
        final activePlan =
            plansList.firstWhere(
                  (p) => p is Map && p['isActive'] == true,
                  orElse: () => plansList.first,
                )
                as dynamic;

        activePlanName = activePlan is Map ? activePlan['planName'] : null;
        activePlanDays = activePlan is Map
            ? toIntSafe(activePlan['daysPerWeek'], fallback: 0)
            : null;
      }

      emit(
        HomeLoaded(
          userName: userName,
          profileImageUrl: profileImageUrl,
          totalCaloriesBurned: toIntSafe(totalCalories),
          workoutsThisWeek: toIntSafe(workoutsThisWeek),
          currentStreak: toIntSafe(currentStreak),
          tokenBalance: toIntSafe(tokenBalanceValue),
          activePlanName: activePlanName,
          activePlanDays: activePlanDays,
          unreadNotifications: toIntSafe(unreadNotifs),
        ),
      );
    } on DioException catch (e) {
      emit(HomeError(e.response?.data?['message'] ?? 'Failed to load data'));
    } catch (e) {
      emit(HomeError('Unexpected error occurred'));
    }
  }
}
