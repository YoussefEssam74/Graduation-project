import 'package:flutter/material.dart';
import 'package:flutter_bloc/flutter_bloc.dart';
import '../cubit/add_inbody_cubit.dart';
import '../cubit/add_inbody_state.dart';

class AddInBodyScreen extends StatelessWidget {
  final weightController = TextEditingController();
  final heightController = TextEditingController();
  final fatController = TextEditingController();
  final muscleController = TextEditingController();

  AddInBodyScreen({super.key});

  @override
  Widget build(BuildContext context) {
    return BlocProvider(
      create: (context) => AddInBodyCubit(),
      child: Scaffold(
        appBar: AppBar(title: const Text('Add New Metrics'), centerTitle: true),
        body: BlocConsumer<AddInBodyCubit, AddInBodyState>(
          listener: (context, state) {
            if (state is AddInBodySuccess) {
              ScaffoldMessenger.of(context).showSnackBar(
                const SnackBar(
                  content: Text('Metrics Added!'),
                  backgroundColor: Colors.green,
                ),
              );
              // ممكن هنا نستدعي دالة تحديث الشاشة اللي قبلها لو حابب
              Navigator.pop(context);
            } else if (state is AddInBodyError) {
              ScaffoldMessenger.of(context).showSnackBar(
                SnackBar(
                  content: Text(state.message),
                  backgroundColor: Colors.red,
                ),
              );
            }
          },
          builder: (context, state) {
            return Padding(
              padding: const EdgeInsets.all(24.0),
              child: Column(
                children: [
                  TextField(
                    controller: weightController,
                    keyboardType: TextInputType.number,
                    decoration: const InputDecoration(labelText: 'Weight (kg)'),
                  ),
                  const SizedBox(height: 16),
                  TextField(
                    controller: heightController,
                    keyboardType: TextInputType.number,
                    decoration: const InputDecoration(labelText: 'Height (cm)'),
                  ),
                  const SizedBox(height: 16),
                  TextField(
                    controller: fatController,
                    keyboardType: TextInputType.number,
                    decoration: const InputDecoration(
                      labelText: 'Body Fat (%)',
                    ),
                  ),
                  const SizedBox(height: 16),
                  TextField(
                    controller: muscleController,
                    keyboardType: TextInputType.number,
                    decoration: const InputDecoration(
                      labelText: 'Muscle Mass (kg)',
                    ),
                  ),
                  const Spacer(),
                  SizedBox(
                    width: double.infinity,
                    height: 55,
                    child: ElevatedButton(
                      onPressed: state is AddInBodyLoading
                          ? null
                          : () {
                              context.read<AddInBodyCubit>().submitInBody(
                                double.tryParse(weightController.text) ?? 0,
                                double.tryParse(heightController.text) ?? 0,
                                double.tryParse(fatController.text) ?? 0,
                                double.tryParse(muscleController.text) ?? 0,
                              );
                            },
                      child: state is AddInBodyLoading
                          ? const CircularProgressIndicator()
                          : const Text('Save Metrics'),
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
}
