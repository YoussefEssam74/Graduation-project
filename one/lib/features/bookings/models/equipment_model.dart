class EquipmentModel {
  final int equipmentId;
  final String name;
  final int? categoryId;
  final String categoryName;
  final int status;
  final String? statusText;
  final String? location;
  final String? lastMaintenanceDate;
  final String? nextMaintenanceDate;
  final int tokensCostPerHour;

  EquipmentModel({
    required this.equipmentId,
    required this.name,
    this.categoryId,
    required this.categoryName,
    required this.status,
    this.statusText,
    this.location,
    this.lastMaintenanceDate,
    this.nextMaintenanceDate,
    required this.tokensCostPerHour,
  });

  bool get isAvailable =>
      status == 1 || statusText?.toLowerCase() == 'available';

  String get imageUrl => '';

  factory EquipmentModel.fromJson(Map<String, dynamic> json) {
    return EquipmentModel(
      equipmentId: json['equipmentId'] ?? 0,
      name: json['name'] ?? 'Equipment',
      categoryId: json['categoryId'],
      categoryName: json['categoryName'] ?? 'General',
      status: json['status'] ?? 1,
      statusText: json['statusText'],
      location: json['location'],
      lastMaintenanceDate: json['lastMaintenanceDate'],
      nextMaintenanceDate: json['nextMaintenanceDate'],
      tokensCostPerHour: json['tokensCostPerHour'] ?? 0,
    );
  }
}
