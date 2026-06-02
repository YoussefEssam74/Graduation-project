import 'package:flutter/material.dart';
import 'package:flutter_bloc/flutter_bloc.dart';
import 'package:one/features/workouts/models/workout_log_model.dart';
import '../cubit/workout_log_cubit.dart';
import '../cubit/workout_log_state.dart';

class WorkoutLogScreen extends StatefulWidget {
  final int currentPlanId; // بنستقبل الـ Plan ID الحالي من شاشة الـ Summary
  const WorkoutLogScreen({super.key, required this.currentPlanId});

  @override
  State<WorkoutLogScreen> createState() => _WorkoutLogScreenState();
}

class _WorkoutLogScreenState extends State<WorkoutLogScreen> {
  final durationCtrl = TextEditingController();
  final caloriesCtrl = TextEditingController();
  final exercisesCtrl = TextEditingController();
  final notesCtrl = TextEditingController();
  int feelingRating = 3; // ديفولت 3 من 5
  bool isCompleted = true;

  @override
  Widget build(BuildContext context) {
    return BlocProvider(
      create: (context) => WorkoutLogCubit(),
      child: Scaffold(
        backgroundColor: const Color(0xFFF8F9FD),
        appBar: AppBar(
          backgroundColor: Colors.transparent,
          elevation: 0,
          leading: IconButton(
            icon: const Icon(Icons.arrow_back_ios, color: Colors.black),
            onPressed: () => Navigator.pop(context),
          ),
          title: const Text(
            'Log Workout',
            style: TextStyle(color: Colors.black, fontWeight: FontWeight.bold),
          ),
        ),
        body: BlocConsumer<WorkoutLogCubit, WorkoutLogState>(
          listener: (context, state) {
            if (state is WorkoutLogSuccess) {
              ScaffoldMessenger.of(context).showSnackBar(
                const SnackBar(
                  content: Text('Workout Logged!'),
                  backgroundColor: Colors.green,
                ),
              );
              Navigator.pop(context);
            } else if (state is WorkoutLogError) {
              ScaffoldMessenger.of(context).showSnackBar(
                SnackBar(
                  content: Text(state.message),
                  backgroundColor: Colors.red,
                ),
              );
            }
          },
          builder: (context, state) {
            return SingleChildScrollView(
              padding: const EdgeInsets.all(24.0),
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Row(
                    children: [
                      Expanded(
                        child: _buildTextField(
                          'Duration (Mins)',
                          Icons.timer,
                          durationCtrl,
                          isNumber: true,
                        ),
                      ),
                      const SizedBox(width: 16),
                      Expanded(
                        child: _buildTextField(
                          'Calories',
                          Icons.local_fire_department,
                          caloriesCtrl,
                          isNumber: true,
                        ),
                      ),
                    ],
                  ),
                  const SizedBox(height: 16),
                  _buildTextField(
                    'Exercises Completed (e.g., Squats, Bench)',
                    Icons.fitness_center,
                    exercisesCtrl,
                  ),
                  const SizedBox(height: 16),
                  _buildTextField(
                    'Notes / How did it go?',
                    Icons.edit_note,
                    notesCtrl,
                  ),
                  const SizedBox(height: 24),

                  const Text(
                    'How did you feel?',
                    style: TextStyle(fontWeight: FontWeight.bold, fontSize: 16),
                  ),
                  const SizedBox(height: 8),
                  Slider(
                    value: feelingRating.toDouble(),
                    min: 1,
                    max: 5,
                    divisions: 4,
                    activeColor: const Color(0xFF1A73E8),
                    label: feelingRating.toString(),
                    onChanged: (val) =>
                        setState(() => feelingRating = val.toInt()),
                  ),
                  const Padding(
                    padding: EdgeInsets.symmetric(horizontal: 16),
                    child: Row(
                      mainAxisAlignment: MainAxisAlignment.spaceBetween,
                      children: [
                        Text(
                          'Exhausted',
                          style: TextStyle(color: Colors.grey, fontSize: 12),
                        ),
                        Text(
                          'Great',
                          style: TextStyle(color: Colors.grey, fontSize: 12),
                        ),
                      ],
                    ),
                  ),
                  const SizedBox(height: 24),

                  SwitchListTile(
                    title: const Text(
                      'Workout Completed',
                      style: TextStyle(fontWeight: FontWeight.bold),
                    ),
                    value: isCompleted,
                    activeColor: const Color(0xFF1A73E8),
                    onChanged: (val) => setState(() => isCompleted = val),
                    contentPadding: EdgeInsets.zero,
                  ),
                  const SizedBox(height: 32),

                  SizedBox(
                    width: double.infinity,
                    height: 55,
                    child: ElevatedButton(
                      onPressed: state is WorkoutLogLoading
                          ? null
                          : () {
                              final request = WorkoutLogRequest(
                                planId: widget.currentPlanId,
                                workoutDate: DateTime.now().toIso8601String(),
                                durationMinutes: int.tryParse(
                                  durationCtrl.text,
                                ),
                                caloriesBurned: int.tryParse(caloriesCtrl.text),
                                exercisesCompleted: exercisesCtrl.text,
                                notes: notesCtrl.text,
                                feelingRating: feelingRating,
                                completed: isCompleted,
                              );
                              context.read<WorkoutLogCubit>().submitWorkoutLog(
                                request,
                              );
                            },
                      style: ElevatedButton.styleFrom(
                        backgroundColor: const Color(0xFF1A73E8),
                        shape: RoundedRectangleBorder(
                          borderRadius: BorderRadius.circular(16),
                        ),
                      ),
                      child: state is WorkoutLogLoading
                          ? const CircularProgressIndicator(color: Colors.white)
                          : const Text(
                              'Save Workout',
                              style: TextStyle(
                                color: Colors.white,
                                fontSize: 16,
                                fontWeight: FontWeight.bold,
                              ),
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

  Widget _buildTextField(
    String hint,
    IconData icon,
    TextEditingController controller, {
    bool isNumber = false,
  }) {
    return TextField(
      controller: controller,
      keyboardType: isNumber ? TextInputType.number : TextInputType.text,
      decoration: InputDecoration(
        hintText: hint,
        prefixIcon: Icon(icon, color: Colors.blueAccent),
        filled: true,
        fillColor: Colors.white,
        border: OutlineInputBorder(
          borderRadius: BorderRadius.circular(16),
          borderSide: BorderSide.none,
        ),
      ),
    );
  }
}
