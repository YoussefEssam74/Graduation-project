// lib/core/widgets/gym_background.dart
//
// Widget مشترك يُستخدم في كل الشاشات لإعطائها
// نفس خلفية الجيم الشفافة الموجودة في Login / Register

import 'package:flutter/material.dart';

// ─────────────────────────────────────────────────────────────────
// 1. خلفية الجيم المتحركة (صور Unsplash مع Fade Transition)
// ─────────────────────────────────────────────────────────────────
class GymBackground extends StatefulWidget {
  const GymBackground({super.key});

  @override
  State<GymBackground> createState() => _GymBackgroundState();
}

class _GymBackgroundState extends State<GymBackground>
    with SingleTickerProviderStateMixin {
  late final AnimationController _animCtrl;
  int _currentIndex = 0;

  static const List<String> _gymImages = [
    'https://images.unsplash.com/photo-1534438327276-14e5300c3a48?q=90&w=800&auto=format&fit=crop',
    'https://images.unsplash.com/photo-1517836357463-d25dfeac3438?q=90&w=800&auto=format&fit=crop',
    'https://images.unsplash.com/photo-1558611848-73f7eb4001a1?q=90&w=800&auto=format&fit=crop',
    'https://images.unsplash.com/photo-1571902943202-507ec2618e8f?q=90&w=800&auto=format&fit=crop',
  ];

  @override
  void initState() {
    super.initState();
    _animCtrl = AnimationController(
      vsync: this,
      duration: const Duration(seconds: 2),
    )..forward();

    // تبديل الصورة كل 6 ثواني
    Future.doWhile(() async {
      await Future.delayed(const Duration(seconds: 6));
      if (!mounted) return false;
      _animCtrl.reset();
      setState(() {
        _currentIndex = (_currentIndex + 1) % _gymImages.length;
      });
      _animCtrl.forward();
      return true;
    });
  }

  @override
  void dispose() {
    _animCtrl.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    return AnimatedSwitcher(
      duration: const Duration(seconds: 2),
      child: Image.network(
        _gymImages[_currentIndex],
        key: ValueKey(_currentIndex),
        fit: BoxFit.cover,
        width: double.infinity,
        height: double.infinity,
        errorBuilder: (_, __, ___) => Container(
          color: const Color(0xFF0D47A1),
          child: const Center(
            child:
                Icon(Icons.fitness_center, color: Colors.white24, size: 80),
          ),
        ),
      ),
    );
  }
}

// ─────────────────────────────────────────────────────────────────
// 2. طبقة التعتيم (Overlay) — يمكن تخصيصها لكل صفحة
// ─────────────────────────────────────────────────────────────────
class GymOverlay extends StatelessWidget {
  /// [opacity] — شدة التعتيم: 0.0 = شفاف تماماً، 1.0 = معتم تماماً
  final double opacity;
  const GymOverlay({super.key, this.opacity = 0.72});

  @override
  Widget build(BuildContext context) {
    return Container(
      decoration: BoxDecoration(
        gradient: LinearGradient(
          begin: Alignment.topCenter,
          end: Alignment.bottomCenter,
          colors: [
            Colors.black.withValues(alpha: opacity * 0.5),
            Colors.black.withValues(alpha: opacity * 0.85),
            const Color(0xFF0D1B2A).withValues(alpha: opacity),
          ],
          stops: const [0.0, 0.55, 1.0],
        ),
      ),
    );
  }
}

// ─────────────────────────────────────────────────────────────────
// 3. GymScaffold — Scaffold جاهز بخلفية الجيم
//    استخدامه: GymScaffold(body: YourContent())
// ─────────────────────────────────────────────────────────────────
class GymScaffold extends StatelessWidget {
  final Widget body;
  final PreferredSizeWidget? appBar;
  final Widget? bottomNavigationBar;
  final Widget? floatingActionButton;
  final Widget? drawer;

  /// شدة التعتيم — الشاشات الداخلية تحتاج تعتيم أخف (0.55)
  final double overlayOpacity;

  const GymScaffold({
    super.key,
    required this.body,
    this.appBar,
    this.bottomNavigationBar,
    this.floatingActionButton,
    this.drawer,
    this.overlayOpacity = 0.65,
  });

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: Colors.black,
      appBar: appBar,
      bottomNavigationBar: bottomNavigationBar,
      floatingActionButton: floatingActionButton,
      drawer: drawer,
      body: Stack(
        fit: StackFit.expand,
        children: [
          // خلفية الجيم المتحركة
          const GymBackground(),
          // طبقة التعتيم
          GymOverlay(opacity: overlayOpacity),
          // المحتوى
          body,
        ],
      ),
    );
  }
}
