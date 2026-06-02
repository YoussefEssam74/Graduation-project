class NotificationModel {
  final int notificationId;
  final int userId;
  final String? notificationType;
  final String? priority;
  final String? title;
  final String? message;
  final String? referenceType;
  final int? referenceId;
  final bool isRead;
  final String? readAt;
  final String createdAt;
  final String updatedAt;

  NotificationModel({
    required this.notificationId,
    required this.userId,
    this.notificationType,
    this.priority,
    this.title,
    this.message,
    this.referenceType,
    this.referenceId,
    required this.isRead,
    this.readAt,
    required this.createdAt,
    required this.updatedAt,
  });

  factory NotificationModel.fromJson(Map<String, dynamic> json) {
    return NotificationModel(
      notificationId: json['notificationId'] ?? 0,
      userId: json['userId'] ?? 0,
      notificationType: json['notificationType'],
      priority: json['priority'],
      title: json['title'],
      message: json['message'],
      referenceType: json['referenceType'],
      referenceId: json['referenceId'],
      isRead: json['isRead'] ?? false,
      readAt: json['readAt'],
      createdAt: json['createdAt'] ?? DateTime.now().toIso8601String(),
      updatedAt: json['updatedAt'] ?? DateTime.now().toIso8601String(),
    );
  }

  // Helper getter for UI
  String? get type => notificationType;
  int? get id => notificationId;
}
