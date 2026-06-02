import 'package:flutter_bloc/flutter_bloc.dart';
import 'package:dio/dio.dart';
import 'package:one/core/api/api_client.dart';
import 'package:one/core/api/cache_helper.dart';
import 'package:one/features/profile/models/subscription_model.dart';
import 'subscription_state.dart';

class SubscriptionCubit extends Cubit<SubscriptionState> {
  SubscriptionCubit() : super(SubscriptionInitial());

  Future<void> fetchPlansAndTokens() async {
    emit(SubscriptionLoading());
    try {
      final userId = CacheHelper.getData(key: 'userId') ?? 0;

      // ── Plans ─────────────────────────────────
      List<SubscriptionPlanModel> plans = [];
      try {
        final res = await ApiClient.dio.get('/Subscription/plans/active');
        if (res.statusCode == 200) {
          List<dynamic> raw = [];
          if (res.data is List) {
            raw = res.data as List;
          } else if (res.data is Map<String, dynamic>) {
            final d = res.data as Map<String, dynamic>;
            raw = (d['data'] ?? d['plans'] ?? []) is List
                ? d['data'] ?? d['plans'] ?? []
                : [];
          }
          plans = raw
              .whereType<Map<String, dynamic>>()
              .map((p) => SubscriptionPlanModel.fromJson(p))
              .toList();
        }
      } on DioException catch (_) {
      } catch (_) {}

      // ── Active subscription ────────────────────
      Map<String, dynamic>? activeSub;
      try {
        final res = await ApiClient.dio.get(
          '/Subscription/user/$userId/active',
        );
        if (res.statusCode == 200 && res.data is Map<String, dynamic>) {
          final raw = res.data as Map<String, dynamic>;
          final inner = raw['data'];
          final d = inner is Map<String, dynamic> ? inner : raw;
          if (d.containsKey('planId') || d.containsKey('planName')) {
            activeSub = d;
          }
        }
      } on DioException catch (_) {
      } catch (_) {}

      // ── Token balance ──────────────────────────
      int balance = 0;
      try {
        final res = await ApiClient.dio.get('/users/$userId/tokens');
        if (res.statusCode == 200) {
          final d = res.data;
          balance = d is int
              ? d
              : (d is Map<String, dynamic>
                    ? (d['balance'] ?? d['tokenBalance'] ?? 0)
                    : 0);
        }
      } on DioException catch (_) {
      } catch (_) {}

      // ── Token transactions ─────────────────────
      List<TokenTransactionModel> transactions = [];
      try {
        final res = await ApiClient.dio.get('/token-transactions/user/$userId');
        if (res.statusCode == 200) {
          List<dynamic> raw = [];
          if (res.data is List) {
            raw = res.data as List;
          } else if (res.data is Map<String, dynamic>) {
            final d = res.data as Map<String, dynamic>;
            raw = (d['data'] ?? []) is List ? d['data'] ?? [] : [];
          }
          transactions = raw
              .whereType<Map<String, dynamic>>()
              .map((t) => TokenTransactionModel.fromJson(t))
              .toList();
        }
      } on DioException catch (_) {
      } catch (_) {}

      emit(
        SubscriptionLoaded(
          plans: plans,
          activeSub: activeSub,
          transactions: transactions,
          tokenBalance: balance,
        ),
      );
    } catch (e) {
      emit(SubscriptionError('Failed to load subscription data'));
    }
  }

  // ══════════════════════════════════════════════
  // Subscribe to plan
  // CreatePaymentDto requires: userId, amount, paymentMethod
  // CreateSubscriptionDto requires: userId, planId, paymentId
  // ══════════════════════════════════════════════
  Future<void> subscribeToPlan(
    int planId,
    double planPrice,
    String paymentMethod,
  ) async {
    emit(SubscriptionProcessing());
    try {
      final userId = CacheHelper.getData(key: 'userId') ?? 0;

      // Step 1: Create payment (amount is required & must be > 0)
      final payRes = await ApiClient.dio.post(
        '/Payment',
        data: {
          'userId': userId,
          'amount': planPrice > 0 ? planPrice : 1.0,
          'paymentMethod': paymentMethod,
          'paymentType': 'Subscription',
        },
      );

      // Extract paymentId from response
      int paymentId = 0;
      if (payRes.statusCode == 200 || payRes.statusCode == 201) {
        final d = payRes.data;
        if (d is Map<String, dynamic>) {
          final inner = d['data'] is Map<String, dynamic>
              ? d['data'] as Map<String, dynamic>
              : d;
          paymentId = inner['paymentId'] ?? inner['id'] ?? 0;
        }
      }

      if (paymentId == 0) {
        // Some APIs return the ID directly
        if (payRes.data is int) paymentId = payRes.data as int;
      }

      // Step 2: Create subscription
      await ApiClient.dio.post(
        '/Subscription',
        data: {'userId': userId, 'planId': planId, 'paymentId': paymentId},
      );

      emit(SubscriptionSuccess('Subscription activated successfully! 🎉'));
      await fetchPlansAndTokens();
    } on DioException catch (e) {
      final msg = _extractError(e);
      emit(SubscriptionError(msg));
      await fetchPlansAndTokens();
    } catch (e) {
      emit(SubscriptionError('Unexpected error: ${e.toString()}'));
      await fetchPlansAndTokens();
    }
  }

  String _extractError(DioException e) {
    final data = e.response?.data;
    if (data is Map<String, dynamic>) {
      return data['message'] ??
          data['title'] ??
          data['error'] ??
          'Subscription failed (${e.response?.statusCode})';
    }
    if (data is String && data.isNotEmpty) return data;
    return 'Subscription failed (${e.response?.statusCode ?? "no connection"})';
  }
}
