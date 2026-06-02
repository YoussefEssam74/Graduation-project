import 'package:flutter/material.dart';
import 'package:flutter/services.dart';
import '../../home/ui/home_screen.dart';
import '../../plan/ui/plan_screen.dart';
import '../../ai_coach/ui/ai_coach_screen.dart';
import '../../summary/ui/summary_screen.dart';
import '../../bookings/ui/bookings_screen.dart';
import '../../profile/ui/profile_screen.dart';

class MainLayoutScreen extends StatefulWidget {
  const MainLayoutScreen({super.key});

  @override
  State<MainLayoutScreen> createState() => _MainLayoutScreenState();
}

class _MainLayoutScreenState extends State<MainLayoutScreen>
    with TickerProviderStateMixin {
  int _currentIndex = 0;

  final List<Widget> _screens = const [
    HomeScreen(),
    PlanScreen(),
    AiCoachScreen(),
    SummaryScreen(),
    BookingsScreen(),
    ProfileScreen(),
  ];

  static const _items = [
    _NavItem(Icons.home_filled, Icons.home_filled, 'Home'),
    _NavItem(
      Icons.calendar_month_outlined,
      Icons.calendar_month_outlined,
      'Plan',
    ),
    _NavItem(Icons.smart_toy_outlined, Icons.smart_toy_outlined, 'AI Coach'),
    _NavItem(Icons.bar_chart_outlined, Icons.bar_chart_outlined, 'Summary'),
    _NavItem(
      Icons.check_circle_outline_rounded,
      Icons.check_circle_outline_rounded,
      'Bookings',
    ),
    _NavItem(
      Icons.person_outline_rounded,
      Icons.person_outline_rounded,
      'Profile',
    ),
  ];

  void _onTap(int index) {
    if (index == _currentIndex) return;
    HapticFeedback.lightImpact();
    setState(() => _currentIndex = index);
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      // تم تغييرها لـ false لضمان أن الصفحات تنتهي قبل الـ Bar ولا تختفي تحته
      extendBody: false,
      backgroundColor: const Color(
        0xFFF8F9FA,
      ), // لون خلفية هادئ ومناسب للتصميم الشيك
      body: IndexedStack(index: _currentIndex, children: _screens),
      // نضع الـ Bar داخل Padding ليظل محتفظاً بشكله العائم
      bottomNavigationBar: Padding(
        padding: const EdgeInsets.only(bottom: 20, left: 20, right: 20),
        child: _buildNavBar(),
      ),
    );
  }

  Widget _buildNavBar() {
    return Container(
      decoration: BoxDecoration(
        color: Colors.white,
        borderRadius: BorderRadius.circular(30),
        boxShadow: [
          BoxShadow(
            color: Colors.black.withOpacity(0.08),
            blurRadius: 20,
            offset: const Offset(0, 10),
          ),
        ],
      ),
      child: SafeArea(
        child: SizedBox(
          height: 65,
          child: Row(
            mainAxisAlignment: MainAxisAlignment.spaceAround,
            children: List.generate(_items.length, (i) {
              return Expanded(child: _buildSimpleNavItem(i));
            }),
          ),
        ),
      ),
    );
  }

  Widget _buildSimpleNavItem(int index) {
    final isSelected = _currentIndex == index;
    final item = _items[index];

    return GestureDetector(
      behavior: HitTestBehavior.opaque,
      onTap: () => _onTap(index),
      child: Column(
        mainAxisSize: MainAxisSize.min,
        mainAxisAlignment: MainAxisAlignment.center,
        children: [
          Icon(
            isSelected ? item.activeIcon : item.icon,
            color: isSelected ? const Color(0xFF1A3A8F) : Colors.grey.shade400,
            size: isSelected ? 24 : 22,
          ),
          const SizedBox(height: 4),
          Text(
            item.label,
            style: TextStyle(
              color: isSelected
                  ? const Color(0xFF1A3A8F)
                  : Colors.grey.shade400,
              fontSize: 10,
              fontWeight: isSelected ? FontWeight.bold : FontWeight.w500,
            ),
            maxLines: 1,
          ),
          const SizedBox(height: 2),
          // النقطة المؤشرة
          AnimatedContainer(
            duration: const Duration(milliseconds: 250),
            width: isSelected ? 4 : 0,
            height: isSelected ? 4 : 0,
            decoration: const BoxDecoration(
              shape: BoxShape.circle,
              color: Color(0xFF1A3A8F),
            ),
          ),
        ],
      ),
    );
  }
}

class _NavItem {
  final IconData activeIcon;
  final IconData icon;
  final String label;
  const _NavItem(this.activeIcon, this.icon, this.label);
}
