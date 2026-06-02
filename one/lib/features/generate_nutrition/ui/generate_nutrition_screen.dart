import 'package:flutter/material.dart';
import 'package:flutter_bloc/flutter_bloc.dart';
import '../cubit/generate_nutrition_cubit.dart';
import '../cubit/generate_nutrition_state.dart';

class GenerateNutritionScreen extends StatefulWidget {
  const GenerateNutritionScreen({super.key});
  @override
  State<GenerateNutritionScreen> createState() =>
      _GenerateNutritionScreenState();
}

class _GenerateNutritionScreenState extends State<GenerateNutritionScreen>
    with TickerProviderStateMixin {
  int _step = 0;

  // Step 1
  String _goal = 'Weight Loss';
  String _activityLevel = 'Moderately Active';

  // Step 2
  String _dietType = 'Omnivore';
  final Set<String> _restrictions = {};

  // Step 3
  final _nameCtrl = TextEditingController();
  bool _manualCalories = false;
  bool _manualMacros = false;
  double _calories = 2000;
  int _protein = 150;
  int _carbs = 200;
  int _fat = 67;

  late AnimationController _stepAnim;
  late Animation<double> _fadeAnim;

  static const _goals = [
    ('🔥', 'Weight Loss', 'Caloric deficit to shed body fat'),
    ('💪', 'Muscle Gain', 'Fuel hypertrophy with protein surplus'),
    ('⚖️', 'Maintain Weight', 'Stay balanced at your current weight'),
    ('🔄', 'Recomposition', 'Lose fat and gain muscle simultaneously'),
  ];

  static const _activityLevels = [
    ('🪑', 'Sedentary', 'Little or no exercise'),
    ('🚶', 'Lightly Active', 'Light exercise 1–3×/week'),
    ('🏃', 'Moderately Active', 'Moderate exercise 3–5×/week'),
    ('⚡', 'Very Active', 'Hard exercise 6–7×/week'),
    ('🔥', 'Extremely Active', 'Very hard daily exercise + physical job'),
  ];

  static const _dietTypes = [
    ('🍽️', 'Omnivore', 'Eats all foods'),
    ('🥦', 'Vegetarian', 'No meat or fish'),
    ('🌱', 'Vegan', 'No animal products'),
    ('🥑', 'Keto', 'Very low carb, high fat'),
    ('🥩', 'Paleo', 'Whole foods, no grains'),
    ('🫒', 'Mediterranean', 'Olive oil, fish, veggies'),
  ];

  static const _restrictionsList = [
    'Gluten-Free',
    'Dairy-Free',
    'Nut-Free',
    'Shellfish-Free',
    'Egg-Free',
    'Soy-Free',
    'Low-Sodium',
    'Halal',
    'Kosher',
  ];

  @override
  void initState() {
    super.initState();
    _stepAnim = AnimationController(
      vsync: this,
      duration: const Duration(milliseconds: 350),
    );
    _fadeAnim = CurvedAnimation(parent: _stepAnim, curve: Curves.easeOut);
    _stepAnim.forward();
    _updateMacros();
    _nameCtrl.text = 'My ${_goal} Plan';
  }

  @override
  void dispose() {
    _stepAnim.dispose();
    _nameCtrl.dispose();
    super.dispose();
  }

  void _updateMacros() {
    if (_manualMacros) return;
    // Auto-calculate based on goal & calories
    final cal = _calories.toInt();
    switch (_goal) {
      case 'Weight Loss':
        _protein = ((cal * 0.35) / 4).round();
        _carbs = ((cal * 0.35) / 4).round();
        _fat = ((cal * 0.30) / 9).round();
        break;
      case 'Muscle Gain':
        _protein = ((cal * 0.35) / 4).round();
        _carbs = ((cal * 0.45) / 4).round();
        _fat = ((cal * 0.20) / 9).round();
        break;
      case 'Recomposition':
        _protein = ((cal * 0.40) / 4).round();
        _carbs = ((cal * 0.30) / 4).round();
        _fat = ((cal * 0.30) / 9).round();
        break;
      default:
        _protein = ((cal * 0.30) / 4).round();
        _carbs = ((cal * 0.40) / 4).round();
        _fat = ((cal * 0.30) / 9).round();
    }
  }

  void _updateCaloriesForGoal() {
    if (_manualCalories) return;
    switch (_activityLevel) {
      case 'Sedentary':
        _calories = _goal == 'Weight Loss' ? 1600 : 2000;
        break;
      case 'Lightly Active':
        _calories = _goal == 'Weight Loss' ? 1800 : 2300;
        break;
      case 'Moderately Active':
        _calories = _goal == 'Weight Loss' ? 2000 : 2600;
        break;
      case 'Very Active':
        _calories = _goal == 'Weight Loss' ? 2300 : 3000;
        break;
      case 'Extremely Active':
        _calories = _goal == 'Weight Loss' ? 2600 : 3500;
        break;
    }
    _updateMacros();
  }

  void _nextStep() {
    setState(() {
      _step++;
      if (_step == 2) {
        _updateCaloriesForGoal();
        _nameCtrl.text = 'My $_goal Plan';
      }
    });
    _stepAnim.forward(from: 0);
  }

  void _prevStep() {
    if (_step == 0) {
      Navigator.pop(context);
      return;
    }
    setState(() => _step--);
    _stepAnim.forward(from: 0);
  }

  int get _macroTotal => (_protein * 4) + (_carbs * 4) + (_fat * 9);

  @override
  Widget build(BuildContext context) {
    return BlocProvider(
      create: (_) => GenerateNutritionCubit(),
      child: Builder(
        builder: (ctx) {
          return Scaffold(
            backgroundColor: Colors.grey.shade100,
            body: BlocConsumer<GenerateNutritionCubit, GenerateNutritionState>(
              listener: (context, state) {
                if (state is GenerateNutritionSuccess) {
                  ScaffoldMessenger.of(context).showSnackBar(
                    SnackBar(
                      content: Text(state.message),
                      backgroundColor: Colors.green,
                      behavior: SnackBarBehavior.floating,
                    ),
                  );
                  Navigator.pop(context, true);
                }
                if (state is GenerateNutritionError) {
                  final isToken = state.message.toLowerCase().contains('token');
                  ScaffoldMessenger.of(context).showSnackBar(
                    SnackBar(
                      content: Row(
                        children: [
                          Icon(
                            isToken ? Icons.toll_rounded : Icons.error_outline,
                            color: Colors.white,
                            size: 18,
                          ),
                          const SizedBox(width: 8),
                          Expanded(child: Text(state.message)),
                        ],
                      ),
                      backgroundColor: isToken
                          ? Colors.orange
                          : Colors.redAccent,
                      behavior: SnackBarBehavior.floating,
                      duration: const Duration(seconds: 5),
                    ),
                  );
                }
              },
              builder: (context, state) {
                final loading = state is GenerateNutritionLoading;
                return Column(
                  children: [
                    _buildHeader(),
                    Expanded(
                      child: FadeTransition(
                        opacity: _fadeAnim,
                        child: SingleChildScrollView(
                          padding: const EdgeInsets.all(20),
                          child: _step == 0
                              ? _buildStep1()
                              : _step == 1
                              ? _buildStep2()
                              : _buildStep3(),
                        ),
                      ),
                    ),
                    _buildFooter(context, loading),
                  ],
                );
              },
            ),
          );
        },
      ),
    );
  }

  // ── Header ────────────────────────────────────
  Widget _buildHeader() {
    return Container(
      decoration: const BoxDecoration(
        gradient: LinearGradient(
          colors: [Color(0xFF1B6B3A), Color(0xFF43A047)],
          begin: Alignment.topLeft,
          end: Alignment.bottomRight,
        ),
      ),
      child: SafeArea(
        bottom: false,
        child: Column(
          children: [
            Padding(
              padding: const EdgeInsets.fromLTRB(16, 12, 16, 0),
              child: Row(
                children: [
                  GestureDetector(
                    onTap: _prevStep,
                    child: Container(
                      padding: const EdgeInsets.all(8),
                      decoration: BoxDecoration(
                        color: Colors.white.withOpacity(0.2),
                        borderRadius: BorderRadius.circular(10),
                      ),
                      child: const Icon(
                        Icons.arrow_back_ios_new_rounded,
                        color: Colors.white,
                        size: 16,
                      ),
                    ),
                  ),
                  const SizedBox(width: 12),
                  const Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      Text(
                        'AI Nutrition Planner',
                        style: TextStyle(
                          color: Colors.white,
                          fontWeight: FontWeight.bold,
                          fontSize: 18,
                        ),
                      ),
                      Text(
                        'Personalized macros in 3 steps',
                        style: TextStyle(color: Colors.white70, fontSize: 12),
                      ),
                    ],
                  ),
                ],
              ),
            ),
            const SizedBox(height: 16),
            _buildStepper(),
            const SizedBox(height: 8),
          ],
        ),
      ),
    );
  }

  Widget _buildStepper() {
    final steps = ['Goal & Activity', 'Diet Preferences', 'Calories & Macros'];
    return Padding(
      padding: const EdgeInsets.symmetric(horizontal: 20),
      child: Row(
        children: List.generate(steps.length * 2 - 1, (i) {
          if (i.isOdd) {
            final done = _step > i ~/ 2;
            return Expanded(
              child: Container(
                height: 2,
                color: done ? Colors.white : Colors.white.withOpacity(0.25),
              ),
            );
          }
          final idx = i ~/ 2;
          final done = _step > idx;
          final active = _step == idx;
          return Column(
            children: [
              AnimatedContainer(
                duration: const Duration(milliseconds: 300),
                width: 34,
                height: 34,
                decoration: BoxDecoration(
                  color: done
                      ? Colors.white
                      : active
                      ? Colors.white
                      : Colors.white.withOpacity(0.2),
                  shape: BoxShape.circle,
                  border: Border.all(
                    color: active ? Colors.white : Colors.transparent,
                    width: 2,
                  ),
                ),
                child: Center(
                  child: done
                      ? const Icon(
                          Icons.check_rounded,
                          color: Color(0xFF1B6B3A),
                          size: 16,
                        )
                      : Text(
                          '${idx + 1}',
                          style: TextStyle(
                            color: active
                                ? const Color(0xFF1B6B3A)
                                : Colors.white70,
                            fontWeight: FontWeight.bold,
                            fontSize: 13,
                          ),
                        ),
                ),
              ),
              const SizedBox(height: 4),
              Text(
                steps[idx],
                style: TextStyle(
                  color: active ? Colors.white : Colors.white60,
                  fontSize: 9,
                  fontWeight: active ? FontWeight.bold : FontWeight.normal,
                ),
              ),
            ],
          );
        }),
      ),
    );
  }

  // ── Step 1: Goal & Activity ───────────────────
  Widget _buildStep1() {
    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        const Text(
          "What's your primary goal?",
          style: TextStyle(fontSize: 18, fontWeight: FontWeight.bold),
        ),
        const SizedBox(height: 4),
        Text(
          'This determines your caloric strategy.',
          style: TextStyle(color: Colors.grey.shade500, fontSize: 13),
        ),
        const SizedBox(height: 16),
        GridView.count(
          crossAxisCount: 2,
          shrinkWrap: true,
          physics: const NeverScrollableScrollPhysics(),
          crossAxisSpacing: 10,
          mainAxisSpacing: 10,
          childAspectRatio: 2.0,
          children: _goals.map((g) {
            final isSel = _goal == g.$2;
            return GestureDetector(
              onTap: () {
                setState(() {
                  _goal = g.$2;
                  _updateCaloriesForGoal();
                });
              },
              child: AnimatedContainer(
                duration: const Duration(milliseconds: 200),
                padding: const EdgeInsets.all(12),
                decoration: BoxDecoration(
                  color: isSel
                      ? const Color(0xFF1B6B3A).withOpacity(0.08)
                      : Colors.white,
                  borderRadius: BorderRadius.circular(14),
                  border: Border.all(
                    color: isSel
                        ? const Color(0xFF1B6B3A)
                        : Colors.grey.shade200,
                    width: isSel ? 2 : 1,
                  ),
                  boxShadow: [
                    BoxShadow(
                      color: Colors.grey.withOpacity(0.06),
                      blurRadius: 6,
                      offset: const Offset(0, 2),
                    ),
                  ],
                ),
                child: Row(
                  children: [
                    Text(g.$1, style: const TextStyle(fontSize: 22)),
                    const SizedBox(width: 8),
                    Expanded(
                      child: Column(
                        crossAxisAlignment: CrossAxisAlignment.start,
                        mainAxisAlignment: MainAxisAlignment.center,
                        children: [
                          Text(
                            g.$2,
                            style: TextStyle(
                              fontWeight: FontWeight.bold,
                              fontSize: 10,
                              color: isSel
                                  ? const Color(0xFF1B6B3A)
                                  : Colors.black87,
                            ),
                          ),
                          Text(
                            g.$3,
                            style: TextStyle(
                              fontSize: 10,
                              color: Colors.grey.shade500,
                            ),
                            maxLines: 2,
                            overflow: TextOverflow.ellipsis,
                          ),
                        ],
                      ),
                    ),
                  ],
                ),
              ),
            );
          }).toList(),
        ),
        const SizedBox(height: 24),
        const Text(
          'Activity Level',
          style: TextStyle(fontSize: 16, fontWeight: FontWeight.bold),
        ),
        const SizedBox(height: 4),
        Text(
          'How active are you day-to-day?',
          style: TextStyle(color: Colors.grey.shade500, fontSize: 13),
        ),
        const SizedBox(height: 12),
        ...(_activityLevels.map((a) {
          final isSel = _activityLevel == a.$2;
          return GestureDetector(
            onTap: () {
              setState(() {
                _activityLevel = a.$2;
                _updateCaloriesForGoal();
              });
            },
            child: AnimatedContainer(
              duration: const Duration(milliseconds: 200),
              margin: const EdgeInsets.only(bottom: 8),
              padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 14),
              decoration: BoxDecoration(
                color: isSel
                    ? const Color(0xFF1B6B3A).withOpacity(0.06)
                    : Colors.white,
                borderRadius: BorderRadius.circular(14),
                border: Border.all(
                  color: isSel ? const Color(0xFF1B6B3A) : Colors.grey.shade200,
                  width: isSel ? 2 : 1,
                ),
              ),
              child: Row(
                children: [
                  Text(a.$1, style: const TextStyle(fontSize: 20)),
                  const SizedBox(width: 14),
                  Expanded(
                    child: Column(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: [
                        Text(
                          a.$2,
                          style: TextStyle(
                            fontWeight: FontWeight.bold,
                            fontSize: 14,
                            color: isSel
                                ? const Color(0xFF1B6B3A)
                                : Colors.black87,
                          ),
                        ),
                        Text(
                          a.$3,
                          style: TextStyle(
                            fontSize: 12,
                            color: Colors.grey.shade500,
                          ),
                        ),
                      ],
                    ),
                  ),
                  if (isSel)
                    const Icon(
                      Icons.check_rounded,
                      color: Color(0xFF1B6B3A),
                      size: 20,
                    ),
                ],
              ),
            ),
          );
        }).toList()),
      ],
    );
  }

  // ── Step 2: Diet Preferences ──────────────────
  Widget _buildStep2() {
    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        const Text(
          'Diet Type',
          style: TextStyle(fontSize: 18, fontWeight: FontWeight.bold),
        ),
        const SizedBox(height: 4),
        Text(
          'Choose the style of eating that fits you best.',
          style: TextStyle(color: Colors.grey.shade500, fontSize: 13),
        ),
        const SizedBox(height: 16),
        GridView.count(
          crossAxisCount: 3,
          shrinkWrap: true,
          physics: const NeverScrollableScrollPhysics(),
          crossAxisSpacing: 10,
          mainAxisSpacing: 10,
          childAspectRatio: 1.1,
          children: _dietTypes.map((d) {
            final isSel = _dietType == d.$2;
            return GestureDetector(
              onTap: () => setState(() => _dietType = d.$2),
              child: AnimatedContainer(
                duration: const Duration(milliseconds: 200),
                decoration: BoxDecoration(
                  color: isSel
                      ? const Color(0xFF1B6B3A).withOpacity(0.08)
                      : Colors.white,
                  borderRadius: BorderRadius.circular(14),
                  border: Border.all(
                    color: isSel
                        ? const Color(0xFF1B6B3A)
                        : Colors.grey.shade200,
                    width: isSel ? 2 : 1,
                  ),
                  boxShadow: [
                    BoxShadow(
                      color: Colors.grey.withOpacity(0.06),
                      blurRadius: 6,
                      offset: const Offset(0, 2),
                    ),
                  ],
                ),
                child: Column(
                  mainAxisAlignment: MainAxisAlignment.center,
                  children: [
                    Text(d.$1, style: const TextStyle(fontSize: 26)),
                    const SizedBox(height: 6),
                    Text(
                      d.$2,
                      style: TextStyle(
                        fontWeight: FontWeight.bold,
                        fontSize: 12,
                        color: isSel ? const Color(0xFF1B6B3A) : Colors.black87,
                      ),
                    ),
                    Text(
                      d.$3,
                      style: TextStyle(
                        fontSize: 9,
                        color: Colors.grey.shade500,
                      ),
                      textAlign: TextAlign.center,
                    ),
                  ],
                ),
              ),
            );
          }).toList(),
        ),
        const SizedBox(height: 24),
        Row(
          children: [
            const Text(
              'Dietary Restrictions',
              style: TextStyle(fontSize: 16, fontWeight: FontWeight.bold),
            ),
            const SizedBox(width: 8),
            Container(
              padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 3),
              decoration: BoxDecoration(
                color: Colors.grey.shade200,
                borderRadius: BorderRadius.circular(8),
              ),
              child: const Text(
                'optional',
                style: TextStyle(fontSize: 11, color: Colors.grey),
              ),
            ),
          ],
        ),
        const SizedBox(height: 4),
        Text(
          'Select all that apply.',
          style: TextStyle(color: Colors.grey.shade500, fontSize: 13),
        ),
        const SizedBox(height: 12),
        Wrap(
          spacing: 8,
          runSpacing: 8,
          children: _restrictionsList.map((r) {
            final isSel = _restrictions.contains(r);
            return GestureDetector(
              onTap: () => setState(
                () => isSel ? _restrictions.remove(r) : _restrictions.add(r),
              ),
              child: AnimatedContainer(
                duration: const Duration(milliseconds: 180),
                padding: const EdgeInsets.symmetric(
                  horizontal: 14,
                  vertical: 8,
                ),
                decoration: BoxDecoration(
                  color: isSel
                      ? const Color(0xFF1B6B3A).withOpacity(0.1)
                      : Colors.white,
                  borderRadius: BorderRadius.circular(30),
                  border: Border.all(
                    color: isSel
                        ? const Color(0xFF1B6B3A)
                        : Colors.grey.shade300,
                    width: isSel ? 1.5 : 1,
                  ),
                ),
                child: Text(
                  r,
                  style: TextStyle(
                    fontSize: 13,
                    fontWeight: isSel ? FontWeight.bold : FontWeight.normal,
                    color: isSel ? const Color(0xFF1B6B3A) : Colors.black87,
                  ),
                ),
              ),
            );
          }).toList(),
        ),
      ],
    );
  }

  // ── Step 3: Calories & Macros ─────────────────
  Widget _buildStep3() {
    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        // Plan Name
        RichText(
          text: const TextSpan(
            children: [
              TextSpan(
                text: 'Plan Name ',
                style: TextStyle(
                  fontSize: 15,
                  fontWeight: FontWeight.bold,
                  color: Colors.black87,
                ),
              ),
              TextSpan(
                text: '*',
                style: TextStyle(color: Colors.red, fontSize: 15),
              ),
            ],
          ),
        ),
        const SizedBox(height: 8),
        Container(
          decoration: BoxDecoration(
            color: Colors.white,
            borderRadius: BorderRadius.circular(12),
            border: Border.all(color: Colors.grey.shade200),
          ),
          child: TextField(
            controller: _nameCtrl,
            decoration: const InputDecoration(
              hintText: 'My Weight Loss Plan',
              hintStyle: TextStyle(color: Colors.grey),
              border: InputBorder.none,
              contentPadding: EdgeInsets.symmetric(
                horizontal: 16,
                vertical: 14,
              ),
            ),
          ),
        ),
        const SizedBox(height: 20),

        // Daily Calories
        Container(
          padding: const EdgeInsets.all(16),
          decoration: BoxDecoration(
            color: Colors.white,
            borderRadius: BorderRadius.circular(16),
            boxShadow: [
              BoxShadow(
                color: Colors.grey.withOpacity(0.07),
                blurRadius: 8,
                offset: const Offset(0, 3),
              ),
            ],
          ),
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              Row(
                mainAxisAlignment: MainAxisAlignment.spaceBetween,
                children: [
                  const Text(
                    'Daily Calorie Target',
                    style: TextStyle(fontWeight: FontWeight.bold, fontSize: 15),
                  ),
                  GestureDetector(
                    onTap: () =>
                        setState(() => _manualCalories = !_manualCalories),
                    child: Container(
                      padding: const EdgeInsets.symmetric(
                        horizontal: 10,
                        vertical: 5,
                      ),
                      decoration: BoxDecoration(
                        color: _manualCalories
                            ? const Color(0xFF1B6B3A)
                            : Colors.grey.shade100,
                        borderRadius: BorderRadius.circular(8),
                      ),
                      child: Text(
                        _manualCalories ? 'Auto' : 'Manual',
                        style: TextStyle(
                          fontSize: 11,
                          fontWeight: FontWeight.bold,
                          color: _manualCalories ? Colors.white : Colors.grey,
                        ),
                      ),
                    ),
                  ),
                ],
              ),
              const SizedBox(height: 4),
              Text(
                'Auto-calculated based on your goal & activity',
                style: TextStyle(color: Colors.grey.shade500, fontSize: 11),
              ),
              const SizedBox(height: 16),
              // Calorie display
              Row(
                mainAxisAlignment: MainAxisAlignment.spaceBetween,
                children: [
                  GestureDetector(
                    onTap: () => setState(() {
                      _calories = (_calories - 100).clamp(1200, 5000);
                      _updateMacros();
                    }),
                    child: Container(
                      width: 32,
                      height: 32,
                      decoration: BoxDecoration(
                        color: Colors.grey.shade100,
                        shape: BoxShape.circle,
                      ),
                      child: const Icon(Icons.remove, size: 18),
                    ),
                  ),
                  RichText(
                    text: TextSpan(
                      children: [
                        TextSpan(
                          text: '${_calories.toInt()}',
                          style: const TextStyle(
                            color: Color(0xFF1B6B3A),
                            fontSize: 32,
                            fontWeight: FontWeight.bold,
                          ),
                        ),
                        const TextSpan(
                          text: ' kcal/day',
                          style: TextStyle(color: Colors.grey, fontSize: 14),
                        ),
                      ],
                    ),
                  ),
                  GestureDetector(
                    onTap: () => setState(() {
                      _calories = (_calories + 100).clamp(1200, 5000);
                      _updateMacros();
                    }),
                    child: Container(
                      width: 32,
                      height: 32,
                      decoration: BoxDecoration(
                        color: Colors.grey.shade100,
                        shape: BoxShape.circle,
                      ),
                      child: const Icon(Icons.add, size: 18),
                    ),
                  ),
                ],
              ),
              SliderTheme(
                data: SliderTheme.of(context).copyWith(
                  activeTrackColor: const Color(0xFF1B6B3A),
                  inactiveTrackColor: const Color(0xFF1B6B3A).withOpacity(0.15),
                  thumbColor: const Color(0xFF1B6B3A),
                  overlayColor: const Color(0xFF1B6B3A).withOpacity(0.1),
                  trackHeight: 4,
                  thumbShape: const RoundSliderThumbShape(
                    enabledThumbRadius: 8,
                  ),
                ),
                child: Slider(
                  value: _calories,
                  min: 1200,
                  max: 5000,
                  onChanged: (v) => setState(() {
                    _calories = v;
                    _updateMacros();
                  }),
                ),
              ),
              Row(
                mainAxisAlignment: MainAxisAlignment.spaceBetween,
                children: const [
                  Text(
                    '1,200',
                    style: TextStyle(color: Colors.grey, fontSize: 11),
                  ),
                  Text(
                    '5,000',
                    style: TextStyle(color: Colors.grey, fontSize: 11),
                  ),
                ],
              ),
            ],
          ),
        ),
        const SizedBox(height: 16),

        // Macro Targets
        Container(
          padding: const EdgeInsets.all(16),
          decoration: BoxDecoration(
            color: Colors.white,
            borderRadius: BorderRadius.circular(16),
            boxShadow: [
              BoxShadow(
                color: Colors.grey.withOpacity(0.07),
                blurRadius: 8,
                offset: const Offset(0, 3),
              ),
            ],
          ),
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              Row(
                mainAxisAlignment: MainAxisAlignment.spaceBetween,
                children: [
                  const Text(
                    'Macro Targets',
                    style: TextStyle(fontWeight: FontWeight.bold, fontSize: 15),
                  ),
                  GestureDetector(
                    onTap: () => setState(() => _manualMacros = !_manualMacros),
                    child: Container(
                      padding: const EdgeInsets.symmetric(
                        horizontal: 10,
                        vertical: 5,
                      ),
                      decoration: BoxDecoration(
                        color: _manualMacros
                            ? const Color(0xFF1B6B3A)
                            : Colors.grey.shade100,
                        borderRadius: BorderRadius.circular(8),
                      ),
                      child: Text(
                        _manualMacros ? 'Auto' : 'Manual',
                        style: TextStyle(
                          fontSize: 11,
                          fontWeight: FontWeight.bold,
                          color: _manualMacros ? Colors.white : Colors.grey,
                        ),
                      ),
                    ),
                  ),
                ],
              ),
              const SizedBox(height: 4),
              Text(
                'Protein, carbs and fat targets',
                style: TextStyle(color: Colors.grey.shade500, fontSize: 11),
              ),
              const SizedBox(height: 16),
              Row(
                children: [
                  _macroCol(
                    '${_protein}g',
                    'Protein · ${_protein * 4} kcal',
                    const Color(0xFF1A3A8F),
                  ),
                  _macroCol(
                    '${_carbs}g',
                    'Carbs · ${_carbs * 4} kcal',
                    Colors.orange,
                  ),
                  _macroCol(
                    '${_fat}g',
                    'Fat · ${_fat * 9} kcal',
                    Colors.amber.shade700,
                  ),
                ],
              ),
              const SizedBox(height: 12),
              Row(
                children: [
                  const Icon(
                    Icons.info_outline_rounded,
                    size: 14,
                    color: Colors.grey,
                  ),
                  const SizedBox(width: 6),
                  const Text(
                    'Total from macros',
                    style: TextStyle(color: Colors.grey, fontSize: 12),
                  ),
                  const Spacer(),
                  Text(
                    '$_macroTotal kcal',
                    style: TextStyle(
                      color: _macroTotal.abs() - _calories.toInt().abs() < 50
                          ? const Color(0xFF1B6B3A)
                          : Colors.orange,
                      fontWeight: FontWeight.bold,
                      fontSize: 13,
                    ),
                  ),
                ],
              ),
            ],
          ),
        ),
        const SizedBox(height: 16),

        // Plan Summary
        Container(
          padding: const EdgeInsets.all(16),
          decoration: BoxDecoration(
            color: const Color(0xFF1B6B3A).withOpacity(0.06),
            borderRadius: BorderRadius.circular(16),
            border: Border.all(color: const Color(0xFF1B6B3A).withOpacity(0.2)),
          ),
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              Text(
                'Plan Summary',
                style: TextStyle(
                  color: const Color(0xFF1B6B3A),
                  fontWeight: FontWeight.bold,
                  fontSize: 14,
                ),
              ),
              const SizedBox(height: 10),
              _summaryRow('Goal', _goal),
              _summaryRow('Activity', _activityLevel),
              _summaryRow('Diet', _dietType),
              _summaryRow(
                'Daily Calories',
                '${_calories.toInt()} kcal',
                valueColor: const Color(0xFF1B6B3A),
              ),
              if (_restrictions.isNotEmpty)
                _summaryRow('Restrictions', _restrictions.join(', ')),
            ],
          ),
        ),
      ],
    );
  }

  Widget _macroCol(String value, String label, Color color) {
    return Expanded(
      child: Column(
        children: [
          Text(
            value,
            style: TextStyle(
              color: color,
              fontSize: 22,
              fontWeight: FontWeight.bold,
            ),
          ),
          Text(
            label,
            textAlign: TextAlign.center,
            style: const TextStyle(color: Colors.grey, fontSize: 10),
          ),
          const SizedBox(height: 4),
          ClipRRect(
            borderRadius: BorderRadius.circular(3),
            child: LinearProgressIndicator(
              value: 0.7,
              backgroundColor: color.withOpacity(0.1),
              valueColor: AlwaysStoppedAnimation<Color>(color),
              minHeight: 3,
            ),
          ),
        ],
      ),
    );
  }

  Widget _summaryRow(String label, String value, {Color? valueColor}) {
    return Padding(
      padding: const EdgeInsets.only(bottom: 6),
      child: Row(
        mainAxisAlignment: MainAxisAlignment.spaceBetween,
        children: [
          Text(label, style: const TextStyle(color: Colors.grey, fontSize: 13)),
          Text(
            value,
            style: TextStyle(
              fontWeight: FontWeight.w600,
              fontSize: 13,
              color: valueColor ?? Colors.black87,
            ),
          ),
        ],
      ),
    );
  }

  // ── Footer ────────────────────────────────────
  Widget _buildFooter(BuildContext ctx, bool loading) {
    return Container(
      color: Colors.white,
      padding: EdgeInsets.fromLTRB(
        20,
        12,
        20,
        MediaQuery.of(ctx).padding.bottom + 12,
      ),
      child: Row(
        children: [
          if (_step > 0) ...[
            Expanded(
              flex: 2,
              child: OutlinedButton(
                onPressed: loading ? null : _prevStep,
                style: OutlinedButton.styleFrom(
                  padding: const EdgeInsets.symmetric(vertical: 14),
                  side: BorderSide(color: Colors.grey.shade300),
                  shape: RoundedRectangleBorder(
                    borderRadius: BorderRadius.circular(14),
                  ),
                ),
                child: const Text(
                  'Back',
                  style: TextStyle(
                    color: Colors.black54,
                    fontWeight: FontWeight.w600,
                  ),
                ),
              ),
            ),
            const SizedBox(width: 12),
          ],
          Expanded(
            flex: 4,
            child: loading
                ? Container(
                    padding: const EdgeInsets.symmetric(vertical: 14),
                    decoration: BoxDecoration(
                      color: const Color(0xFF1B6B3A),
                      borderRadius: BorderRadius.circular(14),
                    ),
                    child: const Row(
                      mainAxisAlignment: MainAxisAlignment.center,
                      children: [
                        SizedBox(
                          width: 18,
                          height: 18,
                          child: CircularProgressIndicator(
                            color: Colors.white,
                            strokeWidth: 2,
                          ),
                        ),
                        SizedBox(width: 10),
                        Text(
                          'Generating...',
                          style: TextStyle(
                            color: Colors.white,
                            fontWeight: FontWeight.bold,
                          ),
                        ),
                      ],
                    ),
                  )
                : ElevatedButton(
                    onPressed: _step < 2
                        ? _nextStep
                        : () {
                            if (_nameCtrl.text.trim().isEmpty) {
                              ScaffoldMessenger.of(ctx).showSnackBar(
                                const SnackBar(
                                  content: Text('Please enter a plan name'),
                                  backgroundColor: Colors.orange,
                                  behavior: SnackBarBehavior.floating,
                                ),
                              );
                              return;
                            }
                            ctx
                                .read<GenerateNutritionCubit>()
                                .generateNutritionPlan(
                                  planName: _nameCtrl.text.trim(),
                                  goal: _goal,
                                  activityLevel: _activityLevel,
                                  dietType: _dietType,
                                  restrictions: _restrictions.toList(),
                                  dailyCalories: _calories.toInt(),
                                  proteinGrams: _protein,
                                  carbsGrams: _carbs,
                                  fatGrams: _fat,
                                );
                          },
                    style: ElevatedButton.styleFrom(
                      backgroundColor: const Color(0xFF1B6B3A),
                      elevation: 0,
                      padding: const EdgeInsets.symmetric(vertical: 14),
                      shape: RoundedRectangleBorder(
                        borderRadius: BorderRadius.circular(14),
                      ),
                    ),
                    child: Row(
                      mainAxisAlignment: MainAxisAlignment.center,
                      children: [
                        if (_step == 2)
                          const Icon(
                            Icons.auto_awesome,
                            color: Colors.white,
                            size: 18,
                          ),
                        if (_step == 2) const SizedBox(width: 6),
                        Text(
                          _step < 2 ? 'Continue →' : 'Generate Plan',
                          style: const TextStyle(
                            color: Colors.white,
                            fontWeight: FontWeight.bold,
                            fontSize: 15,
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
}
