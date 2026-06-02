class SummaryModel {
  final UserMetrics metrics;
  final WorkoutSummaryData summary;
  final List<RecentWorkout> recentWorkouts;
  final String? aiInsight;
  final List<ActivityFeedItem> activityFeed;

  SummaryModel({
    required this.metrics,
    required this.summary,
    required this.recentWorkouts,
    this.aiInsight,
    this.activityFeed = const [],
  });
}

class UserMetrics {
  final int totalCaloriesBurned;
  final int workoutsThisWeek;
  final double averageWorkoutDuration;
  final double currentWeight;
  final double bmi;
  final int currentStreak;
  final int totalWorkouts;
  final int totalDurationMinutes;

  UserMetrics({
    required this.totalCaloriesBurned,
    required this.workoutsThisWeek,
    required this.averageWorkoutDuration,
    required this.currentWeight,
    required this.bmi,
    this.currentStreak = 0,
    this.totalWorkouts = 0,
    this.totalDurationMinutes = 0,
  });

  factory UserMetrics.fromJson(Map<String, dynamic> json) => UserMetrics(
    totalCaloriesBurned: (json['totalCaloriesBurned'] as num?)?.toInt() ?? 0,
    workoutsThisWeek: (json['workoutsThisWeek'] as num?)?.toInt() ?? 0,
    averageWorkoutDuration:
        (json['averageWorkoutDuration'] as num?)?.toDouble() ?? 0,
    currentWeight: (json['currentWeight'] as num?)?.toDouble() ?? 0,
    bmi: (json['bmi'] as num?)?.toDouble() ?? 0,
    currentStreak: (json['currentStreak'] as num?)?.toInt() ?? 0,
    totalWorkouts: (json['totalWorkouts'] as num?)?.toInt() ?? 0,
    totalDurationMinutes: (json['totalDurationMinutes'] as num?)?.toInt() ?? 0,
  );
}

class WorkoutSummaryData {
  final int currentStreak;
  final int longestStreak;
  final int totalWorkouts;
  final int totalCaloriesBurned;
  final int totalDurationMinutes;
  final int averageWorkoutDuration;

  WorkoutSummaryData({
    required this.currentStreak,
    required this.longestStreak,
    required this.totalWorkouts,
    this.totalCaloriesBurned = 0,
    this.totalDurationMinutes = 0,
    this.averageWorkoutDuration = 0,
  });

  factory WorkoutSummaryData.fromJson(
    Map<String, dynamic> json,
  ) => WorkoutSummaryData(
    currentStreak: (json['currentStreak'] as num?)?.toInt() ?? 0,
    longestStreak: (json['longestStreak'] as num?)?.toInt() ?? 0,
    totalWorkouts: (json['totalWorkouts'] as num?)?.toInt() ?? 0,
    totalCaloriesBurned: (json['totalCaloriesBurned'] as num?)?.toInt() ?? 0,
    totalDurationMinutes: (json['totalDurationMinutes'] as num?)?.toInt() ?? 0,
    averageWorkoutDuration:
        (json['averageWorkoutDuration'] as num?)?.toInt() ?? 0,
  );
}

class RecentWorkout {
  final String date;
  final String type;
  final int durationMinutes;
  final int caloriesBurned;
  final String intensity;
  final bool completed;

  RecentWorkout({
    required this.date,
    required this.type,
    required this.durationMinutes,
    required this.caloriesBurned,
    required this.intensity,
    this.completed = false,
  });

  factory RecentWorkout.fromJson(Map<String, dynamic> json) => RecentWorkout(
    date: json['workoutDate'] ?? json['date'] ?? '',
    type:
        json['exercisesCompleted'] ??
        json['type'] ??
        json['planName'] ??
        'Workout Session',
    durationMinutes: (json['durationMinutes'] as num?)?.toInt() ?? 0,
    caloriesBurned: (json['caloriesBurned'] as num?)?.toInt() ?? 0,
    intensity: json['intensity'] ?? _ratingToIntensity(json['feelingRating']),
    completed: json['completed'] ?? false,
  );

  static String _ratingToIntensity(dynamic rating) {
    final r = (rating as num?)?.toInt() ?? 3;
    if (r >= 5) return 'High';
    if (r >= 3) return 'Medium';
    return 'Light';
  }
}

class ActivityFeedItem {
  final int activityId;
  final String? activityType;
  final String? title;
  final String? description;
  final DateTime createdAt;

  ActivityFeedItem({
    required this.activityId,
    this.activityType,
    this.title,
    this.description,
    required this.createdAt,
  });

  factory ActivityFeedItem.fromJson(Map<String, dynamic> json) =>
      ActivityFeedItem(
        activityId: (json['activityId'] ?? json['id'] ?? 0) as int,
        activityType: json['activityType']?.toString(),
        title: json['title']?.toString(),
        description: json['description']?.toString(),
        createdAt: json['createdAt'] != null
            ? DateTime.tryParse(json['createdAt'].toString()) ?? DateTime.now()
            : DateTime.now(),
      );
}
