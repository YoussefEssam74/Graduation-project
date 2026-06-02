class ChatMessageModel {
  final String text;
  final bool isUser;
  final String time;

  ChatMessageModel({
    required this.text,
    required this.isUser,
    required this.time,
  });
}

class ChatSessionModel {
  final int sessionId;
  final String? firstMessage;
  final DateTime? createdAt;
  final int messageCount;

  ChatSessionModel({
    required this.sessionId,
    this.firstMessage,
    this.createdAt,
    this.messageCount = 0,
  });

  factory ChatSessionModel.fromJson(Map<String, dynamic> json) {
    return ChatSessionModel(
      sessionId: json['sessionId'] ?? json['id'] ?? 0,
      firstMessage:
          json['firstMessage'] ??
          json['title'] ??
          json['summary'] ??
          'Chat Session',
      createdAt: json['createdAt'] != null
          ? DateTime.tryParse(json['createdAt'])
          : null,
      messageCount: json['messageCount'] ?? json['count'] ?? 0,
    );
  }

  String get displayTitle {
    if (firstMessage != null && firstMessage!.isNotEmpty) {
      return firstMessage!.length > 40
          ? '${firstMessage!.substring(0, 40)}...'
          : firstMessage!;
    }
    return 'Chat Session #$sessionId';
  }
}
