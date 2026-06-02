import 'package:equatable/equatable.dart';

abstract class GenerateNutritionState extends Equatable {
  @override
  List<Object?> get props => [];
}

class GenerateNutritionInitial extends GenerateNutritionState {}

class GenerateNutritionLoading extends GenerateNutritionState {}

class GenerateNutritionSuccess extends GenerateNutritionState {
  final String message;
  GenerateNutritionSuccess(this.message);
  @override
  List<Object?> get props => [message];
}

class GenerateNutritionError extends GenerateNutritionState {
  final String message;
  GenerateNutritionError(this.message);
  @override
  List<Object?> get props => [message];
}
