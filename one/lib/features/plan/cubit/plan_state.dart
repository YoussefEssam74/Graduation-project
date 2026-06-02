import 'package:equatable/equatable.dart';
import '../model/plan_model.dart';
import '../model/nutrition_plan_model.dart';

abstract class PlanState extends Equatable {
  @override
  List<Object?> get props => [];
}

class PlanInitial extends PlanState {}

class PlanLoading extends PlanState {}

class PlanLoaded extends PlanState {
  final List<PlanModel> allPlans;
  final PlanModel? activePlan;
  final int selectedDayIndex;

  PlanLoaded({
    required this.allPlans,
    this.activePlan,
    this.selectedDayIndex = 0,
  });

  PlanLoaded copyWith({
    List<PlanModel>? allPlans,
    PlanModel? activePlan,
    int? selectedDayIndex,
  }) {
    return PlanLoaded(
      allPlans: allPlans ?? this.allPlans,
      activePlan: activePlan ?? this.activePlan,
      selectedDayIndex: selectedDayIndex ?? this.selectedDayIndex,
    );
  }

  @override
  List<Object?> get props => [allPlans, activePlan, selectedDayIndex];
}

class PlanDeleting extends PlanState {}

class PlanDeleteSuccess extends PlanState {
  final String message;
  PlanDeleteSuccess(this.message);
  @override
  List<Object?> get props => [message];
}

class PlanError extends PlanState {
  final String message;
  PlanError(this.message);
  @override
  List<Object?> get props => [message];
}

class WorkoutPlanGenerating extends PlanState {}

class WorkoutPlanGenerateSuccess extends PlanState {
  final String message;
  WorkoutPlanGenerateSuccess(this.message);
  @override
  List<Object?> get props => [message];
}

// ── Nutrition States ──────────────────────────────────

class NutritionPlanLoading extends PlanState {}

class NutritionPlanLoaded extends PlanState {
  final List<NutritionPlanModel> allPlans;
  final NutritionPlanModel? activePlan;

  NutritionPlanLoaded({required this.allPlans, this.activePlan});

  @override
  List<Object?> get props => [allPlans, activePlan];
}

class NutritionPlanGenerating extends PlanState {}

class NutritionPlanGenerateSuccess extends PlanState {
  final String message;
  NutritionPlanGenerateSuccess(this.message);
  @override
  List<Object?> get props => [message];
}

class NutritionPlanError extends PlanState {
  final String message;
  NutritionPlanError(this.message);
  @override
  List<Object?> get props => [message];
}
