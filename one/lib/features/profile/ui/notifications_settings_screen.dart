import 'package:flutter/material.dart';
import 'package:dio/dio.dart';
import 'package:intl/intl.dart';
import 'package:one/core/api/api_client.dart';
import 'package:one/core/api/cache_helper.dart';

class NotificationsScreen extends StatefulWidget {
  const NotificationsScreen({super.key});
  @override
  State<NotificationsScreen> createState() => _NotificationsScreenState();
}

class _NotificationsScreenState extends State<NotificationsScreen> {
  List<Map<String, dynamic>> _notifications = [];
  bool _loading = true;
  String? _error;
  int _unreadCount = 0;

  @override
  void initState() {
    super.initState();
    _fetch();
  }

  Future<void> _fetch() async {
    setState(() {
      _loading = true;
      _error = null;
    });
    try {
      final userId = CacheHelper.getData(key: 'userId') ?? 0;
      final res = await ApiClient.dio.get(
        '/notifications/user/$userId',
        queryParameters: {'unreadOnly': false},
      );
      List<dynamic> raw = [];
      if (res.data is List) {
        raw = res.data as List;
      } else if (res.data is Map<String, dynamic>) {
        final d = res.data as Map<String, dynamic>;
        final inner = d['data'] ?? d['notifications'] ?? [];
        raw = inner is List ? inner : [];
      }
      final list = raw.whereType<Map<String, dynamic>>().toList();
      setState(() {
        _notifications = list;
        _unreadCount = list.where((n) => !(n['isRead'] ?? false)).length;
        _loading = false;
      });
    } on DioException catch (e) {
      setState(() {
        _error = e.response?.data?['message'] ?? 'Failed to load notifications';
        _loading = false;
      });
    } catch (_) {
      setState(() {
        _error = 'Failed to load notifications';
        _loading = false;
      });
    }
  }

  Future<void> _markRead(int id, int idx) async {
    try {
      await ApiClient.dio.put('/notifications/$id/read');
      setState(() {
        _notifications[idx] = {..._notifications[idx], 'isRead': true};
        _unreadCount = _notifications
            .where((n) => !(n['isRead'] ?? false))
            .length;
      });
    } catch (_) {}
  }

