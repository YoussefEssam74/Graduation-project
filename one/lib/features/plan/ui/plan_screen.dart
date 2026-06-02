//==============================================================================================//
//33//
// import 'package:flutter/material.dart';
// import 'exercise_detail_sheet.dart';
// import 'package:flutter_bloc/flutter_bloc.dart';
// import '../cubit/plan_cubit.dart';
// import '../cubit/plan_state.dart';
// import '../model/plan_model.dart';
// import '../model/nutrition_plan_model.dart';

// class PlanScreen extends StatelessWidget {
//   const PlanScreen({super.key});

//   @override
//   Widget build(BuildContext context) {
//     return BlocProvider(
//       create: (_) => PlanCubit()..fetchPlans(),
//       child: const _PlanView(),
//     );
//   }
// }

// class _PlanView extends StatefulWidget {
//   const _PlanView();

//   @override
//   State<_PlanView> createState() => _PlanViewState();
// }

// class _PlanViewState extends State<_PlanView>
//     with SingleTickerProviderStateMixin {
//   late TabController _tabController;

//   @override
//   void initState() {
//     super.initState();
//     _tabController = TabController(length: 2, vsync: this);
//   }

//   @override
//   void dispose() {
//     _tabController.dispose();
//     super.dispose();
//   }

//   @override
//   Widget build(BuildContext context) {
//     return Scaffold(
//       backgroundColor: Colors.white,
//       body: BlocConsumer<PlanCubit, PlanState>(
//         listener: (context, state) {
//           if (state is PlanDeleteSuccess ||
//               state is WorkoutPlanGenerateSuccess ||
//               state is NutritionPlanGenerateSuccess) {
//             final msg = state is PlanDeleteSuccess
//                 ? state.message
//                 : state is WorkoutPlanGenerateSuccess
//                 ? state.message
//                 : (state as NutritionPlanGenerateSuccess).message;
//             ScaffoldMessenger.of(context).showSnackBar(
//               SnackBar(
//                 content: Text(msg),
//                 backgroundColor: Colors.green,
//                 behavior: SnackBarBehavior.floating,
//                 shape: RoundedRectangleBorder(
//                   borderRadius: BorderRadius.circular(12),
//                 ),
//               ),
//             );
//           }
//           if (state is PlanError || state is NutritionPlanError) {
//             final msg = state is PlanError
//                 ? state.message
//                 : (state as NutritionPlanError).message;
//             final lower = msg.toLowerCase();
//             final isTokenError =
//                 lower.contains('token') ||
//                 lower.contains('insufficient') ||
//                 lower.contains('balance') ||
//                 lower.contains('subscription');
//             final isServiceDown =
//                 lower.contains('temporarily offline') ||
//                 lower.contains('ml service') ||
//                 lower.contains('unavailable') ||
//                 lower.contains('refused');

//             IconData snackIcon = Icons.error_outline_rounded;
//             Color snackColor = Colors.redAccent;
//             if (isTokenError) {
//               snackIcon = Icons.toll_rounded;
//               snackColor = Colors.orange;
//             } else if (isServiceDown) {
//               snackIcon = Icons.cloud_off_rounded;
//               snackColor = Colors.blueGrey;
//             }

//             ScaffoldMessenger.of(context).showSnackBar(
//               SnackBar(
//                 content: Row(
//                   children: [
//                     Icon(snackIcon, color: Colors.white, size: 18),
//                     const SizedBox(width: 8),
//                     Expanded(child: Text(msg)),
//                   ],
//                 ),
//                 backgroundColor: snackColor,
//                 behavior: SnackBarBehavior.floating,
//                 duration: const Duration(seconds: 5),
//                 shape: RoundedRectangleBorder(
//                   borderRadius: BorderRadius.circular(12),
//                 ),
//               ),
//             );
//           }
//         },
//         builder: (context, state) {
//           return SafeArea(
//             child: Column(
//               children: [
//                 _buildTopBar(context),
//                 const SizedBox(height: 12),
//                 _buildTabBar(context),
//                 const SizedBox(height: 16),
//                 Expanded(
//                   child: TabBarView(
//                     controller: _tabController,
//                     physics: const NeverScrollableScrollPhysics(),
//                     children: [
//                       _buildWorkoutTab(context, state),
//                       _buildNutritionTab(context, state),
//                     ],
//                   ),
//                 ),
//               ],
//             ),
//           );
//         },
//       ),
//     );
//   }

//   Widget _buildTopBar(BuildContext context) {
//     return Padding(
//       padding: const EdgeInsets.fromLTRB(20, 12, 20, 0),
//       child: Row(
//         children: [
//           GestureDetector(
//             onTap: () => Navigator.of(context).maybePop(),
//             child: const Icon(
//               Icons.menu_rounded,
//               color: Colors.black87,
//               size: 26,
//             ),
//           ),
//           const SizedBox(width: 14),
//           const Text(
//             'My Plans',
//             style: TextStyle(
//               fontSize: 22,
//               fontWeight: FontWeight.bold,
//               color: Color(0xFF1A1A2E),
//             ),
//           ),
//           const Spacer(),
//           GestureDetector(
//             onTap: () => _showGenerateOptions(context),
//             child: Container(
//               padding: const EdgeInsets.symmetric(horizontal: 18, vertical: 10),
//               decoration: BoxDecoration(
//                 color: const Color(0xFF1A3A8F),
//                 borderRadius: BorderRadius.circular(14),
//               ),
//               child: const Row(
//                 mainAxisSize: MainAxisSize.min,
//                 children: [
//                   Icon(Icons.auto_awesome, color: Colors.white, size: 16),
//                   SizedBox(width: 6),
//                   Text(
//                     'Generate',
//                     style: TextStyle(
//                       color: Colors.white,
//                       fontWeight: FontWeight.bold,
//                       fontSize: 14,
//                     ),
//                   ),
//                 ],
//               ),
//             ),
//           ),
//         ],
//       ),
//     );
//   }

//   Widget _buildTabBar(BuildContext context) {
//     return Padding(
//       padding: const EdgeInsets.symmetric(horizontal: 20),
//       child: Container(
//         height: 44,
//         decoration: BoxDecoration(
//           color: const Color(0xFFF0F0F5),
//           borderRadius: BorderRadius.circular(12),
//         ),
//         child: TabBar(
//           controller: _tabController,
//           labelColor: Colors.white,
//           unselectedLabelColor: Colors.grey,
//           labelStyle: const TextStyle(
//             fontWeight: FontWeight.bold,
//             fontSize: 14,
//           ),
//           unselectedLabelStyle: const TextStyle(fontSize: 14),
//           indicator: BoxDecoration(
//             color: const Color(0xFF1A3A8F),
//             borderRadius: BorderRadius.circular(10),
//           ),
//           indicatorSize: TabBarIndicatorSize.tab,
//           dividerColor: Colors.transparent,
//           padding: const EdgeInsets.all(3),
//           onTap: (i) {
//             if (i == 0)
//               context.read<PlanCubit>().fetchPlans();
//             else
//               context.read<PlanCubit>().fetchNutritionPlan();
//           },
//           tabs: const [
//             Tab(text: 'Workout'),
//             Tab(text: 'Nutrition'),
//           ],
//         ),
//       ),
//     );
//   }

//   // ─── WORKOUT TAB ───────────────────────────────────────────────
//   Widget _buildWorkoutTab(BuildContext context, PlanState state) {
//     if (state is PlanInitial ||
//         state is PlanLoading ||
//         state is WorkoutPlanGenerating) {
//       return const Center(
//         child: CircularProgressIndicator(color: Color(0xFF1A3A8F)),
//       );
//     }
//     if (state is PlanError)
//       return _buildError(
//         context,
//         state.message,
//         () => context.read<PlanCubit>().fetchPlans(),
//       );
//     if (state is PlanLoaded) {
//       if (state.allPlans.isEmpty) return _buildEmptyWorkout(context);
//       return _buildWorkoutContent(context, state);
//     }
//     return const Center(
//       child: CircularProgressIndicator(color: Color(0xFF1A3A8F)),
//     );
//   }

//   Widget _buildWorkoutContent(BuildContext context, PlanLoaded state) {
//     final plan = state.activePlan!;
//     final days = plan.days;
//     final selectedDay = state.selectedDayIndex < days.length
//         ? days[state.selectedDayIndex]
//         : null;

//     return RefreshIndicator(
//       color: const Color(0xFF1A3A8F),
//       onRefresh: () => context.read<PlanCubit>().fetchPlans(),
//       child: SingleChildScrollView(
//         physics: const AlwaysScrollableScrollPhysics(),
//         child: Column(
//           crossAxisAlignment: CrossAxisAlignment.start,
//           children: [
//             _buildHeroPlanCard(context, plan),
//             const SizedBox(height: 20),
//             if (days.isNotEmpty) ...[
//               _buildDaySelector(context, days, state.selectedDayIndex),
//               const SizedBox(height: 20),
//             ],
//             if (selectedDay != null) ...[
//               const Padding(
//                 padding: EdgeInsets.symmetric(horizontal: 20),
//                 child: Text(
//                   "Today's Workout",
//                   style: TextStyle(
//                     fontSize: 20,
//                     fontWeight: FontWeight.bold,
//                     color: Color(0xFF1A1A2E),
//                   ),
//                 ),
//               ),
//               const SizedBox(height: 12),
//               if (selectedDay.exercises.isEmpty)
//                 _buildRestDay()
//               else
//                 ...selectedDay.exercises.map((ex) => _buildExerciseCard(ex)),
//               const SizedBox(height: 24),
//             ],
//           ],
//         ),
//       ),
//     );
//   }

//   Widget _buildHeroPlanCard(BuildContext context, PlanModel plan) {
//     final dayLabels = _getDayLabels(plan.daysPerWeek ?? 0);
//     return Padding(
//       padding: const EdgeInsets.symmetric(horizontal: 20),
//       child: Container(
//         width: double.infinity,
//         padding: const EdgeInsets.all(22),
//         decoration: BoxDecoration(
//           color: const Color(0xFF1A3A8F),
//           borderRadius: BorderRadius.circular(20),
//         ),
//         child: Column(
//           crossAxisAlignment: CrossAxisAlignment.start,
//           children: [
//             Row(
//               mainAxisAlignment: MainAxisAlignment.spaceBetween,
//               children: [
//                 Container(
//                   padding: const EdgeInsets.symmetric(
//                     horizontal: 10,
//                     vertical: 4,
//                   ),
//                   decoration: BoxDecoration(
//                     color: Colors.white.withOpacity(0.2),
//                     borderRadius: BorderRadius.circular(8),
//                   ),
//                   child: const Text(
//                     'ACTIVE',
//                     style: TextStyle(
//                       color: Colors.white,
//                       fontSize: 11,
//                       fontWeight: FontWeight.bold,
//                       letterSpacing: 1.2,
//                     ),
//                   ),
//                 ),
//                 GestureDetector(
//                   onTap: () => _confirmDelete(context, plan.planId),
//                   child: Icon(
//                     Icons.fitness_center_rounded,
//                     color: Colors.white.withOpacity(0.6),
//                     size: 24,
//                   ),
//                 ),
//               ],
//             ),
//             const SizedBox(height: 14),
//             Text(
//               plan.planName,
//               style: const TextStyle(
//                 color: Colors.white,
//                 fontSize: 26,
//                 fontWeight: FontWeight.bold,
//               ),
//             ),
//             const SizedBox(height: 18),
//             Row(
//               children: [
//                 _planStatBox(
//                   label: 'FREQUENCY',
//                   value: '${plan.daysPerWeek ?? "—"}',
//                   unit: 'days/wk',
//                 ),
//                 const SizedBox(width: 10),
//                 _planStatBox(
//                   label: 'DURATION',
//                   value: '${plan.durationWeeks ?? "—"}',
//                   unit: 'weeks',
//                 ),
//                 const SizedBox(width: 10),
//                 _planStatBox(
//                   label: 'LEVEL',
//                   value: plan.fitnessLevel ?? '—',
//                   unit: '',
//                   wide: true,
//                 ),
//               ],
//             ),
//             const SizedBox(height: 18),
//             Row(
//               mainAxisAlignment: MainAxisAlignment.spaceBetween,
//               children: [
//                 Row(
//                   children: dayLabels
//                       .map(
//                         (d) => Container(
//                           margin: const EdgeInsets.only(right: 6),
//                           width: 32,
//                           height: 32,
//                           decoration: BoxDecoration(
//                             color: Colors.white,
//                             shape: BoxShape.circle,
//                             boxShadow: [
//                               BoxShadow(
//                                 color: Colors.black.withOpacity(0.1),
//                                 blurRadius: 4,
//                               ),
//                             ],
//                           ),
//                           child: Center(
//                             child: Text(
//                               d,
//                               style: const TextStyle(
//                                 color: Color(0xFF1A3A8F),
//                                 fontWeight: FontWeight.bold,
//                                 fontSize: 11,
//                               ),
//                             ),
//                           ),
//                         ),
//                       )
//                       .toList(),
//                 ),
//                 Text(
//                   'Week ${plan.currentWeek} of ${plan.durationWeeks ?? "—"}',
//                   style: TextStyle(
//                     color: Colors.white.withOpacity(0.85),
//                     fontSize: 13,
//                     fontWeight: FontWeight.w500,
//                   ),
//                 ),
//               ],
//             ),
//           ],
//         ),
//       ),
//     );
//   }

//   Widget _planStatBox({
//     required String label,
//     required String value,
//     required String unit,
//     bool wide = false,
//   }) {
//     return Expanded(
//       flex: wide ? 2 : 1,
//       child: Container(
//         padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 10),
//         decoration: BoxDecoration(
//           color: Colors.white.withOpacity(0.15),
//           borderRadius: BorderRadius.circular(12),
//         ),
//         child: Column(
//           crossAxisAlignment: CrossAxisAlignment.start,
//           children: [
//             Text(
//               label,
//               style: TextStyle(
//                 color: Colors.white.withOpacity(0.7),
//                 fontSize: 9,
//                 fontWeight: FontWeight.w600,
//                 letterSpacing: 0.5,
//               ),
//             ),
//             const SizedBox(height: 4),
//             Text(
//               value,
//               style: const TextStyle(
//                 color: Colors.white,
//                 fontSize: 20,
//                 fontWeight: FontWeight.bold,
//                 height: 1.1,
//               ),
//             ),
//             if (unit.isNotEmpty)
//               Text(
//                 unit,
//                 style: TextStyle(
//                   color: Colors.white.withOpacity(0.7),
//                   fontSize: 11,
//                 ),
//               ),
//           ],
//         ),
//       ),
//     );
//   }

//   Widget _buildDaySelector(
//     BuildContext context,
//     List<PlanDayModel> days,
//     int selectedIndex,
//   ) {
//     return SizedBox(
//       height: 100,
//       child: ListView.builder(
//         scrollDirection: Axis.horizontal,
//         padding: const EdgeInsets.symmetric(horizontal: 16),
//         itemCount: days.length,
//         itemBuilder: (ctx, i) {
//           final day = days[i];
//           final isSelected = i == selectedIndex;
//           final isRest = day.exercises.isEmpty;
//           return GestureDetector(
//             onTap: () => context.read<PlanCubit>().selectDay(i),
//             child: AnimatedContainer(
//               duration: const Duration(milliseconds: 200),
//               width: 90,
//               margin: const EdgeInsets.symmetric(horizontal: 4),
//               decoration: BoxDecoration(
//                 color: Colors.white,
//                 borderRadius: BorderRadius.circular(16),
//                 border: Border.all(
//                   color: isSelected
//                       ? const Color(0xFF1A3A8F)
//                       : Colors.grey.shade200,
//                   width: isSelected ? 2 : 1,
//                 ),
//                 boxShadow: isSelected
//                     ? [
//                         BoxShadow(
//                           color: const Color(0xFF1A3A8F).withOpacity(0.15),
//                           blurRadius: 8,
//                           offset: const Offset(0, 3),
//                         ),
//                       ]
//                     : null,
//               ),
//               child: Column(
//                 mainAxisAlignment: MainAxisAlignment.center,
//                 children: [
//                   Text(
//                     'DAY ${day.dayNumber}',
//                     style: TextStyle(
//                       fontSize: 10,
//                       fontWeight: FontWeight.bold,
//                       color: isSelected ? const Color(0xFF1A3A8F) : Colors.grey,
//                       letterSpacing: 0.5,
//                     ),
//                   ),
//                   const SizedBox(height: 4),
//                   Text(
//                     isRest
//                         ? 'Rest'
//                         : (day.dayName?.isNotEmpty == true
//                               ? day.dayName!
//                               : _guessMuscleName(day)),
//                     style: TextStyle(
//                       fontSize: 14,
//                       fontWeight: FontWeight.bold,
//                       color: isSelected
//                           ? const Color(0xFF1A3A8F)
//                           : Colors.black87,
//                     ),
//                     textAlign: TextAlign.center,
//                     maxLines: 2,
//                     overflow: TextOverflow.ellipsis,
//                   ),
//                   const SizedBox(height: 6),
//                   if (isSelected && !isRest)
//                     const Icon(
//                       Icons.check_circle_rounded,
//                       color: Color(0xFF1A3A8F),
//                       size: 18,
//                     )
//                   else if (isRest)
//                     Icon(
//                       Icons.bedtime_outlined,
//                       color: Colors.grey.shade400,
//                       size: 18,
//                     ),
//                 ],
//               ),
//             ),
//           );
//         },
//       ),
//     );
//   }

