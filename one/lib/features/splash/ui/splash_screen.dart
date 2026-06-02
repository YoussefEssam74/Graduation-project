import 'package:flutter/material.dart';
import 'package:flutter/services.dart';
import 'package:one/core/api/cache_helper.dart';
import '../../auth/ui/login_screen.dart';
import '../../main_layout/ui/main_layout_screen.dart';

class SplashScreen extends StatefulWidget {
  const SplashScreen({super.key});

  @override
  State<SplashScreen> createState() => _SplashScreenState();
}

class _SplashScreenState extends State<SplashScreen>
    with TickerProviderStateMixin {
  // Logo animation
  late AnimationController _logoCtrl;
  late Animation<double> _logoScale;
  late Animation<double> _logoFade;

  // Text animation
  late AnimationController _textCtrl;
  late Animation<double> _textFade;
  late Animation<Offset> _textSlide;

  // Tagline animation
  late AnimationController _tagCtrl;
  late Animation<double> _tagFade;

  // Progress bar animation
  late AnimationController _progressCtrl;
  late Animation<double> _progressAnim;

  // Particles
  late AnimationController _particleCtrl;

  @override
  void initState() {
    super.initState();

    SystemChrome.setSystemUIOverlayStyle(
      const SystemUiOverlayStyle(
        statusBarColor: Colors.transparent,
        statusBarIconBrightness: Brightness.light,
      ),
    );

    // Logo
    _logoCtrl = AnimationController(
      vsync: this,
      duration: const Duration(milliseconds: 900),
    );
    _logoScale = Tween<double>(
      begin: 0.3,
      end: 1.0,
    ).animate(CurvedAnimation(parent: _logoCtrl, curve: Curves.elasticOut));
    _logoFade = Tween<double>(begin: 0.0, end: 1.0).animate(
      CurvedAnimation(
        parent: _logoCtrl,
        curve: const Interval(0.0, 0.5, curve: Curves.easeIn),
      ),
    );

    // Text
    _textCtrl = AnimationController(
      vsync: this,
      duration: const Duration(milliseconds: 700),
    );
    _textFade = Tween<double>(
      begin: 0.0,
      end: 1.0,
    ).animate(CurvedAnimation(parent: _textCtrl, curve: Curves.easeOut));
    _textSlide = Tween<Offset>(
      begin: const Offset(0, 0.4),
      end: Offset.zero,
    ).animate(CurvedAnimation(parent: _textCtrl, curve: Curves.easeOut));

    // Tagline
    _tagCtrl = AnimationController(
      vsync: this,
      duration: const Duration(milliseconds: 600),
    );
    _tagFade = Tween<double>(
      begin: 0.0,
      end: 1.0,
    ).animate(CurvedAnimation(parent: _tagCtrl, curve: Curves.easeOut));

    // Progress bar
    _progressCtrl = AnimationController(
      vsync: this,
      duration: const Duration(milliseconds: 2200),
    );
    _progressAnim = Tween<double>(
      begin: 0.0,
      end: 1.0,
    ).animate(CurvedAnimation(parent: _progressCtrl, curve: Curves.easeInOut));

    // Particles
    _particleCtrl = AnimationController(
      vsync: this,
      duration: const Duration(seconds: 3),
    )..repeat();

    _startAnimations();
  }

  Future<void> _startAnimations() async {
    await Future.delayed(const Duration(milliseconds: 200));
    _logoCtrl.forward();

    await Future.delayed(const Duration(milliseconds: 600));
    _textCtrl.forward();

    await Future.delayed(const Duration(milliseconds: 300));
    _tagCtrl.forward();
    _progressCtrl.forward();

    // Navigate after loading
    await Future.delayed(const Duration(milliseconds: 2800));
    _navigate();
  }

  void _navigate() {
    if (!mounted) return;
    final token = CacheHelper.getData(key: 'token');
    final userId = CacheHelper.getData(key: 'userId');

    Navigator.pushReplacement(
      context,
      PageRouteBuilder(
        pageBuilder: (_, __, ___) => (token != null && userId != null)
            ? const MainLayoutScreen()
            : const LoginScreen(),
        transitionDuration: const Duration(milliseconds: 600),
        transitionsBuilder: (_, anim, __, child) {
          return FadeTransition(
            opacity: CurvedAnimation(parent: anim, curve: Curves.easeOut),
            child: child,
          );
        },
      ),
    );
  }

  @override
  void dispose() {
    _logoCtrl.dispose();
    _textCtrl.dispose();
    _tagCtrl.dispose();
    _progressCtrl.dispose();
    _particleCtrl.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    final size = MediaQuery.of(context).size;

    return Scaffold(
      body: Container(
        width: double.infinity,
        height: double.infinity,
        decoration: const BoxDecoration(
          gradient: LinearGradient(
            begin: Alignment.topLeft,
            end: Alignment.bottomRight,
            colors: [Color(0xFF0A1628), Color(0xFF1A3A8F), Color(0xFF0D47A1)],
            stops: [0.0, 0.5, 1.0],
          ),
        ),
        child: Stack(
          children: [
            // ── Animated background circles ──────
            AnimatedBuilder(
              animation: _particleCtrl,
              builder: (_, __) {
                return Stack(
                  children: [
                    Positioned(
                      right: -60,
                      top: -60,
                      child: Opacity(
                        opacity: 0.07,
                        child: Container(
                          width: 300,
                          height: 300,
                          decoration: const BoxDecoration(
                            shape: BoxShape.circle,
                            color: Colors.white,
                          ),
                        ),
                      ),
                    ),
                    Positioned(
                      left: -40,
                      bottom: size.height * 0.15,
                      child: Opacity(
                        opacity: 0.05,
                        child: Container(
                          width: 200,
                          height: 200,
                          decoration: const BoxDecoration(
                            shape: BoxShape.circle,
                            color: Colors.white,
                          ),
                        ),
                      ),
                    ),
                    ..._buildFloatingDots(size),
                  ],
                );
              },
            ),

            // ── Grid pattern overlay ──────────────
            Positioned.fill(
              child: Opacity(
                opacity: 0.03,
                child: CustomPaint(painter: _GridPainter()),
              ),
            ),

            // ── Main content ──────────────────────
            SafeArea(
              child: Column(
                children: [
                  Expanded(
                    child: Column(
                      mainAxisAlignment: MainAxisAlignment.center,
                      children: [
                        AnimatedBuilder(
                          animation: _logoCtrl,
                          builder: (_, __) => FadeTransition(
                            opacity: _logoFade,
                            child: ScaleTransition(
                              scale: _logoScale,
                              child: _buildLogo(),
                            ),
                          ),
                        ),
                        const SizedBox(height: 32),
                        AnimatedBuilder(
                          animation: _textCtrl,
                          builder: (_, __) => FadeTransition(
                            opacity: _textFade,
                            child: SlideTransition(
                              position: _textSlide,
                              child: _buildAppName(),
                            ),
                          ),
                        ),
                        const SizedBox(height: 12),
                        AnimatedBuilder(
                          animation: _tagCtrl,
                          builder: (_, __) => FadeTransition(
                            opacity: _tagFade,
                            child: _buildTagline(),
                          ),
                        ),
                      ],
                    ),
                  ),

                  // ── Progress & version at bottom ──
                  Padding(
                    padding: const EdgeInsets.fromLTRB(40, 0, 40, 40),
                    child: Column(
                      children: [
                        AnimatedBuilder(
                          animation: _tagCtrl,
                          builder: (_, __) => FadeTransition(
                            opacity: _tagFade,
                            child: _buildFeatureBadges(),
                          ),
                        ),
                        const SizedBox(height: 28),

                        AnimatedBuilder(
                          animation: _progressCtrl,
                          builder: (_, __) {
                            return Column(
                              children: [
                                ClipRRect(
                                  borderRadius: BorderRadius.circular(10),
                                  child: LinearProgressIndicator(
                                    value: _progressAnim.value,
                                    backgroundColor: Colors.white.withOpacity(
                                      0.1,
                                    ),
                                    valueColor:
                                        const AlwaysStoppedAnimation<Color>(
                                          Colors.white,
                                        ),
                                    minHeight: 3,
                                  ),
                                ),
                                const SizedBox(height: 12),
                                Text(
                                  _loadingText(_progressAnim.value),
                                  style: TextStyle(
                                    color: Colors.white.withOpacity(0.5),
                                    fontSize: 11,
                                    letterSpacing: 0.5,
                                  ),
                                ),
                              ],
                            );
                          },
                        ),
                        const SizedBox(height: 20),

                        Text(
                          'IntelliFit v1.0.0',
                          style: TextStyle(
                            color: Colors.white.withOpacity(0.25),
                            fontSize: 10,
                            letterSpacing: 1,
                          ),
                        ),
                      ],
                    ),
                  ),
                ],
              ),
            ),
          ],
        ),
      ),
    );
  }

  Widget _buildLogo() {
    return Container(
      width: 100,
      height: 100,
      decoration: BoxDecoration(
        shape: BoxShape.circle,
        gradient: const LinearGradient(
          colors: [Color(0xFF4A90E2), Color(0xFF1A3A8F)],
          begin: Alignment.topLeft,
          end: Alignment.bottomRight,
        ),
        boxShadow: [
          BoxShadow(
            color: const Color(0xFF1A3A8F).withOpacity(0.6),
            blurRadius: 30,
            spreadRadius: 5,
          ),
        ],
        border: Border.all(color: Colors.white.withOpacity(0.2), width: 2),
      ),
      child: const Center(
        child: Icon(
          Icons.fitness_center_rounded,
          color: Colors.white,
          size: 44,
        ),
      ),
    );
  }

  Widget _buildAppName() {
    return ShaderMask(
      shaderCallback: (bounds) => const LinearGradient(
        colors: [Colors.white, Color(0xFFB3C8F0)],
      ).createShader(bounds),
      child: const Text(
        'PulsGym',
        style: TextStyle(
          color: Colors.white,
          fontSize: 40,
          fontWeight: FontWeight.bold,
          letterSpacing: 1,
        ),
      ),
    );
  }

  Widget _buildTagline() {
    return Row(
      mainAxisAlignment: MainAxisAlignment.center,
      children: [
        Container(width: 30, height: 1, color: Colors.white.withOpacity(0.3)),
        const SizedBox(width: 12),
        Text(
          'YOUR AI FITNESS COMPANION',
          style: TextStyle(
            color: Colors.white.withOpacity(0.6),
            fontSize: 11,
            letterSpacing: 2.5,
            fontWeight: FontWeight.w500,
          ),
        ),
        const SizedBox(width: 12),
        Container(width: 30, height: 1, color: Colors.white.withOpacity(0.3)),
      ],
    );
  }

  Widget _buildFeatureBadges() {
    final features = [
      (Icons.smart_toy_rounded, 'AI Coach'),
      (Icons.fitness_center_rounded, 'Workouts'),
      (Icons.restaurant_rounded, 'Nutrition'),
    ];

    return Wrap(
      alignment: WrapAlignment.center,
      spacing: 12,
      runSpacing: 10,
      children: features.map((f) {
        return Container(
          padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 7),
          decoration: BoxDecoration(
            color: Colors.white.withOpacity(0.07),
            borderRadius: BorderRadius.circular(20),
            border: Border.all(color: Colors.white.withOpacity(0.12)),
          ),
          child: Row(
            mainAxisSize: MainAxisSize.min,
            children: [
              Icon(f.$1, color: Colors.white70, size: 13),
              const SizedBox(width: 5),
              Text(
                f.$2,
                style: const TextStyle(
                  color: Colors.white70,
                  fontSize: 11,
                  fontWeight: FontWeight.w500,
                ),
              ),
            ],
          ),
        );
      }).toList(),
    );
  }

  List<Widget> _buildFloatingDots(Size size) {
    final dots = [
      _DotData(
        left: 30,
        top: size.height * 0.2,
        size: 4,
        opacity: 0.3,
        delay: 0.0,
      ),
      _DotData(
        right: 50,
        top: size.height * 0.35,
        size: 6,
        opacity: 0.2,
        delay: 0.3,
      ),
      _DotData(
        left: 80,
        bottom: size.height * 0.35,
        size: 3,
        opacity: 0.25,
        delay: 0.6,
      ),
      _DotData(
        right: 30,
        bottom: size.height * 0.25,
        size: 5,
        opacity: 0.2,
        delay: 0.9,
      ),
    ];

    return dots.map((d) {
      final progress = (_particleCtrl.value + d.delay) % 1.0;
      final yOffset = (progress * 20) - 10;
      return Positioned(
        left: d.left,
        right: d.right,
        top: d.top != null ? d.top! + yOffset : null,
        bottom: d.bottom != null ? d.bottom! - yOffset : null,
        child: Opacity(
          opacity: d.opacity,
          child: Container(
            width: d.size,
            height: d.size,
            decoration: const BoxDecoration(
              color: Colors.white,
              shape: BoxShape.circle,
            ),
          ),
        ),
      );
    }).toList();
  }

  String _loadingText(double progress) {
    if (progress < 0.3) return 'Initializing...';
    if (progress < 0.6) return 'Loading your data...';
    if (progress < 0.85) return 'Almost ready...';
    return 'Welcome back!';
  }
}

