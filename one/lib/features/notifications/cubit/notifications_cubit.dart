import 'package:flutter_bloc/flutter_bloc.dart';
import 'package:dio/dio.dart';
import 'package:one/core/api/api_client.dart';
import 'package:one/core/api/cache_helper.dart';
import 'notifications_state.dart';
import '../models/notification_model.dart';

class NotificationsCubit extends Cubit<NotificationsState> {
  NotificationsCubit() : super(NotificationsInitial());

  Future<void> fetchNotifications() async {
    emit(NotificationsLoading());
    try {
      final userId = CacheHelper.getData(key: 'userId') ?? 0;

      // GET /api/notifications/user/{userId}
      final response = await ApiClient.dio.get('/notifications/user/$userId');

      List<NotificationModel> notifications = [];

      if (response.data is List) {
        notifications = (response.data as List)
            .map((json) => NotificationModel.fromJson(json))
            .toList();
      } else if (response.data is Map && response.data['data'] is List) {
        notifications = (response.data['data'] as List)
            .map((json) => NotificationModel.fromJson(json))
            .toList();
      }

      // Sort by date - newest first
      notifications.sort(
        (a, b) =>
            DateTime.parse(b.createdAt).compareTo(DateTime.parse(a.createdAt)),
      );

      emit(NotificationsLoaded(notifications: notifications));
    } on DioException catch (e) {
      emit(
        NotificationsError(
          message:
              e.response?.data?['message'] ?? 'Failed to load notifications',
        ),
      );
    } catch (e) {
      emit(NotificationsError(message: 'Unexpected error occurred'));
    }
  }

  Future<void> markAsRead(int notificationId) async {
    try {
      // PUT /api/notifications/{id}/read
      await ApiClient.dio.put('/notifications/$notificationId/read');

      // Refresh notifications
      await fetchNotifications();
    } catch (e) {
      // Silent fail - don't disrupt user
    }
  }

  Future<void> markAllAsRead() async {
    try {
      final userId = CacheHelper.getData(key: 'userId') ?? 0;

      // PUT /api/notifications/user/{userId}/read-all
      await ApiClient.dio.put('/notifications/user/$userId/read-all');

      // Refresh notifications
      await fetchNotifications();
    } catch (e) {
      // Silent fail
    }
  }

  Future<void> deleteNotification(int notificationId) async {
    try {
      // DELETE /api/notifications/{id}
      await ApiClient.dio.delete('/notifications/$notificationId');

      // Refresh notifications
      await fetchNotifications();
    } catch (e) {
      // Silent fail
    }
  }
}
