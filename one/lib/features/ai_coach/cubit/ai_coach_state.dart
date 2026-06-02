import 'package:equatable/equatable.dart';
import '../models/chat_message_model.dart';

abstract class AiCoachState extends Equatable {
  @override
  List<Object?> get props => [];
}

class AiCoachInitial extends AiCoachState {}

class AiCoachLoading extends AiCoachState {}

class AiCoachHistoryLoading extends AiCoachState {}

class AiCoachHistoryLoaded extends AiCoachState {
  final List<ChatSessionModel> sessions;
  AiCoachHistoryLoaded({required this.sessions});
  @override
  List<Object?> get props => [sessions];
}

class AiCoachSuccess extends AiCoachState {
  final List<ChatMessageModel> messages;
  final bool isAiTyping;
  final List<ChatSessionModel> sessions;

  AiCoachSuccess({
    required this.messages,
    this.isAiTyping = false,
    this.sessions = const [],
  });

  @override
  List<Object?> get props => [messages, isAiTyping, sessions];
}

class AiCoachError extends AiCoachState {
  final String message;
  AiCoachError(this.message);
  @override
  List<Object?> get props => [message];
}
