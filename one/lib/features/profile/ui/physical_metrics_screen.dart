import 'package:flutter/material.dart';
import 'package:flutter_bloc/flutter_bloc.dart';
import '../cubit/profile_cubit.dart';
import '../cubit/profile_state.dart';
import '../models/profile_models.dart';

class PhysicalMetricsScreen extends StatefulWidget {
  const PhysicalMetricsScreen({super.key});

  @override
  State<PhysicalMetricsScreen> createState() => _PhysicalMetricsScreenState();
}

class _PhysicalMetricsScreenState extends State<PhysicalMetricsScreen> {
  final _weightCtrl = TextEditingController();
  final _heightCtrl = TextEditingController();
  final _fatCtrl = TextEditingController();
  final _muscleCtrl = TextEditingController();
  final _waterCtrl = TextEditingController();

  @override
  void dispose() {
    _weightCtrl.dispose();
    _heightCtrl.dispose();
    _fatCtrl.dispose();
    _muscleCtrl.dispose();
    _waterCtrl.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: const Color(0xFFF2F4F7),
      appBar: AppBar(
        backgroundColor: Colors.white,
        elevation: 0,
        leading: GestureDetector(
          onTap: () => Navigator.pop(context),
          child: Container(
            margin: const EdgeInsets.all(8),
            decoration: BoxDecoration(
              color: Colors.grey.shade100,
              borderRadius: BorderRadius.circular(10),
            ),
            child: const Icon(
              Icons.arrow_back_ios_new_rounded,
              color: Color(0xFF1A3A8F),
              size: 16,
            ),
          ),
        ),
        title: const Text(
          'Physical Metrics',
          style: TextStyle(
            color: Color(0xFF1A1A2E),
            fontWeight: FontWeight.bold,
            fontSize: 17,
          ),
        ),
      ),
      body: BlocConsumer<ProfileCubit, ProfileState>(
        listener: (ctx, state) {
          if (state is ProfileUpdateSuccess) {
            ScaffoldMessenger.of(ctx).showSnackBar(
              SnackBar(
                content: Text(state.message),
                backgroundColor: Colors.green,
                behavior: SnackBarBehavior.floating,
                shape: RoundedRectangleBorder(
                  borderRadius: BorderRadius.circular(12),
                ),
              ),
            );
            Navigator.pop(ctx);
          }
          if (state is ProfileError) {
            ScaffoldMessenger.of(ctx).showSnackBar(
              SnackBar(
                content: Text(state.message),
                backgroundColor: Colors.redAccent,
                behavior: SnackBarBehavior.floating,
                shape: RoundedRectangleBorder(
                  borderRadius: BorderRadius.circular(12),
                ),
              ),
            );
          }
        },
        builder: (ctx, state) {
          InBodyModel? current;
          if (state is ProfileLoaded) current = state.inBody;

          // Pre-fill if existing
          if (current != null && _weightCtrl.text.isEmpty) {
            _weightCtrl.text = current.weight.toStringAsFixed(1);
            _heightCtrl.text = current.height.toStringAsFixed(0);
            if (current.bodyFatPercentage != null)
              _fatCtrl.text = current.bodyFatPercentage!.toStringAsFixed(1);
            if (current.muscleMass != null)
              _muscleCtrl.text = current.muscleMass!.toStringAsFixed(1);
            if (current.bodyWaterPercentage != null)
              _waterCtrl.text = current.bodyWaterPercentage!.toStringAsFixed(1);
          }

          return SingleChildScrollView(
            padding: const EdgeInsets.all(16),
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                // Current measurements display
                if (current != null) _buildCurrentCard(current),
                const SizedBox(height: 20),

                // PHYSICAL METRICS section
                _sLabel('PHYSICAL METRICS'),
                const SizedBox(height: 10),
                Row(
                  children: [
                    Expanded(
                      child: _metricBox(
                        Icons.height_rounded,
                        const Color(0xFF1A3A8F),
                        'Height (cm)',
                        _heightCtrl,
                        TextInputType.number,
                      ),
                    ),
                    const SizedBox(width: 12),
                    Expanded(
                      child: _metricBox(
                        Icons.monitor_weight_outlined,
                        Colors.orange,
                        'Weight (kg)',
                        _weightCtrl,
                        TextInputType.number,
                      ),
                    ),
                  ],
                ),
                const SizedBox(height: 20),

                // BODY COMPOSITION section
                _sLabel('BODY COMPOSITION'),
                const SizedBox(height: 10),
                Container(
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
                  child: Column(
                    children: [
                      _inlineField(
                        Icons.percent_rounded,
                        Colors.red,
                        'Body Fat %',
                        _fatCtrl,
                      ),
                      _divider(),
                      _inlineField(
                        Icons.fitness_center_rounded,
                        const Color(0xFF1A3A8F),
                        'Muscle Mass (kg)',
                        _muscleCtrl,
                      ),
                      _divider(),
                      _inlineField(
                        Icons.water_drop_outlined,
                        Colors.blue,
                        'Body Water %',
                        _waterCtrl,
                      ),
                    ],
                  ),
                ),

                // BMI Display
                if (_weightCtrl.text.isNotEmpty &&
                    _heightCtrl.text.isNotEmpty) ...[
                  const SizedBox(height: 20),
                  _buildBmiCard(),
                ],

                // Detailed Body Composition link
                const SizedBox(height: 16),
                Container(
                  padding: const EdgeInsets.all(14),
                  decoration: BoxDecoration(
                    color: const Color(0xFF1A3A8F).withOpacity(0.06),
                    borderRadius: BorderRadius.circular(14),
                    border: Border.all(
                      color: const Color(0xFF1A3A8F).withOpacity(0.15),
                    ),
                  ),
                  child: Row(
                    children: [
                      const Icon(
                        Icons.bar_chart_rounded,
                        color: Color(0xFF1A3A8F),
                        size: 20,
                      ),
                      const SizedBox(width: 12),
                      const Expanded(
                        child: Column(
                          crossAxisAlignment: CrossAxisAlignment.start,
                          children: [
                            Text(
                              'Detailed Body Composition',
                              style: TextStyle(
                                color: Color(0xFF1A3A8F),
                                fontWeight: FontWeight.bold,
                                fontSize: 13,
                              ),
                            ),
                            Text(
                              'Full InBody analysis from your coach',
                              style: TextStyle(
                                color: Colors.grey,
                                fontSize: 11,
                              ),
                            ),
                          ],
                        ),
                      ),
                      const Text(
                        'Update',
                        style: TextStyle(
                          color: Color(0xFF1A3A8F),
                          fontWeight: FontWeight.bold,
                          fontSize: 13,
                        ),
                      ),
                    ],
                  ),
                ),

                const SizedBox(height: 28),

                // Save button
                SizedBox(
                  width: double.infinity,
                  child: ElevatedButton(
                    onPressed: state is ProfileUpdating
                        ? null
                        : () => _save(ctx),
                    style: ElevatedButton.styleFrom(
                      backgroundColor: const Color(0xFF1A3A8F),
                      foregroundColor: Colors.white,
                      elevation: 0,
                      padding: const EdgeInsets.symmetric(vertical: 14),
                      shape: RoundedRectangleBorder(
                        borderRadius: BorderRadius.circular(14),
                      ),
                    ),
                    child: state is ProfileUpdating
                        ? const SizedBox(
                            width: 20,
                            height: 20,
                            child: CircularProgressIndicator(
                              color: Colors.white,
                              strokeWidth: 2,
                            ),
                          )
                        : const Text(
                            'Save Measurements',
                            style: TextStyle(
                              fontWeight: FontWeight.bold,
                              fontSize: 15,
                            ),
                          ),
                  ),
                ),
              ],
            ),
          );
        },
      ),
    );
  }

  Widget _buildCurrentCard(InBodyModel m) {
    final bmi = m.computedBmi;
    String bmiLabel = 'Normal';
    Color bmiColor = Colors.green;
    if (bmi < 18.5) {
      bmiLabel = 'Underweight';
      bmiColor = Colors.blue;
    } else if (bmi >= 25) {
      bmiLabel = 'Overweight';
      bmiColor = Colors.orange;
    } else if (bmi >= 30) {
      bmiLabel = 'Obese';
      bmiColor = Colors.red;
    }

    return Container(
      padding: const EdgeInsets.all(16),
      decoration: BoxDecoration(
        gradient: const LinearGradient(
          colors: [Color(0xFF1A3A8F), Color(0xFF0D47A1)],
          begin: Alignment.topLeft,
          end: Alignment.bottomRight,
        ),
        borderRadius: BorderRadius.circular(18),
      ),
      child: Column(
        children: [
          Row(
            mainAxisAlignment: MainAxisAlignment.spaceAround,
            children: [
              _currentStat('${m.height.toInt()}', 'Height (cm)'),
              _currentStat(m.weight.toStringAsFixed(1), 'Weight (kg)'),
              _currentStat(
                bmi.toStringAsFixed(1),
                'BMI',
                color: bmiColor,
                label2: bmiLabel,
              ),
            ],
          ),
          if (m.bodyFatPercentage != null || m.muscleMass != null) ...[
            Divider(color: Colors.white.withOpacity(0.2), height: 20),
            Row(
              mainAxisAlignment: MainAxisAlignment.spaceAround,
              children: [
                if (m.bodyFatPercentage != null)
                  _currentStat(
                    '${m.bodyFatPercentage!.toStringAsFixed(1)}%',
                    'Body Fat',
                  ),
                if (m.muscleMass != null)
                  _currentStat(
                    '${m.muscleMass!.toStringAsFixed(1)} kg',
                    'Muscle Mass',
                  ),
                if (m.bodyWaterPercentage != null)
                  _currentStat(
                    '${m.bodyWaterPercentage!.toStringAsFixed(1)}%',
                    'Body Water',
                  ),
              ],
            ),
          ],
        ],
      ),
    );
  }

  Widget _currentStat(
    String value,
    String label, {
    Color? color,
    String? label2,
  }) {
    return Column(
      children: [
        Text(
          value,
          style: TextStyle(
            color: color ?? Colors.white,
            fontSize: 20,
            fontWeight: FontWeight.bold,
          ),
        ),
        Text(
          label,
          style: const TextStyle(color: Colors.white70, fontSize: 11),
        ),
        if (label2 != null)
          Text(
            label2,
            style: TextStyle(
              color: color ?? Colors.white70,
              fontSize: 10,
              fontWeight: FontWeight.bold,
            ),
          ),
      ],
    );
  }

  Widget _metricBox(
    IconData icon,
    Color color,
    String label,
    TextEditingController ctrl,
    TextInputType kbType,
  ) {
    return Container(
      padding: const EdgeInsets.all(14),
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
            children: [
              Icon(icon, color: color, size: 18),
              const SizedBox(width: 8),
              Text(
                label,
                style: const TextStyle(color: Colors.grey, fontSize: 11),
              ),
            ],
          ),
          TextField(
            controller: ctrl,
            keyboardType: kbType,
            onChanged: (_) => setState(() {}),
            style: TextStyle(
              fontSize: 22,
              fontWeight: FontWeight.bold,
              color: color,
            ),
            decoration: InputDecoration(
              hintText: '—',
              hintStyle: TextStyle(
                color: Colors.grey.shade300,
                fontSize: 22,
                fontWeight: FontWeight.bold,
              ),
              border: InputBorder.none,
              contentPadding: EdgeInsets.zero,
              isDense: true,
            ),
          ),
        ],
      ),
    );
  }

  Widget _inlineField(
    IconData icon,
    Color color,
    String label,
    TextEditingController ctrl,
  ) {
    return Padding(
      padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 12),
      child: Row(
        children: [
          Container(
            width: 36,
            height: 36,
            decoration: BoxDecoration(
              color: color.withOpacity(0.1),
              borderRadius: BorderRadius.circular(10),
            ),
            child: Icon(icon, color: color, size: 18),
          ),
          const SizedBox(width: 14),
          Expanded(
            child: TextField(
              controller: ctrl,
              keyboardType: const TextInputType.numberWithOptions(
                decimal: true,
              ),
              style: const TextStyle(fontSize: 14, color: Color(0xFF1A1A2E)),
              decoration: InputDecoration(
                labelText: label,
                labelStyle: const TextStyle(color: Colors.grey, fontSize: 12),
                border: InputBorder.none,
                isDense: true,
              ),
            ),
          ),
        ],
      ),
    );
  }

  Widget _buildBmiCard() {
    final w = double.tryParse(_weightCtrl.text) ?? 0;
    final h = double.tryParse(_heightCtrl.text) ?? 0;
    if (w <= 0 || h <= 0) return const SizedBox.shrink();
    final hm = h / 100;
    final bmi = w / (hm * hm);
    String label = 'Normal Weight';
    Color c = Colors.green;
    if (bmi < 18.5) {
      label = 'Underweight';
      c = Colors.blue;
    } else if (bmi >= 30) {
      label = 'Obese';
      c = Colors.red;
    } else if (bmi >= 25) {
      label = 'Overweight';
      c = Colors.orange;
    }

    return Container(
      padding: const EdgeInsets.all(14),
      decoration: BoxDecoration(
        color: c.withOpacity(0.08),
        borderRadius: BorderRadius.circular(14),
        border: Border.all(color: c.withOpacity(0.2)),
      ),
      child: Row(
        children: [
          Icon(Icons.calculate_outlined, color: c, size: 22),
          const SizedBox(width: 12),
          Expanded(
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                const Text(
                  'BMI (Body Mass Index)',
                  style: TextStyle(fontWeight: FontWeight.w600, fontSize: 13),
                ),
                Text(
                  '$label · ${bmi.toStringAsFixed(1)}',
                  style: TextStyle(color: c, fontSize: 12),
                ),
              ],
            ),
          ),
        ],
      ),
    );
  }

  Widget _sLabel(String text) => Padding(
    padding: const EdgeInsets.only(left: 4, bottom: 2),
    child: Text(
      text,
      style: TextStyle(
        color: Colors.grey.shade500,
        fontSize: 11,
        fontWeight: FontWeight.w700,
        letterSpacing: 0.8,
      ),
    ),
  );

  Widget _divider() => Divider(
    height: 1,
    indent: 60,
    endIndent: 16,
    color: Colors.grey.shade100,
  );

  void _save(BuildContext ctx) {
    final weight = double.tryParse(_weightCtrl.text);
    final height = double.tryParse(_heightCtrl.text);

    if (weight == null || height == null) {
      ScaffoldMessenger.of(ctx).showSnackBar(
        const SnackBar(
          content: Text('Please enter valid weight and height'),
          backgroundColor: Colors.orange,
          behavior: SnackBarBehavior.floating,
        ),
      );
      return;
    }

    ctx.read<ProfileCubit>().saveInBodyMeasurement(
      weight: weight,
      height: height,
      bodyFat: double.tryParse(_fatCtrl.text),
      muscleMass: double.tryParse(_muscleCtrl.text),
      bodyWater: double.tryParse(_waterCtrl.text),
    );
  }
}
