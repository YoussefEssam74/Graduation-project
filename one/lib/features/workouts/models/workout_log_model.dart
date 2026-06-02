class WorkoutLogRequest {
  final int planId;
  final String workoutDate;
  final int? durationMinutes;
  final int? caloriesBurned;
  final String? exercisesCompleted;
  final String? notes;
  final int? feelingRating;
  final bool completed;

  WorkoutLogRequest({
    required this.planId,
    required this.workoutDate,
    this.durationMinutes,
    this.caloriesBurned,
    this.exercisesCompleted,
    this.notes,
    this.feelingRating,
    this.completed = true,
  });

  Map<String, dynamic> toJson() => {
    "planId": planId,
    "workoutDate": workoutDate,
    "durationMinutes": durationMinutes,
    "caloriesBurned": caloriesBurned,
    "exercisesCompleted": exercisesCompleted,
    "notes": notes,
    "feelingRating": feelingRating,
    "completed": completed,
  };
}
