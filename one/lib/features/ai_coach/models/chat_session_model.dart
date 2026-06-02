// lib/features/ai_coach/models/chat_session_model.dart

class ChatSessionModel {
  final int sessionId;
  final String title;
  final DateTime createdAt;
  final String? lastMessage;
  final int messageCount;

  ChatSessionModel({
    required this.sessionId,
    required this.title,
    required this.createdAt,
    this.lastMessage,
    this.messageCount = 0,
  });

  factory ChatSessionModel.fromJson(Map<String, dynamic> json) {
    return ChatSessionModel(
      sessionId: json['sessionId'] ?? json['id'] ?? 0,
      title: json['title'] ?? json['name'] ?? 'Chat Session',
      createdAt: json['createdAt'] != null
          ? DateTime.tryParse(json['createdAt']) ?? DateTime.now()
          : DateTime.now(),
      lastMessage: json['lastMessage'] ?? json['preview'],
      messageCount: json['messageCount'] ?? json['messagesCount'] ?? 0,
    );
  }

  String get formattedDate {
    final now = DateTime.now();
    final diff = now.difference(createdAt);
    if (diff.inDays == 0) return 'Today';
    if (diff.inDays == 1) return 'Yesterday';
    if (diff.inDays < 7) return '${diff.inDays} days ago';
    return '${createdAt.day}/${createdAt.month}/${createdAt.year}';
  }
}
