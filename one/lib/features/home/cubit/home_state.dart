import 'package:equatable/equatable.dart';

abstract class HomeState extends Equatable {
  @override
  List<Object?> get props => [];
}

class HomeInitial extends HomeState {}

class HomeLoading extends HomeState {}

class HomeLoaded extends HomeState {
  final String userName;
  final String? profileImageUrl;
  final int totalCaloriesBurned;
  final int workoutsThisWeek;
  final int currentStreak;
  final int tokenBalance;
  final String? activePlanName;
  final int? activePlanDays;
  final int unreadNotifications;

  HomeLoaded({
    required this.userName,
    this.profileImageUrl,
    required this.totalCaloriesBurned,
    required this.workoutsThisWeek,
    required this.currentStreak,
    required this.tokenBalance,
    this.activePlanName,
    this.activePlanDays,
    this.unreadNotifications = 0,
  });

  @override
  List<Object?> get props => [
    userName,
    profileImageUrl,
    totalCaloriesBurned,
    workoutsThisWeek,
    currentStreak,
    tokenBalance,
    activePlanName,
    activePlanDays,
    unreadNotifications,
  ];
}

class HomeError extends HomeState {
  final String message;
  HomeError(this.message);
  @override
  List<Object?> get props => [message];
}
