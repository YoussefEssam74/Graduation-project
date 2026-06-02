import 'package:equatable/equatable.dart';

abstract class GeneratePlanState extends Equatable {
  @override
  List<Object?> get props => [];
}

class GeneratePlanInitial extends GeneratePlanState {}

class GeneratePlanLoading extends GeneratePlanState {}

class GeneratePlanSuccess extends GeneratePlanState {
  final int? planId; // الـ ID بتاع الخطة المحفوظة
  GeneratePlanSuccess({this.planId});
  @override
  List<Object?> get props => [planId];
}

class GeneratePlanError extends GeneratePlanState {
  final String message;
  GeneratePlanError(this.message);
  @override
  List<Object?> get props => [message];
}