class _GridPainter extends CustomPainter {
  @override
  void paint(Canvas canvas, Size size) {
    final paint = Paint()
      ..color = Colors.white.withOpacity(0.2)
      ..strokeWidth = 0.5;
    const step = 40.0;
    for (double x = 0; x < size.width; x += step) {
      canvas.drawLine(Offset(x, 0), Offset(x, size.height), paint);
    }
    for (double y = 0; y < size.height; y += step) {
      canvas.drawLine(Offset(0, y), Offset(size.width, y), paint);
    }
  }

  @override
  bool shouldRepaint(_) => false;
}

class _DotData {
  final double? left, right, top, bottom;
  final double size, opacity, delay;
  const _DotData({
    this.left,
    this.right,
    this.top,
    this.bottom,
    required this.size,
    required this.opacity,
    required this.delay,
  });
}

//=========================================================================================//

// import 'package:flutter/material.dart';
// import 'package:flutter/services.dart';
// // تم إزالة استدعاء الـ CacheHelper والـ MainLayout لأننا لن نحتاجهما هنا الآن
// import '../../auth/ui/login_screen.dart';

// class SplashScreen extends StatefulWidget {
//   const SplashScreen({super.key});

//   @override
//   State<SplashScreen> createState() => _SplashScreenState();
// }

