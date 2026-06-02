import 'package:flutter_bloc/flutter_bloc.dart';
import 'package:dio/dio.dart';
import 'package:one/core/api/api_client.dart';
import 'package:one/core/api/cache_helper.dart';
import 'summary_state.dart';
import '../models/summary_model.dart';

class SummaryCubit extends Cubit<SummaryState> {
  SummaryCubit() : super(SummaryInitial());

  Future<void> fetchDailySummary() async {
    emit(SummaryLoading());
    try {
      final userId = CacheHelper.getData(key: 'userId') ?? 0;

      // ── 1. Workout summary ────────────────────
      UserWorkoutSummary? workoutSummary;
      try {
        final res = await ApiClient.dio.get('/users/$userId/workout-summary');
        if (res.statusCode == 200 && res.data != null) {
          Map<String, dynamic>? d;
          if (res.data is Map<String, dynamic>) {
            final raw = res.data as Map<String, dynamic>;
            d = raw['data'] is Map<String, dynamic>
                ? raw['data'] as Map<String, dynamic>
                : raw;
          }
          if (d != null) {
            workoutSummary = UserWorkoutSummary.fromJson(d);
          }
        }
      } on DioException catch (_) {
      } catch (_) {}

      // ── 2. Member stats ───────────────────────
      Map<String, dynamic>? memberStats;
      try {
        final res = await ApiClient.dio.get('/stats/member/$userId');
        if (res.statusCode == 200 && res.data != null) {
          if (res.data is Map<String, dynamic>) {
            final raw = res.data as Map<String, dynamic>;
            memberStats = raw['data'] is Map<String, dynamic>
                ? raw['data'] as Map<String, dynamic>
                : raw;
          }
        }
      } on DioException catch (_) {
      } catch (_) {}

      // ── 3. Recent workout logs ────────────────
      List<RecentWorkout> recentWorkouts = [];
      try {
        final res = await ApiClient.dio.get('/workout-logs/user/$userId');
        if (res.statusCode == 200 && res.data != null) {
          List<dynamic> raw = [];
          if (res.data is List) {
            raw = res.data as List;
          } else if (res.data is Map<String, dynamic>) {
            final d = res.data as Map<String, dynamic>;
            raw = (d['data'] ?? d['logs'] ?? []) is List
                ? d['data'] ?? d['logs'] ?? []
                : [];
          }
          recentWorkouts = raw
              .whereType<Map<String, dynamic>>()
              .take(5)
              .map((e) => RecentWorkout.fromJson(e))
              .toList();
        }
      } on DioException catch (_) {
      } catch (_) {}

      // ── 4. Activity feed ──────────────────────
      List<ActivityFeedItem> feed = [];
      try {
        final res = await ApiClient.dio.get(
          '/activity-feed/user/$userId',
          queryParameters: {'limit': 10},
        );
        if (res.statusCode == 200 && res.data != null) {
          List<dynamic> raw = [];
          if (res.data is List) {
            raw = res.data as List;
          } else if (res.data is Map<String, dynamic>) {
            final d = res.data as Map<String, dynamic>;
            raw = (d['data'] ?? d['items'] ?? []) is List
                ? d['data'] ?? d['items'] ?? []
                : [];
          }
          feed = raw
              .whereType<Map<String, dynamic>>()
              .map((e) => ActivityFeedItem.fromJson(e))
              .toList();
        }
      } on DioException catch (_) {
      } catch (_) {}

      // ── 5. AI insight from history ────────────
      String? aiInsight;
      try {
        final res = await ApiClient.dio.get(
          '/ai/history/$userId',
          queryParameters: {'limit': 1},
        );
        if (res.statusCode == 200 && res.data != null) {
          List<dynamic> raw = [];
          if (res.data is List)
            raw = res.data as List;
          else if (res.data is Map<String, dynamic>) {
            final d = res.data as Map<String, dynamic>;
            raw = (d['data'] ?? d['messages'] ?? []) is List
                ? d['data'] ?? d['messages'] ?? []
                : [];
          }
          if (raw.isNotEmpty) {
            final last = raw.last;
            if (last is Map<String, dynamic>) {
              final raw_text =
                  last['message'] ??
                  last['content'] ??
                  last['response'] ??
                  last['text'] ??
                  '';
              aiInsight = _cleanInsight(raw_text.toString());
            }
          }
        }
      } on DioException catch (_) {
      } catch (_) {}

      // ── Build SummaryModel from real data ─────
      // Merge data from stats + workout summary
      final totalCalories =
          workoutSummary?.totalCaloriesBurned ??
          (memberStats?['totalCaloriesBurned'] as num?)?.toInt() ??
          0;
      final totalWorkouts =
          workoutSummary?.totalWorkouts ??
          (memberStats?['totalWorkouts'] as num?)?.toInt() ??
          0;
      final streak =
          workoutSummary?.currentStreak ??
          (memberStats?['currentStreak'] as num?)?.toInt() ??
          0;
      final totalMinutes =
          workoutSummary?.totalDurationMinutes ??
          (memberStats?['totalDurationMinutes'] as num?)?.toInt() ??
          0;

      final metrics = UserMetrics(
        totalCaloriesBurned: totalCalories,
        workoutsThisWeek: totalWorkouts,
        averageWorkoutDuration:
            workoutSummary?.averageWorkoutDuration.toDouble() ?? 0,
        currentWeight: 0,
        bmi: 0,
        currentStreak: streak,
        totalWorkouts: totalWorkouts,
        totalDurationMinutes: totalMinutes,
      );

      final summaryData = SummaryModel(
        metrics: metrics,
        summary: WorkoutSummaryData(
          currentStreak: streak,
          longestStreak: workoutSummary?.longestStreak ?? streak,
          totalWorkouts: totalWorkouts,
          totalCaloriesBurned: totalCalories,
          totalDurationMinutes: totalMinutes,
          averageWorkoutDuration: workoutSummary?.averageWorkoutDuration ?? 0,
        ),
        recentWorkouts: recentWorkouts,
        aiInsight: aiInsight,
        activityFeed: feed,
      );

      emit(
        SummarySuccess(
          summaryData,
          workoutSummary: workoutSummary,
          aiInsight: aiInsight,
        ),
      );
    } catch (e) {
      emit(SummaryError('Failed to load summary. Pull to refresh.'));
    }
  }

  String _cleanInsight(String text) {
    return text
        .replaceAll(
          RegExp(r',?\s*tokensSpent\s*:\s*\d+', caseSensitive: false),
          '',
        )
        .replaceAll(
          RegExp(r',?\s*responseTimeMs\s*:\s*\d+', caseSensitive: false),
          '',
        )
        .replaceAll(
          RegExp(r',?\s*sessionId\s*:\s*\d+', caseSensitive: false),
          '',
        )
        .replaceAll(RegExp(r',\s*$'), '')
        .trim();
  }
}
