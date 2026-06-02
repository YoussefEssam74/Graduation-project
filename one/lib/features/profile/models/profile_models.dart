class UserModel {
  final int userId;
  final String name;
  final String email;
  final String? phone;
  final String? profileImageUrl;
  final int tokenBalance;
  final String? role;
  final int? membershipLevel;

  UserModel({
    required this.userId,
    required this.name,
    required this.email,
    this.phone,
    this.profileImageUrl,
    required this.tokenBalance,
    this.role,
    this.membershipLevel,
  });

  factory UserModel.fromJson(Map<String, dynamic> json) => UserModel(
    userId: json['userId'] ?? 0,
    name: json['name'] ?? 'FitAI User',
    email: json['email'] ?? '',
    phone: json['phone'],
    profileImageUrl: json['profileImageUrl'],
    tokenBalance: json['tokenBalance'] ?? 0,
    role: json['role'],
    membershipLevel: json['membershipLevel'],
  );

  String get levelDisplay {
    final lvl = membershipLevel ?? 1;
    return 'Lv. $lvl';
  }
}

class InBodyModel {
  final int measurementId;
  final double weight;
  final double height;
  final double? bodyFatPercentage;
  final double? muscleMass;
  final double? bodyWaterPercentage;
  final double? bmi;
  final DateTime createdAt;

  InBodyModel({
    required this.measurementId,
    required this.weight,
    required this.height,
    this.bodyFatPercentage,
    this.muscleMass,
    this.bodyWaterPercentage,
    this.bmi,
    required this.createdAt,
  });

  factory InBodyModel.fromJson(Map<String, dynamic> json) => InBodyModel(
    measurementId: json['measurementId'] ?? 0,
    weight: (json['weight'] as num?)?.toDouble() ?? 0,
    height: (json['height'] as num?)?.toDouble() ?? 0,
    bodyFatPercentage: (json['bodyFatPercentage'] as num?)?.toDouble(),
    muscleMass: (json['muscleMass'] as num?)?.toDouble(),
    bodyWaterPercentage: (json['bodyWaterPercentage'] as num?)?.toDouble(),
    bmi: (json['bmi'] as num?)?.toDouble(),
    createdAt: json['createdAt'] != null
        ? DateTime.tryParse(json['createdAt']) ?? DateTime.now()
        : DateTime.now(),
  );

  double get computedBmi {
    if (bmi != null) return bmi!;
    if (height <= 0) return 0;
    final hm = height / 100;
    return weight / (hm * hm);
  }
}

class ActiveSubscriptionModel {
  final int subscriptionId;
  final int planId;
  final String planName;
  final DateTime startDate;
  final DateTime endDate;
  final String status;
  final double price;
  final int tokensIncluded;

  ActiveSubscriptionModel({
    required this.subscriptionId,
    required this.planId,
    required this.planName,
    required this.startDate,
    required this.endDate,
    required this.status,
    required this.price,
    required this.tokensIncluded,
  });

  bool get isActive =>
      status.toLowerCase() == 'active' && endDate.isAfter(DateTime.now());

  factory ActiveSubscriptionModel.fromJson(Map<String, dynamic> json) =>
      ActiveSubscriptionModel(
        subscriptionId: json['subscriptionId'] ?? 0,
        planId: json['planId'] ?? 0,
        planName: json['planName'] ?? 'Plan',
        startDate: DateTime.tryParse(json['startDate'] ?? '') ?? DateTime.now(),
        endDate:
            DateTime.tryParse(json['endDate'] ?? '') ??
            DateTime.now().add(const Duration(days: 30)),
        status: json['status'] ?? 'Active',
        price: (json['price'] as num?)?.toDouble() ?? 0,
        tokensIncluded: json['tokensIncluded'] ?? 0,
      );
}

class RecentActivityModel {
  final int logId;
  final String activityType;
  final String title;
  final DateTime date;
  final int durationMinutes;
  final int caloriesBurned;
  final int? tokensEarned;

  RecentActivityModel({
    required this.logId,
    required this.activityType,
    required this.title,
    required this.date,
    required this.durationMinutes,
    required this.caloriesBurned,
    this.tokensEarned,
  });

  factory RecentActivityModel.fromJson(Map<String, dynamic> json) =>
      RecentActivityModel(
        logId: json['logId'] ?? json['id'] ?? 0,
        activityType: json['activityType'] ?? 'Workout',
        title:
            json['title'] ??
            json['type'] ??
            json['exercisesCompleted'] ??
            'Workout Session',
        date:
            DateTime.tryParse(json['date'] ?? json['workoutDate'] ?? '') ??
            DateTime.now(),
        durationMinutes: json['durationMinutes'] ?? 0,
        caloriesBurned: json['caloriesBurned'] ?? 0,
        tokensEarned: json['tokensEarned'],
      );
}