// class _SplashScreenState extends State<SplashScreen>
//     with TickerProviderStateMixin {
//   // Logo animation
//   late AnimationController _logoCtrl;
//   late Animation<double> _logoScale;
//   late Animation<double> _logoFade;

//   // Text animation
//   late AnimationController _textCtrl;
//   late Animation<double> _textFade;
//   late Animation<Offset> _textSlide;

//   // Tagline animation
//   late AnimationController _tagCtrl;
//   late Animation<double> _tagFade;

//   // Progress bar animation
//   late AnimationController _progressCtrl;
//   late Animation<double> _progressAnim;

//   // Particles
//   late AnimationController _particleCtrl;

//   @override
//   void initState() {
//     super.initState();

//     SystemChrome.setSystemUIOverlayStyle(
//       const SystemUiOverlayStyle(
//         statusBarColor: Colors.transparent,
//         statusBarIconBrightness: Brightness.light,
//       ),
//     );

//     // Logo
//     _logoCtrl = AnimationController(
//       vsync: this,
//       duration: const Duration(milliseconds: 900),
//     );
//     _logoScale = Tween<double>(
//       begin: 0.3,
//       end: 1.0,
//     ).animate(CurvedAnimation(parent: _logoCtrl, curve: Curves.elasticOut));
//     _logoFade = Tween<double>(begin: 0.0, end: 1.0).animate(
//       CurvedAnimation(
//         parent: _logoCtrl,
//         curve: const Interval(0.0, 0.5, curve: Curves.easeIn),
//       ),
//     );