//   Widget _buildExerciseCard(PlanExerciseModel ex) {
//     return GestureDetector(
//       onTap: () => ExerciseDetailSheet.show(context, ex),
//       child: Container(
//         margin: const EdgeInsets.fromLTRB(20, 0, 20, 12),
//         decoration: BoxDecoration(
//           color: Colors.white,
//           borderRadius: BorderRadius.circular(16),
//           boxShadow: [
//             BoxShadow(
//               color: Colors.grey.withOpacity(0.08),
//               blurRadius: 10,
//               offset: const Offset(0, 3),
//             ),
//           ],
//         ),
//         child: Padding(
//           padding: const EdgeInsets.all(16),
//           child: Row(
//             children: [
//               ClipRRect(
//                 borderRadius: BorderRadius.circular(12),
//                 child: Container(
//                   width: 70,
//                   height: 70,
//                   color: const Color(0xFF1A3A8F).withOpacity(0.08),
//                   child: const Icon(
//                     Icons.fitness_center_rounded,
//                     color: Color(0xFF1A3A8F),
//                     size: 30,
//                   ),
//                 ),
//               ),
//               const SizedBox(width: 14),
//               Expanded(
//                 child: Column(
//                   crossAxisAlignment: CrossAxisAlignment.start,
//                   children: [
//                     Row(
//                       children: [
//                         Expanded(
//                           child: Text(
//                             ex.exerciseName ?? 'Exercise',
//                             style: const TextStyle(
//                               fontSize: 16,
//                               fontWeight: FontWeight.bold,
//                               color: Color(0xFF1A1A2E),
//                             ),
//                           ),
//                         ),
//                         if (ex.muscleGroup != null) ...[
//                           const SizedBox(width: 6),
//                           Container(
//                             padding: const EdgeInsets.symmetric(
//                               horizontal: 8,
//                               vertical: 3,
//                             ),
//                             decoration: BoxDecoration(
//                               color: const Color(0xFF1A3A8F).withOpacity(0.1),
//                               borderRadius: BorderRadius.circular(6),
//                             ),
//                             child: Text(
//                               ex.muscleGroup!.toUpperCase(),
//                               style: const TextStyle(
//                                 color: Color(0xFF1A3A8F),
//                                 fontSize: 9,
//                                 fontWeight: FontWeight.bold,
//                                 letterSpacing: 0.5,
//                               ),
//                             ),
//                           ),
//                         ],
//                       ],
//                     ),
//                     const SizedBox(height: 10),
//                     Row(
//                       children: [
//                         _exerciseStat(
//                           'SETS',
//                           '${ex.sets ?? "—"} × ${ex.reps ?? "—"}',
//                         ),
//                         const SizedBox(width: 18),
//                         _exerciseStat('REST', ex.restDisplay),
//                       ],
//                     ),
//                   ],
//                 ),
//               ),
//               const SizedBox(width: 8),
//               const Icon(
//                 Icons.chevron_right_rounded,
//                 color: Colors.grey,
//                 size: 20,
//               ),
//             ],
//           ),
//         ),
//       ),
//     );
//   }

//   Widget _exerciseStat(String label, String value) {
//     return Column(
//       crossAxisAlignment: CrossAxisAlignment.start,
//       children: [
//         Text(
//           label,
//           style: const TextStyle(
//             color: Colors.grey,
//             fontSize: 10,
//             fontWeight: FontWeight.w600,
//             letterSpacing: 0.5,
//           ),
//         ),
//         const SizedBox(height: 2),
//         Text(
//           value,
//           style: const TextStyle(
//             color: Color(0xFF1A3A8F),
//             fontSize: 15,
//             fontWeight: FontWeight.bold,
//           ),
//         ),
//       ],
//     );
//   }

//   Widget _buildRestDay() {
//     return Padding(
//       padding: const EdgeInsets.symmetric(horizontal: 20),
//       child: Container(
//         width: double.infinity,
//         padding: const EdgeInsets.all(32),
//         decoration: BoxDecoration(
//           color: Colors.grey.shade50,
//           borderRadius: BorderRadius.circular(18),
//           border: Border.all(color: Colors.grey.shade200),
//         ),
//         child: Column(
//           children: [
//             Icon(Icons.bedtime_outlined, size: 48, color: Colors.grey.shade400),
//             const SizedBox(height: 12),
//             Text(
//               'Rest Day',
//               style: TextStyle(
//                 fontSize: 18,
//                 fontWeight: FontWeight.bold,
//                 color: Colors.grey.shade500,
//               ),
//             ),
//             const SizedBox(height: 6),
//             Text(
//               'Recovery is part of the process 💪',
//               style: TextStyle(color: Colors.grey.shade400, fontSize: 13),
//             ),
//           ],
//         ),
//       ),
//     );
//   }

//   // ─── NUTRITION TAB ─────────────────────────────────────────────
//   Widget _buildNutritionTab(BuildContext context, PlanState state) {
//     if (state is NutritionPlanLoading || state is NutritionPlanGenerating) {
//       return const Center(
//         child: CircularProgressIndicator(color: Color(0xFF1A3A8F)),
//       );
//     }
//     if (state is NutritionPlanError) {
//       return _buildError(
//         context,
//         state.message,
//         () => context.read<PlanCubit>().fetchNutritionPlan(),
//       );
//     }
//     if (state is NutritionPlanLoaded) {
//       if (state.allPlans.isEmpty) return _buildEmptyNutrition(context);
//       return _buildNutritionContent(context, state);
//     }
//     return _buildEmptyNutrition(context);
//   }

//   Widget _buildNutritionContent(
//     BuildContext context,
//     NutritionPlanLoaded state,
//   ) {
//     final plan = state.activePlan!;
//     return RefreshIndicator(
//       color: const Color(0xFF1A3A8F),
//       onRefresh: () => context.read<PlanCubit>().fetchNutritionPlan(),
//       child: SingleChildScrollView(
//         physics: const AlwaysScrollableScrollPhysics(),
//         padding: const EdgeInsets.symmetric(horizontal: 20),
//         child: Column(
//           crossAxisAlignment: CrossAxisAlignment.start,
//           children: [
//             _buildNutritionHeroCard(plan),
//             const SizedBox(height: 20),
//             _buildMacrosRow(plan),
//             if (plan.days.isNotEmpty) ...[
//               const SizedBox(height: 20),
//               const Text(
//                 'Meal Schedule',
//                 style: TextStyle(
//                   fontSize: 18,
//                   fontWeight: FontWeight.bold,
//                   color: Color(0xFF1A1A2E),
//                 ),
//               ),
//               const SizedBox(height: 12),
//               ...plan.days.map((d) => _buildNutritionDayCard(d)),
//             ],
//             const SizedBox(height: 24),
//           ],
//         ),
//       ),
//     );
//   }

//   Widget _buildNutritionHeroCard(NutritionPlanModel plan) {
//     return Container(
//       width: double.infinity,
//       padding: const EdgeInsets.all(22),
//       decoration: BoxDecoration(
//         color: const Color(0xFF1B6B3A),
//         borderRadius: BorderRadius.circular(20),
//       ),
//       child: Column(
//         crossAxisAlignment: CrossAxisAlignment.start,
//         children: [
//           Row(
//             mainAxisAlignment: MainAxisAlignment.spaceBetween,
//             children: [
//               Container(
//                 padding: const EdgeInsets.symmetric(
//                   horizontal: 10,
//                   vertical: 4,
//                 ),
//                 decoration: BoxDecoration(
//                   color: Colors.white.withOpacity(0.2),
//                   borderRadius: BorderRadius.circular(8),
//                 ),
//                 child: const Text(
//                   'ACTIVE',
//                   style: TextStyle(
//                     color: Colors.white,
//                     fontSize: 11,
//                     fontWeight: FontWeight.bold,
//                     letterSpacing: 1.2,
//                   ),
//                 ),
//               ),
//               Icon(
//                 Icons.restaurant_rounded,
//                 color: Colors.white.withOpacity(0.7),
//                 size: 22,
//               ),
//             ],
//           ),
//           const SizedBox(height: 12),
//           Text(
//             plan.planName,
//             style: const TextStyle(
//               color: Colors.white,
//               fontSize: 24,
//               fontWeight: FontWeight.bold,
//             ),
//           ),
//           if (plan.description != null) ...[
//             const SizedBox(height: 6),
//             Text(
//               plan.description!,
//               style: TextStyle(
//                 color: Colors.white.withOpacity(0.7),
//                 fontSize: 13,
//               ),
//             ),
//           ],
//           const SizedBox(height: 16),
//           Row(
//             children: [
//               _nutritionStatBox('🔥', plan.caloriesDisplay, 'Calories'),
//               const SizedBox(width: 8),
//               _nutritionStatBox('💪', plan.proteinDisplay, 'Protein'),
//               const SizedBox(width: 8),
//               _nutritionStatBox('🌾', plan.carbsDisplay, 'Carbs'),
//               const SizedBox(width: 8),
//               _nutritionStatBox('🥑', plan.fatDisplay, 'Fat'),
//             ],
//           ),
//         ],
//       ),
//     );
//   }

//   Widget _nutritionStatBox(String emoji, String value, String label) {
//     return Expanded(
//       child: Container(
//         padding: const EdgeInsets.symmetric(vertical: 10, horizontal: 6),
//         decoration: BoxDecoration(
//           color: Colors.white.withOpacity(0.15),
//           borderRadius: BorderRadius.circular(12),
//         ),
//         child: Column(
//           children: [
//             Text(emoji, style: const TextStyle(fontSize: 14)),
//             const SizedBox(height: 3),
//             Text(
//               value,
//               style: const TextStyle(
//                 color: Colors.white,
//                 fontWeight: FontWeight.bold,
//                 fontSize: 12,
//               ),
//             ),
//             Text(
//               label,
//               style: TextStyle(
//                 color: Colors.white.withOpacity(0.7),
//                 fontSize: 9,
//               ),
//             ),
//           ],
//         ),
//       ),
//     );
//   }

//   Widget _buildMacrosRow(NutritionPlanModel plan) {
//     return Container(
//       padding: const EdgeInsets.all(18),
//       decoration: BoxDecoration(
//         color: Colors.white,
//         borderRadius: BorderRadius.circular(18),
//         boxShadow: [
//           BoxShadow(
//             color: Colors.grey.withOpacity(0.07),
//             blurRadius: 10,
//             offset: const Offset(0, 3),
//           ),
//         ],
//       ),
//       child: Column(
//         crossAxisAlignment: CrossAxisAlignment.start,
//         children: [
//           const Text(
//             'Daily Macros',
//             style: TextStyle(
//               fontWeight: FontWeight.bold,
//               fontSize: 15,
//               color: Color(0xFF1A1A2E),
//             ),
//           ),
//           const SizedBox(height: 14),
//           if (plan.dailyCalories != null)
//             _macroBar('Calories', plan.dailyCalories!, 2500, Colors.orange),
//           if (plan.proteinGrams != null)
//             _macroBar(
//               'Protein (g)',
//               plan.proteinGrams!,
//               200,
//               const Color(0xFF1A3A8F),
//             ),
//           if (plan.carbsGrams != null)
//             _macroBar(
//               'Carbs (g)',
//               plan.carbsGrams!,
//               300,
//               const Color(0xFF1B6B3A),
//             ),
//           if (plan.fatGrams != null)
//             _macroBar('Fat (g)', plan.fatGrams!, 80, Colors.purple),
//           if (plan.dailyCalories == null && plan.proteinGrams == null)
//             const Center(
//               child: Padding(
//                 padding: EdgeInsets.all(12),
//                 child: Text(
//                   'Macro details not available',
//                   style: TextStyle(color: Colors.grey),
//                 ),
//               ),
//             ),
//         ],
//       ),
//     );
//   }

//   Widget _macroBar(String label, int value, int max, Color color) {
//     final progress = (value / max).clamp(0.0, 1.0);
//     return Padding(
//       padding: const EdgeInsets.only(bottom: 12),
//       child: Column(
//         children: [
//           Row(
//             mainAxisAlignment: MainAxisAlignment.spaceBetween,
//             children: [
//               Text(
//                 label,
//                 style: const TextStyle(color: Colors.black87, fontSize: 13),
//               ),
//               Text(
//                 '$value',
//                 style: TextStyle(
//                   color: color,
//                   fontWeight: FontWeight.bold,
//                   fontSize: 13,
//                 ),
//               ),
//             ],
//           ),
//           const SizedBox(height: 6),
//           ClipRRect(
//             borderRadius: BorderRadius.circular(6),
//             child: LinearProgressIndicator(
//               value: progress,
//               backgroundColor: Colors.grey.shade100,
//               valueColor: AlwaysStoppedAnimation<Color>(color),
//               minHeight: 8,
//             ),
//           ),
//         ],
//       ),
//     );
//   }

//   Widget _buildNutritionDayCard(NutritionDayModel day) {
//     return Container(
//       margin: const EdgeInsets.only(bottom: 12),
//       decoration: BoxDecoration(
//         color: Colors.white,
//         borderRadius: BorderRadius.circular(16),
//         boxShadow: [
//           BoxShadow(
//             color: Colors.grey.withOpacity(0.06),
//             blurRadius: 8,
//             offset: const Offset(0, 2),
//           ),
//         ],
//       ),
//       child: Theme(
//         data: Theme.of(context).copyWith(dividerColor: Colors.transparent),
//         child: ExpansionTile(
//           tilePadding: const EdgeInsets.symmetric(horizontal: 16, vertical: 4),
//           leading: Container(
//             width: 38,
//             height: 38,
//             decoration: BoxDecoration(
//               color: const Color(0xFF1B6B3A).withOpacity(0.1),
//               borderRadius: BorderRadius.circular(10),
//             ),
//             child: const Icon(
//               Icons.restaurant_rounded,
//               color: Color(0xFF1B6B3A),
//               size: 18,
//             ),
//           ),
//           title: Text(
//             day.displayName,
//             style: const TextStyle(
//               fontWeight: FontWeight.bold,
//               fontSize: 14,
//               color: Color(0xFF1A1A2E),
//             ),
//           ),
//           subtitle: Text(
//             '${day.meals.length} meals',
//             style: const TextStyle(color: Colors.grey, fontSize: 12),
//           ),
//           shape: RoundedRectangleBorder(
//             borderRadius: BorderRadius.circular(16),
//           ),
//           collapsedShape: RoundedRectangleBorder(
//             borderRadius: BorderRadius.circular(16),
//           ),
//           children: day.meals.map((m) => _buildMealTile(m)).toList(),
//         ),
//       ),
//     );
//   }

//   Widget _buildMealTile(NutritionMealModel meal) {
//     return Padding(
//       padding: const EdgeInsets.fromLTRB(16, 0, 16, 12),
//       child: Container(
//         padding: const EdgeInsets.all(14),
//         decoration: BoxDecoration(
//           color: const Color(0xFFF6F8FF),
//           borderRadius: BorderRadius.circular(12),
//         ),
//         child: Row(
//           children: [
//             Expanded(
//               child: Column(
//                 crossAxisAlignment: CrossAxisAlignment.start,
//                 children: [
//                   Text(
//                     meal.mealType,
//                     style: const TextStyle(
//                       fontWeight: FontWeight.bold,
//                       fontSize: 13,
//                       color: Color(0xFF1A1A2E),
//                     ),
//                   ),
//                   if (meal.description != null) ...[
//                     const SizedBox(height: 3),
//                     Text(
//                       meal.description!,
//                       style: const TextStyle(color: Colors.grey, fontSize: 12),
//                     ),
//                   ],
//                   if (meal.foods.isNotEmpty) ...[
//                     const SizedBox(height: 6),
//                     Wrap(
//                       spacing: 6,
//                       runSpacing: 4,
//                       children: meal.foods
//                           .map(
//                             (f) => Container(
//                               padding: const EdgeInsets.symmetric(
//                                 horizontal: 8,
//                                 vertical: 3,
//                               ),
//                               decoration: BoxDecoration(
//                                 color: const Color(0xFF1B6B3A).withOpacity(0.1),
//                                 borderRadius: BorderRadius.circular(8),
//                               ),
//                               child: Text(
//                                 f,
//                                 style: const TextStyle(
//                                   color: Color(0xFF1B6B3A),
//                                   fontSize: 11,
//                                 ),
//                               ),
//                             ),
//                           )
//                           .toList(),
//                     ),
//                   ],
//                 ],
//               ),
//             ),
//             if (meal.calories != null)
//               Container(
//                 padding: const EdgeInsets.symmetric(
//                   horizontal: 10,
//                   vertical: 5,
//                 ),
//                 decoration: BoxDecoration(
//                   color: Colors.orange.withOpacity(0.1),
//                   borderRadius: BorderRadius.circular(10),
//                 ),
//                 child: Text(
//                   '${meal.calories} kcal',
//                   style: const TextStyle(
//                     color: Colors.orange,
//                     fontWeight: FontWeight.bold,
//                     fontSize: 12,
//                   ),
//                 ),
//               ),
//           ],
//         ),
//       ),
//     );
//   }

