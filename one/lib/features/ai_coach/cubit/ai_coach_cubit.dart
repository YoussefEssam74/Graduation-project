import 'package:flutter_bloc/flutter_bloc.dart';
import 'package:dio/dio.dart';
import 'package:intl/intl.dart';
import 'package:one/core/api/api_client.dart';
import 'package:one/core/api/cache_helper.dart';
import 'ai_coach_state.dart';
import '../models/chat_message_model.dart';

class AiCoachCubit extends Cubit<AiCoachState> {
  AiCoachCubit() : super(AiCoachInitial());

  final List<ChatMessageModel> _history = [];
  int? _sessionId;
  List<ChatSessionModel> _sessions = [];

  void initChat() {
    _history.add(
      ChatMessageModel(
        text:
            "Hello! 👋 I'm your AI Coach. Ask me anything about your workout, nutrition, or fitness goals!",
        isUser: false,
        time: _now(),
      ),
    );
    emit(AiCoachSuccess(messages: List.from(_history), sessions: _sessions));
  }

  Future<void> fetchChatHistory() async {
    emit(AiCoachHistoryLoading());
    try {
      final userId = CacheHelper.getData(key: 'userId') ?? 0;
      final response = await ApiClient.dio.get('/ai/sessions/$userId');
      List<ChatSessionModel> sessions = [];
      if (response.data is List) {
        sessions = (response.data as List)
            .map((s) => ChatSessionModel.fromJson(s))
            .toList();
      } else if (response.data is Map && response.data['data'] is List) {
        sessions = (response.data['data'] as List)
            .map((s) => ChatSessionModel.fromJson(s))
            .toList();
      }
      _sessions = sessions;
      emit(AiCoachHistoryLoaded(sessions: sessions));
    } catch (_) {
      emit(AiCoachHistoryLoaded(sessions: []));
    }
  }

  Future<void> loadSession(int sessionId) async {
    emit(AiCoachLoading());
    try {
      final userId = CacheHelper.getData(key: 'userId') ?? 0;
      final response = await ApiClient.dio.get(
        '/ai/sessions/$userId/$sessionId',
      );
      _history.clear();
      _sessionId = sessionId;
      List<dynamic> messages = [];
      if (response.data is List) {
        messages = response.data;
      } else if (response.data is Map && response.data['messages'] is List) {
        messages = response.data['messages'];
      }
      for (var msg in messages) {
        if (msg is Map) {
          final role = msg['role'] ?? msg['isUser'];
          final isUser = role == 'user' || role == true;
          _history.add(
            ChatMessageModel(
              text: msg['message'] ?? msg['text'] ?? msg['content'] ?? '',
              isUser: isUser,
              time: msg['createdAt'] != null
                  ? DateFormat('h:mm a').format(
                      DateTime.tryParse(msg['createdAt']) ?? DateTime.now(),
                    )
                  : _now(),
            ),
          );
        }
      }
      if (_history.isEmpty) {
        _history.add(
          ChatMessageModel(
            text: "Session loaded. How can I help you?",
            isUser: false,
            time: _now(),
          ),
        );
      }
      emit(AiCoachSuccess(messages: List.from(_history), sessions: _sessions));
    } catch (_) {
      _history.clear();
      initChat();
    }
  }

  void startNewChat() {
    _history.clear();
    _sessionId = null;
    initChat();
  }