//     // Text
//     _textCtrl = AnimationController(
//       vsync: this,
//       duration: const Duration(milliseconds: 700),
//     );
//     _textFade = Tween<double>(
//       begin: 0.0,
//       end: 1.0,
//     ).animate(CurvedAnimation(parent: _textCtrl, curve: Curves.easeOut));
//     _textSlide = Tween<Offset>(
//       begin: const Offset(0, 0.4),
//       end: Offset.zero,
//     ).animate(CurvedAnimation(parent: _textCtrl, curve: Curves.easeOut));

//     // Tagline
//     _tagCtrl = AnimationController(
//       vsync: this,
//       duration: const Duration(milliseconds: 600),
//     );
//     _tagFade = Tween<double>(
//       begin: 0.0,
//       end: 1.0,
//     ).animate(CurvedAnimation(parent: _tagCtrl, curve: Curves.easeOut));

//     // Progress bar
//     _progressCtrl = AnimationController(
//       vsync: this,
//       duration: const Duration(milliseconds: 2200),
//     );
//     _progressAnim = Tween<double>(
//       begin: 0.0,
//       end: 1.0,
//     ).animate(CurvedAnimation(parent: _progressCtrl, curve: Curves.easeInOut));

//     // Particles
//     _particleCtrl = AnimationController(
//       vsync: this,
//       duration: const Duration(seconds: 3),
//     )..repeat();

