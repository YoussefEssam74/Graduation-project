// auth_models.dart

class UserModel {
  final int userId;
  final String email;
  final String name;
  final String? phone;
  final String? dateOfBirth;
  final int? gender;
  final String role;
  final String? profileImageUrl;
  final String? address;
  final int tokenBalance;
  final bool isActive;
  final bool emailVerified;
  final String? lastLoginAt;
  final String createdAt;
  final bool? mustChangePassword;
  final bool? isFirstLogin;

  UserModel({
    required this.userId,
    required this.email,
    required this.name,
    this.phone,
    this.dateOfBirth,
    this.gender,
    required this.role,
    this.profileImageUrl,
    this.address,
    required this.tokenBalance,
    required this.isActive,
    required this.emailVerified,
    this.lastLoginAt,
    required this.createdAt,
    this.mustChangePassword,
    this.isFirstLogin,
  });

  factory UserModel.fromJson(Map<String, dynamic> json) {
    return UserModel(
      userId: json['userId'],
      email: json['email'],
      name: json['name'],
      phone: json['phone'],
      dateOfBirth: json['dateOfBirth'],
      gender: json['gender'],
      role: json['role'],
      profileImageUrl: json['profileImageUrl'],
      address: json['address'],
      tokenBalance: json['tokenBalance'] ?? 0,
      isActive: json['isActive'] ?? true,
      emailVerified: json['emailVerified'] ?? false,
      lastLoginAt: json['lastLoginAt'],
      createdAt: json['createdAt'],
      mustChangePassword: json['mustChangePassword'],
      isFirstLogin: json['isFirstLogin'],
    );
  }
}

class AuthResponseModel {
  final UserModel user;
  final String token;
  final String expiresAt;

  AuthResponseModel({
    required this.user,
    required this.token,
    required this.expiresAt,
  });

  factory AuthResponseModel.fromJson(Map<String, dynamic> json) {
    return AuthResponseModel(
      user: UserModel.fromJson(json['user']),
      token: json['token'],
      expiresAt: json['expiresAt'],
    );
  }
}
