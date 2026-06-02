import 'package:flutter/material.dart';

class AchievementModel {
  final int userMilestoneId;
  final int milestoneId;
  final String name;
  final String? description;
  final int currentProgress;
  final int? target;
  final bool isCompleted;
  final DateTime? completedAt;
  final DateTime createdAt;

  AchievementModel({
    required this.userMilestoneId,
    required this.milestoneId,
    required this.name,
    this.description,
    required this.currentProgress,
    this.target,
    required this.isCompleted,
    this.completedAt,
    required this.createdAt,
  });

  double get progressPercent {
    if (target == null || target == 0)
      return isCompleted ? 1.0 : 0.0;
    return (currentProgress / target!).clamp(0.0, 1.0);
  }

  String get progressLabel {
    if (target != null) return '$currentProgress / $target';
    return isCompleted ? 'Completed' : 'In Progress';
  }

  factory AchievementModel.fromJson(
      Map<String, dynamic> json) =>
      AchievementModel(
        userMilestoneId: json['userMilestoneId'] ?? 0,
        milestoneId: json['milestoneId'] ?? 0,
        name: json['milestoneName'] ?? json['name'] ?? 'Achievement',
        description:
            json['milestoneDescription'] ?? json['description'],
        currentProgress: json['currentProgress'] ?? 0,
        target: json['milestoneTarget'] ?? json['target'],
        isCompleted: json['isCompleted'] ?? false,
        completedAt: json['completedAt'] != null
            ? DateTime.tryParse(json['completedAt'])
            : null,
        createdAt: json['createdAt'] != null
            ? DateTime.tryParse(json['createdAt']) ??
                DateTime.now()
            : DateTime.now(),
      );

  IconData get icon {
    final n = name.toLowerCase();
    if (n.contains('workout') || n.contains('train'))
      return Icons.fitness_center_rounded;
    if (n.contains('streak') || n.contains('fire'))
      return Icons.local_fire_department_rounded;
    if (n.contains('nutrition') || n.contains('diet'))
      return Icons.restaurant_rounded;
    if (n.contains('book') || n.contains('session'))
      return Icons.event_available_rounded;
    if (n.contains('weight') || n.contains('body'))
      return Icons.monitor_weight_outlined;
    if (n.contains('step') || n.contains('walk'))
      return Icons.directions_walk_rounded;
    if (n.contains('sleep')) return Icons.bedtime_outlined;
    return Icons.emoji_events_rounded;
  }

  Color get badgeColor {
    if (isCompleted) return const Color(0xFF1A3A8F);
    final pct = progressPercent;
    if (pct >= 0.75) return Colors.orange;
    if (pct >= 0.5) return Colors.blue;
    return Colors.grey;
  }
}
