class SubscriptionPlanModel {
  final int planId;
  final String planName;
  final double price;
  final int durationDays;
  final String? description;
  final int tokensIncluded;
  final String? features;
  final int? maxBookingsPerDay;
  final bool isPopular;
  final bool isActive;

  SubscriptionPlanModel({
    required this.planId,
    required this.planName,
    required this.price,
    required this.durationDays,
    this.description,
    required this.tokensIncluded,
    this.features,
    this.maxBookingsPerDay,
    this.isPopular = false,
    this.isActive = true,
  });

  List<String> get featureList {
    if (features == null || features!.isEmpty) return [];
    return features!.split(',').map((f) => f.trim()).toList();
  }

  String get durationLabel {
    if (durationDays == 30 || durationDays == 31) return '/month';
    if (durationDays == 365) return '/year';
    if (durationDays == 7) return '/week';
    return '/${durationDays}d';
  }

  factory SubscriptionPlanModel.fromJson(Map<String, dynamic> json) =>
      SubscriptionPlanModel(
        planId: json['planId'] ?? 0,
        planName: json['planName'] ?? 'Plan',
        price: (json['price'] as num?)?.toDouble() ?? 0,
        durationDays: json['durationDays'] ?? 30,
        description: json['description'],
        tokensIncluded: json['tokensIncluded'] ?? 0,
        features: json['features'],
        maxBookingsPerDay: json['maxBookingsPerDay'],
        isPopular: json['isPopular'] ?? false,
        isActive: json['isActive'] ?? true,
      );
}

class TokenTransactionModel {
  final int transactionId;
  final int amount;
  final String? transactionType;
  final String? description;
  final DateTime createdAt;

  TokenTransactionModel({
    required this.transactionId,
    required this.amount,
    this.transactionType,
    this.description,
    required this.createdAt,
  });

  bool get isCredit => amount > 0;

  factory TokenTransactionModel.fromJson(Map<String, dynamic> json) =>
      TokenTransactionModel(
        transactionId: json['transactionId'] ?? 0,
        amount: json['amount'] ?? 0,
        transactionType: json['transactionType'],
        description: json['description'],
        createdAt: json['createdAt'] != null
            ? DateTime.tryParse(json['createdAt']) ?? DateTime.now()
            : DateTime.now(),
      );
}
