import 'package:equatable/equatable.dart';

abstract class WorkoutLogState extends Equatable {
  @override
  List<Object?> get props => [];
}

class WorkoutLogInitial extends WorkoutLogState {}

class WorkoutLogLoading extends WorkoutLogState {}

class WorkoutLogSuccess extends WorkoutLogState {}

class WorkoutLogError extends WorkoutLogState {
  final String message;
  WorkoutLogError(this.message);
  @override
  List<Object?> get props => [message];
}
