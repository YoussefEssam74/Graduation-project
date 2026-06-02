import 'package:equatable/equatable.dart';
import 'package:one/features/profile/models/subscription_model.dart';

abstract class SubscriptionState extends Equatable {
  @override
  List<Object?> get props => [];
}

class SubscriptionInitial extends SubscriptionState {}

class SubscriptionLoading extends SubscriptionState {}

class SubscriptionProcessing extends SubscriptionState {}

class SubscriptionLoaded extends SubscriptionState {
  final List<SubscriptionPlanModel> plans;
  final Map<String, dynamic>? activeSub;
  final List<TokenTransactionModel> transactions;
  final int tokenBalance;

  SubscriptionLoaded({
    required this.plans,
    this.activeSub,
    required this.transactions,
    required this.tokenBalance,
  });

  @override
  List<Object?> get props => [plans, activeSub, transactions, tokenBalance];
}

class SubscriptionSuccess extends SubscriptionState {
  final String message;
  SubscriptionSuccess(this.message);
  @override
  List<Object?> get props => [message];
}

class SubscriptionError extends SubscriptionState {
  final String message;
  SubscriptionError(this.message);
  @override
  List<Object?> get props => [message];
}
