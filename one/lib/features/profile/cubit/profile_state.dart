import 'package:equatable/equatable.dart';
import '../models/profile_models.dart';

abstract class ProfileState extends Equatable {
  @override
  List<Object?> get props => [];
}

class ProfileInitial extends ProfileState {}

class ProfileLoading extends ProfileState {}

class ProfileUpdating extends ProfileState {}

class ProfileLoaded extends ProfileState {
  final UserModel user;
  final InBodyModel? inBody;
  final ActiveSubscriptionModel? subscription;
  final List<RecentActivityModel> recentActivity;
  final int workoutsThisMonth;
  final double totalDistanceKm;

  ProfileLoaded({
    required this.user,
    this.inBody,
    this.subscription,
    this.recentActivity = const [],
    this.workoutsThisMonth = 0,
    this.totalDistanceKm = 0,
  });

  @override
  List<Object?> get props => [user, inBody, subscription, recentActivity];
}

class ProfileError extends ProfileState {
  final String message;
  ProfileError(this.message);
  @override
  List<Object?> get props => [message];
}

class ProfileUpdateSuccess extends ProfileState {
  final String message;
  ProfileUpdateSuccess(this.message);
  @override
  List<Object?> get props => [message];
}