//   // ─── EMPTY STATES ──────────────────────────────────────────────
//   Widget _buildEmptyWorkout(BuildContext context) {
//     return Center(
//       child: Padding(
//         padding: const EdgeInsets.all(32),
//         child: Column(
//           mainAxisAlignment: MainAxisAlignment.center,
//           children: [
//             Container(
//               width: 90,
//               height: 90,
//               decoration: BoxDecoration(
//                 color: const Color(0xFF1A3A8F).withOpacity(0.08),
//                 shape: BoxShape.circle,
//               ),
//               child: const Icon(
//                 Icons.fitness_center_rounded,
//                 color: Color(0xFF1A3A8F),
//                 size: 44,
//               ),
//             ),
//             const SizedBox(height: 20),
//             const Text(
//               'No Workout Plan Yet',
//               style: TextStyle(fontSize: 18, fontWeight: FontWeight.bold),
//             ),
//             const SizedBox(height: 8),
//             const Text(
//               'Generate a personalized AI workout plan\nbased on your fitness goals.',
//               textAlign: TextAlign.center,
//               style: TextStyle(color: Colors.grey, fontSize: 14),
//             ),
//             const SizedBox(height: 24),
//             ElevatedButton.icon(
//               onPressed: () => _showGenerateWorkoutDialog(context),
//               icon: const Icon(Icons.auto_awesome, size: 18),
//               label: const Text(
//                 'Generate Workout Plan',
//                 style: TextStyle(fontWeight: FontWeight.bold),
//               ),
//               style: ElevatedButton.styleFrom(
//                 backgroundColor: const Color(0xFF1A3A8F),
//                 foregroundColor: Colors.white,
//                 elevation: 0,
//                 padding: const EdgeInsets.symmetric(
//                   horizontal: 24,
//                   vertical: 14,
//                 ),
//                 shape: RoundedRectangleBorder(
//                   borderRadius: BorderRadius.circular(14),
//                 ),
//               ),
//             ),
//           ],
//         ),
//       ),
//     );
//   }

//   Widget _buildEmptyNutrition(BuildContext context) {
//     return Center(
//       child: Padding(
//         padding: const EdgeInsets.all(32),
//         child: Column(
//           mainAxisAlignment: MainAxisAlignment.center,
//           children: [
//             Container(
//               width: 90,
//               height: 90,
//               decoration: BoxDecoration(
//                 color: const Color(0xFF1B6B3A).withOpacity(0.08),
//                 shape: BoxShape.circle,
//               ),
//               child: const Icon(
//                 Icons.restaurant_rounded,
//                 color: Color(0xFF1B6B3A),
//                 size: 44,
//               ),
//             ),
//             const SizedBox(height: 20),
//             const Text(
//               'No Nutrition Plan Yet',
//               style: TextStyle(fontSize: 18, fontWeight: FontWeight.bold),
//             ),
//             const SizedBox(height: 8),
//             const Text(
//               'Generate a personalized AI nutrition plan\ntailored to your goals.',
//               textAlign: TextAlign.center,
//               style: TextStyle(color: Colors.grey, fontSize: 14),
//             ),
//             const SizedBox(height: 24),
//             ElevatedButton.icon(
//               onPressed: () => _showGenerateNutritionDialog(context),
//               icon: const Icon(Icons.auto_awesome, size: 18),
//               label: const Text(
//                 'Generate Nutrition Plan',
//                 style: TextStyle(fontWeight: FontWeight.bold),
//               ),
//               style: ElevatedButton.styleFrom(
//                 backgroundColor: const Color(0xFF1B6B3A),
//                 foregroundColor: Colors.white,
//                 elevation: 0,
//                 padding: const EdgeInsets.symmetric(
//                   horizontal: 24,
//                   vertical: 14,
//                 ),
//                 shape: RoundedRectangleBorder(
//                   borderRadius: BorderRadius.circular(14),
//                 ),
//               ),
//             ),
//           ],
//         ),
//       ),
//     );
//   }

//   // ─── GENERATE DIALOGS ──────────────────────────────────────────
//   void _showGenerateOptions(BuildContext context) {
//     showModalBottomSheet(
//       context: context,
//       backgroundColor: Colors.transparent,
//       builder: (_) => Container(
//         decoration: const BoxDecoration(
//           color: Colors.white,
//           borderRadius: BorderRadius.vertical(top: Radius.circular(28)),
//         ),
//         padding: const EdgeInsets.all(24),
//         child: Column(
//           mainAxisSize: MainAxisSize.min,
//           children: [
//             Container(
//               width: 40,
//               height: 4,
//               decoration: BoxDecoration(
//                 color: Colors.grey.shade300,
//                 borderRadius: BorderRadius.circular(2),
//               ),
//             ),
//             const SizedBox(height: 20),
//             const Text(
//               'Generate AI Plan',
//               style: TextStyle(fontSize: 18, fontWeight: FontWeight.bold),
//             ),
//             const SizedBox(height: 20),
//             _genOption(
//               icon: Icons.fitness_center_rounded,
//               color: const Color(0xFF1A3A8F),
//               title: 'Workout Plan',
//               subtitle: 'AI-personalized training schedule',
//               onTap: () {
//                 Navigator.pop(context);
//                 _showGenerateWorkoutDialog(context);
//               },
//             ),
//             const SizedBox(height: 12),
//             _genOption(
//               icon: Icons.restaurant_rounded,
//               color: const Color(0xFF1B6B3A),
//               title: 'Nutrition Plan',
//               subtitle: 'AI-tailored daily meal plan',
//               onTap: () {
//                 Navigator.pop(context);
//                 _showGenerateNutritionDialog(context);
//               },
//             ),
//             const SizedBox(height: 8),
//           ],
//         ),
//       ),
//     );
//   }

//   Widget _genOption({
//     required IconData icon,
//     required Color color,
//     required String title,
//     required String subtitle,
//     required VoidCallback onTap,
//   }) {
//     return GestureDetector(
//       onTap: onTap,
//       child: Container(
//         padding: const EdgeInsets.all(16),
//         decoration: BoxDecoration(
//           color: color.withOpacity(0.05),
//           borderRadius: BorderRadius.circular(16),
//           border: Border.all(color: color.withOpacity(0.2)),
//         ),
//         child: Row(
//           children: [
//             Container(
//               padding: const EdgeInsets.all(10),
//               decoration: BoxDecoration(
//                 color: color.withOpacity(0.1),
//                 borderRadius: BorderRadius.circular(12),
//               ),
//               child: Icon(icon, color: color, size: 22),
//             ),
//             const SizedBox(width: 14),
//             Expanded(
//               child: Column(
//                 crossAxisAlignment: CrossAxisAlignment.start,
//                 children: [
//                   Text(
//                     title,
//                     style: const TextStyle(
//                       fontWeight: FontWeight.bold,
//                       fontSize: 15,
//                     ),
//                   ),
//                   Text(
//                     subtitle,
//                     style: const TextStyle(color: Colors.grey, fontSize: 12),
//                   ),
//                 ],
//               ),
//             ),
//             Icon(Icons.arrow_forward_ios_rounded, color: color, size: 16),
//           ],
//         ),
//       ),
//     );
//   }

//   void _showGenerateWorkoutDialog(BuildContext context) {
//     final planCubit = context.read<PlanCubit>();
//     String selectedLevel = 'Beginner';
//     String selectedGoal = 'Weight Loss';
//     int selectedDays = 3;
//     showDialog(
//       context: context,
//       builder: (_) => StatefulBuilder(
//         builder: (ctx, setState) => AlertDialog(
//           shape: RoundedRectangleBorder(
//             borderRadius: BorderRadius.circular(24),
//           ),
//           title: const Row(
//             children: [
//               Icon(Icons.fitness_center_rounded, color: Color(0xFF1A3A8F)),
//               SizedBox(width: 10),
//               Text('Workout Plan', style: TextStyle(fontSize: 16)),
//             ],
//           ),
//           content: SingleChildScrollView(
//             child: Column(
//               mainAxisSize: MainAxisSize.min,
//               crossAxisAlignment: CrossAxisAlignment.start,
//               children: [
//                 const Text(
//                   'Fitness Level',
//                   style: TextStyle(fontWeight: FontWeight.w600, fontSize: 13),
//                 ),
//                 const SizedBox(height: 8),
//                 Wrap(
//                   spacing: 8,
//                   children: ['Beginner', 'Intermediate', 'Advanced']
//                       .map(
//                         (l) => ChoiceChip(
//                           label: Text(l),
//                           selected: selectedLevel == l,
//                           selectedColor: const Color(0xFF1A3A8F),
//                           labelStyle: TextStyle(
//                             color: selectedLevel == l
//                                 ? Colors.white
//                                 : Colors.black87,
//                             fontSize: 12,
//                           ),
//                           onSelected: (_) => setState(() => selectedLevel = l),
//                         ),
//                       )
//                       .toList(),
//                 ),
//                 const SizedBox(height: 16),
//                 const Text(
//                   'Goal',
//                   style: TextStyle(fontWeight: FontWeight.w600, fontSize: 13),
//                 ),
//                 const SizedBox(height: 8),
//                 Wrap(
//                   spacing: 8,
//                   runSpacing: 6,
//                   children:
//                       ['Weight Loss', 'Muscle Gain', 'Endurance', 'Strength']
//                           .map(
//                             (g) => ChoiceChip(
//                               label: Text(
//                                 g,
//                                 style: const TextStyle(fontSize: 12),
//                               ),
//                               selected: selectedGoal == g,
//                               selectedColor: const Color(0xFF1A3A8F),
//                               labelStyle: TextStyle(
//                                 color: selectedGoal == g
//                                     ? Colors.white
//                                     : Colors.black87,
//                               ),
//                               onSelected: (_) =>
//                                   setState(() => selectedGoal = g),
//                             ),
//                           )
//                           .toList(),
//                 ),
//                 const SizedBox(height: 16),
//                 const Text(
//                   'Days per Week',
//                   style: TextStyle(fontWeight: FontWeight.w600, fontSize: 13),
//                 ),
//                 const SizedBox(height: 8),
//                 Wrap(
//                   spacing: 8,
//                   children: [2, 3, 4, 5, 6]
//                       .map(
//                         (d) => ChoiceChip(
//                           label: Text('$d'),
//                           selected: selectedDays == d,
//                           selectedColor: const Color(0xFF1A3A8F),
//                           labelStyle: TextStyle(
//                             color: selectedDays == d
//                                 ? Colors.white
//                                 : Colors.black87,
//                           ),
//                           onSelected: (_) => setState(() => selectedDays = d),
//                         ),
//                       )
//                       .toList(),
//                 ),
//               ],
//             ),
//           ),
//           actions: [
//             TextButton(
//               onPressed: () => Navigator.pop(ctx),
//               child: const Text('Cancel', style: TextStyle(color: Colors.grey)),
//             ),
//             ElevatedButton.icon(
//               onPressed: () {
//                 Navigator.pop(ctx);
//                 planCubit.generateWorkoutPlan(
//                   fitnessLevel: selectedLevel,
//                   goal: selectedGoal,
//                   daysPerWeek: selectedDays,
//                   forceRegenerate: true,
//                 );
//               },
//               icon: const Icon(Icons.auto_awesome, size: 16),
//               label: const Text('Generate'),
//               style: ElevatedButton.styleFrom(
//                 backgroundColor: const Color(0xFF1A3A8F),
//                 foregroundColor: Colors.white,
//                 shape: RoundedRectangleBorder(
//                   borderRadius: BorderRadius.circular(10),
//                 ),
//               ),
//             ),
//           ],
//         ),
//       ),
//     );
//   }

//   void _showGenerateNutritionDialog(BuildContext context) {
//     final planCubit = context.read<PlanCubit>();
//     final nameCtrl = TextEditingController(
//       text: 'Nutrition Plan ${DateTime.now().month}/${DateTime.now().day}',
//     );
//     String selectedGoal = 'Weight Loss';
//     showDialog(
//       context: context,
//       builder: (_) => StatefulBuilder(
//         builder: (ctx, setState) => AlertDialog(
//           shape: RoundedRectangleBorder(
//             borderRadius: BorderRadius.circular(24),
//           ),
//           title: const Row(
//             children: [
//               Icon(Icons.restaurant_rounded, color: Color(0xFF1B6B3A)),
//               SizedBox(width: 10),
//               Text('Nutrition Plan', style: TextStyle(fontSize: 16)),
//             ],
//           ),
//           content: SingleChildScrollView(
//             child: Column(
//               mainAxisSize: MainAxisSize.min,
//               crossAxisAlignment: CrossAxisAlignment.start,
//               children: [
//                 const Text(
//                   'Plan Name',
//                   style: TextStyle(fontWeight: FontWeight.w600, fontSize: 13),
//                 ),
//                 const SizedBox(height: 8),
//                 TextField(
//                   controller: nameCtrl,
//                   decoration: InputDecoration(
//                     filled: true,
//                     fillColor: const Color(0xFFF4F6FB),
//                     border: OutlineInputBorder(
//                       borderRadius: BorderRadius.circular(12),
//                       borderSide: BorderSide.none,
//                     ),
//                     contentPadding: const EdgeInsets.symmetric(
//                       horizontal: 14,
//                       vertical: 12,
//                     ),
//                   ),
//                 ),
//                 const SizedBox(height: 16),
//                 const Text(
//                   'Goal',
//                   style: TextStyle(fontWeight: FontWeight.w600, fontSize: 13),
//                 ),
//                 const SizedBox(height: 8),
//                 Wrap(
//                   spacing: 8,
//                   runSpacing: 6,
//                   children:
//                       ['Weight Loss', 'Muscle Gain', 'Maintenance', 'Bulking']
//                           .map(
//                             (g) => ChoiceChip(
//                               label: Text(
//                                 g,
//                                 style: const TextStyle(fontSize: 12),
//                               ),
//                               selected: selectedGoal == g,
//                               selectedColor: const Color(0xFF1B6B3A),
//                               labelStyle: TextStyle(
//                                 color: selectedGoal == g
//                                     ? Colors.white
//                                     : Colors.black87,
//                               ),
//                               onSelected: (_) =>
//                                   setState(() => selectedGoal = g),
//                             ),
//                           )
//                           .toList(),
//                 ),
//               ],
//             ),
//           ),
//           actions: [
//             TextButton(
//               onPressed: () => Navigator.pop(ctx),
//               child: const Text('Cancel', style: TextStyle(color: Colors.grey)),
//             ),
//             ElevatedButton.icon(
//               onPressed: () {
//                 if (nameCtrl.text.trim().isEmpty) return;
//                 Navigator.pop(ctx);
//                 planCubit.generateNutritionPlan(
//                   planName: nameCtrl.text.trim(),
//                   dietaryPreferences: selectedGoal,
//                 );
//               },
//               icon: const Icon(Icons.auto_awesome, size: 16),
//               label: const Text('Generate'),
//               style: ElevatedButton.styleFrom(
//                 backgroundColor: const Color(0xFF1B6B3A),
//                 foregroundColor: Colors.white,
//                 shape: RoundedRectangleBorder(
//                   borderRadius: BorderRadius.circular(10),
//                 ),
//               ),
//             ),
//           ],
//         ),
//       ),
//     );
//   }

//   // ─── HELPERS ───────────────────────────────────────────────────
//   Widget _buildError(
//     BuildContext context,
//     String message,
//     VoidCallback onRetry,
//   ) {
//     return Center(
//       child: Padding(
//         padding: const EdgeInsets.all(24),
//         child: Column(
//           mainAxisAlignment: MainAxisAlignment.center,
//           children: [
//             Icon(Icons.wifi_off_rounded, size: 64, color: Colors.grey.shade300),
//             const SizedBox(height: 16),
//             Text(
//               message,
//               textAlign: TextAlign.center,
//               style: const TextStyle(color: Colors.grey, fontSize: 14),
//             ),
//             const SizedBox(height: 24),
//             ElevatedButton.icon(
//               onPressed: onRetry,
//               icon: const Icon(Icons.refresh_rounded),
//               label: const Text('Try Again'),
//               style: ElevatedButton.styleFrom(
//                 backgroundColor: const Color(0xFF1A3A8F),
//                 foregroundColor: Colors.white,
//                 shape: RoundedRectangleBorder(
//                   borderRadius: BorderRadius.circular(12),
//                 ),
//                 padding: const EdgeInsets.symmetric(
//                   horizontal: 24,
//                   vertical: 12,
//                 ),
//               ),
//             ),
//           ],
//         ),
//       ),
//     );
//   }

//   void _confirmDelete(BuildContext context, int planId) {
//     showDialog(
//       context: context,
//       builder: (_) => AlertDialog(
//         shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(20)),
//         title: const Text(
//           'Delete Plan',
//           style: TextStyle(fontWeight: FontWeight.bold),
//         ),
//         content: const Text('Are you sure you want to delete this plan?'),
//         actions: [
//           TextButton(
//             onPressed: () => Navigator.pop(context),
//             child: const Text('Cancel', style: TextStyle(color: Colors.grey)),
//           ),
//           ElevatedButton(
//             onPressed: () {
//               Navigator.pop(context);
//               context.read<PlanCubit>().deletePlan(planId);
//             },
//             style: ElevatedButton.styleFrom(
//               backgroundColor: Colors.redAccent,
//               shape: RoundedRectangleBorder(
//                 borderRadius: BorderRadius.circular(10),
//               ),
//             ),
//             child: const Text('Delete', style: TextStyle(color: Colors.white)),
//           ),
//         ],
//       ),
//     );
//   }

//   List<String> _getDayLabels(int daysPerWeek) {
//     final all = ['S', 'M', 'T', 'W', 'T', 'F', 'S'];
//     if (daysPerWeek <= 0 || daysPerWeek > 7) return all.take(5).toList();
//     return all.take(daysPerWeek).toList();
//   }