  // ══════════════════════════════════════════════════
  // sendMessage – يجرب gemini-chat الأول، لو فشل يجرب ai/chat
  // ══════════════════════════════════════════════════
  Future<void> sendMessage(String text) async {
    if (text.trim().isEmpty) return;
    final userId = CacheHelper.getData(key: 'userId') ?? 0;

    _history.add(
      ChatMessageModel(text: text.trim(), isUser: true, time: _now()),
    );
    emit(
      AiCoachSuccess(
        messages: List.from(_history),
        isAiTyping: true,
        sessions: _sessions,
      ),
    );

    // ── جرب gemini-chat ──
    try {
      final response = await ApiClient.dio.post(
        '/ai/gemini-chat',
        data: {
          "userId": userId,
          "message": text.trim(),
          if (_sessionId != null) "sessionId": _sessionId,
        },
      );

      if (response.statusCode == 200 || response.statusCode == 201) {
        final replyText = _extractReply(response.data);
        if (response.data is Map && response.data['sessionId'] != null) {
          _sessionId = response.data['sessionId'];
        }
        _history.add(
          ChatMessageModel(text: replyText, isUser: false, time: _now()),
        );
        emit(
          AiCoachSuccess(
            messages: List.from(_history),
            isAiTyping: false,
            sessions: _sessions,
          ),
        );
        return;
      }
    } on DioException catch (e) {
      // لو 404 أو 503 جرب الـ fallback
      final status = e.response?.statusCode ?? 0;
      if (status != 400 && status != 401 && status != 403) {
        await _fallbackAiChat(text, userId);
        return;
      }
      _addErrorMessage(
        'Error ${e.response?.statusCode}: ${e.response?.data?["message"] ?? "Request failed"}',
      );
      return;
    } catch (_) {}

    await _fallbackAiChat(text, userId);
  }

  Future<void> _fallbackAiChat(String text, int userId) async {
    try {
      final response = await ApiClient.dio.post(
        '/ai/chat',
        data: {
          "userId": userId,
          "query": text.trim(),
          "contentTypes": ["string"],
        },
      );

      if (response.statusCode == 200 || response.statusCode == 201) {
        final replyText = _extractReply(response.data);
        _history.add(
          ChatMessageModel(text: replyText, isUser: false, time: _now()),
        );
        emit(
          AiCoachSuccess(
            messages: List.from(_history),
            isAiTyping: false,
            sessions: _sessions,
          ),
        );
      } else {
        _addErrorMessage(
          'AI service returned ${response.statusCode}. Please try again.',
        );
      }
    } on DioException catch (e) {
      final msg =
          e.response?.data?['message'] ??
          e.response?.data?['title'] ??
          e.response?.data?.toString() ??
          'Connection error. Check your internet.';
      _addErrorMessage(msg);
    } catch (e) {
      _addErrorMessage('Unexpected error: ${e.toString()}');
    }
  }

  void clearChat() {
    _history.clear();
    _sessionId = null;
    initChat();
  }

  // ══════════════════════════════════════════════════
  // _extractReply – يقرأ الـ response بشكل صح
  // ══════════════════════════════════════════════════
  String _extractReply(dynamic data) {
    if (data == null) return 'No response received.';

    String raw = '';

    if (data is String) {
      raw = data;
    } else if (data is Map) {
      // الـ API ممكن يرجع في أي من الـ fields دي
      for (final key in [
        'message',
        'reply',
        'response',
        'text',
        'content',
        'answer',
        'result',
      ]) {
        if (data[key] != null && data[key].toString().isNotEmpty) {
          raw = data[key].toString();
          break;
        }
      }
      // لو لسه فاضي ابحث في nested objects
      if (raw.isEmpty) {
        if (data['data'] is Map) return _extractReply(data['data']);
        if (data['data'] is String) raw = data['data'];
      }
      if (raw.isEmpty) raw = data.toString();
    } else if (data is List && data.isNotEmpty) {
      return _extractReply(data.first);
    } else {
      raw = data.toString();
    }

    return _cleanMetadata(raw);
  }

  // ── شيل الـ metadata اللي بتيجي مع الـ response ──
  String _cleanMetadata(String text) {
    return text
        .replaceAll(
          RegExp(r',?\s*tokensSpent\s*:\s*\d+', caseSensitive: false),
          '',
        )
        .replaceAll(
          RegExp(r',?\s*responseTimeMs\s*:\s*\d+', caseSensitive: false),
          '',
        )
        .replaceAll(
          RegExp(r',?\s*sessionId\s*:\s*\d+', caseSensitive: false),
          '',
        )
        .replaceAll(
          RegExp(r',?\s*model\s*:\s*[^\n,}]+', caseSensitive: false),
          '',
        )
        .replaceAll(RegExp(r',\s*$'), '')
        .trim();
  }

  void _addErrorMessage(String msg) {
    _history.add(ChatMessageModel(text: msg, isUser: false, time: _now()));
    emit(
      AiCoachSuccess(
        messages: List.from(_history),
        isAiTyping: false,
        sessions: _sessions,
      ),
    );
  }

  String _now() => DateFormat('h:mm a').format(DateTime.now());
}
