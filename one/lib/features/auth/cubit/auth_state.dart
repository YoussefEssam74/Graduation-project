abstract class AuthState {}

class AuthInitial extends AuthState {}

class AuthLoading extends AuthState {}

// خلينا الـ AuthSuccess فاضي عشان ميطلبش منك أي حاجة بين الأقواس
class AuthSuccess extends AuthState {}

class AuthError extends AuthState {
  final String message;

  AuthError(this.message);
}
