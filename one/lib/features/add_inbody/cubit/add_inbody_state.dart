import 'package:equatable/equatable.dart';

abstract class AddInBodyState extends Equatable {
  @override
  List<Object?> get props => [];
}

class AddInBodyInitial extends AddInBodyState {}

class AddInBodyLoading extends AddInBodyState {}

class AddInBodySuccess extends AddInBodyState {}

class AddInBodyError extends AddInBodyState {
  final String message;
  AddInBodyError(this.message);
  @override
  List<Object?> get props => [message];
}
