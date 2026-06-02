class UserModel {
  final int userId;
  final String name;
  final String email;
  final String? phone;
  final String? profileImageUrl;
  final int tokenBalance;

  UserModel({
    required this.userId,
    required this.name,
    required this.email,
    this.phone,
    this.profileImageUrl,
    required this.tokenBalance,
  });

  factory UserModel.fromJson(Map<String, dynamic> json) {
    return UserModel(
      userId: json['userId'] ?? 0,
      name: json['name'] ?? 'FitAI User',
      email: json['email'] ?? '',
      phone: json['phone'],
      profileImageUrl: json['profileImageUrl'],
      tokenBalance: json['tokenBalance'] ?? 0,
    );
  }
}
