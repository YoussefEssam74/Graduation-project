import 'package:equatable/equatable.dart';
import '../models/summary_model.dart';

abstract class SummaryState extends Equatable {
  @override
  List<Object?> get props => [];
}

class SummaryInitial extends SummaryState {}

class SummaryLoading extends SummaryState {}

class SummarySuccess extends SummaryState {
  final SummaryModel data;
  final UserWorkoutSummary? workoutSummary;
  final String? aiInsight;

  SummarySuccess(this.data, {this.workoutSummary, this.aiInsight});

  @override
  List<Object?> get props => [data, workoutSummary, aiInsight];
}

class SummaryError extends SummaryState {
  final String message;
  SummaryError(this.message);
  @override
  List<Object?> get props => [message];
}

// Enriched workout summary from /users/{id}/workout-summary
class UserWorkoutSummary {
  final int totalWorkouts;
  final int totalDurationMinutes;
  final int totalCaloriesBurned;
  final int averageWorkoutDuration;
  final int currentStreak;
  final int longestStreak;
  final List<String> favoriteExercises;

  UserWorkoutSummary({
    this.totalWorkouts = 0,
    this.totalDurationMinutes = 0,
    this.totalCaloriesBurned = 0,
    this.averageWorkoutDuration = 0,
    this.currentStreak = 0,
    this.longestStreak = 0,
    this.favoriteExercises = const [],
  });

  factory UserWorkoutSummary.fromJson(
    Map<String, dynamic> json,
  ) => UserWorkoutSummary(
    totalWorkouts: (json['totalWorkouts'] as num?)?.toInt() ?? 0,
    totalDurationMinutes: (json['totalDurationMinutes'] as num?)?.toInt() ?? 0,
    totalCaloriesBurned: (json['totalCaloriesBurned'] as num?)?.toInt() ?? 0,
    averageWorkoutDuration:
        (json['averageWorkoutDuration'] as num?)?.toInt() ?? 0,
    currentStreak: (json['currentStreak'] as num?)?.toInt() ?? 0,
    longestStreak: (json['longestStreak'] as num?)?.toInt() ?? 0,
    favoriteExercises:
        (json['favoriteExercises'] as List?)
            ?.map((e) => e.toString())
            .toList() ??
        [],
  );

  String get durationDisplay {
    if (totalDurationMinutes == 0) return '0m';
    if (totalDurationMinutes < 60) return '${totalDurationMinutes}m';
    final h = totalDurationMinutes ~/ 60;
    final m = totalDurationMinutes % 60;
    return m > 0 ? '${h}h ${m}m' : '${h}h';
  }
}