//   String _guessMuscleName(PlanDayModel day) {
//     if (day.exercises.isEmpty) return 'Rest';
//     final groups = day.exercises
//         .map((e) => e.muscleGroup ?? '')
//         .where((g) => g.isNotEmpty)
//         .toList();
//     if (groups.isEmpty) return 'Day ${day.dayNumber}';
//     final freq = <String, int>{};
//     for (final g in groups) freq[g] = (freq[g] ?? 0) + 1;
//     return freq.entries.reduce((a, b) => a.value >= b.value ? a : b).key;
//   }
// }

//-----------------------------------------------------------------------------------------------------//

//ge.//

// import 'package:flutter/material.dart';
// import 'package:one/features/generate_nutrition/ui/generate_nutrition_screen.dart';
// import 'package:one/features/generate_plan/ui/generate_plan_screen.dart';
// import 'exercise_detail_sheet.dart';
// import 'package:flutter_bloc/flutter_bloc.dart';
// import '../cubit/plan_cubit.dart';
// import '../cubit/plan_state.dart';
// import '../model/plan_model.dart';
// import '../model/nutrition_plan_model.dart';

// class PlanScreen extends StatelessWidget {
//   const PlanScreen({super.key});

//   @override
//   Widget build(BuildContext context) {
//     return BlocProvider(
//       create: (_) => PlanCubit()..fetchPlans(),
//       child: const _PlanView(),
//     );
//   }
// }

// class _PlanView extends StatefulWidget {
//   const _PlanView();

//   @override
//   State<_PlanView> createState() => _PlanViewState();
// }

// class _PlanViewState extends State<_PlanView>
//     with SingleTickerProviderStateMixin {
//   late TabController _tabController;

//   @override
//   void initState() {
//     super.initState();
//     _tabController = TabController(length: 2, vsync: this);
//   }

//   @override
//   void dispose() {
//     _tabController.dispose();
//     super.dispose();
//   }

//   @override
//   Widget build(BuildContext context) {
//     return Scaffold(
//       backgroundColor: Colors.white,
//       body: BlocConsumer<PlanCubit, PlanState>(
//         listener: (context, state) {
//           if (state is PlanDeleteSuccess ||
//               state is WorkoutPlanGenerateSuccess ||
//               state is NutritionPlanGenerateSuccess) {
//             final msg = state is PlanDeleteSuccess
//                 ? state.message
//                 : state is WorkoutPlanGenerateSuccess
//                 ? state.message
//                 : (state as NutritionPlanGenerateSuccess).message;
//             ScaffoldMessenger.of(context).showSnackBar(
//               SnackBar(
//                 content: Text(msg),
//                 backgroundColor: Colors.green,
//                 behavior: SnackBarBehavior.floating,
//                 shape: RoundedRectangleBorder(
//                   borderRadius: BorderRadius.circular(12),
//                 ),
//               ),
//             );
//           }
//           if (state is PlanError || state is NutritionPlanError) {
//             final msg = state is PlanError
//                 ? state.message
//                 : (state as NutritionPlanError).message;
//             final lower = msg.toLowerCase();
//             final isTokenError =
//                 lower.contains('token') ||
//                 lower.contains('insufficient') ||
//                 lower.contains('balance') ||
//                 lower.contains('subscription');
//             final isServiceDown =
//                 lower.contains('temporarily offline') ||
//                 lower.contains('ml service') ||
//                 lower.contains('unavailable') ||
//                 lower.contains('refused');

//             IconData snackIcon = Icons.error_outline_rounded;
//             Color snackColor = Colors.redAccent;
//             if (isTokenError) {
//               snackIcon = Icons.toll_rounded;
//               snackColor = Colors.orange;
//             } else if (isServiceDown) {
//               snackIcon = Icons.cloud_off_rounded;
//               snackColor = Colors.blueGrey;
//             }

//             ScaffoldMessenger.of(context).showSnackBar(
//               SnackBar(
//                 content: Row(
//                   children: [
//                     Icon(snackIcon, color: Colors.white, size: 18),
//                     const SizedBox(width: 8),
//                     Expanded(child: Text(msg)),
//                   ],
//                 ),
//                 backgroundColor: snackColor,
//                 behavior: SnackBarBehavior.floating,
//                 duration: const Duration(seconds: 5),
//                 shape: RoundedRectangleBorder(
//                   borderRadius: BorderRadius.circular(12),
//                 ),
//               ),
//             );
//           }
//         },
//         builder: (context, state) {
//           return SafeArea(
//             child: Column(
//               children: [
//                 _buildTopBar(context),
//                 const SizedBox(height: 12),
//                 _buildTabBar(context),
//                 const SizedBox(height: 16),
//                 Expanded(
//                   child: TabBarView(
//                     controller: _tabController,
//                     physics: const NeverScrollableScrollPhysics(),
//                     children: [
//                       _buildWorkoutTab(context, state),
//                       _buildNutritionTab(context, state),
//                     ],
//                   ),
//                 ),
//               ],
//             ),
//           );
//         },
//       ),
//     );
//   }

//   Widget _buildTopBar(BuildContext context) {
//     return Padding(
//       padding: const EdgeInsets.fromLTRB(20, 12, 20, 0),
//       child: Row(
//         children: [
//           GestureDetector(
//             onTap: () => Navigator.of(context).maybePop(),
//             child: const Icon(
//               Icons.arrow_back_ios_rounded,
//               color: Colors.black87,
//               size: 24,
//             ),
//           ),
//           const SizedBox(width: 14),
//           const Text(
//             'My Plans',
//             style: TextStyle(
//               fontSize: 22,
//               fontWeight: FontWeight.bold,
//               color: Color(0xFF1A1A2E),
//             ),
//           ),
//           const Spacer(),
//           GestureDetector(
//             onTap: () => _showGenerateOptions(context),
//             child: Container(
//               padding: const EdgeInsets.symmetric(horizontal: 18, vertical: 10),
//               decoration: BoxDecoration(
//                 color: const Color(0xFF1A3A8F),
//                 borderRadius: BorderRadius.circular(14),
//               ),
//               child: const Row(
//                 mainAxisSize: MainAxisSize.min,
//                 children: [
//                   Icon(Icons.auto_awesome, color: Colors.white, size: 16),
//                   SizedBox(width: 6),
//                   Text(
//                     'Generate',
//                     style: TextStyle(
//                       color: Colors.white,
//                       fontWeight: FontWeight.bold,
//                       fontSize: 14,
//                     ),
//                   ),
//                 ],
//               ),
//             ),
//           ),
//         ],
//       ),
//     );
//   }

//   Widget _buildTabBar(BuildContext context) {
//     return Padding(
//       padding: const EdgeInsets.symmetric(horizontal: 20),
//       child: Container(
//         height: 44,
//         decoration: BoxDecoration(
//           color: const Color(0xFFF0F0F5),
//           borderRadius: BorderRadius.circular(12),
//         ),
//         child: TabBar(
//           controller: _tabController,
//           labelColor: Colors.white,
//           unselectedLabelColor: Colors.grey,
//           labelStyle: const TextStyle(
//             fontWeight: FontWeight.bold,
//             fontSize: 14,
//           ),
//           unselectedLabelStyle: const TextStyle(fontSize: 14),
//           indicator: BoxDecoration(
//             color: const Color(0xFF1A3A8F),
//             borderRadius: BorderRadius.circular(10),
//           ),
//           indicatorSize: TabBarIndicatorSize.tab,
//           dividerColor: Colors.transparent,
//           padding: const EdgeInsets.all(3),
//           onTap: (i) {
//             if (i == 0)
//               context.read<PlanCubit>().fetchPlans();
//             else
//               context.read<PlanCubit>().fetchNutritionPlan();
//           },
//           tabs: const [
//             Tab(text: 'Workout'),
//             Tab(text: 'Nutrition'),
//           ],
//         ),
//       ),
//     );
//   }

//   // ─── WORKOUT TAB ───────────────────────────────────────────────
//   Widget _buildWorkoutTab(BuildContext context, PlanState state) {
//     if (state is PlanInitial ||
//         state is PlanLoading ||
//         state is WorkoutPlanGenerating) {
//       return const Center(
//         child: CircularProgressIndicator(color: Color(0xFF1A3A8F)),
//       );
//     }
//     if (state is PlanError)
//       return _buildError(
//         context,
//         state.message,
//         () => context.read<PlanCubit>().fetchPlans(),
//       );
//     if (state is PlanLoaded) {
//       if (state.allPlans.isEmpty) return _buildEmptyWorkout(context);
//       return _buildWorkoutContent(context, state);
//     }
//     return const Center(
//       child: CircularProgressIndicator(color: Color(0xFF1A3A8F)),
//     );
//   }

//   Widget _buildWorkoutContent(BuildContext context, PlanLoaded state) {
//     final plan = state.activePlan!;
//     final days = plan.days;
//     final selectedDay = state.selectedDayIndex < days.length
//         ? days[state.selectedDayIndex]
//         : null;

//     return RefreshIndicator(
//       color: const Color(0xFF1A3A8F),
//       onRefresh: () => context.read<PlanCubit>().fetchPlans(),
//       child: SingleChildScrollView(
//         physics: const AlwaysScrollableScrollPhysics(),
//         child: Column(
//           crossAxisAlignment: CrossAxisAlignment.start,
//           children: [
//             _buildHeroPlanCard(context, plan),
//             const SizedBox(height: 20),
//             if (days.isNotEmpty) ...[
//               _buildDaySelector(context, days, state.selectedDayIndex),
//               const SizedBox(height: 20),
//             ],
//             if (selectedDay != null) ...[
//               const Padding(
//                 padding: EdgeInsets.symmetric(horizontal: 20),
//                 child: Text(
//                   "Today's Workout",
//                   style: TextStyle(
//                     fontSize: 20,
//                     fontWeight: FontWeight.bold,
//                     color: Color(0xFF1A1A2E),
//                   ),
//                 ),
//               ),
//               const SizedBox(height: 12),
//               if (selectedDay.exercises.isEmpty)
//                 _buildRestDay()
//               else
//                 ...selectedDay.exercises.map((ex) => _buildExerciseCard(ex)),
//               const SizedBox(height: 24),
//             ],
//           ],
//         ),
//       ),
//     );
//   }

//   Widget _buildHeroPlanCard(BuildContext context, PlanModel plan) {
//     final dayLabels = _getDayLabels(plan.daysPerWeek ?? 0);
//     return Padding(
//       padding: const EdgeInsets.symmetric(horizontal: 20),
//       child: Container(
//         width: double.infinity,
//         padding: const EdgeInsets.all(22),
//         decoration: BoxDecoration(
//           color: const Color(0xFF1A3A8F),
//           borderRadius: BorderRadius.circular(20),
//         ),
//         child: Column(
//           crossAxisAlignment: CrossAxisAlignment.start,
//           children: [
//             Row(
//               mainAxisAlignment: MainAxisAlignment.spaceBetween,
//               children: [
//                 Container(
//                   padding: const EdgeInsets.symmetric(
//                     horizontal: 10,
//                     vertical: 4,
//                   ),
//                   decoration: BoxDecoration(
//                     color: Colors.white.withOpacity(0.2),
//                     borderRadius: BorderRadius.circular(8),
//                   ),
//                   child: const Text(
//                     'ACTIVE',
//                     style: TextStyle(
//                       color: Colors.white,
//                       fontSize: 11,
//                       fontWeight: FontWeight.bold,
//                       letterSpacing: 1.2,
//                     ),
//                   ),
//                 ),
//                 GestureDetector(
//                   onTap: () => _confirmDelete(context, plan.planId),
//                   child: Icon(
//                     Icons.fitness_center_rounded,
//                     color: Colors.white.withOpacity(0.6),
//                     size: 24,
//                   ),
//                 ),
//               ],
//             ),
//             const SizedBox(height: 14),
//             Text(
//               plan.planName,
//               style: const TextStyle(
//                 color: Colors.white,
//                 fontSize: 26,
//                 fontWeight: FontWeight.bold,
//               ),
//             ),
//             const SizedBox(height: 18),
//             Row(
//               children: [
//                 _planStatBox(
//                   label: 'FREQUENCY',
//                   value: '${plan.daysPerWeek ?? "—"}',
//                   unit: 'days/wk',
//                 ),
//                 const SizedBox(width: 10),
//                 _planStatBox(
//                   label: 'DURATION',
//                   value: '${plan.durationWeeks ?? "—"}',
//                   unit: 'weeks',
//                 ),
//                 const SizedBox(width: 10),
//                 _planStatBox(
//                   label: 'LEVEL',
//                   value: plan.fitnessLevel ?? '—',
//                   unit: '',
//                   wide: true,
//                 ),
//               ],
//             ),
//             const SizedBox(height: 18),
//             Row(
//               mainAxisAlignment: MainAxisAlignment.spaceBetween,
//               children: [
//                 Row(
//                   children: dayLabels
//                       .map(
//                         (d) => Container(
//                           margin: const EdgeInsets.only(right: 6),
//                           width: 32,
//                           height: 32,
//                           decoration: BoxDecoration(
//                             color: Colors.white,
//                             shape: BoxShape.circle,
//                             boxShadow: [
//                               BoxShadow(
//                                 color: Colors.black.withOpacity(0.1),
//                                 blurRadius: 4,
//                               ),
//                             ],
//                           ),
//                           child: Center(
//                             child: Text(
//                               d,
//                               style: const TextStyle(
//                                 color: Color(0xFF1A3A8F),
//                                 fontWeight: FontWeight.bold,
//                                 fontSize: 11,
//                               ),
//                             ),
//                           ),
//                         ),
//                       )
//                       .toList(),
//                 ),
//                 Text(
//                   'Week ${plan.currentWeek} of ${plan.durationWeeks ?? "—"}',
//                   style: TextStyle(
//                     color: Colors.white.withOpacity(0.85),
//                     fontSize: 13,
//                     fontWeight: FontWeight.w500,
//                   ),
//                 ),
//               ],
//             ),
//           ],
//         ),
//       ),
//     );
//   }

//   Widget _planStatBox({
//     required String label,
//     required String value,
//     required String unit,
//     bool wide = false,
//   }) {
//     return Expanded(
//       flex: wide ? 2 : 1,
//       child: Container(
//         padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 10),
//         decoration: BoxDecoration(
//           color: Colors.white.withOpacity(0.15),
//           borderRadius: BorderRadius.circular(12),
//         ),
//         child: Column(
//           crossAxisAlignment: CrossAxisAlignment.start,
//           children: [
//             Text(
//               label,
//               style: TextStyle(
//                 color: Colors.white.withOpacity(0.7),
//                 fontSize: 9,
//                 fontWeight: FontWeight.w600,
//                 letterSpacing: 0.5,
//               ),
//             ),
//             const SizedBox(height: 4),
//             Text(
//               value,
//               style: const TextStyle(
//                 color: Colors.white,
//                 fontSize: 20,
//                 fontWeight: FontWeight.bold,
//                 height: 1.1,
//               ),
//             ),
//             if (unit.isNotEmpty)
//               Text(
//                 unit,
//                 style: TextStyle(
//                   color: Colors.white.withOpacity(0.7),
//                   fontSize: 11,
//                 ),
//               ),
//           ],
//         ),
//       ),
//     );
//   }

//   Widget _buildDaySelector(
//     BuildContext context,
//     List<PlanDayModel> days,
//     int selectedIndex,
//   ) {
//     return SizedBox(
//       height: 100,
//       child: ListView.builder(
//         scrollDirection: Axis.horizontal,
//         padding: const EdgeInsets.symmetric(horizontal: 16),
//         itemCount: days.length,
//         itemBuilder: (ctx, i) {
//           final day = days[i];
//           final isSelected = i == selectedIndex;
//           final isRest = day.exercises.isEmpty;
//           return GestureDetector(
//             onTap: () => context.read<PlanCubit>().selectDay(i),
//             child: AnimatedContainer(
//               duration: const Duration(milliseconds: 200),
//               width: 90,
//               margin: const EdgeInsets.symmetric(horizontal: 4),
//               decoration: BoxDecoration(
//                 color: Colors.white,
//                 borderRadius: BorderRadius.circular(16),
//                 border: Border.all(
//                   color: isSelected
//                       ? const Color(0xFF1A3A8F)
//                       : Colors.grey.shade200,
//                   width: isSelected ? 2 : 1,
//                 ),
//                 boxShadow: isSelected
//                     ? [
//                         BoxShadow(
//                           color: const Color(0xFF1A3A8F).withOpacity(0.15),
//                           blurRadius: 8,
//                           offset: const Offset(0, 3),
//                         ),
//                       ]
//                     : null,
//               ),
//               child: Column(
//                 mainAxisAlignment: MainAxisAlignment.center,
//                 children: [
//                   Text(
//                     'DAY ${day.dayNumber}',
//                     style: TextStyle(
//                       fontSize: 10,
//                       fontWeight: FontWeight.bold,
//                       color: isSelected ? const Color(0xFF1A3A8F) : Colors.grey,
//                       letterSpacing: 0.5,
//                     ),
//                   ),
//                   const SizedBox(height: 4),
//                   Text(
//                     isRest
//                         ? 'Rest'
//                         : (day.dayName?.isNotEmpty == true
//                               ? day.dayName!
//                               : _guessMuscleName(day)),
//                     style: TextStyle(
//                       fontSize: 14,
//                       fontWeight: FontWeight.bold,
//                       color: isSelected
//                           ? const Color(0xFF1A3A8F)
//                           : Colors.black87,
//                     ),
//                     textAlign: TextAlign.center,
//                     maxLines: 2,
//                     overflow: TextOverflow.ellipsis,
//                   ),
//                   const SizedBox(height: 6),
//                   if (isSelected && !isRest)
//                     const Icon(
//                       Icons.check_circle_rounded,
//                       color: Color(0xFF1A3A8F),
//                       size: 18,
//                     )
//                   else if (isRest)
//                     Icon(
//                       Icons.bedtime_outlined,
//                       color: Colors.grey.shade400,
//                       size: 18,
//                     ),
//                 ],
//               ),
//             ),
//           );
//         },
//       ),
//     );
//   }

