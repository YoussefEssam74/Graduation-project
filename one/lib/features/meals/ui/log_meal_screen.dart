import 'package:flutter/material.dart';
import 'package:flutter_bloc/flutter_bloc.dart';
import 'package:one/features/meals/models/meal_request_model.dart';
import '../cubit/log_meal_cubit.dart';
import '../cubit/log_meal_state.dart';

class LogMealScreen extends StatefulWidget {
  final int currentNutritionPlanId;
  const LogMealScreen({super.key, required this.currentNutritionPlanId});

  @override
  State<LogMealScreen> createState() => _LogMealScreenState();
}

class _LogMealScreenState extends State<LogMealScreen> {
  final nameCtrl = TextEditingController();
  final descCtrl = TextEditingController();
  final caloriesCtrl = TextEditingController();
  final proteinCtrl = TextEditingController();
  final carbsCtrl = TextEditingController();
  final fatsCtrl = TextEditingController();

  String selectedType = 'Breakfast';
  final mealTypes = [
    'Breakfast',
    'Lunch',
    'Dinner',
    'Snack',
    'Pre-Workout',
    'Post-Workout',
  ];

  @override
  Widget build(BuildContext context) {
    return BlocProvider(
      create: (context) => LogMealCubit(),
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
            'Log a Meal',
            style: TextStyle(color: Colors.black, fontWeight: FontWeight.bold),
          ),
        ),
        body: BlocConsumer<LogMealCubit, LogMealState>(
          listener: (context, state) {
            if (state is LogMealSuccess) {
              ScaffoldMessenger.of(context).showSnackBar(
                const SnackBar(
                  content: Text('Meal Saved!'),
                  backgroundColor: Colors.green,
                ),
              );
              Navigator.pop(context);
            } else if (state is LogMealError) {
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
                  _buildTextField(
                    'Meal Name *',
                    Icons.restaurant_menu,
                    nameCtrl,
                  ),
                  const SizedBox(height: 16),

                  // Dropdown for Meal Type
                  Container(
                    padding: const EdgeInsets.symmetric(horizontal: 16),
                    decoration: BoxDecoration(
                      color: Colors.white,
                      borderRadius: BorderRadius.circular(16),
                    ),
                    child: DropdownButtonHideUnderline(
                      child: DropdownButton<String>(
                        isExpanded: true,
                        value: selectedType,
                        items: mealTypes
                            .map(
                              (type) => DropdownMenuItem(
                                value: type,
                                child: Text(type),
                              ),
                            )
                            .toList(),
                        onChanged: (val) => setState(() => selectedType = val!),
                      ),
                    ),
                  ),
                  const SizedBox(height: 16),

                  _buildTextField(
                    'Total Calories',
                    Icons.local_fire_department,
                    caloriesCtrl,
                    isNumber: true,
                  ),
                  const SizedBox(height: 16),

                  Row(
                    children: [
                      Expanded(
                        child: _buildTextField(
                          'Protein (g)',
                          Icons.egg_alt,
                          proteinCtrl,
                          isNumber: true,
                        ),
                      ),
                      const SizedBox(width: 12),
                      Expanded(
                        child: _buildTextField(
                          'Carbs (g)',
                          Icons.breakfast_dining,
                          carbsCtrl,
                          isNumber: true,
                        ),
                      ),
                      const SizedBox(width: 12),
                      Expanded(
                        child: _buildTextField(
                          'Fats (g)',
                          Icons.water_drop,
                          fatsCtrl,
                          isNumber: true,
                        ),
                      ),
                    ],
                  ),
                  const SizedBox(height: 16),
                  _buildTextField(
                    'Description / Recipe (Optional)',
                    Icons.description,
                    descCtrl,
                  ),

                  const SizedBox(height: 32),
                  SizedBox(
                    width: double.infinity,
                    height: 55,
                    child: ElevatedButton(
                      onPressed: state is LogMealLoading
                          ? null
                          : () {
                              if (nameCtrl.text.isEmpty) {
                                ScaffoldMessenger.of(context).showSnackBar(
                                  const SnackBar(
                                    content: Text('Meal Name is required!'),
                                    backgroundColor: Colors.red,
                                  ),
                                );
                                return;
                              }

                              final request = MealRequestDto(
                                name: nameCtrl.text,
                                description: descCtrl.text,
                                calories: int.tryParse(caloriesCtrl.text),
                                proteinGrams: double.tryParse(proteinCtrl.text),
                                carbsGrams: double.tryParse(carbsCtrl.text),
                                fatGrams: double.tryParse(fatsCtrl.text),
                                mealType: selectedType,
                                nutritionPlanId: widget
                                    .currentNutritionPlanId, // ممرر من الشاشة السابقة
                              );
                              context.read<LogMealCubit>().submitMeal(request);
                            },
                      style: ElevatedButton.styleFrom(
                        backgroundColor: const Color(0xFF1A73E8),
                        shape: RoundedRectangleBorder(
                          borderRadius: BorderRadius.circular(16),
                        ),
                      ),
                      child: state is LogMealLoading
                          ? const CircularProgressIndicator(color: Colors.white)
                          : const Text(
                              'Save Meal',
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
