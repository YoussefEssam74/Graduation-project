class PlanModel {
  final int planId;
  final String planName;
  final String? description;
  final String? fitnessLevel;
  final String? goal;
  final int? daysPerWeek;
  final int? durationWeeks;
  final String? planType;
  final String? status;
  final bool isActive;
  final String? modelVersion;
  final DateTime createdAt;
  final DateTime updatedAt;
  final List<PlanDayModel> days;
  final int? assignedCoachId;
  final String? assignedCoachName;
  final String? approvalNotes;

  PlanModel({
    required this.planId,
    required this.planName,
    this.description,
    this.fitnessLevel,
    this.goal,
    this.daysPerWeek,
    this.durationWeeks,
    this.planType,
    this.status,
    required this.isActive,
    this.modelVersion,
    required this.createdAt,
    required this.updatedAt,
    required this.days,
    this.assignedCoachId,
    this.assignedCoachName,
    this.approvalNotes,
  });

  int get totalExercises =>
      days.fold(0, (sum, day) => sum + day.exercises.length);

  double get progressPercent {
    if (durationWeeks == null || durationWeeks == 0) return 0;
    return 1 / durationWeeks!;
  }

  int get currentWeek => 1;

  String get displayStatus {
    if (status != null && status!.isNotEmpty) return status!;
    return isActive ? 'Active' : 'Inactive';
  }

  factory PlanModel.fromJson(Map<String, dynamic> json) {
    List<PlanDayModel> daysList = [];
    if (json['days'] != null && json['days'] is List) {
      daysList = (json['days'] as List)
          .map((d) => PlanDayModel.fromJson(d))
          .toList();
    }
    return PlanModel(
      planId: json['planId'] ?? 0,
      planName: json['planName'] ?? 'My Plan',
      description: json['description'],
      fitnessLevel: json['fitnessLevel'],
      goal: json['goal'],
      daysPerWeek: json['daysPerWeek'],
      durationWeeks: json['durationWeeks'],
      planType: json['planType'],
      status: json['status'],
      isActive: json['isActive'] ?? true,
      modelVersion: json['modelVersion'],
      createdAt: json['createdAt'] != null
          ? DateTime.tryParse(json['createdAt']) ?? DateTime.now()
          : DateTime.now(),
      updatedAt: json['updatedAt'] != null
          ? DateTime.tryParse(json['updatedAt']) ?? DateTime.now()
          : DateTime.now(),
      days: daysList,
      assignedCoachId: json['assignedCoachId'],
      assignedCoachName: json['assignedCoachName'],
      approvalNotes: json['approvalNotes'],
    );
  }
}

class PlanDayModel {
  final int dayNumber;
  final String? dayName;
  final List<PlanExerciseModel> exercises;

  PlanDayModel({
    required this.dayNumber,
    this.dayName,
    required this.exercises,
  });

  String get displayName =>
      dayName?.isNotEmpty == true ? dayName! : 'Day $dayNumber';

  factory PlanDayModel.fromJson(Map<String, dynamic> json) {
    List<PlanExerciseModel> exList = [];
    if (json['exercises'] != null && json['exercises'] is List) {
      exList = (json['exercises'] as List)
          .map((e) => PlanExerciseModel.fromJson(e))
          .toList();
    }
    return PlanDayModel(
      dayNumber: json['dayNumber'] ?? 1,
      dayName: json['dayName'],
      exercises: exList,
    );
  }
}

class PlanExerciseModel {
  final int workoutPlanExerciseId;
  final int exerciseId;
  final String? exerciseName;
  final int dayNumber;
  final int orderInDay;
  final int? sets;
  final int? reps;
  final int? restSeconds;
  final String? rest;
  final String? notes;
  final String? equipmentRequired;
  final String? muscleGroup;

  // ── الحقول الجديدة من الـ API ──
  final String? description;
  final String? imageUrl;
  final double? weightKg;
  final String? weightRecommendation;
  final List<String> targetMuscles;
  final String? equipment;
  final String? tempo;
  final String? movementPattern;
  final String? exerciseType;
  final List<String> alternatives;

  PlanExerciseModel({
    required this.workoutPlanExerciseId,
    required this.exerciseId,
    this.exerciseName,
    required this.dayNumber,
    required this.orderInDay,
    this.sets,
    this.reps,
    this.restSeconds,
    this.rest,
    this.notes,
    this.equipmentRequired,
    this.muscleGroup,
    this.description,
    this.imageUrl,
    this.weightKg,
    this.weightRecommendation,
    this.targetMuscles = const [],
    this.equipment,
    this.tempo,
    this.movementPattern,
    this.exerciseType,
    this.alternatives = const [],
  });

  String get restDisplay {
    if (rest != null && rest!.isNotEmpty) return rest!;
    if (restSeconds == null) return '—';
    if (restSeconds! >= 60) return '${(restSeconds! / 60).floor()}m';
    return '${restSeconds}s';
  }

  String get repsDisplay => reps?.toString() ?? '—';

  factory PlanExerciseModel.fromJson(Map<String, dynamic> json) {
    List<String> muscles = [];
    if (json['targetMuscles'] is List) {
      muscles = (json['targetMuscles'] as List)
          .map((m) => m.toString())
          .toList();
    }

    List<String> alts = [];
    if (json['alternatives'] is List) {
      alts = (json['alternatives'] as List).map((a) => a.toString()).toList();
    }

    return PlanExerciseModel(
      workoutPlanExerciseId: json['workoutPlanExerciseId'] ?? 0,
      exerciseId: json['exerciseId'] ?? 0,
      exerciseName: json['exerciseName'] ?? json['name'],
      dayNumber: json['dayNumber'] ?? 1,
      orderInDay: json['orderInDay'] ?? 0,
      sets: json['sets'],
      reps: json['reps'] is int
          ? json['reps']
          : int.tryParse(json['reps']?.toString() ?? ''),
      restSeconds: json['restSeconds'],
      rest: json['rest'],
      notes: json['notes'],
      equipmentRequired: json['equipmentRequired'],
      muscleGroup: json['muscleGroup'],
      description: json['description'],
      imageUrl: json['imageUrl'],
      weightKg: (json['weightKg'] as num?)?.toDouble(),
      weightRecommendation: json['weightRecommendation'],
      targetMuscles: muscles,
      equipment: json['equipment'] ?? json['equipmentRequired'],
      tempo: json['tempo'],
      movementPattern: json['movementPattern'],
      exerciseType: json['exerciseType'],
      alternatives: alts,
    );
  }
}
