import 'package:equatable/equatable.dart';

abstract class PersonalDataState extends Equatable {
  @override
  List<Object?> get props => [];
}

class PersonalDataInitial extends PersonalDataState {}

class PersonalDataLoading extends PersonalDataState {}

class PersonalDataSuccess extends PersonalDataState {
  final String message;

  PersonalDataSuccess(this.message);

  @override
  List<Object?> get props => [message];
}

class PersonalDataError extends PersonalDataState {
  final String message;

  PersonalDataError(this.message);

  @override
  List<Object?> get props => [message];
}