//   Widget _buildExerciseCard(PlanExerciseModel ex) {
//     return GestureDetector(
//       onTap: () => ExerciseDetailSheet.show(context, ex),
//       child: Container(
//         margin: const EdgeInsets.fromLTRB(20, 0, 20, 12),
//         decoration: BoxDecoration(
//           color: Colors.white,
//           borderRadius: BorderRadius.circular(16),
//           boxShadow: [
//             BoxShadow(
//               color: Colors.grey.withOpacity(0.08),
//               blurRadius: 10,
//               offset: const Offset(0, 3),
//             ),
//           ],
//         ),
//         child: Padding(
//           padding: const EdgeInsets.all(16),
//           child: Row(
//             children: [
//               ClipRRect(
//                 borderRadius: BorderRadius.circular(12),
//                 child: Container(
//                   width: 70,
//                   height: 70,
//                   color: const Color(0xFF1A3A8F).withOpacity(0.08),
//                   child: const Icon(
//                     Icons.fitness_center_rounded,
//                     color: Color(0xFF1A3A8F),
//                     size: 30,
//                   ),
//                 ),
//               ),
//               const SizedBox(width: 14),
//               Expanded(
//                 child: Column(
//                   crossAxisAlignment: CrossAxisAlignment.start,
//                   children: [
//                     Row(
//                       children: [
//                         Expanded(
//                           child: Text(
//                             ex.exerciseName ?? 'Exercise',
//                             style: const TextStyle(
//                               fontSize: 16,
//                               fontWeight: FontWeight.bold,
//                               color: Color(0xFF1A1A2E),
//                             ),
//                           ),
//                         ),
//                         if (ex.muscleGroup != null) ...[
//                           const SizedBox(width: 6),
//                           Container(
//                             padding: const EdgeInsets.symmetric(
//                               horizontal: 8,
//                               vertical: 3,
//                             ),
//                             decoration: BoxDecoration(
//                               color: const Color(0xFF1A3A8F).withOpacity(0.1),
//                               borderRadius: BorderRadius.circular(6),
//                             ),
//                             child: Text(
//                               ex.muscleGroup!.toUpperCase(),
//                               style: const TextStyle(
//                                 color: Color(0xFF1A3A8F),
//                                 fontSize: 9,
//                                 fontWeight: FontWeight.bold,
//                                 letterSpacing: 0.5,
//                               ),
//                             ),
//                           ),
//                         ],
//                       ],
//                     ),
//                     const SizedBox(height: 10),
//                     Row(
//                       children: [
//                         _exerciseStat(
//                           'SETS',
//                           '${ex.sets ?? "—"} × ${ex.reps ?? "—"}',
//                         ),
//                         const SizedBox(width: 18),
//                         _exerciseStat('REST', ex.restDisplay),
//                       ],
//                     ),
//                   ],
//                 ),
//               ),
//               const SizedBox(width: 8),
//               const Icon(
//                 Icons.chevron_right_rounded,
//                 color: Colors.grey,
//                 size: 20,
//               ),
//             ],
//           ),
//         ),
//       ),
//     );
//   }

//   Widget _exerciseStat(String label, String value) {
//     return Column(
//       crossAxisAlignment: CrossAxisAlignment.start,
//       children: [
//         Text(
//           label,
//           style: const TextStyle(
//             color: Colors.grey,
//             fontSize: 10,
//             fontWeight: FontWeight.w600,
//             letterSpacing: 0.5,
//           ),
//         ),
//         const SizedBox(height: 2),
//         Text(
//           value,
//           style: const TextStyle(
//             color: Color(0xFF1A3A8F),
//             fontSize: 15,
//             fontWeight: FontWeight.bold,
//           ),
//         ),
//       ],
//     );
//   }

//   Widget _buildRestDay() {
//     return Padding(
//       padding: const EdgeInsets.symmetric(horizontal: 20),
//       child: Container(
//         width: double.infinity,
//         padding: const EdgeInsets.all(32),
//         decoration: BoxDecoration(
//           color: Colors.grey.shade50,
//           borderRadius: BorderRadius.circular(18),
//           border: Border.all(color: Colors.grey.shade200),
//         ),
//         child: Column(
//           children: [
//             Icon(Icons.bedtime_outlined, size: 48, color: Colors.grey.shade400),
//             const SizedBox(height: 12),
//             Text(
//               'Rest Day',
//               style: TextStyle(
//                 fontSize: 18,
//                 fontWeight: FontWeight.bold,
//                 color: Colors.grey.shade500,
//               ),
//             ),
//             const SizedBox(height: 6),
//             Text(
//               'Recovery is part of the process 💪',
//               style: TextStyle(color: Colors.grey.shade400, fontSize: 13),
//             ),
//           ],
//         ),
//       ),
//     );
//   }

//   // ─── NUTRITION TAB ─────────────────────────────────────────────
//   Widget _buildNutritionTab(BuildContext context, PlanState state) {
//     if (state is NutritionPlanLoading || state is NutritionPlanGenerating) {
//       return const Center(
//         child: CircularProgressIndicator(color: Color(0xFF1A3A8F)),
//       );
//     }
//     if (state is NutritionPlanError) {
//       return _buildError(
//         context,
//         state.message,
//         () => context.read<PlanCubit>().fetchNutritionPlan(),
//       );
//     }
//     if (state is NutritionPlanLoaded) {
//       if (state.allPlans.isEmpty) return _buildEmptyNutrition(context);
//       return _buildNutritionContent(context, state);
//     }
//     return _buildEmptyNutrition(context);
//   }

//   Widget _buildNutritionContent(
//     BuildContext context,
//     NutritionPlanLoaded state,
//   ) {
//     final plan = state.activePlan!;
//     return RefreshIndicator(
//       color: const Color(0xFF1A3A8F),
//       onRefresh: () => context.read<PlanCubit>().fetchNutritionPlan(),
//       child: SingleChildScrollView(
//         physics: const AlwaysScrollableScrollPhysics(),
//         padding: const EdgeInsets.symmetric(horizontal: 20),
//         child: Column(
//           crossAxisAlignment: CrossAxisAlignment.start,
//           children: [
//             _buildNutritionHeroCard(plan),
//             const SizedBox(height: 20),
//             _buildMacrosRow(plan),
//             if (plan.days.isNotEmpty) ...[
//               const SizedBox(height: 20),
//               const Text(
//                 'Meal Schedule',
//                 style: TextStyle(
//                   fontSize: 18,
//                   fontWeight: FontWeight.bold,
//                   color: Color(0xFF1A1A2E),
//                 ),
//               ),
//               const SizedBox(height: 12),
//               ...plan.days.map((d) => _buildNutritionDayCard(d)),
//             ],
//             const SizedBox(height: 24),
//           ],
//         ),
//       ),
//     );
//   }

//   Widget _buildNutritionHeroCard(NutritionPlanModel plan) {
//     return Container(
//       width: double.infinity,
//       padding: const EdgeInsets.all(22),
//       decoration: BoxDecoration(
//         color: const Color(0xFF1B6B3A),
//         borderRadius: BorderRadius.circular(20),
//       ),
//       child: Column(
//         crossAxisAlignment: CrossAxisAlignment.start,
//         children: [
//           Row(
//             mainAxisAlignment: MainAxisAlignment.spaceBetween,
//             children: [
//               Container(
//                 padding: const EdgeInsets.symmetric(
//                   horizontal: 10,
//                   vertical: 4,
//                 ),
//                 decoration: BoxDecoration(
//                   color: Colors.white.withOpacity(0.2),
//                   borderRadius: BorderRadius.circular(8),
//                 ),
//                 child: const Text(
//                   'ACTIVE',
//                   style: TextStyle(
//                     color: Colors.white,
//                     fontSize: 11,
//                     fontWeight: FontWeight.bold,
//                     letterSpacing: 1.2,
//                   ),
//                 ),
//               ),
//               Icon(
//                 Icons.restaurant_rounded,
//                 color: Colors.white.withOpacity(0.7),
//                 size: 22,
//               ),
//             ],
//           ),
//           const SizedBox(height: 12),
//           Text(
//             plan.planName,
//             style: const TextStyle(
//               color: Colors.white,
//               fontSize: 24,
//               fontWeight: FontWeight.bold,
//             ),
//           ),
//           if (plan.description != null) ...[
//             const SizedBox(height: 6),
//             Text(
//               plan.description!,
//               style: TextStyle(
//                 color: Colors.white.withOpacity(0.7),
//                 fontSize: 13,
//               ),
//             ),
//           ],
//           const SizedBox(height: 16),
//           Row(
//             children: [
//               _nutritionStatBox('🔥', plan.caloriesDisplay, 'Calories'),
//               const SizedBox(width: 8),
//               _nutritionStatBox('💪', plan.proteinDisplay, 'Protein'),
//               const SizedBox(width: 8),
//               _nutritionStatBox('🌾', plan.carbsDisplay, 'Carbs'),
//               const SizedBox(width: 8),
//               _nutritionStatBox('🥑', plan.fatDisplay, 'Fat'),
//             ],
//           ),
//         ],
//       ),
//     );
//   }

//   Widget _nutritionStatBox(String emoji, String value, String label) {
//     return Expanded(
//       child: Container(
//         padding: const EdgeInsets.symmetric(vertical: 10, horizontal: 6),
//         decoration: BoxDecoration(
//           color: Colors.white.withOpacity(0.15),
//           borderRadius: BorderRadius.circular(12),
//         ),
//         child: Column(
//           children: [
//             Text(emoji, style: const TextStyle(fontSize: 14)),
//             const SizedBox(height: 3),
//             Text(
//               value,
//               style: const TextStyle(
//                 color: Colors.white,
//                 fontWeight: FontWeight.bold,
//                 fontSize: 12,
//               ),
//             ),
//             Text(
//               label,
//               style: TextStyle(
//                 color: Colors.white.withOpacity(0.7),
//                 fontSize: 9,
//               ),
//             ),
//           ],
//         ),
//       ),
//     );
//   }

//   Widget _buildMacrosRow(NutritionPlanModel plan) {
//     return Container(
//       padding: const EdgeInsets.all(18),
//       decoration: BoxDecoration(
//         color: Colors.white,
//         borderRadius: BorderRadius.circular(18),
//         boxShadow: [
//           BoxShadow(
//             color: Colors.grey.withOpacity(0.07),
//             blurRadius: 10,
//             offset: const Offset(0, 3),
//           ),
//         ],
//       ),
//       child: Column(
//         crossAxisAlignment: CrossAxisAlignment.start,
//         children: [
//           const Text(
//             'Daily Macros',
//             style: TextStyle(
//               fontWeight: FontWeight.bold,
//               fontSize: 15,
//               color: Color(0xFF1A1A2E),
//             ),
//           ),
//           const SizedBox(height: 14),
//           if (plan.dailyCalories != null)
//             _macroBar('Calories', plan.dailyCalories!, 2500, Colors.orange),
//           if (plan.proteinGrams != null)
//             _macroBar(
//               'Protein (g)',
//               plan.proteinGrams!,
//               200,
//               const Color(0xFF1A3A8F),
//             ),
//           if (plan.carbsGrams != null)
//             _macroBar(
//               'Carbs (g)',
//               plan.carbsGrams!,
//               300,
//               const Color(0xFF1B6B3A),
//             ),
//           if (plan.fatGrams != null)
//             _macroBar('Fat (g)', plan.fatGrams!, 80, Colors.purple),
//           if (plan.dailyCalories == null && plan.proteinGrams == null)
//             const Center(
//               child: Padding(
//                 padding: EdgeInsets.all(12),
//                 child: Text(
//                   'Macro details not available',
//                   style: TextStyle(color: Colors.grey),
//                 ),
//               ),
//             ),
//         ],
//       ),
//     );
//   }

//   Widget _macroBar(String label, int value, int max, Color color) {
//     final progress = (value / max).clamp(0.0, 1.0);
//     return Padding(
//       padding: const EdgeInsets.only(bottom: 12),
//       child: Column(
//         children: [
//           Row(
//             mainAxisAlignment: MainAxisAlignment.spaceBetween,
//             children: [
//               Text(
//                 label,
//                 style: const TextStyle(color: Colors.black87, fontSize: 13),
//               ),
//               Text(
//                 '$value',
//                 style: TextStyle(
//                   color: color,
//                   fontWeight: FontWeight.bold,
//                   fontSize: 13,
//                 ),
//               ),
//             ],
//           ),
//           const SizedBox(height: 6),
//           ClipRRect(
//             borderRadius: BorderRadius.circular(6),
//             child: LinearProgressIndicator(
//               value: progress,
//               backgroundColor: Colors.grey.shade100,
//               valueColor: AlwaysStoppedAnimation<Color>(color),
//               minHeight: 8,
//             ),
//           ),
//         ],
//       ),
//     );
//   }

//   Widget _buildNutritionDayCard(NutritionDayModel day) {
//     return Container(
//       margin: const EdgeInsets.only(bottom: 12),
//       decoration: BoxDecoration(
//         color: Colors.white,
//         borderRadius: BorderRadius.circular(16),
//         boxShadow: [
//           BoxShadow(
//             color: Colors.grey.withOpacity(0.06),
//             blurRadius: 8,
//             offset: const Offset(0, 2),
//           ),
//         ],
//       ),
//       child: Theme(
//         data: Theme.of(context).copyWith(dividerColor: Colors.transparent),
//         child: ExpansionTile(
//           tilePadding: const EdgeInsets.symmetric(horizontal: 16, vertical: 4),
//           leading: Container(
//             width: 38,
//             height: 38,
//             decoration: BoxDecoration(
//               color: const Color(0xFF1B6B3A).withOpacity(0.1),
//               borderRadius: BorderRadius.circular(10),
//             ),
//             child: const Icon(
//               Icons.restaurant_rounded,
//               color: Color(0xFF1B6B3A),
//               size: 18,
//             ),
//           ),
//           title: Text(
//             day.displayName,
//             style: const TextStyle(
//               fontWeight: FontWeight.bold,
//               fontSize: 14,
//               color: Color(0xFF1A1A2E),
//             ),
//           ),
//           subtitle: Text(
//             '${day.meals.length} meals',
//             style: const TextStyle(color: Colors.grey, fontSize: 12),
//           ),
//           shape: RoundedRectangleBorder(
//             borderRadius: BorderRadius.circular(16),
//           ),
//           collapsedShape: RoundedRectangleBorder(
//             borderRadius: BorderRadius.circular(16),
//           ),
//           children: day.meals.map((m) => _buildMealTile(m)).toList(),
//         ),
//       ),
//     );
//   }

//   Widget _buildMealTile(NutritionMealModel meal) {
//     return Padding(
//       padding: const EdgeInsets.fromLTRB(16, 0, 16, 12),
//       child: Container(
//         padding: const EdgeInsets.all(14),
//         decoration: BoxDecoration(
//           color: const Color(0xFFF6F8FF),
//           borderRadius: BorderRadius.circular(12),
//         ),
//         child: Row(
//           children: [
//             Expanded(
//               child: Column(
//                 crossAxisAlignment: CrossAxisAlignment.start,
//                 children: [
//                   Text(
//                     meal.mealType,
//                     style: const TextStyle(
//                       fontWeight: FontWeight.bold,
//                       fontSize: 13,
//                       color: Color(0xFF1A1A2E),
//                     ),
//                   ),
//                   if (meal.description != null) ...[
//                     const SizedBox(height: 3),
//                     Text(
//                       meal.description!,
//                       style: const TextStyle(color: Colors.grey, fontSize: 12),
//                     ),
//                   ],
//                   if (meal.foods.isNotEmpty) ...[
//                     const SizedBox(height: 6),
//                     Wrap(
//                       spacing: 6,
//                       runSpacing: 4,
//                       children: meal.foods
//                           .map(
//                             (f) => Container(
//                               padding: const EdgeInsets.symmetric(
//                                 horizontal: 8,
//                                 vertical: 3,
//                               ),
//                               decoration: BoxDecoration(
//                                 color: const Color(0xFF1B6B3A).withOpacity(0.1),
//                                 borderRadius: BorderRadius.circular(8),
//                               ),
//                               child: Text(
//                                 f,
//                                 style: const TextStyle(
//                                   color: Color(0xFF1B6B3A),
//                                   fontSize: 11,
//                                 ),
//                               ),
//                             ),
//                           )
//                           .toList(),
//                     ),
//                   ],
//                 ],
//               ),
//             ),
//             if (meal.calories != null)
//               Container(
//                 padding: const EdgeInsets.symmetric(
//                   horizontal: 10,
//                   vertical: 5,
//                 ),
//                 decoration: BoxDecoration(
//                   color: Colors.orange.withOpacity(0.1),
//                   borderRadius: BorderRadius.circular(10),
//                 ),
//                 child: Text(
//                   '${meal.calories} kcal',
//                   style: const TextStyle(
//                     color: Colors.orange,
//                     fontWeight: FontWeight.bold,
//                     fontSize: 12,
//                   ),
//                 ),
//               ),
//           ],
//         ),
//       ),
//     );
//   }

