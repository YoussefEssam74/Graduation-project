import 'package:flutter/material.dart';
import 'package:flutter_bloc/flutter_bloc.dart';
import 'package:intl/intl.dart';
import '../cubit/achievements_cubit.dart';
import '../cubit/achievements_state.dart';
import '../models/achievement_model.dart';

class AchievementsScreen extends StatelessWidget {
  const AchievementsScreen({super.key});

  @override
  Widget build(BuildContext context) {
    return BlocProvider(
      create: (_) =>
          AchievementsCubit()..fetchAchievements(),
      child: const _AchievementsView(),
    );
  }
}

class _AchievementsView extends StatefulWidget {
  const _AchievementsView();
  @override
  State<_AchievementsView> createState() =>
      _AchievementsViewState();
}

class _AchievementsViewState
    extends State<_AchievementsView>
    with SingleTickerProviderStateMixin {
  late TabController _tab;

  @override
  void initState() {
    super.initState();
    _tab = TabController(length: 2, vsync: this);
  }

  @override
  void dispose() {
    _tab.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: const Color(0xFFF2F4F7),
      body: SafeArea(
        child: BlocBuilder<AchievementsCubit, AchievementsState>(
          builder: (ctx, state) => Column(children: [
            // ── Top Bar ──────────────────────────
            Padding(
              padding: const EdgeInsets.fromLTRB(
                  16, 14, 16, 6),
              child: Row(children: [
                GestureDetector(
                  onTap: () => Navigator.pop(ctx),
                  child: Container(
                    padding: const EdgeInsets.all(8),
                    decoration: BoxDecoration(
                      color: Colors.white,
                      borderRadius:
                          BorderRadius.circular(10),
                      boxShadow: [
                        BoxShadow(
                            color: Colors.grey
                                .withOpacity(0.1),
                            blurRadius: 4)
                      ],
                    ),
                    child: const Icon(
                        Icons.arrow_back_ios_new_rounded,
                        color: Color(0xFF1A3A8F),
                        size: 16),
                  ),
                ),
                const SizedBox(width: 12),
                const Expanded(
                  child: Text('Achievements',
                      style: TextStyle(
                          fontSize: 20,
                          fontWeight: FontWeight.bold,
                          color: Color(0xFF1A1A2E))),
                ),
              ]),
            ),

            // ── Stats Banner ─────────────────────
            if (state is AchievementsLoaded)
              _buildStatsBanner(ctx, state),

            // ── Tab Bar ──────────────────────────
            Padding(
              padding: const EdgeInsets.fromLTRB(
                  16, 10, 16, 8),
              child: Container(
                height: 44,
                decoration: BoxDecoration(
                    color: const Color(0xFFF0F0F5),
                    borderRadius:
                        BorderRadius.circular(12)),
                child: TabBar(
                  controller: _tab,
                  labelColor: Colors.white,
                  unselectedLabelColor: Colors.grey,
                  labelStyle: const TextStyle(
                      fontWeight: FontWeight.bold,
                      fontSize: 13),
                  indicator: BoxDecoration(
                      color: const Color(0xFF1A3A8F),
                      borderRadius:
                          BorderRadius.circular(10)),
                  indicatorSize: TabBarIndicatorSize.tab,
                  dividerColor: Colors.transparent,
                  padding: const EdgeInsets.all(3),
                  tabs: [
                    Tab(
                        text: state is AchievementsLoaded
                            ? 'In Progress (${state.inProgress.length})'
                            : 'In Progress'),
                    Tab(
                        text: state is AchievementsLoaded
                            ? 'Completed (${state.completed.length})'
                            : 'Completed'),
                  ],
                ),
              ),
            ),

            // ── Content ──────────────────────────
            Expanded(
              child: state is AchievementsLoading ||
                      state is AchievementsInitial
                  ? const Center(
                      child: CircularProgressIndicator(
                          color: Color(0xFF1A3A8F)))
                  : state is AchievementsError
                      ? _buildError(ctx, state.message)
                      : TabBarView(
                          controller: _tab,
                          physics:
                              const NeverScrollableScrollPhysics(),
                          children: [
                            _buildInProgressTab(
                                ctx,
                                state as AchievementsLoaded),
                            _buildCompletedTab(
                                ctx,
                                state),
                          ],
                        ),
            ),
          ]),
        ),
      ),
    );
  }

  // ── Stats Banner ──────────────────────────────────
  Widget _buildStatsBanner(
      BuildContext ctx, AchievementsLoaded state) {
    return Container(
      margin:
          const EdgeInsets.symmetric(horizontal: 16),
      padding: const EdgeInsets.all(18),
      decoration: BoxDecoration(
        gradient: const LinearGradient(
          colors: [Color(0xFF1A3A8F), Color(0xFF0D47A1)],
          begin: Alignment.topLeft,
          end: Alignment.bottomRight,
        ),
        borderRadius: BorderRadius.circular(18),
      ),
      child: Row(
          mainAxisAlignment:
              MainAxisAlignment.spaceAround,
          children: [
        _bannerStat(
            '${state.totalCompleted}', 'Completed'),
        _vDivider(),
        _bannerStat(
            '${state.inProgress.length}', 'In Progress'),
        _vDivider(),
        _bannerStat(
            '${state.totalPoints}', 'Total Points'),
      ]),
    );
  }

  Widget _bannerStat(String value, String label) {
    return Column(children: [
      Text(value,
          style: const TextStyle(
              color: Colors.white,
              fontSize: 22,
              fontWeight: FontWeight.bold)),
      Text(label,
          style: const TextStyle(
              color: Colors.white70, fontSize: 11)),
    ]);
  }

  Widget _vDivider() => Container(
      width: 1,
      height: 36,
      color: Colors.white.withOpacity(0.2));

  // ── In Progress Tab ──────────────────────────────
  Widget _buildInProgressTab(
      BuildContext ctx, AchievementsLoaded state) {
    if (state.inProgress.isEmpty) {
      return _buildEmpty(
          'All achievements completed! 🎉',
          Icons.emoji_events_rounded,
          Colors.amber);
    }
    return RefreshIndicator(
      color: const Color(0xFF1A3A8F),
      onRefresh: () =>
          ctx.read<AchievementsCubit>().fetchAchievements(),
      child: ListView.builder(
        padding: const EdgeInsets.fromLTRB(16, 8, 16, 24),
        itemCount: state.inProgress.length,
        itemBuilder: (_, i) =>
            _buildProgressCard(state.inProgress[i]),
      ),
    );
  }

  Widget _buildProgressCard(AchievementModel a) {
    return Container(
      margin: const EdgeInsets.only(bottom: 12),
      padding: const EdgeInsets.all(16),
      decoration: BoxDecoration(
        color: Colors.white,
        borderRadius: BorderRadius.circular(18),
        boxShadow: [
          BoxShadow(
              color: Colors.grey.withOpacity(0.07),
              blurRadius: 8,
              offset: const Offset(0, 3))
        ],
      ),
      child: Row(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
        // Icon badge
        Container(
          width: 52,
          height: 52,
          decoration: BoxDecoration(
            color: a.badgeColor.withOpacity(0.1),
            borderRadius: BorderRadius.circular(16),
          ),
          child: Icon(a.icon,
              color: a.badgeColor, size: 26),
        ),
        const SizedBox(width: 14),
        Expanded(
          child: Column(
              crossAxisAlignment:
                  CrossAxisAlignment.start,
              children: [
            Row(children: [
              Expanded(
                child: Text(a.name,
                    style: const TextStyle(
                        fontWeight: FontWeight.bold,
                        fontSize: 14,
                        color: Color(0xFF1A1A2E))),
              ),
              Text(
                  '${(a.progressPercent * 100).toInt()}%',
                  style: TextStyle(
                      color: a.badgeColor,
                      fontWeight: FontWeight.bold,
                      fontSize: 13)),
            ]),
            if (a.description != null) ...[
              const SizedBox(height: 3),
              Text(a.description!,
                  style: const TextStyle(
                      color: Colors.grey, fontSize: 12),
                  maxLines: 2,
                  overflow: TextOverflow.ellipsis),
            ],
            const SizedBox(height: 10),
            // Progress bar
            ClipRRect(
              borderRadius: BorderRadius.circular(6),
              child: LinearProgressIndicator(
                value: a.progressPercent,
                backgroundColor:
                    a.badgeColor.withOpacity(0.1),
                valueColor: AlwaysStoppedAnimation<Color>(
                    a.badgeColor),
                minHeight: 8,
              ),
            ),
            const SizedBox(height: 5),
            Text(a.progressLabel,
                style: TextStyle(
                    color: Colors.grey.shade500,
                    fontSize: 11)),
          ]),
        ),
      ]),
    );
  }

  // ── Completed Tab ────────────────────────────────
  Widget _buildCompletedTab(
      BuildContext ctx, AchievementsLoaded state) {
    if (state.completed.isEmpty) {
      return _buildEmpty(
          'Complete your first achievement!',
          Icons.lock_outline_rounded,
          Colors.grey);
    }
    return RefreshIndicator(
      color: const Color(0xFF1A3A8F),
      onRefresh: () =>
          ctx.read<AchievementsCubit>().fetchAchievements(),
      child: GridView.builder(
        padding: const EdgeInsets.fromLTRB(16, 8, 16, 24),
        gridDelegate:
            const SliverGridDelegateWithFixedCrossAxisCount(
          crossAxisCount: 2,
          crossAxisSpacing: 12,
          mainAxisSpacing: 12,
          childAspectRatio: 0.88,
        ),
        itemCount: state.completed.length,
        itemBuilder: (_, i) =>
            _buildCompletedCard(state.completed[i]),
      ),
    );
  }

  Widget _buildCompletedCard(AchievementModel a) {
    final dateStr = a.completedAt != null
        ? DateFormat('MMM d, yyyy').format(a.completedAt!)
        : 'Completed';

    return Container(
      decoration: BoxDecoration(
        color: Colors.white,
        borderRadius: BorderRadius.circular(18),
        boxShadow: [
          BoxShadow(
              color: Colors.grey.withOpacity(0.08),
              blurRadius: 8,
              offset: const Offset(0, 3))
        ],
      ),
      child: Padding(
        padding: const EdgeInsets.all(16),
        child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
          // Badge
          Container(
            width: 52,
            height: 52,
            decoration: BoxDecoration(
              gradient: const LinearGradient(
                colors: [Color(0xFF1A3A8F), Color(0xFF0D47A1)],
                begin: Alignment.topLeft,
                end: Alignment.bottomRight,
              ),
              borderRadius: BorderRadius.circular(16),
              boxShadow: [
                BoxShadow(
                    color: const Color(0xFF1A3A8F)
                        .withOpacity(0.3),
                    blurRadius: 8,
                    offset: const Offset(0, 3))
              ],
            ),
            child: Icon(a.icon,
                color: Colors.white, size: 26),
          ),
          const SizedBox(height: 10),
          Text(a.name,
              style: const TextStyle(
                  fontWeight: FontWeight.bold,
                  fontSize: 13,
                  color: Color(0xFF1A1A2E)),
              maxLines: 2,
              overflow: TextOverflow.ellipsis),
          const Spacer(),
          Row(children: [
            const Icon(Icons.check_circle_rounded,
                color: Colors.green, size: 13),
            const SizedBox(width: 4),
            Expanded(
              child: Text(dateStr,
                  style: const TextStyle(
                      color: Colors.grey,
                      fontSize: 10),
                  overflow: TextOverflow.ellipsis),
            ),
          ]),
        ]),
      ),
    );
  }

  Widget _buildEmpty(
      String msg, IconData icon, Color color) {
    return Center(
      child: Column(
          mainAxisAlignment: MainAxisAlignment.center,
          children: [
        Container(
          width: 80,
          height: 80,
          decoration: BoxDecoration(
              color: color.withOpacity(0.1),
              shape: BoxShape.circle),
          child: Icon(icon, color: color, size: 40),
        ),
        const SizedBox(height: 16),
        Text(msg,
            textAlign: TextAlign.center,
            style: const TextStyle(
                color: Colors.grey, fontSize: 14)),
      ]),
    );
  }

  Widget _buildError(BuildContext ctx, String msg) {
    return Center(
      child: Padding(
        padding: const EdgeInsets.all(24),
        child: Column(
            mainAxisAlignment: MainAxisAlignment.center,
            children: [
          Icon(Icons.wifi_off_rounded,
              size: 56, color: Colors.grey.shade300),
          const SizedBox(height: 14),
          Text(msg,
              textAlign: TextAlign.center,
              style: const TextStyle(
                  color: Colors.grey, fontSize: 13)),
          const SizedBox(height: 20),
          ElevatedButton.icon(
            onPressed: () => ctx
                .read<AchievementsCubit>()
                .fetchAchievements(),
            icon: const Icon(Icons.refresh_rounded),
            label: const Text('Try Again'),
            style: ElevatedButton.styleFrom(
              backgroundColor: const Color(0xFF1A3A8F),
              foregroundColor: Colors.white,
              shape: RoundedRectangleBorder(
                  borderRadius: BorderRadius.circular(12)),
            ),
          ),
        ]),
      ),
    );
  }
}
