import 'package:flutter_bloc/flutter_bloc.dart';
import 'package:dio/dio.dart';
import 'package:one/core/api/api_client.dart';
import 'package:one/core/api/cache_helper.dart';
import 'achievements_state.dart';
import '../models/achievement_model.dart';

class AchievementsCubit extends Cubit<AchievementsState> {
  AchievementsCubit() : super(AchievementsInitial());

  Future<void> fetchAchievements() async {
    emit(AchievementsLoading());
    try {
      final userId = CacheHelper.getData(key: 'userId') ?? 0;

      // بنجرب الـ endpoints الاتنين
      List<dynamic> raw = [];

      try {
        // جرب /progress أولاً
        final res = await ApiClient.dio.get(
          '/user-milestones/user/$userId/progress',
        );
        if (res.statusCode == 200) {
          if (res.data is List) {
            raw = res.data as List;
          } else if (res.data is Map<String, dynamic>) {
            final d = res.data as Map<String, dynamic>;
            raw = (d['data'] ?? d['milestones'] ?? []) is List
                ? d['data'] ?? d['milestones'] ?? []
                : [];
          }
        }
      } on DioException catch (e) {
        // لو 404 جرب الـ endpoint التاني
        if (e.response?.statusCode == 404 || e.response?.statusCode == 400) {
          try {
            final res2 = await ApiClient.dio.get(
              '/user-milestones/user/$userId',
            );
            if (res2.statusCode == 200) {
              if (res2.data is List) {
                raw = res2.data as List;
              } else if (res2.data is Map<String, dynamic>) {
                final d = res2.data as Map<String, dynamic>;
                raw = (d['data'] ?? d['milestones'] ?? []) is List
                    ? d['data'] ?? d['milestones'] ?? []
                    : [];
              }
            }
          } catch (_) {}
        }
      }

      // لو مفيش بيانات → عرض empty state مش error
      if (raw.isEmpty) {
        emit(
          AchievementsLoaded(
            completed: [],
            inProgress: [],
            totalCompleted: 0,
            totalPoints: 0,
          ),
        );
        return;
      }

      final all = raw
          .whereType<Map<String, dynamic>>()
          .map((e) => AchievementModel.fromJson(e))
          .toList();

      final completed = all.where((a) => a.isCompleted).toList();
      final inProgress = all.where((a) => !a.isCompleted).toList();

      completed.sort(
        (a, b) => (b.completedAt ?? b.createdAt).compareTo(
          a.completedAt ?? a.createdAt,
        ),
      );
      inProgress.sort((a, b) => b.progressPercent.compareTo(a.progressPercent));

      emit(
        AchievementsLoaded(
          completed: completed,
          inProgress: inProgress,
          totalCompleted: completed.length,
          totalPoints: completed.length * 100,
        ),
      );
    } on DioException catch (e) {
      final status = e.response?.statusCode ?? 0;
      // 404 = user has no milestones yet → show empty not error
      if (status == 404 || status == 400) {
        emit(
          AchievementsLoaded(
            completed: [],
            inProgress: [],
            totalCompleted: 0,
            totalPoints: 0,
          ),
        );
      } else {
        emit(
          AchievementsError(
            e.response?.data?['message'] ?? 'Failed to load achievements',
          ),
        );
      }
    } catch (_) {
      // Any other error → show empty not crash
      emit(
        AchievementsLoaded(
          completed: [],
          inProgress: [],
          totalCompleted: 0,
          totalPoints: 0,
        ),
      );
    }
  }
}