//     _startAnimations();
//   }

//   Future<void> _startAnimations() async {
//     await Future.delayed(const Duration(milliseconds: 200));
//     _logoCtrl.forward();

//     await Future.delayed(const Duration(milliseconds: 600));
//     _textCtrl.forward();

//     await Future.delayed(const Duration(milliseconds: 300));
//     _tagCtrl.forward();
//     _progressCtrl.forward();

//     // ننتظر انتهاء التحميل ثم ننتقل
//     await Future.delayed(const Duration(milliseconds: 2800));
//     _navigate();
//   }

//   void _navigate() {
//     if (!mounted) return;

//     // تم التعديل هنا لفتح صفحة LoginScreen مباشرة دائماً
//     Navigator.pushReplacement(
//       context,
//       PageRouteBuilder(
//         pageBuilder: (_, __, ___) => const LoginScreen(),
//         transitionDuration: const Duration(milliseconds: 600),
//         transitionsBuilder: (_, anim, __, child) {
//           return FadeTransition(
//             opacity: CurvedAnimation(parent: anim, curve: Curves.easeOut),
//             child: child,
//           );
//         },
//       ),
//     );
//   }

//   @override
//   void dispose() {
//     _logoCtrl.dispose();
//     _textCtrl.dispose();
//     _tagCtrl.dispose();
//     _progressCtrl.dispose();
//     _particleCtrl.dispose();
//     super.dispose();
//   }

//   @override
//   Widget build(BuildContext context) {
//     final size = MediaQuery.of(context).size;

//     return Scaffold(
//       body: Container(
//         width: double.infinity,
//         height: double.infinity,
//         decoration: const BoxDecoration(
//           gradient: LinearGradient(
//             begin: Alignment.topLeft,
//             end: Alignment.bottomRight,
//             colors: [Color(0xFF0A1628), Color(0xFF1A3A8F), Color(0xFF0D47A1)],
//           ),
//         ),
//         child: Stack(
//           children: [
//             // Background Animations...
//             Positioned.fill(
//               child: Opacity(
//                 opacity: 0.03,
//                 child: CustomPaint(painter: _GridPainter()),
//               ),
//             ),

//             SafeArea(
//               child: Column(
//                 children: [
//                   Expanded(
//                     child: Column(
//                       mainAxisAlignment: MainAxisAlignment.center,
//                       children: [
//                         ScaleTransition(
//                           scale: _logoScale,
//                           child: FadeTransition(
//                             opacity: _logoFade,
//                             child: _buildLogo(),
//                           ),
//                         ),
//                         const SizedBox(height: 32),
//                         SlideTransition(
//                           position: _textSlide,
//                           child: FadeTransition(
//                             opacity: _textFade,
//                             child: _buildAppName(),
//                           ),
//                         ),
//                         const SizedBox(height: 12),
//                         FadeTransition(
//                           opacity: _tagFade,
//                           child: _buildTagline(),
//                         ),
//                       ],
//                     ),
//                   ),

