class InBodyModel {
  final double weight;
  final double height;
  final double? bodyFatPercentage;
  final double? muscleMass;
  final double? bmr;
  final String? measurementDate;

  InBodyModel({
    required this.weight,
    required this.height,
    this.bodyFatPercentage,
    this.muscleMass,
    this.bmr,
    this.measurementDate,
  });

  factory InBodyModel.fromJson(Map<String, dynamic> json) {
    return InBodyModel(
      weight: (json['weight'] ?? 0).toDouble(),
      height: (json['height'] ?? 0).toDouble(),
      bodyFatPercentage: json['bodyFatPercentage']?.toDouble(),
      muscleMass: json['muscleMass']?.toDouble(),
      bmr: json['bmr']?.toDouble(),
      measurementDate: json['measurementDate'],
    );
  }
}
