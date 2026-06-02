class AddInBodyRequestModel {
  final double weight;
  final double height;
  final double bodyFatPercentage;
  final double muscleMass;
  final int userId;

  AddInBodyRequestModel({
    required this.weight,
    required this.height,
    required this.bodyFatPercentage,
    required this.muscleMass,
    required this.userId,
  });

  Map<String, dynamic> toJson() => {
    "weight": weight,
    "height": height,
    "bodyFatPercentage": bodyFatPercentage,
    "muscleMass": muscleMass,
    "userId": userId,
    "measurementDate": DateTime.now().toIso8601String(),
  };
}
