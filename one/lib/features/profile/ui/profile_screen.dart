import 'package:flutter/material.dart';
import 'package:flutter_bloc/flutter_bloc.dart';

import 'package:one/core/api/cache_helper.dart';
import 'package:one/features/profile/ui/subscription_screen.dart';
import '../cubit/profile_cubit.dart';
import '../cubit/profile_state.dart';
import '../models/profile_models.dart';

import '../../achievements/ui/achievements_screen.dart';
import '../../notifications/ui/notifications_screen.dart';
import '../../auth/ui/login_screen.dart';
import 'personal_data_screen.dart';

class ProfileScreen extends StatelessWidget {
  const ProfileScreen({super.key});

  @override
  Widget build(BuildContext context) {
    return BlocProvider(
      create: (_) => ProfileCubit()..fetchUserProfile(),
      child: const _ProfileView(),
    );
  }
}

class _ProfileView extends StatelessWidget {
  const _ProfileView();

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: Colors.white,
      body: Stack(
        children: [
          // 1. خلفية الصورة من الإنترنت
          Positioned.fill(
            child: Image.network(
              'https://images.unsplash.com/photo-1534438327276-14e5300c3a48?q=80&w=2070&auto=format&fit=crop',
              fit: BoxFit.cover,
            ),
          ),

          // 2. طبقة تعتيم بيضاء (Overlay)
          Positioned.fill(
            child: Container(color: Colors.white.withOpacity(0.92)),
          ),

          // 3. المحتوى الرئيسي
          BlocBuilder<ProfileCubit, ProfileState>(
            builder: (context, state) {
              if (state is ProfileLoading || state is ProfileInitial) {
                return const Center(
                  child: CircularProgressIndicator(color: Color(0xFF1A3A8F)),
                );
              }
              if (state is ProfileLoaded) {
                return _buildContent(context, state);
              }
              if (state is ProfileError) {
                return Center(child: Text(state.message));
              }
              return const Center(
                child: CircularProgressIndicator(color: Color(0xFF1A3A8F)),
              );
            },
          ),
        ],
      ),
    );
  }

  Widget _buildContent(BuildContext context, ProfileLoaded state) {
    return RefreshIndicator(
      color: const Color(0xFF1A3A8F),
      onRefresh: () => context.read<ProfileCubit>().fetchUserProfile(),
      child: CustomScrollView(
        slivers: [
          // ── AppBar ثابت (Pinned) ──
          SliverAppBar(
            backgroundColor: Colors.white.withOpacity(
              0.8,
            ), // جعل الخلفية أكثر وضوحاً قليلاً بما أنه ثابت
            elevation: 0,
            pinned: true, // يجعله ثابتاً في الأعلى
            floating: false, // لا يختفي
            snap: false,
            automaticallyImplyLeading: false,
            surfaceTintColor: Colors.transparent,
            title: Row(
              children: [
                CircleAvatar(
                  radius: 15,
                  backgroundColor: Colors.grey.shade200,
                  backgroundImage: state.user.profileImageUrl != null
                      ? NetworkImage(state.user.profileImageUrl!)
                      : null,
                  child: state.user.profileImageUrl == null
                      ? const Icon(Icons.person, size: 15, color: Colors.grey)
                      : null,
                ),
                const SizedBox(width: 8),
                const Text(
                  'Profile',
                  style: TextStyle(
                    color: Color(0xFF1A1A2E),
                    fontSize: 16,
                    fontWeight: FontWeight.bold,
                  ),
                ),
              ],
            ),
            actions: [
              IconButton(
                icon: const Icon(
                  Icons.settings_outlined,
                  color: Color(0xFF1A3A8F),
                  size: 20,
                ),
                onPressed: () => Navigator.push(
                  context,
                  MaterialPageRoute(
                    builder: (_) => BlocProvider.value(
                      value: context.read<ProfileCubit>(),
                      child: PersonalDataScreen(user: state.user),
                    ),
                  ),
                ),
              ),
            ],
          ),

          SliverToBoxAdapter(
            child: Column(
              children: [
                _buildHeroCard(context, state),
                const SizedBox(height: 12),
                _buildStatsRow(context, state),
                const SizedBox(height: 16),
                _sectionLabel('ACCOUNT'),
                const SizedBox(height: 8),
                _buildAccountCard(context, state),
                const SizedBox(height: 16),

                Padding(
                  padding: const EdgeInsets.symmetric(horizontal: 16),
                  child: Row(
                    mainAxisAlignment: MainAxisAlignment.spaceBetween,
                    children: [
                      const Text(
                        'Recent Activity',
                        style: TextStyle(
                          fontSize: 14,
                          fontWeight: FontWeight.bold,
                          color: Color(0xFF1A1A2E),
                        ),
                      ),
                      GestureDetector(
                        onTap: () {},
                        child: const Text(
                          'VIEW ALL',
                          style: TextStyle(
                            color: Color(0xFF1A3A8F),
                            fontSize: 10,
                            fontWeight: FontWeight.bold,
                            letterSpacing: 0.5,
                          ),
                        ),
                      ),
                    ],
                  ),
                ),
                const SizedBox(height: 8),
                _buildActivityList(context, state),
                const SizedBox(height: 16),
                _buildHelpCard(context),
                const SizedBox(height: 16),
                _buildSignOut(context),
                const SizedBox(height: 8),
                const Text(
                  'APP VERSION 1.0.0',
                  style: TextStyle(
                    color: Colors.grey,
                    fontSize: 9,
                    letterSpacing: 0.5,
                  ),
                ),
                const SizedBox(height: 24),
              ],
            ),
          ),
        ],
      ),
    );
  }

  // ── Hero Card ──
  Widget _buildHeroCard(BuildContext context, ProfileLoaded state) {
    return Container(
      margin: const EdgeInsets.fromLTRB(16, 4, 16, 0),
      decoration: BoxDecoration(
        color: Colors.white.withOpacity(0.9),
        borderRadius: BorderRadius.circular(16),
        boxShadow: [
          BoxShadow(
            color: Colors.grey.withOpacity(0.05),
            blurRadius: 8,
            offset: const Offset(0, 2),
          ),
        ],
      ),
      child: Column(
        children: [
          Container(
            height: 60, // تقليل الارتفاع
            decoration: BoxDecoration(
              borderRadius: const BorderRadius.vertical(
                top: Radius.circular(16),
              ),
              gradient: LinearGradient(
                colors: [
                  const Color(0xFF1A3A8F).withOpacity(0.12),
                  const Color(0xFF1A3A8F).withOpacity(0.04),
                ],
              ),
            ),
          ),
          Transform.translate(
            offset: const Offset(0, -25),
            child: Column(
              children: [
                Stack(
                  alignment: Alignment.bottomRight,
                  children: [
                    Container(
                      padding: const EdgeInsets.all(2),
                      decoration: BoxDecoration(
                        shape: BoxShape.circle,
                        border: Border.all(
                          color: const Color(0xFF1A3A8F),
                          width: 1.5,
                        ),
                        color: Colors.white,
                      ),
                      child: CircleAvatar(
                        radius: 34,
                        backgroundColor: Colors.grey.shade200,
                        backgroundImage: state.user.profileImageUrl != null
                            ? NetworkImage(state.user.profileImageUrl!)
                            : null,
                        child: state.user.profileImageUrl == null
                            ? const Icon(
                                Icons.person,
                                size: 34,
                                color: Colors.grey,
                              )
                            : null,
                      ),
                    ),
                    const Icon(
                      Icons.verified,
                      color: Color(0xFF1A3A8F),
                      size: 16,
                    ),
                  ],
                ),
                const SizedBox(height: 6),
                Text(
                  state.user.name,
                  style: const TextStyle(
                    fontSize: 17,
                    fontWeight: FontWeight.bold,
                    color: Color(0xFF1A1A2E),
                  ),
                ),
                Text(
                  'MEMBER ID: #${state.user.userId}',
                  style: const TextStyle(
                    color: Colors.grey,
                    fontSize: 9,
                    fontWeight: FontWeight.w600,
                  ),
                ),
                const SizedBox(height: 12),
                Padding(
                  padding: const EdgeInsets.symmetric(horizontal: 24),
                  child: Row(
                    children: [
                      Expanded(
                        child: _heroStat(
                          '${state.user.tokenBalance}',
                          'TOKENS',
                        ),
                      ),
                      Container(
                        width: 1,
                        height: 25,
                        color: Colors.grey.shade200,
                      ),
                      Expanded(
                        child: _heroStat(state.user.levelDisplay, 'STATUS'),
                      ),
                    ],
                  ),
                ),
              ],
            ),
          ),
        ],
      ),
    );
  }

  Widget _heroStat(String value, String label) {
    return Column(
      children: [
        Text(
          value,
          style: const TextStyle(
            fontSize: 18,
            fontWeight: FontWeight.bold,
            color: Color(0xFF1A3A8F),
          ),
        ),
        Text(
          label,
          style: const TextStyle(
            color: Colors.grey,
            fontSize: 8,
            fontWeight: FontWeight.w600,
          ),
        ),
      ],
    );
  }

  Widget _buildStatsRow(BuildContext context, ProfileLoaded state) {
    return Padding(
      padding: const EdgeInsets.symmetric(horizontal: 16),
      child: Row(
        children: [
          Expanded(
            child: _statCard(
              Icons.directions_run_rounded,
              Colors.orange,
              'MONTHLY',
              '${state.totalDistanceKm.toStringAsFixed(1)} km',
              'Distance',
            ),
          ),
          const SizedBox(width: 8),
          Expanded(
            child: _statCard(
              Icons.bedtime_outlined,
              Colors.purple,
              'AVERAGE',
              '7h 20m',
              'Sleep',
            ),
          ),
        ],
      ),
    );
  }

  Widget _statCard(
    IconData icon,
    Color color,
    String topLabel,
    String value,
    String bottomLabel,
  ) {
    return Container(
      padding: const EdgeInsets.all(10),
      decoration: BoxDecoration(
        color: Colors.white.withOpacity(0.9),
        borderRadius: BorderRadius.circular(12),
        boxShadow: [
          BoxShadow(
            color: Colors.grey.withOpacity(0.04),
            blurRadius: 6,
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
              Icon(icon, color: color, size: 16),
              Text(
                topLabel,
                style: const TextStyle(
                  color: Colors.grey,
                  fontSize: 8,
                  fontWeight: FontWeight.w600,
                ),
              ),
            ],
          ),
          const SizedBox(height: 6),
          Text(
            value,
            style: const TextStyle(
              fontSize: 15,
              fontWeight: FontWeight.bold,
              color: Color(0xFF1A1A2E),
            ),
          ),
          Text(
            bottomLabel,
            style: const TextStyle(color: Colors.grey, fontSize: 9),
          ),
        ],
      ),
    );
  }

  Widget _buildAccountCard(BuildContext context, ProfileLoaded state) {
    return Container(
      margin: const EdgeInsets.symmetric(horizontal: 16),
      decoration: BoxDecoration(
        color: Colors.white.withOpacity(0.95),
        borderRadius: BorderRadius.circular(14),
        boxShadow: [
          BoxShadow(
            color: Colors.grey.withOpacity(0.04),
            blurRadius: 6,
            offset: const Offset(0, 1),
          ),
        ],
      ),
      child: Column(
        children: [
          _menuItem(
            icon: Icons.person_outline_rounded,
            iconBg: const Color(0xFFE8EEF9),
            iconColor: const Color(0xFF1A3A8F),
            label: 'Personal Information',
            onTap: () => Navigator.push(
              context,
              MaterialPageRoute(
                builder: (_) => BlocProvider.value(
                  value: context.read<ProfileCubit>(),
                  child: PersonalDataScreen(user: state.user),
                ),
              ),
            ),
          ),
          _divider(),
          _menuItem(
            icon: Icons.toll_rounded,
            iconBg: const Color(0xFFFFF3E8),
            iconColor: Colors.orange,
            label: 'Tokens & Billing',
            onTap: () => Navigator.push(
              context,
              MaterialPageRoute(builder: (_) => const SubscriptionScreen()),
            ),
          ),
          _divider(),
          _menuItem(
            icon: Icons.emoji_events_rounded,
            iconBg: const Color(0xFFFFF8E1),
            iconColor: Colors.amber,
            label: 'Achievements',
            onTap: () => Navigator.push(
              context,
              MaterialPageRoute(builder: (_) => const AchievementsScreen()),
            ),
          ),
          _divider(),
          _menuItem(
            icon: Icons.notifications_none_rounded,
            iconBg: const Color(0xFFEDE8F9),
            iconColor: Colors.purple,
            label: 'Notifications',
            onTap: () => Navigator.push(
              context,
              MaterialPageRoute(builder: (_) => const NotificationsScreen()),
            ),
          ),
        ],
      ),
    );
  }

  Widget _menuItem({
    required IconData icon,
    required Color iconBg,
    required Color iconColor,
    required String label,
    required VoidCallback onTap,
  }) {
    return GestureDetector(
      onTap: onTap,
      child: Padding(
        padding: const EdgeInsets.symmetric(
          horizontal: 12,
          vertical: 10,
        ), // تقليل المسافات
        child: Row(
          children: [
            Container(
              width: 30,
              height: 30,
              decoration: BoxDecoration(
                color: iconBg,
                borderRadius: BorderRadius.circular(8),
              ),
              child: Icon(icon, color: iconColor, size: 16),
            ), // تصغير الأيقونة لـ 16
            const SizedBox(width: 10),
            Expanded(
              child: Text(
                label,
                style: const TextStyle(
                  fontWeight: FontWeight.w600,
                  fontSize: 12,
                  color: Color(0xFF1A1A2E),
                ),
              ),
            ),
            Icon(Icons.chevron_right, color: Colors.grey.shade400, size: 14),
          ],
        ),
      ),
    );
  }

  Widget _divider() => Divider(
    height: 1,
    indent: 50,
    endIndent: 16,
    color: Colors.grey.shade100,
  );

  Widget _buildActivityList(BuildContext context, ProfileLoaded state) {
    if (state.recentActivity.isEmpty) return const SizedBox.shrink();
    return Column(
      children: state.recentActivity
          .take(2)
          .map((a) => _activityTile(a))
          .toList(),
    );
  }

  Widget _activityTile(RecentActivityModel a) {
    return Container(
      margin: const EdgeInsets.fromLTRB(16, 0, 16, 6),
      padding: const EdgeInsets.all(10),
      decoration: BoxDecoration(
        color: Colors.white.withOpacity(0.95),
        borderRadius: BorderRadius.circular(12),
        boxShadow: [
          BoxShadow(
            color: Colors.grey.withOpacity(0.04),
            blurRadius: 4,
            offset: const Offset(0, 1),
          ),
        ],
      ),
      child: Row(
        children: [
          ClipRRect(
            borderRadius: BorderRadius.circular(8),
            child: Container(
              width: 36,
              height: 36,
              color: const Color(0xFF1A3A8F).withOpacity(0.08),
              child: const Icon(
                Icons.fitness_center_rounded,
                color: Color(0xFF1A3A8F),
                size: 18,
              ),
            ),
          ), // تصغير الأيقونة لـ 18
          const SizedBox(width: 10),
          Expanded(
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Text(
                  a.title,
                  style: const TextStyle(
                    fontWeight: FontWeight.bold,
                    fontSize: 12,
                    color: Color(0xFF1A1A2E),
                  ),
                ),
                Text(
                  '${a.durationMinutes} mins · ${a.caloriesBurned} kcal',
                  style: const TextStyle(color: Colors.grey, fontSize: 9),
                ),
              ],
            ),
          ),
        ],
      ),
    );
  }

  Widget _buildHelpCard(BuildContext context) {
    return Container(
      margin: const EdgeInsets.symmetric(horizontal: 16),
      padding: const EdgeInsets.all(12),
      decoration: BoxDecoration(
        color: const Color(0xFFF0F4FF).withOpacity(0.8),
        borderRadius: BorderRadius.circular(12),
      ),
      child: Row(
        children: [
          Expanded(
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: const [
                Text(
                  'Need Help?',
                  style: TextStyle(
                    fontWeight: FontWeight.bold,
                    fontSize: 12,
                    color: Color(0xFF1A1A2E),
                  ),
                ),
                Text(
                  '24/7 coaching support.',
                  style: TextStyle(color: Colors.grey, fontSize: 10),
                ),
              ],
            ),
          ),
          ElevatedButton(
            onPressed: () {},
            style: ElevatedButton.styleFrom(
              backgroundColor: Colors.white,
              foregroundColor: const Color(0xFF1A1A2E),
              elevation: 0,
              padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 4),
              minimumSize: Size.zero,
              shape: RoundedRectangleBorder(
                borderRadius: BorderRadius.circular(6),
              ),
            ),
            child: const Text(
              'CONTACT',
              style: TextStyle(fontWeight: FontWeight.bold, fontSize: 9),
            ),
          ),
        ],
      ),
    );
  }

  Widget _buildSignOut(BuildContext context) {
    return GestureDetector(
      onTap: () => _confirmSignOut(context),
      child: Row(
        mainAxisAlignment: MainAxisAlignment.center,
        children: const [
          Icon(Icons.logout_rounded, color: Colors.redAccent, size: 14),
          SizedBox(width: 4),
          Text(
            'Sign Out',
            style: TextStyle(
              color: Colors.redAccent,
              fontWeight: FontWeight.bold,
              fontSize: 13,
            ),
          ),
        ],
      ),
    );
  }

  Widget _sectionLabel(String text) => Padding(
    padding: const EdgeInsets.symmetric(horizontal: 20),
    child: Align(
      alignment: Alignment.centerLeft,
      child: Text(
        text,
        style: TextStyle(
          color: Colors.grey.shade500,
          fontSize: 9,
          fontWeight: FontWeight.w700,
          letterSpacing: 0.8,
        ),
      ),
    ),
  );

  void _confirmSignOut(BuildContext context) {
    showDialog(
      context: context,
      builder: (_) => AlertDialog(
        shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(16)),
        title: const Text(
          'Sign Out',
          style: TextStyle(fontWeight: FontWeight.bold, fontSize: 15),
        ),
        content: const Text('Are you sure?', style: TextStyle(fontSize: 13)),
        actions: [
          TextButton(
            onPressed: () => Navigator.pop(context),
            child: const Text('Cancel'),
          ),
          ElevatedButton(
            onPressed: () async {
              await CacheHelper.removeData(key: 'token');
              await CacheHelper.removeData(key: 'userId');
              Navigator.pushAndRemoveUntil(
                context,
                MaterialPageRoute(builder: (_) => const LoginScreen()),
                (r) => false,
              );
            },
            style: ElevatedButton.styleFrom(backgroundColor: Colors.redAccent),
            child: const Text(
              'Sign Out',
              style: TextStyle(color: Colors.white),
            ),
          ),
        ],
      ),
    );
  }
}