  Future<void> _markAllRead() async {
    try {
      final userId = CacheHelper.getData(key: 'userId') ?? 0;
      await ApiClient.dio.put('/notifications/user/$userId/read-all');
      setState(() {
        _notifications = _notifications
            .map((n) => {...n, 'isRead': true})
            .toList();
        _unreadCount = 0;
      });
    } catch (_) {}
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: const Color(0xFFF2F4F7),
      appBar: AppBar(
        backgroundColor: Colors.white,
        elevation: 0,
        leading: GestureDetector(
          onTap: () => Navigator.pop(context),
          child: Container(
            margin: const EdgeInsets.all(8),
            decoration: BoxDecoration(
              color: Colors.grey.shade100,
              borderRadius: BorderRadius.circular(10),
            ),
            child: const Icon(
              Icons.arrow_back_ios_new_rounded,
              color: Color(0xFF1A3A8F),
              size: 16,
            ),
          ),
        ),
        title: Row(
          children: [
            const Text(
              'Notifications',
              style: TextStyle(
                color: Color(0xFF1A1A2E),
                fontWeight: FontWeight.bold,
                fontSize: 17,
              ),
            ),
            if (_unreadCount > 0) ...[
              const SizedBox(width: 8),
              Container(
                padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 3),
                decoration: BoxDecoration(
                  color: const Color(0xFF1A3A8F),
                  borderRadius: BorderRadius.circular(10),
                ),
                child: Text(
                  '$_unreadCount',
                  style: const TextStyle(
                    color: Colors.white,
                    fontSize: 11,
                    fontWeight: FontWeight.bold,
                  ),
                ),
              ),
            ],
          ],
        ),
        actions: [
          if (_unreadCount > 0)
            TextButton(
              onPressed: _markAllRead,
              child: const Text(
                'Mark all read',
                style: TextStyle(
                  color: Color(0xFF1A3A8F),
                  fontSize: 12,
                  fontWeight: FontWeight.bold,
                ),
              ),
            ),
        ],
      ),
      body: _loading
          ? const Center(
              child: CircularProgressIndicator(color: Color(0xFF1A3A8F)),
            )
          : _error != null
          ? _buildError()
          : _notifications.isEmpty
          ? _buildEmpty()
          : RefreshIndicator(
              color: const Color(0xFF1A3A8F),
              onRefresh: _fetch,
              child: ListView.builder(
                padding: const EdgeInsets.all(16),
                itemCount: _notifications.length,
                itemBuilder: (_, i) => _buildTile(_notifications[i], i),
              ),
            ),
    );
  }

  Widget _buildTile(Map<String, dynamic> n, int index) {
    final isRead = n['isRead'] ?? false;
    final title = n['title'] ?? 'Notification';
    final message = n['message'] ?? '';
    final type = n['notificationType'] ?? 'General';
    final createdAt = n['createdAt'] != null
        ? DateTime.tryParse(n['createdAt'])
        : null;
    final dateStr = createdAt != null
        ? DateFormat('MMM d, h:mm a').format(createdAt)
        : '';
    final notifId = n['notificationId'] ?? 0;
    final td = _typeData(type);

    return GestureDetector(
      onTap: () {
        if (!isRead && notifId != 0) _markRead(notifId, index);
      },
      child: Container(
        margin: const EdgeInsets.only(bottom: 10),
        padding: const EdgeInsets.all(14),
        decoration: BoxDecoration(
          color: isRead ? Colors.white : const Color(0xFFF0F4FF),
          borderRadius: BorderRadius.circular(16),
          border: Border.all(
            color: isRead
                ? Colors.transparent
                : const Color(0xFF1A3A8F).withOpacity(0.2),
          ),
          boxShadow: [
            BoxShadow(
              color: Colors.grey.withOpacity(0.06),
              blurRadius: 6,
              offset: const Offset(0, 2),
            ),
          ],
        ),
        child: Row(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Container(
              width: 42,
              height: 42,
              decoration: BoxDecoration(
                color: td.$2.withOpacity(0.1),
                borderRadius: BorderRadius.circular(12),
              ),
              child: Icon(td.$1, color: td.$2, size: 20),
            ),
            const SizedBox(width: 12),
            Expanded(
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Row(
                    children: [
                      Expanded(
                        child: Text(
                          title,
                          style: TextStyle(
                            fontWeight: isRead
                                ? FontWeight.w500
                                : FontWeight.bold,
                            fontSize: 13,
                            color: const Color(0xFF1A1A2E),
                          ),
                        ),
                      ),
                      if (!isRead)
                        Container(
                          width: 8,
                          height: 8,
                          decoration: const BoxDecoration(
                            color: Color(0xFF1A3A8F),
                            shape: BoxShape.circle,
                          ),
                        ),
                    ],
                  ),
                  if (message.isNotEmpty) ...[
                    const SizedBox(height: 3),
                    Text(
                      message,
                      style: const TextStyle(color: Colors.grey, fontSize: 12),
                      maxLines: 2,
                      overflow: TextOverflow.ellipsis,
                    ),
                  ],
                  const SizedBox(height: 4),
                  Text(
                    dateStr,
                    style: const TextStyle(color: Colors.grey, fontSize: 10),
                  ),
                ],
              ),
            ),
          ],
        ),
      ),
    );
  }

  (IconData, Color) _typeData(String type) {
    switch (type.toLowerCase()) {
      case 'booking':
        return (Icons.event_available_rounded, const Color(0xFF1A3A8F));
      case 'workout':
        return (Icons.fitness_center_rounded, Colors.orange);
      case 'nutrition':
        return (Icons.restaurant_rounded, Colors.green);
      case 'achievement':
        return (Icons.emoji_events_rounded, Colors.amber);
      case 'subscription':
        return (Icons.workspace_premium_rounded, Colors.purple);
      case 'payment':
        return (Icons.payment_rounded, Colors.teal);
      default:
        return (Icons.notifications_rounded, const Color(0xFF1A3A8F));
    }
  }

  Widget _buildEmpty() {
    return Center(
      child: Column(
        mainAxisAlignment: MainAxisAlignment.center,
        children: [
          Container(
            width: 80,
            height: 80,
            decoration: BoxDecoration(
              color: const Color(0xFF1A3A8F).withOpacity(0.08),
              shape: BoxShape.circle,
            ),
            child: const Icon(
              Icons.notifications_none_outlined,
              color: Color(0xFF1A3A8F),
              size: 38,
            ),
          ),
          const SizedBox(height: 16),
          const Text(
            'No notifications yet',
            style: TextStyle(
              fontSize: 15,
              fontWeight: FontWeight.bold,
              color: Color(0xFF1A1A2E),
            ),
          ),
          const SizedBox(height: 6),
          const Text(
            "You're all caught up!",
            style: TextStyle(color: Colors.grey, fontSize: 13),
          ),
        ],
      ),
    );
  }

  Widget _buildError() {
    return Center(
      child: Padding(
        padding: const EdgeInsets.all(24),
        child: Column(
          mainAxisAlignment: MainAxisAlignment.center,
          children: [
            Icon(Icons.wifi_off_rounded, size: 56, color: Colors.grey.shade300),
            const SizedBox(height: 14),
            Text(
              _error!,
              textAlign: TextAlign.center,
              style: const TextStyle(color: Colors.grey, fontSize: 13),
            ),
            const SizedBox(height: 20),
            ElevatedButton.icon(
              onPressed: _fetch,
              icon: const Icon(Icons.refresh_rounded),
              label: const Text('Try Again'),
              style: ElevatedButton.styleFrom(
                backgroundColor: const Color(0xFF1A3A8F),
                foregroundColor: Colors.white,
                shape: RoundedRectangleBorder(
                  borderRadius: BorderRadius.circular(12),
                ),
              ),
            ),
          ],
        ),
      ),
    );
  }
}
