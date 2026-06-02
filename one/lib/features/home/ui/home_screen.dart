import 'package:flutter/material.dart';
import 'package:flutter_bloc/flutter_bloc.dart';
import 'package:intl/intl.dart';
import '../cubit/home_cubit.dart';
import '../cubit/home_state.dart';
import '../../notifications/ui/notifications_screen.dart';
import '../../plan/ui/plan_screen.dart';
import '../../bookings/ui/bookings_screen.dart';

class HomeScreen extends StatelessWidget {
  const HomeScreen({super.key});

  @override
  Widget build(BuildContext context) {
    return BlocProvider(
      create: (_) => HomeCubit()..fetchHomeData(),
      child: const _HomeView(),
    );
  }
}

class _HomeView extends StatelessWidget {
  const _HomeView();

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: Colors.white,
      body: Stack(
        children: [
          // 1. خلفية الصورة من الإنترنت (تغطي الشاشة بالكامل)
          Positioned.fill(
            child: Image.network(
              'https://images.unsplash.com/photo-1534438327276-14e5300c3a48?q=80&w=2070&auto=format&fit=crop', // رابط صورة جيم احترافية
              fit: BoxFit.cover,
            ),
          ),

          // 2. طبقة شفافة بيضاء لضمان وضوح النصوص (Overlay)
          Positioned.fill(
            child: Container(
              color: Colors.white.withOpacity(
                0.92,
              ), // تعتيم بنسبة 92% لجعل النص بارزاً جداً
            ),
          ),

          // 3. المحتوى الرئيسي
          BlocBuilder<HomeCubit, HomeState>(
            builder: (context, state) {
              if (state is HomeInitial || state is HomeLoading) {
                return const Center(
                  child: CircularProgressIndicator(color: Color(0xFF1A3A8F)),
                );
              }
              if (state is HomeError) {
                return _buildError(context, state.message);
              }
              if (state is HomeLoaded) {
                return _buildContent(context, state);
              }
              return const SizedBox.shrink();
            },
          ),
        ],
      ),
    );
  }

  Widget _buildContent(BuildContext context, HomeLoaded state) {
    final greeting = _getGreeting();
    final today = DateFormat('EEEE, MMM d').format(DateTime.now());

    return RefreshIndicator(
      color: const Color(0xFF1A3A8F),
      onRefresh: () => context.read<HomeCubit>().fetchHomeData(),
      child: CustomScrollView(
        slivers: [
          // ── AppBar الشفاف ──
          SliverAppBar(
            floating: true,
            snap: true,
            backgroundColor: Colors.transparent,
            elevation: 0,
            automaticallyImplyLeading: false,
            title: Row(
              children: [
                CircleAvatar(
                  radius: 18,
                  backgroundColor: const Color(0xFFF0F0F5),
                  backgroundImage:
                      state.profileImageUrl != null &&
                          state.profileImageUrl!.isNotEmpty
                      ? NetworkImage(state.profileImageUrl!)
                      : null,
                  child:
                      state.profileImageUrl == null ||
                          state.profileImageUrl!.isEmpty
                      ? const Icon(Icons.person, color: Colors.grey, size: 18)
                      : null,
                ),
                const SizedBox(width: 10),
                Expanded(
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      Text(
                        today,
                        style: const TextStyle(
                          color: Colors.grey,
                          fontSize: 10,
                          fontWeight: FontWeight.w600,
                        ),
                      ),
                      Text(
                        '$greeting, ${state.userName.split(' ').first}! 👋',
                        style: const TextStyle(
                          color: Color(0xFF1A1A2E),
                          fontSize: 15,
                          fontWeight: FontWeight.bold,
                        ),
                        maxLines: 1,
                        overflow: TextOverflow.ellipsis,
                      ),
                    ],
                  ),
                ),
              ],
            ),
            actions: [
              Container(
                margin: const EdgeInsets.only(right: 4),
                padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 4),
                decoration: BoxDecoration(
                  color: const Color(0xFF1A3A8F).withOpacity(0.08),
                  borderRadius: BorderRadius.circular(10),
                ),
                child: Row(
                  children: [
                    const Icon(
                      Icons.toll_rounded,
                      color: Color(0xFF1A3A8F),
                      size: 14,
                    ),
                    const SizedBox(width: 4),
                    Text(
                      '${state.tokenBalance}',
                      style: const TextStyle(
                        color: Color(0xFF1A3A8F),
                        fontWeight: FontWeight.bold,
                        fontSize: 12,
                      ),
                    ),
                  ],
                ),
              ),
              IconButton(
                icon: const Icon(
                  Icons.notifications_none_outlined,
                  color: Color(0xFF1A1A2E),
                  size: 22,
                ),
                onPressed: () => Navigator.push(
                  context,
                  MaterialPageRoute(
                    builder: (_) => const NotificationsScreen(),
                  ),
                ),
              ),
            ],
          ),

          SliverToBoxAdapter(
            child: Padding(
              padding: const EdgeInsets.fromLTRB(20, 8, 20, 24),
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  _buildHeroCard(context, state),
                  const SizedBox(height: 20),
                  _buildSectionLabel('Your Stats'),
                  const SizedBox(height: 10),
                  _buildStatsRow(state),
                  const SizedBox(height: 20),
                  if (state.activePlanName != null) ...[
                    _buildSectionLabel('Active Plan'),
                    const SizedBox(height: 10),
                    _buildActivePlanBanner(context, state),
                    const SizedBox(height: 20),
                  ],
                  _buildSectionLabel('Quick Actions'),
                  const SizedBox(height: 10),
                  _buildQuickActions(context),
                ],
              ),
            ),
          ),
        ],
      ),
    );
  }

  // ── Hero Card ──
  Widget _buildHeroCard(BuildContext context, HomeLoaded state) {
    return Container(
      width: double.infinity,
      padding: const EdgeInsets.all(16),
      decoration: BoxDecoration(
        color: const Color(0xFF1A3A8F),
        borderRadius: BorderRadius.circular(16),
        boxShadow: [
          BoxShadow(
            color: const Color(0xFF1A3A8F).withOpacity(0.15),
            blurRadius: 10,
            offset: const Offset(0, 4),
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
                padding: const EdgeInsets.symmetric(horizontal: 6, vertical: 3),
                decoration: BoxDecoration(
                  color: Colors.white.withOpacity(0.15),
                  borderRadius: BorderRadius.circular(6),
                ),
                child: const Text(
                  "TODAY'S GOAL",
                  style: TextStyle(
                    color: Colors.white,
                    fontSize: 9,
                    fontWeight: FontWeight.bold,
                    letterSpacing: 1,
                  ),
                ),
              ),
              Icon(
                Icons.stars_rounded,
                color: Colors.white.withOpacity(0.5),
                size: 18,
              ),
            ],
          ),
          const SizedBox(height: 10),
          Text(
            state.activePlanName ?? "Start Your Journey",
            style: const TextStyle(
              color: Colors.white,
              fontSize: 18,
              fontWeight: FontWeight.bold,
            ),
          ),
          const SizedBox(height: 12),
          Row(
            mainAxisAlignment: MainAxisAlignment.spaceBetween,
            children: [
              if (state.currentStreak > 0)
                Row(
                  children: [
                    const Icon(
                      Icons.bolt_rounded,
                      color: Colors.orangeAccent,
                      size: 16,
                    ),
                    const SizedBox(width: 4),
                    Text(
                      '${state.currentStreak} day streak',
                      style: const TextStyle(
                        color: Colors.white,
                        fontSize: 11,
                        fontWeight: FontWeight.w500,
                      ),
                    ),
                  ],
                )
              else
                const SizedBox.shrink(),
              ElevatedButton(
                onPressed: () => Navigator.push(
                  context,
                  MaterialPageRoute(builder: (_) => const PlanScreen()),
                ),
                style: ElevatedButton.styleFrom(
                  backgroundColor: Colors.white,
                  foregroundColor: const Color(0xFF1A3A8F),
                  padding: const EdgeInsets.symmetric(
                    horizontal: 12,
                    vertical: 6,
                  ),
                  shape: RoundedRectangleBorder(
                    borderRadius: BorderRadius.circular(8),
                  ),
                  minimumSize: Size.zero,
                  tapTargetSize: MaterialTapTargetSize.shrinkWrap,
                  elevation: 0,
                ),
                child: const Text(
                  'View Plan',
                  style: TextStyle(fontWeight: FontWeight.bold, fontSize: 11),
                ),
              ),
            ],
          ),
        ],
      ),
    );
  }

  // ── Stats Row ──
  Widget _buildStatsRow(HomeLoaded state) {
    return Row(
      children: [
        Expanded(
          child: _statCard(
            Icons.local_fire_department_rounded,
            Colors.deepOrange,
            '${state.totalCaloriesBurned}',
            'kcal',
            'Burned',
          ),
        ),
        const SizedBox(width: 8),
        Expanded(
          child: _statCard(
            Icons.calendar_today_rounded,
            const Color(0xFF1A3A8F),
            '${state.workoutsThisWeek}',
            'days',
            'Week',
          ),
        ),
        const SizedBox(width: 8),
        Expanded(
          child: _statCard(
            Icons.bolt_rounded,
            Colors.amber.shade700,
            '${state.currentStreak}',
            'days',
            'Streak',
          ),
        ),
      ],
    );
  }

  Widget _statCard(
    IconData icon,
    Color iconColor,
    String value,
    String unit,
    String label,
  ) {
    return Container(
      padding: const EdgeInsets.all(10),
      decoration: BoxDecoration(
        color: Colors.white.withOpacity(0.9),
        borderRadius: BorderRadius.circular(14),
        boxShadow: [
          BoxShadow(
            color: Colors.grey.withOpacity(0.06),
            blurRadius: 8,
            offset: const Offset(0, 2),
          ),
        ],
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Icon(icon, color: iconColor, size: 14),
          const SizedBox(height: 6),
          Text(
            label,
            style: const TextStyle(
              color: Colors.grey,
              fontSize: 9,
              fontWeight: FontWeight.w600,
            ),
          ),
          const SizedBox(height: 2),
          Row(
            crossAxisAlignment: CrossAxisAlignment.baseline,
            textBaseline: TextBaseline.alphabetic,
            children: [
              Text(
                value,
                style: const TextStyle(
                  fontSize: 16,
                  fontWeight: FontWeight.bold,
                  color: Color(0xFF1A1A2E),
                ),
              ),
              const SizedBox(width: 2),
              Text(
                unit,
                style: const TextStyle(color: Colors.grey, fontSize: 9),
              ),
            ],
          ),
        ],
      ),
    );
  }

  // ── Active Plan Banner ──
  Widget _buildActivePlanBanner(BuildContext context, HomeLoaded state) {
    return GestureDetector(
      onTap: () => Navigator.push(
        context,
        MaterialPageRoute(builder: (_) => const PlanScreen()),
      ),
      child: Container(
        padding: const EdgeInsets.all(12),
        decoration: BoxDecoration(
          color: Colors.white.withOpacity(0.9),
          borderRadius: BorderRadius.circular(14),
          boxShadow: [
            BoxShadow(
              color: Colors.grey.withOpacity(0.06),
              blurRadius: 8,
              offset: const Offset(0, 2),
            ),
          ],
        ),
        child: Row(
          children: [
            Container(
              padding: const EdgeInsets.all(8),
              decoration: BoxDecoration(
                color: const Color(0xFF1A3A8F).withOpacity(0.06),
                borderRadius: BorderRadius.circular(10),
              ),
              child: const Icon(
                Icons.fitness_center_rounded,
                color: Color(0xFF1A3A8F),
                size: 20,
              ),
            ),
            const SizedBox(width: 12),
            Expanded(
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Text(
                    state.activePlanName!,
                    style: const TextStyle(
                      fontWeight: FontWeight.bold,
                      fontSize: 13,
                      color: Color(0xFF1A1A2E),
                    ),
                    maxLines: 1,
                    overflow: TextOverflow.ellipsis,
                  ),
                  const SizedBox(height: 2),
                  if (state.activePlanDays != null)
                    Text(
                      '${state.activePlanDays} days/week',
                      style: const TextStyle(color: Colors.grey, fontSize: 11),
                    ),
                ],
              ),
            ),
            const Icon(
              Icons.chevron_right_rounded,
              color: Colors.grey,
              size: 18,
            ),
          ],
        ),
      ),
    );
  }

  // ── Quick Actions ──
  Widget _buildQuickActions(BuildContext context) {
    final actions = [
      _QuickActionData(
        icon: Icons.event_available_rounded,
        label: 'Book',
        color: const Color(0xFF1A1A2E),
        onTap: () => Navigator.push(
          context,
          MaterialPageRoute(builder: (_) => const BookingsScreen()),
        ),
      ),
      _QuickActionData(
        icon: Icons.fitness_center_rounded,
        label: 'Workout',
        color: const Color(0xFF1A3A8F),
        onTap: () => Navigator.push(
          context,
          MaterialPageRoute(builder: (_) => const PlanScreen()),
        ),
      ),
      _QuickActionData(
        icon: Icons.restaurant_rounded,
        label: 'Nutrition',
        color: const Color(0xFF1B6B3A),
        onTap: () => Navigator.push(
          context,
          MaterialPageRoute(builder: (_) => const PlanScreen()),
        ),
      ),
    ];

    return Row(
      children: actions.map((action) {
        return Expanded(
          child: Padding(
            padding: const EdgeInsets.symmetric(horizontal: 4),
            child: GestureDetector(
              onTap: action.onTap,
              child: Container(
                padding: const EdgeInsets.symmetric(
                  vertical: 12,
                  horizontal: 6,
                ),
                decoration: BoxDecoration(
                  color: action.color,
                  borderRadius: BorderRadius.circular(14),
                  boxShadow: [
                    BoxShadow(
                      color: action.color.withOpacity(0.2),
                      blurRadius: 8,
                      offset: const Offset(0, 3),
                    ),
                  ],
                ),
                child: Column(
                  mainAxisSize: MainAxisSize.min,
                  children: [
                    Container(
                      padding: const EdgeInsets.all(6),
                      decoration: BoxDecoration(
                        color: Colors.white.withOpacity(0.15),
                        borderRadius: BorderRadius.circular(8),
                      ),
                      child: Icon(action.icon, color: Colors.white, size: 18),
                    ),
                    const SizedBox(height: 8),
                    Text(
                      action.label,
                      style: const TextStyle(
                        color: Colors.white,
                        fontWeight: FontWeight.bold,
                        fontSize: 10,
                        letterSpacing: 0.5,
                      ),
                    ),
                  ],
                ),
              ),
            ),
          ),
        );
      }).toList(),
    );
  }

  Widget _buildSectionLabel(String text) => Text(
    text,
    style: const TextStyle(
      fontSize: 15,
      fontWeight: FontWeight.bold,
      color: Color(0xFF1A1A2E),
    ),
  );

  Widget _buildError(BuildContext context, String message) {
    return Center(
      child: Padding(
        padding: const EdgeInsets.all(24),
        child: Column(
          mainAxisAlignment: MainAxisAlignment.center,
          children: [
            const Icon(Icons.wifi_off_rounded, size: 64, color: Colors.grey),
            const SizedBox(height: 16),
            Text(
              message,
              textAlign: TextAlign.center,
              style: const TextStyle(color: Colors.grey, fontSize: 14),
            ),
            const SizedBox(height: 24),
            ElevatedButton(
              onPressed: () => context.read<HomeCubit>().fetchHomeData(),
              style: ElevatedButton.styleFrom(
                backgroundColor: const Color(0xFF1A3A8F),
                shape: RoundedRectangleBorder(
                  borderRadius: BorderRadius.circular(12),
                ),
              ),
              child: const Text(
                'Try Again',
                style: TextStyle(color: Colors.white),
              ),
            ),
          ],
        ),
      ),
    );
  }

  String _getGreeting() {
    final h = DateTime.now().hour;
    if (h < 12) return 'Good Morning';
    if (h < 17) return 'Good Afternoon';
    return 'Good Evening';
  }
}

class _QuickActionData {
  final IconData icon;
  final String label;
  final Color color;
  final VoidCallback onTap;
  const _QuickActionData({
    required this.icon,
    required this.label,
    required this.color,
    required this.onTap,
  });
}
