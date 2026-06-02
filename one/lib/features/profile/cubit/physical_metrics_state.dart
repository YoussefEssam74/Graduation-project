import 'package:equatable/equatable.dart';
import '../models/in_body_model.dart';

abstract class PhysicalMetricsState extends Equatable {
  @override
  List<Object?> get props => [];
}

class PhysicalMetricsInitial extends PhysicalMetricsState {}

class PhysicalMetricsLoading extends PhysicalMetricsState {}

class PhysicalMetricsLoaded extends PhysicalMetricsState {
  final InBodyModel metrics;
  PhysicalMetricsLoaded(this.metrics);

  @override
  List<Object?> get props => [metrics];
}

class PhysicalMetricsError extends PhysicalMetricsState {
  final String message;
  PhysicalMetricsError(this.message);

  @override
  List<Object?> get props => [message];
}
