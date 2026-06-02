import 'package:equatable/equatable.dart';
import '../models/equipment_model.dart';
import '../models/coach_model.dart';

abstract class BookingsState extends Equatable {
  @override
  List<Object?> get props => [];
}

class BookingsInitial extends BookingsState {}

class BookingsLoading extends BookingsState {}

class BookingsLoaded extends BookingsState {
  final List<EquipmentModel> allEquipment;
  final List<EquipmentModel> filteredEquipment;
  final String selectedCategory;
  final DateTime selectedDate;
  final int userTokenBalance;

  BookingsLoaded({
    required this.allEquipment,
    required this.filteredEquipment,
    required this.selectedCategory,
    required this.selectedDate,
    required this.userTokenBalance,
  });

  BookingsLoaded copyWith({
    List<EquipmentModel>? allEquipment,
    List<EquipmentModel>? filteredEquipment,
    String? selectedCategory,
    DateTime? selectedDate,
    int? userTokenBalance,
  }) => BookingsLoaded(
    allEquipment: allEquipment ?? this.allEquipment,
    filteredEquipment: filteredEquipment ?? this.filteredEquipment,
    selectedCategory: selectedCategory ?? this.selectedCategory,
    selectedDate: selectedDate ?? this.selectedDate,
    userTokenBalance: userTokenBalance ?? this.userTokenBalance,
  );

  @override
  List<Object?> get props => [
    allEquipment,
    filteredEquipment,
    selectedCategory,
    selectedDate,
    userTokenBalance,
  ];
}

class SlotsLoading extends BookingsState {}

class SlotsLoaded extends BookingsState {
  final List<String> bookedSlots;
  final EquipmentModel equipment;
  final DateTime selectedDate;
  SlotsLoaded({
    required this.bookedSlots,
    required this.equipment,
    required this.selectedDate,
  });
  @override
  List<Object?> get props => [bookedSlots, equipment, selectedDate];
}

class BookingCreating extends BookingsState {}

class BookingSuccessState extends BookingsState {
  final String message;
  final int tokensCost;
  final int? bookingId;
  BookingSuccessState(this.message, {this.tokensCost = 0, this.bookingId});
  @override
  List<Object?> get props => [message, tokensCost, bookingId];
}

class BookingsError extends BookingsState {
  final String message;
  BookingsError(this.message);
  @override
  List<Object?> get props => [message];
}

// ── Coach States ──────────────────────────────────
class CoachesLoading extends BookingsState {}

class CoachesLoaded extends BookingsState {
  final List<CoachModel> coaches;
  final DateTime selectedDate;
  final int userTokenBalance;

  CoachesLoaded({
    required this.coaches,
    required this.selectedDate,
    required this.userTokenBalance,
  });

  CoachesLoaded copyWith({
    List<CoachModel>? coaches,
    DateTime? selectedDate,
    int? userTokenBalance,
  }) => CoachesLoaded(
    coaches: coaches ?? this.coaches,
    selectedDate: selectedDate ?? this.selectedDate,
    userTokenBalance: userTokenBalance ?? this.userTokenBalance,
  );

  @override
  List<Object?> get props => [coaches, selectedDate, userTokenBalance];
}

class CoachSlotsLoading extends BookingsState {}

class CoachSlotsLoaded extends BookingsState {
  final List<String> bookedSlots;
  final CoachModel coach;
  final DateTime selectedDate;
  CoachSlotsLoaded({
    required this.bookedSlots,
    required this.coach,
    required this.selectedDate,
  });
  @override
  List<Object?> get props => [bookedSlots, coach, selectedDate];
}
