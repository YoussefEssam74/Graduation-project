import 'package:flutter/material.dart';
import 'package:one/core/api/cache_helper.dart';
import 'package:one/features/splash/ui/splash_screen.dart';

import 'core/api/api_client.dart';

import 'features/auth/ui/login_screen.dart';

void main() async {
  WidgetsFlutterBinding.ensureInitialized();

  await CacheHelper.init();
  ApiClient.init();

  Widget startWidget;
  String? token = CacheHelper.getData(key: 'token');

  // شيلنا الشرط مؤقتاً وخليناه يفتح اللوجين دايماً
  startWidget = const LoginScreen();

  // if (token != null) {
  //   startWidget = const MainLayoutScreen(); // لو فيه توكن ادخل على الجيم
  // } else {
  //   startWidget = LoginScreen(); // لو مفيش ارجع للوجين
  // }

  runApp(FitAiApp(startWidget: startWidget));
}

class FitAiApp extends StatelessWidget {
  final Widget startWidget;

  const FitAiApp({super.key, required this.startWidget});

  @override
  Widget build(BuildContext context) {
    return MaterialApp(
      title: 'FitAI',
      debugShowCheckedModeBanner: false,
      theme: ThemeData(
        primarySwatch: Colors.blue,
        scaffoldBackgroundColor: Colors.grey[50],
      ),
      // home: startWidget,
      home: SplashScreen(),
    );
  }
}
