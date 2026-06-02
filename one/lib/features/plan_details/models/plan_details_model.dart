class PlanDetailsModel {
  final int planId;
  final String title;
  final String description;
  final String goal;
  final int durationWeeks;
  final String difficultyLevel;

  PlanDetailsModel({
    required this.planId,
    required this.title,
    required this.description,
    required this.goal,
    required this.durationWeeks,
    required this.difficultyLevel,
  });

  factory PlanDetailsModel.fromJson(Map<String, dynamic> json) {
    return PlanDetailsModel(
      planId: json['planId'] ?? 0,
      title: json['title'] ?? 'Unknown Plan',
      description: json['description'] ?? 'No description available.',
      goal: json['goal'] ?? '',
      durationWeeks: json['durationWeeks'] ?? 0,
      difficultyLevel: json['difficultyLevel'] ?? 'Beginner',
    );
  }
}
