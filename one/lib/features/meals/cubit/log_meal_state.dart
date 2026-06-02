import 'package:equatable/equatable.dart';

abstract class LogMealState extends Equatable {
  @override
  List<Object?> get props => [];
}

class LogMealInitial extends LogMealState {}

class LogMealLoading extends LogMealState {}

class LogMealSuccess extends LogMealState {}

class LogMealError extends LogMealState {
  final String message;
  LogMealError(this.message);
  @override
  List<Object?> get props => [message];
}
