import 'package:equatable/equatable.dart';
import '../models/achievement_model.dart';

abstract class AchievementsState extends Equatable {
  @override
  List<Object?> get props => [];
}

class AchievementsInitial extends AchievementsState {}
class AchievementsLoading extends AchievementsState {}

class AchievementsLoaded extends AchievementsState {
  final List<AchievementModel> completed;
  final List<AchievementModel> inProgress;
  final int totalCompleted;
  final int totalPoints;

  AchievementsLoaded({
    required this.completed,
    required this.inProgress,
    required this.totalCompleted,
    required this.totalPoints,
  });

  List<AchievementModel> get all => [...completed, ...inProgress];

  @override
  List<Object?> get props =>
      [completed, inProgress, totalCompleted, totalPoints];
}

class AchievementsError extends AchievementsState {
  final String message;
  AchievementsError(this.message);
  @override
  List<Object?> get props => [message];
}