//                   Padding(
//                     padding: const EdgeInsets.fromLTRB(40, 0, 40, 40),
//                     child: Column(
//                       children: [
//                         _buildFeatureBadges(), // التي قمنا بتعديلها لـ Wrap سابقاً
//                         const SizedBox(height: 28),
//                         AnimatedBuilder(
//                           animation: _progressCtrl,
//                           builder: (_, __) {
//                             return Column(
//                               children: [
//                                 ClipRRect(
//                                   borderRadius: BorderRadius.circular(10),
//                                   child: LinearProgressIndicator(
//                                     value: _progressAnim.value,
//                                     backgroundColor: Colors.white.withOpacity(
//                                       0.1,
//                                     ),
//                                     valueColor:
//                                         const AlwaysStoppedAnimation<Color>(
//                                           Colors.white,
//                                         ),
//                                     minHeight: 3,
//                                   ),
//                                 ),
//                                 const SizedBox(height: 12),
//                                 Text(
//                                   _loadingText(_progressAnim.value),
//                                   style: TextStyle(
//                                     color: Colors.white.withOpacity(0.5),
//                                     fontSize: 11,
//                                   ),
//                                 ),
//                               ],
//                             );
//                           },
//                         ),
//                       ],
//                     ),
//                   ),
//                 ],
//               ),
//             ),
//           ],
//         ),
//       ),
//     );
//   }

//   // --- Widgets Help ---

//   Widget _buildLogo() {
//     return Container(
//       width: 100,
//       height: 100,
//       decoration: BoxDecoration(
//         shape: BoxShape.circle,
//         gradient: const LinearGradient(
//           colors: [Color(0xFF4A90E2), Color(0xFF1A3A8F)],
//         ),
//         boxShadow: [
//           BoxShadow(
//             color: const Color(0xFF1A3A8F).withOpacity(0.6),
//             blurRadius: 30,
//           ),
//         ],
//       ),
//       child: const Icon(
//         Icons.fitness_center_rounded,
//         color: Colors.white,
//         size: 44,
//       ),
//     );
//   }

//   Widget _buildAppName() {
//     return const Text(
//       'PulsGym',
//       style: TextStyle(
//         color: Colors.white,
//         fontSize: 40,
//         fontWeight: FontWeight.bold,
//       ),
//     );
//   }

//   Widget _buildTagline() {
//     return Text(
//       'YOUR AI FITNESS COMPANION',
//       style: TextStyle(
//         color: Colors.white.withOpacity(0.6),
//         fontSize: 11,
//         letterSpacing: 2.5,
//       ),
//     );
//   }

//   Widget _buildFeatureBadges() {
//     final features = [
//       (Icons.smart_toy_rounded, 'AI Coach'),
//       (Icons.fitness_center_rounded, 'Workouts'),
//       (Icons.restaurant_rounded, 'Nutrition'),
//     ];

//     return Wrap(
//       alignment: WrapAlignment.center,
//       spacing: 12,
//       runSpacing: 10,
//       children: features
//           .map(
//             (f) => Container(
//               padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 7),
//               decoration: BoxDecoration(
//                 color: Colors.white.withOpacity(0.07),
//                 borderRadius: BorderRadius.circular(20),
//                 border: Border.all(color: Colors.white.withOpacity(0.12)),
//               ),
//               child: Row(
//                 mainAxisSize: MainAxisSize.min,
//                 children: [
//                   Icon(f.$1, color: Colors.white70, size: 13),
//                   const SizedBox(width: 5),
//                   Text(
//                     f.$2,
//                     style: const TextStyle(color: Colors.white70, fontSize: 11),
//                   ),
//                 ],
//               ),
//             ),
//           )
//           .toList(),
//     );
//   }

//   String _loadingText(double progress) {
//     if (progress < 0.5) return 'Loading...';
//     return 'Ready to Start!';
//   }
// }

// class _GridPainter extends CustomPainter {
//   @override
//   void paint(Canvas canvas, Size size) {
//     final paint = Paint()
//       ..color = Colors.white.withOpacity(0.05)
//       ..strokeWidth = 0.5;
//     for (double x = 0; x < size.width; x += 40) {
//       canvas.drawLine(Offset(x, 0), Offset(x, size.height), paint);
//     }
//     for (double y = 0; y < size.height; y += 40) {
//       canvas.drawLine(Offset(0, y), Offset(size.width, y), paint);
//     }
//   }

//   @override
//   bool shouldRepaint(_) => false;
// }
