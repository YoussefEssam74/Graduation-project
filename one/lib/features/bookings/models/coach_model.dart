class CoachModel {
  final int userId;
  final int coachProfileId;
  final String name;
  final String? email;
  final String? phone;
  final String? profileImageUrl;
  final String? specialization;
  final String? bio;
  final double? rating;
  final int totalReviews;
  final int totalClients;
  final int? experienceYears;
  final double? hourlyRate;
  final List<String> certifications;
  final bool isAvailable;

  CoachModel({
    required this.userId,
    required this.coachProfileId,
    required this.name,
    this.email,
    this.phone,
    this.profileImageUrl,
    this.specialization,
    this.bio,
    this.rating,
    this.totalReviews = 0,
    this.totalClients = 0,
    this.experienceYears,
    this.hourlyRate,
    this.certifications = const [],
    this.isAvailable = true,
  });

  String get displaySpecialization =>
      specialization?.isNotEmpty == true ? specialization! : 'Fitness Coach';

  String get ratingDisplay =>
      rating != null ? rating!.toStringAsFixed(1) : '0.0';

  factory CoachModel.fromJson(Map<String, dynamic> json) {
    List<String> certs = [];
    if (json['certifications'] is List) {
      certs = (json['certifications'] as List)
          .map((c) => c.toString())
          .toList();
    }
    return CoachModel(
      userId: json['userId'] ?? 0,
      coachProfileId: json['coachProfileId'] ?? json['userId'] ?? 0,
      name: json['name'] ?? 'Coach',
      email: json['email'],
      phone: json['phone'],
      profileImageUrl: json['profileImageUrl'],
      specialization: json['specialization'] ?? json['role'],
      bio: json['bio'],
      rating: (json['rating'] as num?)?.toDouble(),
      totalReviews: json['totalReviews'] ?? 0,
      totalClients: json['totalClients'] ?? 0,
      experienceYears: json['experienceYears'],
      hourlyRate: (json['hourlyRate'] as num?)?.toDouble(),
      certifications: certs,
      isAvailable: json['isAvailable'] ?? true,
    );
  }
}