//   // ─── EMPTY STATES ──────────────────────────────────────────────
//   Widget _buildEmptyWorkout(BuildContext context) {
//     return Center(
//       child: Padding(
//         padding: const EdgeInsets.all(32),
//         child: Column(
//           mainAxisAlignment: MainAxisAlignment.center,
//           children: [
//             Container(
//               width: 90,
//               height: 90,
//               decoration: BoxDecoration(
//                 color: const Color(0xFF1A3A8F).withOpacity(0.08),
//                 shape: BoxShape.circle,
//               ),
//               child: const Icon(
//                 Icons.fitness_center_rounded,
//                 color: Color(0xFF1A3A8F),
//                 size: 44,
//               ),
//             ),
//             const SizedBox(height: 20),
//             const Text(
//               'No Workout Plan Yet',
//               style: TextStyle(fontSize: 18, fontWeight: FontWeight.bold),
//             ),
//             const SizedBox(height: 8),
//             const Text(
//               'Generate a personalized AI workout plan\nbased on your fitness goals.',
//               textAlign: TextAlign.center,
//               style: TextStyle(color: Colors.grey, fontSize: 14),
//             ),
//             const SizedBox(height: 24),
//             ElevatedButton.icon(
//               onPressed: () {
//                 // بدلاً من استدعاء _showGenerateWorkoutDialog سيتم فتح الـ Options
//                 _showGenerateOptions(context);
//               },
//               icon: const Icon(Icons.auto_awesome, size: 18),
//               label: const Text(
//                 'Generate Workout Plan',
//                 style: TextStyle(fontWeight: FontWeight.bold),
//               ),
//               style: ElevatedButton.styleFrom(
//                 backgroundColor: const Color(0xFF1A3A8F),
//                 foregroundColor: Colors.white,
//                 elevation: 0,
//                 padding: const EdgeInsets.symmetric(
//                   horizontal: 24,
//                   vertical: 14,
//                 ),
//                 shape: RoundedRectangleBorder(
//                   borderRadius: BorderRadius.circular(14),
//                 ),
//               ),
//             ),
//           ],
//         ),
//       ),
//     );
//   }

//   Widget _buildEmptyNutrition(BuildContext context) {
//     return Center(
//       child: Padding(
//         padding: const EdgeInsets.all(32),
//         child: Column(
//           mainAxisAlignment: MainAxisAlignment.center,
//           children: [
//             Container(
//               width: 90,
//               height: 90,
//               decoration: BoxDecoration(
//                 color: const Color(0xFF1B6B3A).withOpacity(0.08),
//                 shape: BoxShape.circle,
//               ),
//               child: const Icon(
//                 Icons.restaurant_rounded,
//                 color: Color(0xFF1B6B3A),
//                 size: 44,
//               ),
//             ),
//             const SizedBox(height: 20),
//             const Text(
//               'No Nutrition Plan Yet',
//               style: TextStyle(fontSize: 18, fontWeight: FontWeight.bold),
//             ),
//             const SizedBox(height: 8),
//             const Text(
//               'Generate a personalized AI nutrition plan\ntailored to your goals.',
//               textAlign: TextAlign.center,
//               style: TextStyle(color: Colors.grey, fontSize: 14),
//             ),
//             const SizedBox(height: 24),
//             ElevatedButton.icon(
//               onPressed: () {
//                 // بدلاً من استدعاء _showGenerateNutritionDialog سيتم فتح الـ Options
//                 _showGenerateOptions(context);
//               },
//               icon: const Icon(Icons.auto_awesome, size: 18),
//               label: const Text(
//                 'Generate Nutrition Plan',
//                 style: TextStyle(fontWeight: FontWeight.bold),
//               ),
//               style: ElevatedButton.styleFrom(
//                 backgroundColor: const Color(0xFF1B6B3A),
//                 foregroundColor: Colors.white,
//                 elevation: 0,
//                 padding: const EdgeInsets.symmetric(
//                   horizontal: 24,
//                   vertical: 14,
//                 ),
//                 shape: RoundedRectangleBorder(
//                   borderRadius: BorderRadius.circular(14),
//                 ),
//               ),
//             ),
//           ],
//         ),
//       ),
//     );
//   }

//   // ─── GENERATE DIALOGS ──────────────────────────────────────────
//   void _showGenerateOptions(BuildContext context) {
//     showModalBottomSheet(
//       context: context,
//       backgroundColor: Colors.transparent,
//       builder: (_) => Container(
//         decoration: const BoxDecoration(
//           color: Colors.white,
//           borderRadius: BorderRadius.vertical(top: Radius.circular(28)),
//         ),
//         padding: const EdgeInsets.all(24),
//         child: Column(
//           mainAxisSize: MainAxisSize.min,
//           children: [
//             Container(
//               width: 40,
//               height: 4,
//               decoration: BoxDecoration(
//                 color: Colors.grey.shade300,
//                 borderRadius: BorderRadius.circular(2),
//               ),
//             ),
//             const SizedBox(height: 20),
//             const Text(
//               'Generate AI Plan',
//               style: TextStyle(fontSize: 18, fontWeight: FontWeight.bold),
//             ),
//             const SizedBox(height: 20),
//             _genOption(
//               icon: Icons.fitness_center_rounded,
//               color: const Color(0xFF1A3A8F),
//               title: 'Workout Plan',
//               subtitle: 'AI-personalized training schedule',
//               onTap: () {
//                 Navigator.pop(context);
//                 Navigator.push(
//                   context,
//                   MaterialPageRoute(builder: (_) => const GeneratePlanScreen()),
//                 );
//               },
//             ),
//             const SizedBox(height: 12),
//             _genOption(
//               icon: Icons.restaurant_rounded,
//               color: const Color(0xFF1B6B3A),
//               title: 'Nutrition Plan',
//               subtitle: 'AI-tailored daily meal plan',
//               onTap: () {
//                 Navigator.pop(context);
//                 Navigator.push(
//                   context,
//                   MaterialPageRoute(
//                     builder: (_) => const GenerateNutritionScreen(),
//                   ),
//                 );
//               },
//             ),
//             const SizedBox(height: 8),
//           ],
//         ),
//       ),
//     );
//   }

//   Widget _genOption({
//     required IconData icon,
//     required Color color,
//     required String title,
//     required String subtitle,
//     required VoidCallback onTap,
//   }) {
//     return GestureDetector(
//       onTap: onTap,
//       child: Container(
//         padding: const EdgeInsets.all(16),
//         decoration: BoxDecoration(
//           color: color.withOpacity(0.05),
//           borderRadius: BorderRadius.circular(16),
//           border: Border.all(color: color.withOpacity(0.2)),
//         ),
//         child: Row(
//           children: [
//             Container(
//               padding: const EdgeInsets.all(10),
//               decoration: BoxDecoration(
//                 color: color.withOpacity(0.1),
//                 borderRadius: BorderRadius.circular(12),
//               ),
//               child: Icon(icon, color: color, size: 22),
//             ),
//             const SizedBox(width: 14),
//             Expanded(
//               child: Column(
//                 crossAxisAlignment: CrossAxisAlignment.start,
//                 children: [
//                   Text(
//                     title,
//                     style: const TextStyle(
//                       fontWeight: FontWeight.bold,
//                       fontSize: 15,
//                     ),
//                   ),
//                   Text(
//                     subtitle,
//                     style: const TextStyle(color: Colors.grey, fontSize: 12),
//                   ),
//                 ],
//               ),
//             ),
//             Icon(Icons.arrow_forward_ios_rounded, color: color, size: 16),
//           ],
//         ),
//       ),
//     );
//   }

//   // ─── HELPERS ───────────────────────────────────────────────────
//   Widget _buildError(
//     BuildContext context,
//     String message,
//     VoidCallback onRetry,
//   ) {
//     return Center(
//       child: Padding(
//         padding: const EdgeInsets.all(24),
//         child: Column(
//           mainAxisAlignment: MainAxisAlignment.center,
//           children: [
//             Icon(Icons.wifi_off_rounded, size: 64, color: Colors.grey.shade300),
//             const SizedBox(height: 16),
//             Text(
//               message,
//               textAlign: TextAlign.center,
//               style: const TextStyle(color: Colors.grey, fontSize: 14),
//             ),
//             const SizedBox(height: 24),
//             ElevatedButton.icon(
//               onPressed: onRetry,
//               icon: const Icon(Icons.refresh_rounded),
//               label: const Text('Try Again'),
//               style: ElevatedButton.styleFrom(
//                 backgroundColor: const Color(0xFF1A3A8F),
//                 foregroundColor: Colors.white,
//                 shape: RoundedRectangleBorder(
//                   borderRadius: BorderRadius.circular(12),
//                 ),
//                 padding: const EdgeInsets.symmetric(
//                   horizontal: 24,
//                   vertical: 12,
//                 ),
//               ),
//             ),
//           ],
//         ),
//       ),
//     );
//   }

//   void _confirmDelete(BuildContext context, int planId) {
//     showDialog(
//       context: context,
//       builder: (_) => AlertDialog(
//         shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(20)),
//         title: const Text(
//           'Delete Plan',
//           style: TextStyle(fontWeight: FontWeight.bold),
//         ),
//         content: const Text('Are you sure you want to delete this plan?'),
//         actions: [
//           TextButton(
//             onPressed: () => Navigator.pop(context),
//             child: const Text('Cancel', style: TextStyle(color: Colors.grey)),
//           ),
//           ElevatedButton(
//             onPressed: () {
//               Navigator.pop(context);
//               context.read<PlanCubit>().deletePlan(planId);
//             },
//             style: ElevatedButton.styleFrom(
//               backgroundColor: Colors.redAccent,
//               shape: RoundedRectangleBorder(
//                 borderRadius: BorderRadius.circular(10),
//               ),
//             ),
//             child: const Text('Delete', style: TextStyle(color: Colors.white)),
//           ),
//         ],
//       ),
//     );
//   }

//   List<String> _getDayLabels(int daysPerWeek) {
//     final all = ['S', 'M', 'T', 'W', 'T', 'F', 'S'];
//     if (daysPerWeek <= 0 || daysPerWeek > 7) return all.take(5).toList();
//     return all.take(daysPerWeek).toList();
//   }

//   String _guessMuscleName(PlanDayModel day) {
//     if (day.exercises.isEmpty) return 'Rest';
//     final groups = day.exercises
//         .map((e) => e.muscleGroup ?? '')
//         .where((g) => g.isNotEmpty)
//         .toList();
//     if (groups.isEmpty) return 'Day ${day.dayNumber}';
//     final freq = <String, int>{};
//     for (final g in groups) freq[g] = (freq[g] ?? 0) + 1;
//     return freq.entries.reduce((a, b) => a.value >= b.value ? a : b).key;
//   }
// }

//==================================================================================================//

import 'package:flutter/material.dart';
import 'package:one/features/generate_nutrition/ui/generate_nutrition_screen.dart';
import 'package:one/features/generate_plan/ui/generate_plan_screen.dart';
import 'exercise_detail_sheet.dart';
import 'package:flutter_bloc/flutter_bloc.dart';
import '../cubit/plan_cubit.dart';
import '../cubit/plan_state.dart';
import '../model/plan_model.dart';
import '../model/nutrition_plan_model.dart';

class PlanScreen extends StatelessWidget {
  const PlanScreen({super.key});

  @override
  Widget build(BuildContext context) {
    return BlocProvider(
      create: (_) => PlanCubit()..fetchPlans(),
      child: const _PlanView(),
    );
  }
}

class _PlanView extends StatefulWidget {
  const _PlanView();

  @override
  State<_PlanView> createState() => _PlanViewState();
}

