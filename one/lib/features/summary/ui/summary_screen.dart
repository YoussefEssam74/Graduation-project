import 'package:flutter/material.dart';
import 'package:flutter_bloc/flutter_bloc.dart';
import 'package:intl/intl.dart';
import '../cubit/summary_cubit.dart';
import '../cubit/summary_state.dart';

import '../../plan/ui/plan_screen.dart';
import '../../ai_coach/ui/ai_coach_screen.dart';
import '../../notifications/ui/notifications_screen.dart';

class SummaryScreen extends StatelessWidget {
  const SummaryScreen({super.key});

  @override
  Widget build(BuildContext context) {
    return BlocProvider(
      create: (_) => SummaryCubit()..fetchDailySummary(),
      child: const _SummaryView(),
    );
  }
}

class _SummaryView extends StatelessWidget {
  const _SummaryView();

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: const Color(0xFFF5F7FA),
      body: SafeArea(
        child: BlocBuilder<SummaryCubit, SummaryState>(
          builder: (ctx, state) {
            return RefreshIndicator(
              color: const Color(0xFF1A3A8F),
              onRefresh: () => ctx.read<SummaryCubit>().fetchDailySummary(),
              child: CustomScrollView(
                physics: const AlwaysScrollableScrollPhysics(),
                slivers: [
                  SliverToBoxAdapter(child: _buildTopBar(ctx)),
                  if (state is SummaryLoading || state is SummaryInitial)
                    const SliverFillRemaining(
                      child: Center(
                        child: CircularProgressIndicator(
                          color: Color(0xFF1A3A8F),
                        ),
                      ),
                    )
                  else if (state is SummaryError)
                    SliverFillRemaining(child: _buildError(ctx, state.message))
                  else if (state is SummarySuccess)
                    SliverToBoxAdapter(
                      child: Padding(
                        padding: const EdgeInsets.fromLTRB(14, 0, 14, 24),
                        child: Column(
                          crossAxisAlignment: CrossAxisAlignment.start,
                          children: [
                            _buildActivityRings(ctx, state),
                            const SizedBox(height: 12),
                            _buildAiInsight(ctx, state),
                            const SizedBox(height: 12),
                            _buildStatsRow(state),
                            const SizedBox(height: 16),
                            _sLabel('Recovery Insights'),
                            const SizedBox(height: 8),
                            _buildRecoveryCards(state),
                            const SizedBox(height: 16),
                            _sLabelAction(
                              ctx,
                              "Today's Plan",
                              'VIEW ALL',
                              () => Navigator.push(
                                ctx,
                                MaterialPageRoute(
                                  builder: (_) => const PlanScreen(),
                                ),
                              ),
                            ),
                            const SizedBox(height: 8),
                            _buildTodayPlan(ctx, state),
                            const SizedBox(height: 16),
                            _sLabel('Weekly Trend'),
                            const SizedBox(height: 8),
                            _buildWeeklyTrend(state),
                          ],
                        ),
                      ),
                    ),
                ],
              ),
            );
          },
        ),
      ),
    );
  }

  // ── Top Bar ────────────────────────────────────
  Widget _buildTopBar(BuildContext ctx) {
    return Padding(
      padding: const EdgeInsets.fromLTRB(16, 14, 16, 6),
      child: Row(
        mainAxisAlignment: MainAxisAlignment.spaceBetween,
        children: [
          Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              Text(
                DateFormat('EEEE, MMM d').format(DateTime.now()).toUpperCase(),
                style: const TextStyle(
                  color: Colors.grey,
                  fontSize: 10,
                  fontWeight: FontWeight.w600,
                  letterSpacing: 0.5,
                ),
              ),
              const SizedBox(height: 2),
              const Text(
                'Summary',
                style: TextStyle(
                  fontSize: 22,
                  fontWeight: FontWeight.bold,
                  color: Color(0xFF1A1A2E),
                ),
              ),
            ],
          ),
          GestureDetector(
            onTap: () => Navigator.push(
              ctx,
              MaterialPageRoute(builder: (_) => const NotificationsScreen()),
            ),
            child: Container(
              padding: const EdgeInsets.all(9),
              decoration: BoxDecoration(
                color: Colors.white,
                shape: BoxShape.circle,
                boxShadow: [
                  BoxShadow(
                    color: Colors.grey.withOpacity(0.1),
                    blurRadius: 5,
                    offset: const Offset(0, 2),
                  ),
                ],
              ),
              child: const Icon(
                Icons.notifications_none_outlined,
                color: Colors.black87,
                size: 20,
              ),
            ),
          ),
        ],
      ),
    );
  }

  // ── Activity Rings ─────────────────────────────
  Widget _buildActivityRings(BuildContext ctx, SummarySuccess state) {
    final ws = state.workoutSummary;
    final calories =
        ws?.totalCaloriesBurned ?? state.data.metrics.totalCaloriesBurned;
    final duration =
        ws?.totalDurationMinutes ?? state.data.metrics.totalDurationMinutes;
    final workouts = ws?.totalWorkouts ?? state.data.metrics.totalWorkouts;

    const calGoal = 750, exGoal = 150, standGoal = 10;
    final calP = (calories / calGoal).clamp(0.0, 1.0);
    final exP = (duration / exGoal).clamp(0.0, 1.0);
    final stP = (workouts / standGoal).clamp(0.0, 1.0);

    return Container(
      padding: const EdgeInsets.all(16),
      decoration: BoxDecoration(
        color: Colors.white,
        borderRadius: BorderRadius.circular(18),
        boxShadow: [
          BoxShadow(
            color: Colors.grey.withOpacity(0.07),
            blurRadius: 8,
            offset: const Offset(0, 3),
          ),
        ],
      ),
      child: Row(
        children: [
          // Rings
          SizedBox(
            width: 110,
            height: 110,
            child: Stack(
              alignment: Alignment.center,
              children: [
                SizedBox(
                  width: 104,
                  height: 104,
                  child: CircularProgressIndicator(
                    value: calP,
                    strokeWidth: 11,
                    backgroundColor: Colors.red.withOpacity(0.12),
                    valueColor: const AlwaysStoppedAnimation<Color>(Colors.red),
                    strokeCap: StrokeCap.round,
                  ),
                ),
                SizedBox(
                  width: 78,
                  height: 78,
                  child: CircularProgressIndicator(
                    value: exP,
                    strokeWidth: 11,
                    backgroundColor: Colors.green.withOpacity(0.12),
                    valueColor: const AlwaysStoppedAnimation<Color>(
                      Colors.green,
                    ),
                    strokeCap: StrokeCap.round,
                  ),
                ),
                SizedBox(
                  width: 52,
                  height: 52,
                  child: CircularProgressIndicator(
                    value: stP,
                    strokeWidth: 11,
                    backgroundColor: const Color(0xFF1A3A8F).withOpacity(0.12),
                    valueColor: const AlwaysStoppedAnimation<Color>(
                      Color(0xFF1A3A8F),
                    ),
                    strokeCap: StrokeCap.round,
                  ),
                ),
                Container(
                  width: 28,
                  height: 28,
                  decoration: BoxDecoration(
                    color: const Color(0xFF1A3A8F).withOpacity(0.1),
                    shape: BoxShape.circle,
                  ),
                  child: const Icon(
                    Icons.bolt_rounded,
                    color: Color(0xFF1A3A8F),
                    size: 16,
                  ),
                ),
              ],
            ),
          ),
          const SizedBox(width: 16),
          Expanded(
            child: Column(
              children: [
                _actRow(
                  Icons.arrow_forward_rounded,
                  Colors.red,
                  'Move',
                  calories > 0 ? '$calories' : '—',
                  '$calGoal kcal',
                ),
                const SizedBox(height: 7),
                _actRow(
                  Icons.double_arrow_rounded,
                  Colors.green,
                  'Exercise',
                  duration > 0 ? '${duration}m' : '—',
                  '${exGoal}m goal',
                ),
                const SizedBox(height: 7),
                _actRow(
                  Icons.keyboard_arrow_up_rounded,
                  const Color(0xFF1A3A8F),
                  'Workouts',
                  workouts > 0 ? '$workouts' : '—',
                  '$standGoal goal',
                ),
              ],
            ),
          ),
        ],
      ),
    );
  }

  Widget _actRow(
    IconData icon,
    Color color,
    String label,
    String val,
    String total,
  ) {
    return Row(
      children: [
        Icon(icon, color: color, size: 15),
        const SizedBox(width: 6),
        Expanded(
          child: Text(
            label,
            style: const TextStyle(
              fontSize: 12,
              fontWeight: FontWeight.w500,
              color: Colors.black87,
            ),
          ),
        ),
        RichText(
          text: TextSpan(
            children: [
              TextSpan(
                text: val,
                style: const TextStyle(
                  color: Colors.black87,
                  fontSize: 14,
                  fontWeight: FontWeight.bold,
                ),
              ),
              TextSpan(
                text: ' / $total',
                style: const TextStyle(color: Colors.grey, fontSize: 11),
              ),
            ],
          ),
        ),
      ],
    );
  }

  // ── AI Insight ─────────────────────────────────
  Widget _buildAiInsight(BuildContext ctx, SummarySuccess state) {
    final insight =
        state.aiInsight ??
        'Keep up the great work! Stay consistent with your workouts and nutrition to reach your fitness goals.';

    return Container(
      padding: const EdgeInsets.all(16),
      decoration: BoxDecoration(
        color: const Color(0xFF1A3A8F),
        borderRadius: BorderRadius.circular(18),
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Row(
            children: [
              Container(
                padding: const EdgeInsets.all(6),
                decoration: BoxDecoration(
                  color: Colors.white.withOpacity(0.2),
                  borderRadius: BorderRadius.circular(8),
                ),
                child: const Icon(
                  Icons.smart_toy_outlined,
                  color: Colors.white,
                  size: 15,
                ),
              ),
              const SizedBox(width: 8),
              const Text(
                'AI COACH INSIGHT',
                style: TextStyle(
                  color: Colors.white70,
                  fontSize: 10,
                  fontWeight: FontWeight.bold,
                  letterSpacing: 0.8,
                ),
              ),
            ],
          ),
          const SizedBox(height: 10),
          Text(
            _insightTitle(insight),
            style: const TextStyle(
              color: Colors.white,
              fontSize: 16,
              fontWeight: FontWeight.bold,
              height: 1.3,
            ),
          ),
          const SizedBox(height: 6),
          Text(
            insight,
            style: const TextStyle(
              color: Colors.white70,
              fontSize: 12,
              height: 1.4,
            ),
            maxLines: 3,
            overflow: TextOverflow.ellipsis,
          ),
          const SizedBox(height: 12),
          Row(
            children: [
              Expanded(
                child: GestureDetector(
                  onTap: () => Navigator.push(
                    ctx,
                    MaterialPageRoute(
                      builder: (_) => const AiCoachScreen(showBackButton: true),
                    ),
                  ),
                  child: Container(
                    padding: const EdgeInsets.symmetric(vertical: 10),
                    decoration: BoxDecoration(
                      color: Colors.white,
                      borderRadius: BorderRadius.circular(10),
                    ),
                    child: const Row(
                      mainAxisAlignment: MainAxisAlignment.center,
                      children: [
                        Icon(
                          Icons.check_circle_outline_rounded,
                          color: Color(0xFF1A3A8F),
                          size: 15,
                        ),
                        SizedBox(width: 6),
                        Text(
                          'Accept Adjustment',
                          style: TextStyle(
                            color: Color(0xFF1A3A8F),
                            fontWeight: FontWeight.bold,
                            fontSize: 12,
                          ),
                        ),
                      ],
                    ),
                  ),
                ),
              ),
            ],
          ),
          const SizedBox(height: 8),
          GestureDetector(
            onTap: () => Navigator.push(
              ctx,
              MaterialPageRoute(
                builder: (_) => const AiCoachScreen(showBackButton: true),
              ),
            ),
            child: Container(
              width: double.infinity,
              padding: const EdgeInsets.symmetric(vertical: 10),
              decoration: BoxDecoration(
                color: Colors.white.withOpacity(0.12),
                borderRadius: BorderRadius.circular(10),
              ),
              child: const Center(
                child: Text(
                  'VIEW FULL ANALYSIS',
                  style: TextStyle(
                    color: Colors.white,
                    fontWeight: FontWeight.bold,
                    fontSize: 11,
                    letterSpacing: 0.5,
                  ),
                ),
              ),
            ),
          ),
        ],
      ),
    );
  }

  // ── Stats Row ──────────────────────────────────
  Widget _buildStatsRow(SummarySuccess state) {
    final ws = state.workoutSummary;
    final streak = ws?.currentStreak ?? state.data.metrics.currentStreak;
    final totalWorkouts = ws?.totalWorkouts ?? state.data.metrics.totalWorkouts;

    return Row(
      children: [
        Expanded(
          child: _miniCard(
            icon: Icons.bedtime_outlined,
            iconColor: Colors.purple,
            label: 'Sleep',
            value: streak > 0 ? '${streak}h 0m' : '—',
            sub: 'Quality: Good',
            progress: streak > 0 ? (streak / 8.0).clamp(0.0, 1.0) : 0,
            progressColor: Colors.purple,
          ),
        ),
        const SizedBox(width: 10),
        Expanded(
          child: _miniCard(
            icon: Icons.directions_walk_rounded,
            iconColor: Colors.orange,
            label: 'Steps',
            value: totalWorkouts > 0 ? '${totalWorkouts * 1500}' : '0',
            sub: 'GOAL: 10,000',
            showProgress: false,
          ),
        ),
      ],
    );
  }

  Widget _miniCard({
    required IconData icon,
    required Color iconColor,
    required String label,
    required String value,
    required String sub,
    double progress = 0,
    Color progressColor = Colors.blue,
    bool showProgress = true,
  }) {
    return Container(
      padding: const EdgeInsets.all(13),
      decoration: BoxDecoration(
        color: Colors.white,
        borderRadius: BorderRadius.circular(16),
        boxShadow: [
          BoxShadow(
            color: Colors.grey.withOpacity(0.07),
            blurRadius: 7,
            offset: const Offset(0, 2),
          ),
        ],
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Row(
            mainAxisAlignment: MainAxisAlignment.spaceBetween,
            children: [
              Container(
                padding: const EdgeInsets.all(7),
                decoration: BoxDecoration(
                  color: iconColor.withOpacity(0.1),
                  borderRadius: BorderRadius.circular(9),
                ),
                child: Icon(icon, color: iconColor, size: 15),
              ),
              Text(
                label,
                style: const TextStyle(
                  color: Colors.grey,
                  fontSize: 11,
                  fontWeight: FontWeight.w500,
                ),
              ),
            ],
          ),
          const SizedBox(height: 8),
          Text(
            value,
            style: const TextStyle(
              fontSize: 18,
              fontWeight: FontWeight.bold,
              color: Color(0xFF1A1A2E),
            ),
          ),
          const SizedBox(height: 2),
          Text(sub, style: const TextStyle(color: Colors.grey, fontSize: 10)),
          if (showProgress && progress > 0) ...[
            const SizedBox(height: 6),
            ClipRRect(
              borderRadius: BorderRadius.circular(3),
              child: LinearProgressIndicator(
                value: progress,
                backgroundColor: progressColor.withOpacity(0.1),
                valueColor: AlwaysStoppedAnimation<Color>(progressColor),
                minHeight: 4,
              ),
            ),
          ],
        ],
      ),
    );
  }

  // ── Recovery Cards ─────────────────────────────
  Widget _buildRecoveryCards(SummarySuccess state) {
    final ws = state.workoutSummary;
    final streak = ws?.currentStreak ?? state.data.metrics.currentStreak;
    final calories =
        ws?.totalCaloriesBurned ?? state.data.metrics.totalCaloriesBurned;
    final avgDuration = ws?.averageWorkoutDuration ?? 0;

    final cards = [
      _RC(
        'Active Recovery',
        calories > 0 ? 'MOVE · $calories kcal' : 'Start your first workout',
        Icons.directions_run_rounded,
        const Color(0xFF1A3A8F),
      ),
      _RC(
        'Avg Session',
        avgDuration > 0 ? '$avgDuration min avg' : 'No sessions yet',
        Icons.timer_outlined,
        Colors.green,
      ),
      _RC(
        'Streak: $streak days',
        streak > 0 ? 'Keep it going 🔥' : 'Start your streak!',
        Icons.local_fire_department_rounded,
        Colors.orange,
      ),
    ];

    return SizedBox(
      height: 108,
      child: ListView.builder(
        scrollDirection: Axis.horizontal,
        itemCount: cards.length,
        itemBuilder: (_, i) {
          final c = cards[i];
          return Container(
            width: 140,
            margin: const EdgeInsets.only(right: 10),
            padding: const EdgeInsets.all(12),
            decoration: BoxDecoration(
              color: c.color,
              borderRadius: BorderRadius.circular(16),
              boxShadow: [
                BoxShadow(
                  color: c.color.withOpacity(0.25),
                  blurRadius: 6,
                  offset: const Offset(0, 3),
                ),
              ],
            ),
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Icon(c.icon, color: Colors.white, size: 18),
                const Spacer(),
                Text(
                  c.title,
                  style: const TextStyle(
                    color: Colors.white,
                    fontSize: 12,
                    fontWeight: FontWeight.bold,
                  ),
                ),
                Text(
                  c.sub,
                  style: const TextStyle(color: Colors.white70, fontSize: 10),
                  maxLines: 1,
                  overflow: TextOverflow.ellipsis,
                ),
              ],
            ),
          );
        },
      ),
    );
  }

  // ── Today's Plan ───────────────────────────────
  Widget _buildTodayPlan(BuildContext ctx, SummarySuccess state) {
    final workouts = state.data.recentWorkouts;

    if (workouts.isEmpty) {
      return Container(
        padding: const EdgeInsets.all(20),
        decoration: BoxDecoration(
          color: Colors.white,
          borderRadius: BorderRadius.circular(16),
          border: Border.all(
            color: Colors.grey.shade200,
            style: BorderStyle.solid,
          ),
        ),
        child: Column(
          children: [
            Container(
              padding: const EdgeInsets.all(12),
              decoration: BoxDecoration(
                color: Colors.grey.shade100,
                shape: BoxShape.circle,
              ),
              child: Icon(
                Icons.calendar_today_outlined,
                color: Colors.grey.shade400,
                size: 24,
              ),
            ),
            const SizedBox(height: 10),
            const Text(
              'No plans for today yet.',
              style: TextStyle(
                fontSize: 14,
                fontWeight: FontWeight.bold,
                color: Colors.black87,
              ),
            ),
            const SizedBox(height: 4),
            const Text(
              'Start a workout now to keep your streak alive!',
              textAlign: TextAlign.center,
              style: TextStyle(color: Colors.grey, fontSize: 12),
            ),
            const SizedBox(height: 14),
            GestureDetector(
              onTap: () => Navigator.push(
                ctx,
                MaterialPageRoute(builder: (_) => const PlanScreen()),
              ),
              child: Container(
                padding: const EdgeInsets.symmetric(
                  horizontal: 20,
                  vertical: 11,
                ),
                decoration: BoxDecoration(
                  color: const Color(0xFF1A3A8F),
                  borderRadius: BorderRadius.circular(12),
                ),
                child: const Row(
                  mainAxisSize: MainAxisSize.min,
                  children: [
                    Icon(Icons.add_rounded, color: Colors.white, size: 16),
                    SizedBox(width: 6),
                    Text(
                      'START WORKOUT',
                      style: TextStyle(
                        color: Colors.white,
                        fontWeight: FontWeight.bold,
                        fontSize: 13,
                        letterSpacing: 0.5,
                      ),
                    ),
                  ],
                ),
              ),
            ),
          ],
        ),
      );
    }

    return Column(
      children: workouts.take(3).map((w) {
        final isToday =
            w.date.isNotEmpty &&
            DateTime.tryParse(w.date)?.day == DateTime.now().day;
        return Container(
          margin: const EdgeInsets.only(bottom: 8),
          padding: const EdgeInsets.all(12),
          decoration: BoxDecoration(
            color: Colors.white,
            borderRadius: BorderRadius.circular(14),
            boxShadow: [
              BoxShadow(
                color: Colors.grey.withOpacity(0.06),
                blurRadius: 5,
                offset: const Offset(0, 2),
              ),
            ],
          ),
          child: Row(
            children: [
              Container(
                padding: const EdgeInsets.all(9),
                decoration: BoxDecoration(
                  color: const Color(0xFF1A3A8F).withOpacity(0.1),
                  borderRadius: BorderRadius.circular(10),
                ),
                child: const Icon(
                  Icons.fitness_center_rounded,
                  color: Color(0xFF1A3A8F),
                  size: 18,
                ),
              ),
              const SizedBox(width: 10),
              Expanded(
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Text(
                      w.type,
                      style: const TextStyle(
                        fontWeight: FontWeight.bold,
                        fontSize: 13,
                        color: Colors.black87,
                      ),
                    ),
                    Text(
                      '${isToday ? "Today" : DateFormat("MMM d").format(DateTime.tryParse(w.date) ?? DateTime.now())} · '
                      '${w.durationMinutes > 0 ? "${w.durationMinutes} min" : ""}'
                      '${w.caloriesBurned > 0 ? " · ${w.caloriesBurned} kcal" : ""}',
                      style: const TextStyle(color: Colors.grey, fontSize: 11),
                    ),
                  ],
                ),
              ),
              Container(
                padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 3),
                decoration: BoxDecoration(
                  color: w.completed
                      ? Colors.green.withOpacity(0.1)
                      : Colors.orange.withOpacity(0.1),
                  borderRadius: BorderRadius.circular(7),
                ),
                child: Text(
                  w.completed ? 'Done' : w.intensity,
                  style: TextStyle(
                    color: w.completed ? Colors.green : Colors.orange,
                    fontSize: 10,
                    fontWeight: FontWeight.bold,
                  ),
                ),
              ),
            ],
          ),
        );
      }).toList(),
    );
  }

  // ── Weekly Trend ───────────────────────────────
  Widget _buildWeeklyTrend(SummarySuccess state) {
    final ws = state.workoutSummary;
    final totalMin =
        ws?.totalDurationMinutes ?? state.data.metrics.totalDurationMinutes;
    final totalW = ws?.totalWorkouts ?? state.data.metrics.totalWorkouts;
    final avgMin = ws?.averageWorkoutDuration ?? 0;
    final calories =
        ws?.totalCaloriesBurned ?? state.data.metrics.totalCaloriesBurned;
    final streak = ws?.currentStreak ?? state.data.metrics.currentStreak;

    final days = ['M', 'T', 'W', 'T', 'F', 'S', 'S'];
    final today = DateTime.now().weekday - 1; // 0=Mon
    final maxH = totalMin > 0 ? (totalMin / 7.0) : 30.0;
    final values = List.generate(7, (i) {
      if (totalW == 0) return 0.0;
      return i <= today ? maxH * (0.4 + (i % 3) * 0.2) : maxH * 0.1;
    });

    return Container(
      padding: const EdgeInsets.all(14),
      decoration: BoxDecoration(
        color: Colors.white,
        borderRadius: BorderRadius.circular(16),
        boxShadow: [
          BoxShadow(
            color: Colors.grey.withOpacity(0.07),
            blurRadius: 7,
            offset: const Offset(0, 2),
          ),
        ],
      ),
      child: Column(
        children: [
          Row(
            mainAxisAlignment: MainAxisAlignment.spaceBetween,
            children: [
              const Text(
                'This Week',
                style: TextStyle(
                  fontWeight: FontWeight.bold,
                  fontSize: 13,
                  color: Colors.black87,
                ),
              ),
              Text(
                avgMin > 0
                    ? 'Avg. ${avgMin}m'
                    : totalMin > 0
                    ? 'Avg. ${totalMin ~/ 7}m'
                    : 'No workouts yet',
                style: const TextStyle(color: Colors.grey, fontSize: 11),
              ),
            ],
          ),
          const SizedBox(height: 12),
          SizedBox(
            height: 70,
            child: Row(
              crossAxisAlignment: CrossAxisAlignment.end,
              mainAxisAlignment: MainAxisAlignment.spaceAround,
              children: List.generate(7, (i) {
                final ratio = maxH > 0
                    ? (values[i] / (maxH * 1.2)).clamp(0.05, 1.0)
                    : 0.05;
                final isToday = i == today;
                return Column(
                  mainAxisAlignment: MainAxisAlignment.end,
                  children: [
                    Expanded(
                      child: Align(
                        alignment: Alignment.bottomCenter,
                        child: Container(
                          width: 22,
                          height: 55 * ratio,
                          decoration: BoxDecoration(
                            color: isToday
                                ? const Color(0xFF1A3A8F)
                                : const Color(0xFF1A3A8F).withOpacity(0.18),
                            borderRadius: BorderRadius.circular(5),
                          ),
                        ),
                      ),
                    ),
                    const SizedBox(height: 4),
                    Text(
                      days[i],
                      style: TextStyle(
                        color: isToday ? const Color(0xFF1A3A8F) : Colors.grey,
                        fontSize: 10,
                        fontWeight: isToday
                            ? FontWeight.bold
                            : FontWeight.normal,
                      ),
                    ),
                  ],
                );
              }),
            ),
          ),
          const SizedBox(height: 10),
          Row(
            children: [
              Expanded(
                child: _tStat(
                  'Workouts',
                  totalW > 0 ? '$totalW' : '0',
                  Colors.blue,
                ),
              ),
              Expanded(
                child: _tStat(
                  'Calories',
                  calories > 0 ? '$calories' : '0',
                  Colors.orange,
                ),
              ),
              Expanded(
                child: _tStat(
                  'Streak',
                  streak > 0 ? '${streak}d' : '0d',
                  Colors.deepOrange,
                ),
              ),
            ],
          ),
        ],
      ),
    );
  }

  Widget _tStat(String label, String value, Color color) {
    return Column(
      children: [
        Text(
          value,
          style: TextStyle(
            fontSize: 16,
            fontWeight: FontWeight.bold,
            color: color,
          ),
        ),
        Text(label, style: const TextStyle(color: Colors.grey, fontSize: 10)),
      ],
    );
  }

  // ── Helpers ────────────────────────────────────
  Widget _sLabel(String text) => Text(
    text,
    style: const TextStyle(
      fontSize: 15,
      fontWeight: FontWeight.bold,
      color: Color(0xFF1A1A2E),
    ),
  );

  Widget _sLabelAction(
    BuildContext ctx,
    String title,
    String action,
    VoidCallback onTap,
  ) {
    return Row(
      mainAxisAlignment: MainAxisAlignment.spaceBetween,
      children: [
        Text(
          title,
          style: const TextStyle(
            fontSize: 15,
            fontWeight: FontWeight.bold,
            color: Color(0xFF1A1A2E),
          ),
        ),
        GestureDetector(
          onTap: onTap,
          child: Text(
            action,
            style: const TextStyle(
              color: Color(0xFF1A73E8),
              fontSize: 12,
              fontWeight: FontWeight.bold,
            ),
          ),
        ),
      ],
    );
  }

  Widget _buildError(BuildContext ctx, String msg) {
    return Center(
      child: Padding(
        padding: const EdgeInsets.all(24),
        child: Column(
          mainAxisAlignment: MainAxisAlignment.center,
          children: [
            Icon(Icons.wifi_off_rounded, size: 56, color: Colors.grey.shade300),
            const SizedBox(height: 14),
            Text(
              msg,
              textAlign: TextAlign.center,
              style: const TextStyle(color: Colors.grey, fontSize: 13),
            ),
            const SizedBox(height: 20),
            ElevatedButton.icon(
              onPressed: () => ctx.read<SummaryCubit>().fetchDailySummary(),
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

  String _insightTitle(String insight) {
    if (insight.length < 40) return insight;
    final p = insight.indexOf('.');
    if (p > 0 && p < 80) return insight.substring(0, p);
    return insight.split(' ').take(5).join(' ');
  }
}

class _RC {
  final String title, sub;
  final IconData icon;
  final Color color;
  const _RC(this.title, this.sub, this.icon, this.color);
}
