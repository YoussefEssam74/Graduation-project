import 'package:equatable/equatable.dart';
import '../models/plan_details_model.dart';

abstract class PlanDetailsState extends Equatable {
  @override
  List<Object?> get props => [];
}

class PlanDetailsInitial extends PlanDetailsState {}

class PlanDetailsLoading extends PlanDetailsState {}

class PlanDetailsLoaded extends PlanDetailsState {
  final PlanDetailsModel plan;
  PlanDetailsLoaded(this.plan);
  @override
  List<Object?> get props => [plan];
}

class PlanDetailsError extends PlanDetailsState {
  final String message;
  PlanDetailsError(this.message);
  @override
  List<Object?> get props => [message];
}