class _PlanViewState extends State<_PlanView>
    with SingleTickerProviderStateMixin {
  late TabController _tabController;

  @override
  void initState() {
    super.initState();
    _tabController = TabController(length: 2, vsync: this);
  }

  @override
  void dispose() {
    _tabController.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: Colors.white,
      body: BlocConsumer<PlanCubit, PlanState>(
        listener: (context, state) {
          if (state is PlanDeleteSuccess ||
              state is WorkoutPlanGenerateSuccess ||
              state is NutritionPlanGenerateSuccess) {
            final msg = state is PlanDeleteSuccess
                ? state.message
                : state is WorkoutPlanGenerateSuccess
                ? state.message
                : (state as NutritionPlanGenerateSuccess).message;
            ScaffoldMessenger.of(context).showSnackBar(
              SnackBar(
                content: Text(msg),
                backgroundColor: Colors.green,
                behavior: SnackBarBehavior.floating,
                shape: RoundedRectangleBorder(
                  borderRadius: BorderRadius.circular(12),
                ),
              ),
            );
          }
          if (state is PlanError || state is NutritionPlanError) {
            final msg = state is PlanError
                ? state.message
                : (state as NutritionPlanError).message;
            final lower = msg.toLowerCase();
            final isTokenError =
                lower.contains('token') ||
                lower.contains('insufficient') ||
                lower.contains('balance') ||
                lower.contains('subscription');
            final isServiceDown =
                lower.contains('temporarily offline') ||
                lower.contains('ml service') ||
                lower.contains('unavailable') ||
                lower.contains('refused');

            IconData snackIcon = Icons.error_outline_rounded;
            Color snackColor = Colors.redAccent;
            if (isTokenError) {
              snackIcon = Icons.toll_rounded;
              snackColor = Colors.orange;
            } else if (isServiceDown) {
              snackIcon = Icons.cloud_off_rounded;
              snackColor = Colors.blueGrey;
            }

            ScaffoldMessenger.of(context).showSnackBar(
              SnackBar(
                content: Row(
                  children: [
                    Icon(snackIcon, color: Colors.white, size: 18),
                    const SizedBox(width: 8),
                    Expanded(child: Text(msg)),
                  ],
                ),
                backgroundColor: snackColor,
                behavior: SnackBarBehavior.floating,
                duration: const Duration(seconds: 5),
                shape: RoundedRectangleBorder(
                  borderRadius: BorderRadius.circular(12),
                ),
              ),
            );
          }
        },
        builder: (context, state) {
          return SafeArea(
            child: Column(
              children: [
                _buildTopBar(context),
                const SizedBox(height: 12),
                _buildTabBar(context),
                const SizedBox(height: 16),
                Expanded(
                  child: TabBarView(
                    controller: _tabController,
                    physics: const NeverScrollableScrollPhysics(),
                    children: [
                      _buildWorkoutTab(context, state),
                      _buildNutritionTab(context, state),
                    ],
                  ),
                ),
              ],
            ),
          );
        },
      ),
    );
  }

  Widget _buildTopBar(BuildContext context) {
    return Padding(
      padding: const EdgeInsets.fromLTRB(20, 12, 20, 0),
      child: Row(
        children: [
          GestureDetector(
            onTap: () => Navigator.of(context).maybePop(),
            child: const Icon(
              Icons.arrow_back_ios_rounded,
              color: Colors.black87,
              size: 24,
            ),
          ),
          const SizedBox(width: 14),
          const Text(
            'My Plans',
            style: TextStyle(
              fontSize: 22,
              fontWeight: FontWeight.bold,
              color: Color(0xFF1A1A2E),
            ),
          ),
          const Spacer(),
          GestureDetector(
            onTap: () => _showGenerateOptions(context),
            child: Container(
              padding: const EdgeInsets.symmetric(horizontal: 18, vertical: 10),
              decoration: BoxDecoration(
                color: const Color(0xFF1A3A8F),
                borderRadius: BorderRadius.circular(14),
              ),
              child: const Row(
                mainAxisSize: MainAxisSize.min,
                children: [
                  Icon(Icons.auto_awesome, color: Colors.white, size: 16),
                  SizedBox(width: 6),
                  Text(
                    'Generate',
                    style: TextStyle(
                      color: Colors.white,
                      fontWeight: FontWeight.bold,
                      fontSize: 14,
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

  Widget _buildTabBar(BuildContext context) {
    return Padding(
      padding: const EdgeInsets.symmetric(horizontal: 20),
      child: Container(
        height: 44,
        decoration: BoxDecoration(
          color: const Color(0xFFF0F0F5),
          borderRadius: BorderRadius.circular(12),
        ),
        child: TabBar(
          controller: _tabController,
          labelColor: Colors.white,
          unselectedLabelColor: Colors.grey,
          labelStyle: const TextStyle(
            fontWeight: FontWeight.bold,
            fontSize: 14,
          ),
          unselectedLabelStyle: const TextStyle(fontSize: 14),
          indicator: BoxDecoration(
            color: const Color(0xFF1A3A8F),
            borderRadius: BorderRadius.circular(10),
          ),
          indicatorSize: TabBarIndicatorSize.tab,
          dividerColor: Colors.transparent,
          padding: const EdgeInsets.all(3),
          onTap: (i) {
            if (i == 0)
              context.read<PlanCubit>().fetchPlans();
            else
              context.read<PlanCubit>().fetchNutritionPlan();
          },
          tabs: const [
            Tab(text: 'Workout'),
            Tab(text: 'Nutrition'),
          ],
        ),
      ),
    );
  }

  // ─── WORKOUT TAB ───────────────────────────────────────────────
  Widget _buildWorkoutTab(BuildContext context, PlanState state) {
    if (state is PlanInitial ||
        state is PlanLoading ||
        state is WorkoutPlanGenerating) {
      return const Center(
        child: CircularProgressIndicator(color: Color(0xFF1A3A8F)),
      );
    }
    if (state is PlanError)
      return _buildError(
        context,
        state.message,
        () => context.read<PlanCubit>().fetchPlans(),
      );
    if (state is PlanLoaded) {
      if (state.allPlans.isEmpty) return _buildEmptyWorkout(context);
      return _buildWorkoutContent(context, state);
    }
    return const Center(
      child: CircularProgressIndicator(color: Color(0xFF1A3A8F)),
    );
  }

  Widget _buildWorkoutContent(BuildContext context, PlanLoaded state) {
    final plan = state.activePlan!;
    final days = plan.days;
    final selectedDay = state.selectedDayIndex < days.length
        ? days[state.selectedDayIndex]
        : null;

    return RefreshIndicator(
      color: const Color(0xFF1A3A8F),
      onRefresh: () => context.read<PlanCubit>().fetchPlans(),
      child: SingleChildScrollView(
        physics: const AlwaysScrollableScrollPhysics(),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            _buildHeroPlanCard(context, plan),
            const SizedBox(height: 20),
            if (days.isNotEmpty) ...[
              _buildDaySelector(context, days, state.selectedDayIndex),
              const SizedBox(height: 20),
            ],
            if (selectedDay != null) ...[
              const Padding(
                padding: EdgeInsets.symmetric(horizontal: 20),
                child: Text(
                  "Today's Workout",
                  style: TextStyle(
                    fontSize: 20,
                    fontWeight: FontWeight.bold,
                    color: Color(0xFF1A1A2E),
                  ),
                ),
              ),
              const SizedBox(height: 12),
              if (selectedDay.exercises.isEmpty)
                _buildRestDay()
              else
                ...selectedDay.exercises.map((ex) => _buildExerciseCard(ex)),
              const SizedBox(height: 24),
            ],
          ],
        ),
      ),
    );
  }

  Widget _buildHeroPlanCard(BuildContext context, PlanModel plan) {
    final dayLabels = _getDayLabels(plan.daysPerWeek ?? 0);
    return Padding(
      padding: const EdgeInsets.symmetric(horizontal: 20),
      child: Container(
        width: double.infinity,
        padding: const EdgeInsets.all(22),
        decoration: BoxDecoration(
          color: const Color(0xFF1A3A8F),
          borderRadius: BorderRadius.circular(20),
        ),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Row(
              mainAxisAlignment: MainAxisAlignment.spaceBetween,
              children: [
                Container(
                  padding: const EdgeInsets.symmetric(
                    horizontal: 10,
                    vertical: 4,
                  ),
                  decoration: BoxDecoration(
                    color: Colors.white.withOpacity(0.2),
                    borderRadius: BorderRadius.circular(8),
                  ),
                  child: const Text(
                    'ACTIVE',
                    style: TextStyle(
                      color: Colors.white,
                      fontSize: 11,
                      fontWeight: FontWeight.bold,
                      letterSpacing: 1.2,
                    ),
                  ),
                ),
                GestureDetector(
                  onTap: () => _confirmDelete(context, plan.planId),
                  child: Icon(
                    Icons.fitness_center_rounded,
                    color: Colors.white.withOpacity(0.6),
                    size: 24,
                  ),
                ),
              ],
            ),
            const SizedBox(height: 14),
            Text(
              plan.planName,
              maxLines: 2,
              overflow: TextOverflow.ellipsis,
              style: const TextStyle(
                color: Colors.white,
                fontSize: 26,
                fontWeight: FontWeight.bold,
              ),
            ),
            const SizedBox(height: 18),
            Row(
              children: [
                _planStatBox(
                  label: 'FREQUENCY',
                  value: '${plan.daysPerWeek ?? "—"}',
                  unit: 'days/wk',
                ),
                const SizedBox(width: 10),
                _planStatBox(
                  label: 'DURATION',
                  value: '${plan.durationWeeks ?? "—"}',
                  unit: 'weeks',
                ),
                const SizedBox(width: 10),
                _planStatBox(
                  label: 'LEVEL',
                  value: plan.fitnessLevel ?? '—',
                  unit: '',
                  wide: true,
                ),
              ],
            ),
            const SizedBox(height: 18),
            Row(
              mainAxisAlignment: MainAxisAlignment.spaceBetween,
              children: [
                // SingleChildScrollView لحل مشكلة التجاوز لو كان عدد الأيام كبير
                Expanded(
                  child: SingleChildScrollView(
                    scrollDirection: Axis.horizontal,
                    child: Row(
                      children: dayLabels
                          .map(
                            (d) => Container(
                              margin: const EdgeInsets.only(right: 6),
                              width: 32,
                              height: 32,
                              decoration: BoxDecoration(
                                color: Colors.white,
                                shape: BoxShape.circle,
                                boxShadow: [
                                  BoxShadow(
                                    color: Colors.black.withOpacity(0.1),
                                    blurRadius: 4,
                                  ),
                                ],
                              ),
                              child: Center(
                                child: Text(
                                  d,
                                  style: const TextStyle(
                                    color: Color(0xFF1A3A8F),
                                    fontWeight: FontWeight.bold,
                                    fontSize: 11,
                                  ),
                                ),
                              ),
                            ),
                          )
                          .toList(),
                    ),
                  ),
                ),
                const SizedBox(width: 8),
                Text(
                  'Week ${plan.currentWeek} of ${plan.durationWeeks ?? "—"}',
                  style: TextStyle(
                    color: Colors.white.withOpacity(0.85),
                    fontSize: 13,
                    fontWeight: FontWeight.w500,
                  ),
                ),
              ],
            ),
          ],
        ),
      ),
    );
  }

  Widget _planStatBox({
    required String label,
    required String value,
    required String unit,
    bool wide = false,
  }) {
    return Expanded(
      flex: wide ? 2 : 1,
      child: Container(
        padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 10),
        decoration: BoxDecoration(
          color: Colors.white.withOpacity(0.15),
          borderRadius: BorderRadius.circular(12),
        ),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Text(
              label,
              style: TextStyle(
                color: Colors.white.withOpacity(0.7),
                fontSize: 9,
                fontWeight: FontWeight.w600,
                letterSpacing: 0.5,
              ),
            ),
            const SizedBox(height: 4),
            FittedBox(
              fit: BoxFit.scaleDown,
              child: Text(
                value,
                style: const TextStyle(
                  color: Colors.white,
                  fontSize: 20,
                  fontWeight: FontWeight.bold,
                  height: 1.1,
                ),
              ),
            ),
            if (unit.isNotEmpty)
              Text(
                unit,
                style: TextStyle(
                  color: Colors.white.withOpacity(0.7),
                  fontSize: 11,
                ),
              ),
          ],
        ),
      ),
    );
  }

  Widget _buildDaySelector(
    BuildContext context,
    List<PlanDayModel> days,
    int selectedIndex,
  ) {
    // تم تكبير المساحة لـ 120 لضمان عدم حدوث Overflow عمودي
    return SizedBox(
      height: 120,
      child: ListView.builder(
        scrollDirection: Axis.horizontal,
        padding: const EdgeInsets.symmetric(horizontal: 16),
        itemCount: days.length,
        itemBuilder: (ctx, i) {
          final day = days[i];
          final isSelected = i == selectedIndex;
          final isRest = day.exercises.isEmpty;
          return GestureDetector(
            onTap: () => context.read<PlanCubit>().selectDay(i),
            child: AnimatedContainer(
              duration: const Duration(milliseconds: 200),
              width: 90,
              margin: const EdgeInsets.symmetric(horizontal: 4),
              decoration: BoxDecoration(
                color: Colors.white,
                borderRadius: BorderRadius.circular(16),
                border: Border.all(
                  color: isSelected
                      ? const Color(0xFF1A3A8F)
                      : Colors.grey.shade200,
                  width: isSelected ? 2 : 1,
                ),
              ),
              child: Column(
                mainAxisAlignment: MainAxisAlignment.center,
                mainAxisSize: MainAxisSize.min,
                children: [
                  Text(
                    'DAY ${day.dayNumber}',
                    style: TextStyle(
                      fontSize: 10,
                      fontWeight: FontWeight.bold,
                      color: isSelected ? const Color(0xFF1A3A8F) : Colors.grey,
                      letterSpacing: 0.5,
                    ),
                  ),
                  const SizedBox(height: 4),
                  Padding(
                    padding: const EdgeInsets.symmetric(horizontal: 4),
                    child: Text(
                      isRest
                          ? 'Rest'
                          : (day.dayName?.isNotEmpty == true
                                ? day.dayName!
                                : _guessMuscleName(day)),
                      style: TextStyle(
                        fontSize: 14,
                        fontWeight: FontWeight.bold,
                        color: isSelected
                            ? const Color(0xFF1A3A8F)
                            : Colors.black87,
                      ),
                      textAlign: TextAlign.center,
                      maxLines: 2,
                      overflow: TextOverflow.ellipsis,
                    ),
                  ),
                  const SizedBox(height: 6),
                  if (isSelected && !isRest)
                    const Icon(
                      Icons.check_circle_rounded,
                      color: Color(0xFF1A3A8F),
                      size: 18,
                    )
                  else if (isRest)
                    Icon(
                      Icons.bedtime_outlined,
                      color: Colors.grey.shade400,
                      size: 18,
                    ),
                ],
              ),
            ),
          );
        },
      ),
    );
  }

  Widget _buildExerciseCard(PlanExerciseModel ex) {
    return GestureDetector(
      onTap: () => ExerciseDetailSheet.show(context, ex),
      child: Container(
        margin: const EdgeInsets.fromLTRB(20, 0, 20, 12),
        decoration: BoxDecoration(
          color: Colors.white,
          borderRadius: BorderRadius.circular(16),
          boxShadow: [
            BoxShadow(
              color: Colors.grey.withOpacity(0.08),
              blurRadius: 10,
              offset: const Offset(0, 3),
            ),
          ],
        ),
        child: Padding(
          padding: const EdgeInsets.all(16),
          child: Row(
            children: [
              // ─── استخدام صورة من الإنترنت بدل الأيقونة للتمارين ───
              ClipRRect(
                borderRadius: BorderRadius.circular(12),
                child: Image.network(
                  'https://images.unsplash.com/photo-1581009146145-b5ef050c2e1e?q=80&w=200&auto=format&fit=crop',
                  width: 70,
                  height: 70,
                  fit: BoxFit.cover,
                  errorBuilder: (ctx, err, stack) => Container(
                    width: 70,
                    height: 70,
                    color: const Color(0xFF1A3A8F).withOpacity(0.08),
                    child: const Icon(
                      Icons.fitness_center_rounded,
                      color: Color(0xFF1A3A8F),
                      size: 30,
                    ),
                  ),
                ),
              ),
              const SizedBox(width: 14),
              Expanded(
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Row(
                      children: [
                        Expanded(
                          child: Text(
                            ex.exerciseName ?? 'Exercise',
                            style: const TextStyle(
                              fontSize: 16,
                              fontWeight: FontWeight.bold,
                              color: Color(0xFF1A1A2E),
                            ),
                          ),
                        ),
                        if (ex.muscleGroup != null) ...[
                          const SizedBox(width: 6),
                          Container(
                            padding: const EdgeInsets.symmetric(
                              horizontal: 8,
                              vertical: 3,
                            ),
                            decoration: BoxDecoration(
                              color: const Color(0xFF1A3A8F).withOpacity(0.1),
                              borderRadius: BorderRadius.circular(6),
                            ),
                            child: Text(
                              ex.muscleGroup!.toUpperCase(),
                              style: const TextStyle(
                                color: Color(0xFF1A3A8F),
                                fontSize: 9,
                                fontWeight: FontWeight.bold,
                                letterSpacing: 0.5,
                              ),
                            ),
                          ),
                        ],
                      ],
                    ),
                    const SizedBox(height: 10),
                    // Wrap للـ Stats لتجنب التجاوز الأفقي
                    Wrap(
                      spacing: 16,
                      runSpacing: 6,
                      children: [
                        _exerciseStat(
                          'SETS',
                          '${ex.sets ?? "—"} × ${ex.reps ?? "—"}',
                        ),
                        _exerciseStat('REST', ex.restDisplay),
                      ],
                    ),
                  ],
                ),
              ),
              const SizedBox(width: 8),
              const Icon(
                Icons.chevron_right_rounded,
                color: Colors.grey,
                size: 20,
              ),
            ],
          ),
        ),
      ),
    );
  }

  Widget _exerciseStat(String label, String value) {
    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        Text(
          label,
          style: const TextStyle(
            color: Colors.grey,
            fontSize: 10,
            fontWeight: FontWeight.w600,
            letterSpacing: 0.5,
          ),
        ),
        const SizedBox(height: 2),
        Text(
          value,
          style: const TextStyle(
            color: Color(0xFF1A3A8F),
            fontSize: 15,
            fontWeight: FontWeight.bold,
          ),
        ),
      ],
    );
  }

  Widget _buildRestDay() {
    return Padding(
      padding: const EdgeInsets.symmetric(horizontal: 20),
      child: Container(
        width: double.infinity,
        padding: const EdgeInsets.all(32),
        decoration: BoxDecoration(
          color: Colors.grey.shade50,
          borderRadius: BorderRadius.circular(18),
          border: Border.all(color: Colors.grey.shade200),
        ),
        child: Column(
          children: [
            Icon(Icons.bedtime_outlined, size: 48, color: Colors.grey.shade400),
            const SizedBox(height: 12),
            Text(
              'Rest Day',
              style: TextStyle(
                fontSize: 18,
                fontWeight: FontWeight.bold,
                color: Colors.grey.shade500,
              ),
            ),
            const SizedBox(height: 6),
            Text(
              'Recovery is part of the process 💪',
              style: TextStyle(color: Colors.grey.shade400, fontSize: 13),
            ),
          ],
        ),
      ),
    );
  }

  // ─── NUTRITION TAB ─────────────────────────────────────────────
  Widget _buildNutritionTab(BuildContext context, PlanState state) {
    if (state is NutritionPlanLoading || state is NutritionPlanGenerating) {
      return const Center(
        child: CircularProgressIndicator(color: Color(0xFF1A3A8F)),
      );
    }
    if (state is NutritionPlanError) {
      return _buildError(
        context,
        state.message,
        () => context.read<PlanCubit>().fetchNutritionPlan(),
      );
    }
    if (state is NutritionPlanLoaded) {
      if (state.allPlans.isEmpty) return _buildEmptyNutrition(context);
      return _buildNutritionContent(context, state);
    }
    return _buildEmptyNutrition(context);
  }

  Widget _buildNutritionContent(
    BuildContext context,
    NutritionPlanLoaded state,
  ) {
    final plan = state.activePlan!;
    return RefreshIndicator(
      color: const Color(0xFF1A3A8F),
      onRefresh: () => context.read<PlanCubit>().fetchNutritionPlan(),
      child: SingleChildScrollView(
        physics: const AlwaysScrollableScrollPhysics(),
        padding: const EdgeInsets.symmetric(horizontal: 20),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            _buildNutritionHeroCard(plan),
            const SizedBox(height: 20),
            _buildMacrosRow(plan),
            if (plan.days.isNotEmpty) ...[
              const SizedBox(height: 20),
              const Text(
                'Meal Schedule',
                style: TextStyle(
                  fontSize: 18,
                  fontWeight: FontWeight.bold,
                  color: Color(0xFF1A1A2E),
                ),
              ),
              const SizedBox(height: 12),
              ...plan.days.map((d) => _buildNutritionDayCard(d)),
            ],
            const SizedBox(height: 24),
          ],
        ),
      ),
    );
  }

  Widget _buildNutritionHeroCard(NutritionPlanModel plan) {
    return Container(
      width: double.infinity,
      padding: const EdgeInsets.all(22),
      decoration: BoxDecoration(
        color: const Color(0xFF1B6B3A),
        borderRadius: BorderRadius.circular(20),
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Row(
            mainAxisAlignment: MainAxisAlignment.spaceBetween,
            children: [
              Container(
                padding: const EdgeInsets.symmetric(
                  horizontal: 10,
                  vertical: 4,
                ),
                decoration: BoxDecoration(
                  color: Colors.white.withOpacity(0.2),
                  borderRadius: BorderRadius.circular(8),
                ),
                child: const Text(
                  'ACTIVE',
                  style: TextStyle(
                    color: Colors.white,
                    fontSize: 11,
                    fontWeight: FontWeight.bold,
                    letterSpacing: 1.2,
                  ),
                ),
              ),
              Icon(
                Icons.restaurant_rounded,
                color: Colors.white.withOpacity(0.7),
                size: 22,
              ),
            ],
          ),
          const SizedBox(height: 12),
          Text(
            plan.planName,
            maxLines: 2,
            overflow: TextOverflow.ellipsis,
            style: const TextStyle(
              color: Colors.white,
              fontSize: 24,
              fontWeight: FontWeight.bold,
            ),
          ),
          if (plan.description != null) ...[
            const SizedBox(height: 6),
            Text(
              plan.description!,
              style: TextStyle(
                color: Colors.white.withOpacity(0.7),
                fontSize: 13,
              ),
            ),
          ],
          const SizedBox(height: 16),
          Row(
            children: [
              _nutritionStatBox('🔥', plan.caloriesDisplay, 'Calories'),
              const SizedBox(width: 6),
              _nutritionStatBox('💪', plan.proteinDisplay, 'Protein'),
              const SizedBox(width: 6),
              _nutritionStatBox('🌾', plan.carbsDisplay, 'Carbs'),
              const SizedBox(width: 6),
              _nutritionStatBox('🥑', plan.fatDisplay, 'Fat'),
            ],
          ),
        ],
      ),
    );
  }

  Widget _nutritionStatBox(String emoji, String value, String label) {
    return Expanded(
      child: Container(
        padding: const EdgeInsets.symmetric(vertical: 10, horizontal: 4),
        decoration: BoxDecoration(
          color: Colors.white.withOpacity(0.15),
          borderRadius: BorderRadius.circular(12),
        ),
        child: Column(
          children: [
            Text(emoji, style: const TextStyle(fontSize: 14)),
            const SizedBox(height: 3),
            FittedBox(
              fit: BoxFit.scaleDown,
              child: Text(
                value,
                style: const TextStyle(
                  color: Colors.white,
                  fontWeight: FontWeight.bold,
                  fontSize: 12,
                ),
              ),
            ),
            Text(
              label,
              style: TextStyle(
                color: Colors.white.withOpacity(0.7),
                fontSize: 9,
              ),
            ),
          ],
        ),
      ),
    );
  }

  Widget _buildMacrosRow(NutritionPlanModel plan) {
    return Container(
      padding: const EdgeInsets.all(18),
      decoration: BoxDecoration(
        color: Colors.white,
        borderRadius: BorderRadius.circular(18),
        boxShadow: [
          BoxShadow(
            color: Colors.grey.withOpacity(0.07),
            blurRadius: 10,
            offset: const Offset(0, 3),
          ),
        ],
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          const Text(
            'Daily Macros',
            style: TextStyle(
              fontWeight: FontWeight.bold,
              fontSize: 15,
              color: Color(0xFF1A1A2E),
            ),
          ),
          const SizedBox(height: 14),
          if (plan.dailyCalories != null)
            _macroBar('Calories', plan.dailyCalories!, 2500, Colors.orange),
          if (plan.proteinGrams != null)
            _macroBar(
              'Protein (g)',
              plan.proteinGrams!,
              200,
              const Color(0xFF1A3A8F),
            ),
          if (plan.carbsGrams != null)
            _macroBar(
              'Carbs (g)',
              plan.carbsGrams!,
              300,
              const Color(0xFF1B6B3A),
            ),
          if (plan.fatGrams != null)
            _macroBar('Fat (g)', plan.fatGrams!, 80, Colors.purple),
          if (plan.dailyCalories == null && plan.proteinGrams == null)
            const Center(
              child: Padding(
                padding: EdgeInsets.all(12),
                child: Text(
                  'Macro details not available',
                  style: TextStyle(color: Colors.grey),
                ),
              ),
            ),
        ],
      ),
    );
  }

  Widget _macroBar(String label, int value, int max, Color color) {
    final progress = (value / max).clamp(0.0, 1.0);
    return Padding(
      padding: const EdgeInsets.only(bottom: 12),
      child: Column(
        children: [
          Row(
            mainAxisAlignment: MainAxisAlignment.spaceBetween,
            children: [
              Text(
                label,
                style: const TextStyle(color: Colors.black87, fontSize: 13),
              ),
              Text(
                '$value',
                style: TextStyle(
                  color: color,
                  fontWeight: FontWeight.bold,
                  fontSize: 13,
                ),
              ),
            ],
          ),
          const SizedBox(height: 6),
          ClipRRect(
            borderRadius: BorderRadius.circular(6),
            child: LinearProgressIndicator(
              value: progress,
              backgroundColor: Colors.grey.shade100,
              valueColor: AlwaysStoppedAnimation<Color>(color),
              minHeight: 8,
            ),
          ),
        ],
      ),
    );
  }

  Widget _buildNutritionDayCard(NutritionDayModel day) {
    return Container(
      margin: const EdgeInsets.only(bottom: 12),
      decoration: BoxDecoration(
        color: Colors.white,
        borderRadius: BorderRadius.circular(16),
        boxShadow: [
          BoxShadow(
            color: Colors.grey.withOpacity(0.06),
            blurRadius: 8,
            offset: const Offset(0, 2),
          ),
        ],
      ),
      child: Theme(
        data: Theme.of(context).copyWith(dividerColor: Colors.transparent),
        child: ExpansionTile(
          tilePadding: const EdgeInsets.symmetric(horizontal: 16, vertical: 4),
          // ─── استخدام صورة أكل من الإنترنت بدل الأيقونة ───
          leading: ClipRRect(
            borderRadius: BorderRadius.circular(10),
            child: Image.network(
              'https://images.unsplash.com/photo-1490645935967-10de6ba17061?q=80&w=150&auto=format&fit=crop',
              width: 38,
              height: 38,
              fit: BoxFit.cover,
              errorBuilder: (_, __, ___) => Container(
                width: 38,
                height: 38,
                color: const Color(0xFF1B6B3A).withOpacity(0.1),
                child: const Icon(
                  Icons.restaurant_rounded,
                  color: Color(0xFF1B6B3A),
                  size: 18,
                ),
              ),
            ),
          ),
          title: Text(
            day.displayName,
            style: const TextStyle(
              fontWeight: FontWeight.bold,
              fontSize: 14,
              color: Color(0xFF1A1A2E),
            ),
          ),
          subtitle: Text(
            '${day.meals.length} meals',
            style: const TextStyle(color: Colors.grey, fontSize: 12),
          ),
          shape: RoundedRectangleBorder(
            borderRadius: BorderRadius.circular(16),
          ),
          collapsedShape: RoundedRectangleBorder(
            borderRadius: BorderRadius.circular(16),
          ),
          children: day.meals.map((m) => _buildMealTile(m)).toList(),
        ),
      ),
    );
  }

  Widget _buildMealTile(NutritionMealModel meal) {
    return Padding(
      padding: const EdgeInsets.fromLTRB(16, 0, 16, 12),
      child: Container(
        padding: const EdgeInsets.all(14),
        decoration: BoxDecoration(
          color: const Color(0xFFF6F8FF),
          borderRadius: BorderRadius.circular(12),
        ),
        child: Row(
          children: [
            Expanded(
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Text(
                    meal.mealType,
                    style: const TextStyle(
                      fontWeight: FontWeight.bold,
                      fontSize: 13,
                      color: Color(0xFF1A1A2E),
                    ),
                  ),
                  if (meal.description != null) ...[
                    const SizedBox(height: 3),
                    Text(
                      meal.description!,
                      style: const TextStyle(color: Colors.grey, fontSize: 12),
                    ),
                  ],
                  if (meal.foods.isNotEmpty) ...[
                    const SizedBox(height: 6),
                    Wrap(
                      spacing: 6,
                      runSpacing: 4,
                      children: meal.foods
                          .map(
                            (f) => Container(
                              padding: const EdgeInsets.symmetric(
                                horizontal: 8,
                                vertical: 3,
                              ),
                              decoration: BoxDecoration(
                                color: const Color(0xFF1B6B3A).withOpacity(0.1),
                                borderRadius: BorderRadius.circular(8),
                              ),
                              child: Text(
                                f,
                                style: const TextStyle(
                                  color: Color(0xFF1B6B3A),
                                  fontSize: 11,
                                ),
                              ),
                            ),
                          )
                          .toList(),
                    ),
                  ],
                ],
              ),
            ),
            if (meal.calories != null)
              Container(
                padding: const EdgeInsets.symmetric(
                  horizontal: 10,
                  vertical: 5,
                ),
                decoration: BoxDecoration(
                  color: Colors.orange.withOpacity(0.1),
                  borderRadius: BorderRadius.circular(10),
                ),
                child: Text(
                  '${meal.calories} kcal',
                  style: const TextStyle(
                    color: Colors.orange,
                    fontWeight: FontWeight.bold,
                    fontSize: 12,
                  ),
                ),
              ),
          ],
        ),
      ),
    );
  }

  // ─── EMPTY STATES ──────────────────────────────────────────────
  Widget _buildEmptyWorkout(BuildContext context) {
    return Center(
      child: Padding(
        padding: const EdgeInsets.all(32),
        child: Column(
          mainAxisAlignment: MainAxisAlignment.center,
          children: [
            Container(
              width: 90,
              height: 90,
              decoration: BoxDecoration(
                color: const Color(0xFF1A3A8F).withOpacity(0.08),
                shape: BoxShape.circle,
              ),
              child: const Icon(
                Icons.fitness_center_rounded,
                color: Color(0xFF1A3A8F),
                size: 44,
              ),
            ),
            const SizedBox(height: 20),
            const Text(
              'No Workout Plan Yet',
              style: TextStyle(fontSize: 18, fontWeight: FontWeight.bold),
            ),
            const SizedBox(height: 8),
            const Text(
              'Generate a personalized AI workout plan\nbased on your fitness goals.',
              textAlign: TextAlign.center,
              style: TextStyle(color: Colors.grey, fontSize: 14),
            ),
            const SizedBox(height: 24),
            ElevatedButton.icon(
              onPressed: () {
                _showGenerateOptions(context);
              },
              icon: const Icon(Icons.auto_awesome, size: 18),
              label: const Text(
                'Generate Workout Plan',
                style: TextStyle(fontWeight: FontWeight.bold),
              ),
              style: ElevatedButton.styleFrom(
                backgroundColor: const Color(0xFF1A3A8F),
                foregroundColor: Colors.white,
                elevation: 0,
                padding: const EdgeInsets.symmetric(
                  horizontal: 24,
                  vertical: 14,
                ),
                shape: RoundedRectangleBorder(
                  borderRadius: BorderRadius.circular(14),
                ),
              ),
            ),
          ],
        ),
      ),
    );
  }

  Widget _buildEmptyNutrition(BuildContext context) {
    return Center(
      child: Padding(
        padding: const EdgeInsets.all(32),
        child: Column(
          mainAxisAlignment: MainAxisAlignment.center,
          children: [
            Container(
              width: 90,
              height: 90,
              decoration: BoxDecoration(
                color: const Color(0xFF1B6B3A).withOpacity(0.08),
                shape: BoxShape.circle,
              ),
              child: const Icon(
                Icons.restaurant_rounded,
                color: Color(0xFF1B6B3A),
                size: 44,
              ),
            ),
            const SizedBox(height: 20),
            const Text(
              'No Nutrition Plan Yet',
              style: TextStyle(fontSize: 18, fontWeight: FontWeight.bold),
            ),
            const SizedBox(height: 8),
            const Text(
              'Generate a personalized AI nutrition plan\ntailored to your goals.',
              textAlign: TextAlign.center,
              style: TextStyle(color: Colors.grey, fontSize: 14),
            ),
            const SizedBox(height: 24),
            ElevatedButton.icon(
              onPressed: () {
                _showGenerateOptions(context);
              },
              icon: const Icon(Icons.auto_awesome, size: 18),
              label: const Text(
                'Generate Nutrition Plan',
                style: TextStyle(fontWeight: FontWeight.bold),
              ),
              style: ElevatedButton.styleFrom(
                backgroundColor: const Color(0xFF1B6B3A),
                foregroundColor: Colors.white,
                elevation: 0,
                padding: const EdgeInsets.symmetric(
                  horizontal: 24,
                  vertical: 14,
                ),
                shape: RoundedRectangleBorder(
                  borderRadius: BorderRadius.circular(14),
                ),
              ),
            ),
          ],
        ),
      ),
    );
  }

  // ─── GENERATE DIALOGS ──────────────────────────────────────────
  void _showGenerateOptions(BuildContext context) {
    showModalBottomSheet(
      context: context,
      backgroundColor: Colors.transparent,
      builder: (_) => Container(
        decoration: const BoxDecoration(
          color: Colors.white,
          borderRadius: BorderRadius.vertical(top: Radius.circular(28)),
        ),
        padding: const EdgeInsets.all(24),
        child: Column(
          mainAxisSize: MainAxisSize.min,
          children: [
            Container(
              width: 40,
              height: 4,
              decoration: BoxDecoration(
                color: Colors.grey.shade300,
                borderRadius: BorderRadius.circular(2),
              ),
            ),
            const SizedBox(height: 20),
            const Text(
              'Generate AI Plan',
              style: TextStyle(fontSize: 18, fontWeight: FontWeight.bold),
            ),
            const SizedBox(height: 20),
            _genOption(
              icon: Icons.fitness_center_rounded,
              color: const Color(0xFF1A3A8F),
              title: 'Workout Plan',
              subtitle: 'AI-personalized training schedule',
              onTap: () {
                Navigator.pop(context);
                Navigator.push(
                  context,
                  MaterialPageRoute(builder: (_) => const GeneratePlanScreen()),
                );
              },
            ),
            const SizedBox(height: 12),
            _genOption(
              icon: Icons.restaurant_rounded,
              color: const Color(0xFF1B6B3A),
              title: 'Nutrition Plan',
              subtitle: 'AI-tailored daily meal plan',
              onTap: () {
                Navigator.pop(context);
                Navigator.push(
                  context,
                  MaterialPageRoute(
                    builder: (_) => const GenerateNutritionScreen(),
                  ),
                );
              },
            ),
            const SizedBox(height: 8),
          ],
        ),
      ),
    );
  }

  Widget _genOption({
    required IconData icon,
    required Color color,
    required String title,
    required String subtitle,
    required VoidCallback onTap,
  }) {
    return GestureDetector(
      onTap: onTap,
      child: Container(
        padding: const EdgeInsets.all(16),
        decoration: BoxDecoration(
          color: color.withOpacity(0.05),
          borderRadius: BorderRadius.circular(16),
          border: Border.all(color: color.withOpacity(0.2)),
        ),
        child: Row(
          children: [
            Container(
              padding: const EdgeInsets.all(10),
              decoration: BoxDecoration(
                color: color.withOpacity(0.1),
                borderRadius: BorderRadius.circular(12),
              ),
              child: Icon(icon, color: color, size: 22),
            ),
            const SizedBox(width: 14),
            Expanded(
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Text(
                    title,
                    style: const TextStyle(
                      fontWeight: FontWeight.bold,
                      fontSize: 15,
                    ),
                  ),
                  Text(
                    subtitle,
                    style: const TextStyle(color: Colors.grey, fontSize: 12),
                  ),
                ],
              ),
            ),
            Icon(Icons.arrow_forward_ios_rounded, color: color, size: 16),
          ],
        ),
      ),
    );
  }

  // ─── HELPERS ───────────────────────────────────────────────────
  Widget _buildError(
    BuildContext context,
    String message,
    VoidCallback onRetry,
  ) {
    return Center(
      child: Padding(
        padding: const EdgeInsets.all(24),
        child: Column(
          mainAxisAlignment: MainAxisAlignment.center,
          children: [
            Icon(Icons.wifi_off_rounded, size: 64, color: Colors.grey.shade300),
            const SizedBox(height: 16),
            Text(
              message,
              textAlign: TextAlign.center,
              style: const TextStyle(color: Colors.grey, fontSize: 14),
            ),
            const SizedBox(height: 24),
            ElevatedButton.icon(
              onPressed: onRetry,
              icon: const Icon(Icons.refresh_rounded),
              label: const Text('Try Again'),
              style: ElevatedButton.styleFrom(
                backgroundColor: const Color(0xFF1A3A8F),
                foregroundColor: Colors.white,
                shape: RoundedRectangleBorder(
                  borderRadius: BorderRadius.circular(12),
                ),
                padding: const EdgeInsets.symmetric(
                  horizontal: 24,
                  vertical: 12,
                ),
              ),
            ),
          ],
        ),
      ),
    );
  }

  void _confirmDelete(BuildContext context, int planId) {
    showDialog(
      context: context,
      builder: (_) => AlertDialog(
        shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(20)),
        title: const Text(
          'Delete Plan',
          style: TextStyle(fontWeight: FontWeight.bold),
        ),
        content: const Text('Are you sure you want to delete this plan?'),
        actions: [
          TextButton(
            onPressed: () => Navigator.pop(context),
            child: const Text('Cancel', style: TextStyle(color: Colors.grey)),
          ),
          ElevatedButton(
            onPressed: () {
              Navigator.pop(context);
              context.read<PlanCubit>().deletePlan(planId);
            },
            style: ElevatedButton.styleFrom(
              backgroundColor: Colors.redAccent,
              shape: RoundedRectangleBorder(
                borderRadius: BorderRadius.circular(10),
              ),
            ),
            child: const Text('Delete', style: TextStyle(color: Colors.white)),
          ),
        ],
      ),
    );
  }

  List<String> _getDayLabels(int daysPerWeek) {
    final all = ['S', 'M', 'T', 'W', 'T', 'F', 'S'];
    if (daysPerWeek <= 0 || daysPerWeek > 7) return all.take(5).toList();
    return all.take(daysPerWeek).toList();
  }

  String _guessMuscleName(PlanDayModel day) {
    if (day.exercises.isEmpty) return 'Rest';
    final groups = day.exercises
        .map((e) => e.muscleGroup ?? '')
        .where((g) => g.isNotEmpty)
        .toList();
    if (groups.isEmpty) return 'Day ${day.dayNumber}';
    final freq = <String, int>{};
    for (final g in groups) freq[g] = (freq[g] ?? 0) + 1;
    return freq.entries.reduce((a, b) => a.value >= b.value ? a : b).key;
  }
}
