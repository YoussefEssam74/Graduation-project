// import 'package:flutter/material.dart';
// import 'package:flutter_bloc/flutter_bloc.dart';
// import '../cubit/generate_plan_cubit.dart';
// import '../cubit/generate_plan_state.dart';

// class GeneratePlanScreen extends StatefulWidget {
//   const GeneratePlanScreen({super.key});
//   @override
//   State<GeneratePlanScreen> createState() => _GeneratePlanScreenState();
// }

// class _GeneratePlanScreenState extends State<GeneratePlanScreen>
//     with TickerProviderStateMixin {
//   int _step = 0; // 0=Goal&Level  1=Training  2=Generate

//   // Step 1
//   String _goal = 'Build Muscle';
//   String _level = 'Intermediate';

//   // Step 2
//   int _daysPerWeek = 4;
//   final Set<String> _equipment = {};

//   // Step 3
//   final Set<String> _injuries = {};
//   bool _includeUserContext = true;

//   late AnimationController _stepAnim;
//   late Animation<double> _fadeAnim;

//   static const _goals = [
//     ('Build Muscle', '💪', 'Hypertrophy & size'),
//     ('Strength', '🛡️', 'Max force output'),
//     ('Weight Loss', '🔥', 'Fat burning'),
//     ('Cardio', '💨', 'Cardiovascular health'),
//     ('Endurance', '🚴', 'Stamina & energy'),
//   ];

//   static const _levels = [
//     ('Beginner', '🌱', '0–1 years'),
//     ('Intermediate', '⚡', '1–3 years'),
//     ('Advanced', '🔥', '3+ years'),
//   ];

//   static const _equipmentList = [
//     ('🏋️', 'Barbell'),
//     ('💪', 'Dumbbells'),
//     ('🔗', 'Cable Machine'),
//     ('🏃', 'Body Weight'),
//     ('🔔', 'Kettlebell'),
//     ('🎀', 'Resistance Bands'),
//     ('🔝', 'Pull-up Bar'),
//     ('🪑', 'Bench'),
//   ];

//   static const _injuryList = [
//     ('🩹', 'Lower Back'),
//     ('🤕', 'Shoulder'),
//     ('🦵', 'Knee'),
//     ('✋', 'Wrist'),
//     ('💪', 'Elbow'),
//     ('🍑', 'Hip'),
//     ('🦶', 'Ankle'),
//   ];

//   @override
//   void initState() {
//     super.initState();
//     _stepAnim = AnimationController(
//       vsync: this,
//       duration: const Duration(milliseconds: 350),
//     );
//     _fadeAnim = CurvedAnimation(parent: _stepAnim, curve: Curves.easeOut);
//     _stepAnim.forward();
//   }

//   @override
//   void dispose() {
//     _stepAnim.dispose();
//     super.dispose();
//   }

//   void _nextStep() {
//     if (_step == 1 && _equipment.isEmpty) {
//       ScaffoldMessenger.of(context).showSnackBar(
//         const SnackBar(
//           content: Text('Select at least one equipment option to continue.'),
//           backgroundColor: Colors.orange,
//           behavior: SnackBarBehavior.floating,
//         ),
//       );
//       return;
//     }
//     setState(() => _step++);
//     _stepAnim.forward(from: 0);
//   }

//   void _prevStep() {
//     if (_step == 0) {
//       Navigator.pop(context);
//       return;
//     }
//     setState(() => _step--);
//     _stepAnim.forward(from: 0);
//   }

//   @override
//   Widget build(BuildContext context) {
//     return BlocProvider(
//       create: (_) => GeneratePlanCubit(),
//       child: Builder(
//         builder: (ctx) {
//           return Scaffold(
//             backgroundColor: Colors.grey.shade100,
//             body: BlocConsumer<GeneratePlanCubit, GeneratePlanState>(
//               listener: (context, state) {
//                 if (state is GeneratePlanSuccess) {
//                   ScaffoldMessenger.of(context).showSnackBar(
//                     const SnackBar(
//                       content: Text('Workout plan generated! 💪'),
//                       backgroundColor: Colors.green,
//                       behavior: SnackBarBehavior.floating,
//                     ),
//                   );
//                   Navigator.pop(context, true);
//                 }
//                 if (state is GeneratePlanError) {
//                   final isToken = state.message.toLowerCase().contains('token');
//                   ScaffoldMessenger.of(context).showSnackBar(
//                     SnackBar(
//                       content: Row(
//                         children: [
//                           Icon(
//                             isToken ? Icons.toll_rounded : Icons.error_outline,
//                             color: Colors.white,
//                             size: 18,
//                           ),
//                           const SizedBox(width: 8),
//                           Expanded(child: Text(state.message)),
//                         ],
//                       ),
//                       backgroundColor: isToken
//                           ? Colors.orange
//                           : Colors.redAccent,
//                       behavior: SnackBarBehavior.floating,
//                       duration: const Duration(seconds: 5),
//                     ),
//                   );
//                 }
//               },
//               builder: (context, state) {
//                 final loading = state is GeneratePlanLoading;
//                 return Column(
//                   children: [
//                     _buildHeader(ctx),
//                     Expanded(
//                       child: FadeTransition(
//                         opacity: _fadeAnim,
//                         child: SingleChildScrollView(
//                           padding: const EdgeInsets.all(20),
//                           child: _step == 0
//                               ? _buildStep1()
//                               : _step == 1
//                               ? _buildStep2()
//                               : _buildStep3(context, state),
//                         ),
//                       ),
//                     ),
//                     _buildFooter(context, loading),
//                   ],
//                 );
//               },
//             ),
//           );
//         },
//       ),
//     );
//   }

//   // ══════════════════════════════════════════════
//   // Header with stepper
//   // ══════════════════════════════════════════════
//   Widget _buildHeader(BuildContext ctx) {
//     return Container(
//       decoration: const BoxDecoration(
//         gradient: LinearGradient(
//           colors: [Color(0xFF1A3A8F), Color(0xFF3F51B5)],
//           begin: Alignment.topLeft,
//           end: Alignment.bottomRight,
//         ),
//       ),
//       child: SafeArea(
//         bottom: false,
//         child: Column(
//           children: [
//             Padding(
//               padding: const EdgeInsets.fromLTRB(16, 12, 16, 0),
//               child: Row(
//                 children: [
//                   GestureDetector(
//                     onTap: _prevStep,
//                     child: Container(
//                       padding: const EdgeInsets.all(8),
//                       decoration: BoxDecoration(
//                         color: Colors.white.withOpacity(0.2),
//                         borderRadius: BorderRadius.circular(10),
//                       ),
//                       child: const Icon(
//                         Icons.arrow_back_ios_new_rounded,
//                         color: Colors.white,
//                         size: 16,
//                       ),
//                     ),
//                   ),
//                   const SizedBox(width: 12),
//                   const Column(
//                     crossAxisAlignment: CrossAxisAlignment.start,
//                     children: [
//                       Text(
//                         'AI Workout Planner',
//                         style: TextStyle(
//                           color: Colors.white,
//                           fontWeight: FontWeight.bold,
//                           fontSize: 18,
//                         ),
//                       ),
//                       Text(
//                         'Personalized plan in 3 steps',
//                         style: TextStyle(color: Colors.white70, fontSize: 12),
//                       ),
//                     ],
//                   ),
//                 ],
//               ),
//             ),
//             const SizedBox(height: 16),
//             _buildStepper(),
//             const SizedBox(height: 8),
//           ],
//         ),
//       ),
//     );
//   }

//   Widget _buildStepper() {
//     final steps = ['Goal & Level', 'Training Setup', 'Generate'];
//     return Padding(
//       padding: const EdgeInsets.symmetric(horizontal: 20),
//       child: Row(
//         children: List.generate(steps.length * 2 - 1, (i) {
//           if (i.isOdd) {
//             // Line
//             final lineIdx = i ~/ 2;
//             final done = _step > lineIdx;
//             return Expanded(
//               child: Container(
//                 height: 2,
//                 color: done ? Colors.white : Colors.white.withOpacity(0.25),
//               ),
//             );
//           }
//           final idx = i ~/ 2;
//           final done = _step > idx;
//           final active = _step == idx;
//           return Column(
//             children: [
//               AnimatedContainer(
//                 duration: const Duration(milliseconds: 300),
//                 width: 36,
//                 height: 36,
//                 decoration: BoxDecoration(
//                   color: done
//                       ? Colors.green
//                       : active
//                       ? Colors.white
//                       : Colors.white.withOpacity(0.2),
//                   shape: BoxShape.circle,
//                   border: Border.all(
//                     color: active ? Colors.white : Colors.transparent,
//                     width: 2,
//                   ),
//                 ),
//                 child: Center(
//                   child: done
//                       ? const Icon(
//                           Icons.check_rounded,
//                           color: Colors.white,
//                           size: 18,
//                         )
//                       : Text(
//                           '${idx + 1}',
//                           style: TextStyle(
//                             color: active
//                                 ? const Color(0xFF1A3A8F)
//                                 : Colors.white70,
//                             fontWeight: FontWeight.bold,
//                             fontSize: 14,
//                           ),
//                         ),
//                 ),
//               ),
//               const SizedBox(height: 4),
//               Text(
//                 steps[idx],
//                 style: TextStyle(
//                   color: active ? Colors.white : Colors.white60,
//                   fontSize: 10,
//                   fontWeight: active ? FontWeight.bold : FontWeight.normal,
//                 ),
//               ),
//             ],
//           );
//         }),
//       ),
//     );
//   }

//   // ══════════════════════════════════════════════
//   // Step 1: Goal & Level
//   // ══════════════════════════════════════════════
//   Widget _buildStep1() {
//     return Column(
//       crossAxisAlignment: CrossAxisAlignment.start,
//       children: [
//         _sectionHeader('⚡', 'Primary Goal'),
//         const SizedBox(height: 12),
//         GridView.count(
//           crossAxisCount: 2,
//           shrinkWrap: true,
//           physics: const NeverScrollableScrollPhysics(),
//           crossAxisSpacing: 10,
//           mainAxisSpacing: 10,
//           childAspectRatio: 2.2,
//           children: _goals.map((g) {
//             final isSelected = _goal == g.$1;
//             return GestureDetector(
//               onTap: () => setState(() => _goal = g.$1),
//               child: AnimatedContainer(
//                 duration: const Duration(milliseconds: 200),
//                 padding: const EdgeInsets.symmetric(
//                   horizontal: 12,
//                   vertical: 10,
//                 ),
//                 decoration: BoxDecoration(
//                   color: isSelected
//                       ? const Color(0xFF1A3A8F).withOpacity(0.1)
//                       : Colors.white,
//                   borderRadius: BorderRadius.circular(14),
//                   border: Border.all(
//                     color: isSelected
//                         ? const Color(0xFF1A3A8F)
//                         : Colors.grey.shade200,
//                     width: isSelected ? 2 : 1,
//                   ),
//                   boxShadow: [
//                     BoxShadow(
//                       color: Colors.grey.withOpacity(0.06),
//                       blurRadius: 6,
//                       offset: const Offset(0, 2),
//                     ),
//                   ],
//                 ),
//                 child: Row(
//                   children: [
//                     Text(g.$2, style: const TextStyle(fontSize: 20)),
//                     const SizedBox(width: 8),
//                     Expanded(
//                       child: Column(
//                         crossAxisAlignment: CrossAxisAlignment.start,
//                         mainAxisAlignment: MainAxisAlignment.center,
//                         children: [
//                           Text(
//                             g.$1,
//                             style: TextStyle(
//                               fontWeight: FontWeight.bold,
//                               fontSize: 13,
//                               color: isSelected
//                                   ? const Color(0xFF1A3A8F)
//                                   : Colors.black87,
//                             ),
//                           ),
//                           Text(
//                             g.$3,
//                             style: TextStyle(
//                               fontSize: 10,
//                               color: Colors.grey.shade500,
//                             ),
//                           ),
//                         ],
//                       ),
//                     ),
//                     if (isSelected)
//                       const Icon(
//                         Icons.check_circle_rounded,
//                         color: Color(0xFF1A3A8F),
//                         size: 18,
//                       ),
//                   ],
//                 ),
//               ),
//             );
//           }).toList(),
//         ),
//         const SizedBox(height: 24),
//         _sectionHeader('🎯', 'Fitness Level'),
//         const SizedBox(height: 12),
//         Row(
//           children: _levels.map((l) {
//             final isSelected = _level == l.$1;
//             return Expanded(
//               child: GestureDetector(
//                 onTap: () => setState(() => _level = l.$1),
//                 child: AnimatedContainer(
//                   duration: const Duration(milliseconds: 200),
//                   margin: const EdgeInsets.symmetric(horizontal: 4),
//                   padding: const EdgeInsets.symmetric(vertical: 16),
//                   decoration: BoxDecoration(
//                     color: isSelected
//                         ? const Color(0xFF1A3A8F).withOpacity(0.06)
//                         : Colors.white,
//                     borderRadius: BorderRadius.circular(16),
//                     border: Border.all(
//                       color: isSelected
//                           ? const Color(0xFF1A3A8F)
//                           : Colors.grey.shade200,
//                       width: isSelected ? 2 : 1,
//                     ),
//                     boxShadow: [
//                       BoxShadow(
//                         color: Colors.grey.withOpacity(0.06),
//                         blurRadius: 6,
//                         offset: const Offset(0, 2),
//                       ),
//                     ],
//                   ),
//                   child: Column(
//                     children: [
//                       Text(l.$2, style: const TextStyle(fontSize: 26)),
//                       const SizedBox(height: 6),
//                       Text(
//                         l.$1,
//                         style: TextStyle(
//                           fontWeight: FontWeight.bold,
//                           fontSize: 13,
//                           color: isSelected
//                               ? const Color(0xFF1A3A8F)
//                               : Colors.black87,
//                         ),
//                       ),
//                       Text(
//                         l.$3,
//                         style: TextStyle(
//                           fontSize: 10,
//                           color: Colors.grey.shade500,
//                         ),
//                       ),
//                     ],
//                   ),
//                 ),
//               ),
//             );
//           }).toList(),
//         ),
//       ],
//     );
//   }

//   // ══════════════════════════════════════════════
//   // Step 2: Training Setup
//   // ══════════════════════════════════════════════
//   Widget _buildStep2() {
//     return Column(
//       crossAxisAlignment: CrossAxisAlignment.start,
//       children: [
//         _sectionHeader('📅', 'Days Per Week'),
//         const SizedBox(height: 12),
//         Row(
//           children: [3, 4, 5, 6].map((d) {
//             final isSel = _daysPerWeek == d;
//             return Expanded(
//               child: GestureDetector(
//                 onTap: () => setState(() => _daysPerWeek = d),
//                 child: AnimatedContainer(
//                   duration: const Duration(milliseconds: 200),
//                   margin: const EdgeInsets.symmetric(horizontal: 4),
//                   padding: const EdgeInsets.symmetric(vertical: 16),
//                   decoration: BoxDecoration(
//                     color: isSel ? const Color(0xFF1A3A8F) : Colors.white,
//                     borderRadius: BorderRadius.circular(14),
//                     border: Border.all(
//                       color: isSel
//                           ? const Color(0xFF1A3A8F)
//                           : Colors.grey.shade200,
//                     ),
//                     boxShadow: isSel
//                         ? [
//                             BoxShadow(
//                               color: const Color(0xFF1A3A8F).withOpacity(0.3),
//                               blurRadius: 8,
//                               offset: const Offset(0, 3),
//                             ),
//                           ]
//                         : null,
//                   ),
//                   child: Center(
//                     child: Text(
//                       '$d',
//                       style: TextStyle(
//                         fontSize: 22,
//                         fontWeight: FontWeight.bold,
//                         color: isSel ? Colors.white : Colors.black87,
//                       ),
//                     ),
//                   ),
//                 ),
//               ),
//             );
//           }).toList(),
//         ),
//         const SizedBox(height: 8),
//         Center(
//           child: Text(
//             '$_daysPerWeek training days per week',
//             style: TextStyle(color: Colors.grey.shade500, fontSize: 12),
//           ),
//         ),
//         const SizedBox(height: 24),
//         _sectionHeader('🏋️', 'Available Equipment'),
//         const SizedBox(height: 12),
//         Wrap(
//           spacing: 8,
//           runSpacing: 8,
//           children: _equipmentList.map((e) {
//             final isSel = _equipment.contains(e.$2);
//             return GestureDetector(
//               onTap: () => setState(
//                 () => isSel ? _equipment.remove(e.$2) : _equipment.add(e.$2),
//               ),
//               child: AnimatedContainer(
//                 duration: const Duration(milliseconds: 180),
//                 padding: const EdgeInsets.symmetric(
//                   horizontal: 14,
//                   vertical: 9,
//                 ),
//                 decoration: BoxDecoration(
//                   color: isSel
//                       ? const Color(0xFF1A3A8F).withOpacity(0.1)
//                       : Colors.white,
//                   borderRadius: BorderRadius.circular(30),
//                   border: Border.all(
//                     color: isSel
//                         ? const Color(0xFF1A3A8F)
//                         : Colors.grey.shade300,
//                     width: isSel ? 1.5 : 1,
//                   ),
//                 ),
//                 child: Row(
//                   mainAxisSize: MainAxisSize.min,
//                   children: [
//                     Text(e.$1, style: const TextStyle(fontSize: 15)),
//                     const SizedBox(width: 6),
//                     Text(
//                       e.$2,
//                       style: TextStyle(
//                         fontSize: 13,
//                         fontWeight: isSel ? FontWeight.bold : FontWeight.normal,
//                         color: isSel ? const Color(0xFF1A3A8F) : Colors.black87,
//                       ),
//                     ),
//                   ],
//                 ),
//               ),
//             );
//           }).toList(),
//         ),
//         if (_equipment.isEmpty) ...[
//           const SizedBox(height: 12),
//           Container(
//             padding: const EdgeInsets.all(12),
//             decoration: BoxDecoration(
//               color: Colors.orange.shade50,
//               borderRadius: BorderRadius.circular(10),
//               border: Border.all(color: Colors.orange.shade200),
//             ),
//             child: Row(
//               children: [
//                 Icon(
//                   Icons.warning_amber_rounded,
//                   color: Colors.orange.shade700,
//                   size: 16,
//                 ),
//                 const SizedBox(width: 8),
//                 Text(
//                   'Select at least one equipment option to continue.',
//                   style: TextStyle(color: Colors.orange.shade700, fontSize: 12),
//                 ),
//               ],
//             ),
//           ),
//         ],
//       ],
//     );
//   }

//   // ══════════════════════════════════════════════
//   // Step 3: Generate
//   // ══════════════════════════════════════════════
//   Widget _buildStep3(BuildContext ctx, GeneratePlanState state) {
//     final loading = state is GeneratePlanLoading;
//     return Column(
//       crossAxisAlignment: CrossAxisAlignment.start,
//       children: [
//         _sectionHeader('❤️', 'Current Injuries (optional)'),
//         const SizedBox(height: 12),
//         Wrap(
//           spacing: 8,
//           runSpacing: 8,
//           children: _injuryList.map((inj) {
//             final isSel = _injuries.contains(inj.$2);
//             return GestureDetector(
//               onTap: () => setState(
//                 () => isSel ? _injuries.remove(inj.$2) : _injuries.add(inj.$2),
//               ),
//               child: AnimatedContainer(
//                 duration: const Duration(milliseconds: 180),
//                 padding: const EdgeInsets.symmetric(
//                   horizontal: 14,
//                   vertical: 9,
//                 ),
//                 decoration: BoxDecoration(
//                   color: isSel ? Colors.red.withOpacity(0.08) : Colors.white,
//                   borderRadius: BorderRadius.circular(30),
//                   border: Border.all(
//                     color: isSel ? Colors.red.shade300 : Colors.grey.shade300,
//                   ),
//                 ),
//                 child: Row(
//                   mainAxisSize: MainAxisSize.min,
//                   children: [
//                     Text(inj.$1, style: const TextStyle(fontSize: 14)),
//                     const SizedBox(width: 6),
//                     Text(
//                       inj.$2,
//                       style: TextStyle(
//                         fontSize: 13,
//                         fontWeight: isSel ? FontWeight.bold : FontWeight.normal,
//                         color: isSel ? Colors.red.shade700 : Colors.black87,
//                       ),
//                     ),
//                   ],
//                 ),
//               ),
//             );
//           }).toList(),
//         ),
//         const SizedBox(height: 20),
//         // Plan summary card
//         Container(
//           padding: const EdgeInsets.all(16),
//           decoration: BoxDecoration(
//             color: Colors.grey.shade50,
//             borderRadius: BorderRadius.circular(16),
//             border: Border.all(color: Colors.grey.shade200),
//           ),
//           child: Column(
//             crossAxisAlignment: CrossAxisAlignment.start,
//             children: [
//               Text(
//                 'YOUR PLAN SUMMARY',
//                 style: TextStyle(
//                   color: Colors.grey.shade500,
//                   fontSize: 10,
//                   fontWeight: FontWeight.bold,
//                   letterSpacing: 1,
//                 ),
//               ),
//               const SizedBox(height: 12),
//               Row(
//                 children: [
//                   Expanded(child: _summaryItem('💪', _goal)),
//                   Expanded(child: _summaryItem('⚡', _level)),
//                 ],
//               ),
//               const SizedBox(height: 8),
//               Row(
//                 children: [
//                   Expanded(
//                     child: _summaryItem('📅', '$_daysPerWeek days / week'),
//                   ),
//                   Expanded(
//                     child: _summaryItem(
//                       '🏋️',
//                       '${_equipment.length} equipment types',
//                     ),
//                   ),
//                 ],
//               ),
//             ],
//           ),
//         ),
//         const SizedBox(height: 16),
//         // Include user context
//         GestureDetector(
//           onTap: () =>
//               setState(() => _includeUserContext = !_includeUserContext),
//           child: Container(
//             padding: const EdgeInsets.all(14),
//             decoration: BoxDecoration(
//               color: _includeUserContext
//                   ? const Color(0xFF1A3A8F).withOpacity(0.06)
//                   : Colors.white,
//               borderRadius: BorderRadius.circular(14),
//               border: Border.all(
//                 color: _includeUserContext
//                     ? const Color(0xFF1A3A8F).withOpacity(0.3)
//                     : Colors.grey.shade200,
//               ),
//             ),
//             child: Row(
//               children: [
//                 AnimatedContainer(
//                   duration: const Duration(milliseconds: 200),
//                   width: 22,
//                   height: 22,
//                   decoration: BoxDecoration(
//                     color: _includeUserContext
//                         ? const Color(0xFF1A3A8F)
//                         : Colors.white,
//                     borderRadius: BorderRadius.circular(6),
//                     border: Border.all(
//                       color: _includeUserContext
//                           ? const Color(0xFF1A3A8F)
//                           : Colors.grey.shade400,
//                     ),
//                   ),
//                   child: _includeUserContext
//                       ? const Icon(
//                           Icons.check_rounded,
//                           color: Colors.white,
//                           size: 14,
//                         )
//                       : null,
//                 ),
//                 const SizedBox(width: 12),
//                 const Expanded(
//                   child: Text(
//                     'Include strength profile & muscle scan',
//                     style: TextStyle(fontWeight: FontWeight.w500, fontSize: 14),
//                   ),
//                 ),
//               ],
//             ),
//           ),
//         ),
//       ],
//     );
//   }

//   Widget _summaryItem(String emoji, String text) {
//     return Row(
//       children: [
//         Text(emoji, style: const TextStyle(fontSize: 16)),
//         const SizedBox(width: 6),
//         Flexible(
//           child: Text(
//             text,
//             style: const TextStyle(fontSize: 13, fontWeight: FontWeight.w500),
//           ),
//         ),
//       ],
//     );
//   }

//   Widget _sectionHeader(String emoji, String title) {
//     return Row(
//       children: [
//         Text(emoji, style: const TextStyle(fontSize: 18)),
//         const SizedBox(width: 8),
//         Text(
//           title,
//           style: const TextStyle(
//             fontSize: 16,
//             fontWeight: FontWeight.bold,
//             color: Color(0xFF1A1A2E),
//           ),
//         ),
//       ],
//     );
//   }

//   // ══════════════════════════════════════════════
//   // Footer buttons
//   // ══════════════════════════════════════════════
//   Widget _buildFooter(BuildContext ctx, bool loading) {
//     return Container(
//       color: Colors.white,
//       padding: EdgeInsets.fromLTRB(
//         20,
//         12,
//         20,
//         MediaQuery.of(ctx).padding.bottom + 12,
//       ),
//       child: Row(
//         children: [
//           if (_step > 0) ...[
//             Expanded(
//               flex: 2,
//               child: OutlinedButton(
//                 onPressed: loading ? null : _prevStep,
//                 style: OutlinedButton.styleFrom(
//                   padding: const EdgeInsets.symmetric(vertical: 14),
//                   side: BorderSide(color: Colors.grey.shade300),
//                   shape: RoundedRectangleBorder(
//                     borderRadius: BorderRadius.circular(14),
//                   ),
//                 ),
//                 child: const Text(
//                   'Back',
//                   style: TextStyle(
//                     color: Colors.black54,
//                     fontWeight: FontWeight.w600,
//                   ),
//                 ),
//               ),
//             ),
//             const SizedBox(width: 12),
//           ],
//           Expanded(
//             flex: 4,
//             child: loading
//                 ? Container(
//                     padding: const EdgeInsets.symmetric(vertical: 14),
//                     decoration: BoxDecoration(
//                       color: const Color(0xFF1A3A8F),
//                       borderRadius: BorderRadius.circular(14),
//                     ),
//                     child: const Row(
//                       mainAxisAlignment: MainAxisAlignment.center,
//                       children: [
//                         SizedBox(
//                           width: 18,
//                           height: 18,
//                           child: CircularProgressIndicator(
//                             color: Colors.white,
//                             strokeWidth: 2,
//                           ),
//                         ),
//                         SizedBox(width: 10),
//                         Text(
//                           'Generating...',
//                           style: TextStyle(
//                             color: Colors.white,
//                             fontWeight: FontWeight.bold,
//                           ),
//                         ),
//                       ],
//                     ),
//                   )
//                 : ElevatedButton(
//                     onPressed: _step < 2
//                         ? _nextStep
//                         : () => ctx.read<GeneratePlanCubit>().generatePlan(
//                             goal: _goal,
//                             level: _level,
//                             daysPerWeek: _daysPerWeek,
//                             equipment: _equipment.toList(),
//                             injuries: _injuries.toList(),
//                           ),
//                     style: ElevatedButton.styleFrom(
//                       backgroundColor: _step < 2
//                           ? const Color(0xFF1A3A8F)
//                           : const Color(0xFF6C5CE7),
//                       elevation: 0,
//                       padding: const EdgeInsets.symmetric(vertical: 14),
//                       shape: RoundedRectangleBorder(
//                         borderRadius: BorderRadius.circular(14),
//                       ),
//                     ),
//                     child: Row(
//                       mainAxisAlignment: MainAxisAlignment.center,
//                       children: [
//                         if (_step == 2)
//                           const Icon(
//                             Icons.auto_awesome,
//                             color: Colors.white,
//                             size: 18,
//                           ),
//                         if (_step == 2) const SizedBox(width: 6),
//                         Text(
//                           _step < 2
//                               ? (_step == 0
//                                     ? 'Next: Training Setup →'
//                                     : 'Next: Finish Setup →')
//                               : 'Generate Workout Plan',
//                           style: const TextStyle(
//                             color: Colors.white,
//                             fontWeight: FontWeight.bold,
//                             fontSize: 15,
//                           ),
//                         ),
//                       ],
//                     ),
//                   ),
//           ),
//         ],
//       ),
//     );
//   }
// }

//-------------------------------------------------------------------------------------------------

// import 'package:flutter/material.dart';
// import 'package:flutter_bloc/flutter_bloc.dart';
// import '../cubit/generate_plan_cubit.dart';
// import '../cubit/generate_plan_state.dart';

// class GeneratePlanScreen extends StatefulWidget {
//   const GeneratePlanScreen({super.key});
//   @override
//   State<GeneratePlanScreen> createState() => _GeneratePlanScreenState();
// }

// class _GeneratePlanScreenState extends State<GeneratePlanScreen>
//     with TickerProviderStateMixin {
//   int _step = 0; // 0=Goal&Level  1=Training  2=Generate

//   // Step 1
//   String _goal = 'Build Muscle';
//   String _level = 'Intermediate';

//   // Step 2
//   int _daysPerWeek = 4;
//   final Set<String> _equipment = {};

//   // Step 3
//   final Set<String> _injuries = {};
//   bool _includeUserContext = true;

//   late AnimationController _stepAnim;
//   late Animation<double> _fadeAnim;

//   static const _goals = [
//     ('Build Muscle', '💪', 'Hypertrophy & size'),
//     ('Strength', '🛡️', 'Max force output'),
//     ('Weight Loss', '🔥', 'Fat burning'),
//     ('Cardio', '💨', 'Cardiovascular health'),
//     ('Endurance', '🚴', 'Stamina & energy'),
//   ];

//   static const _levels = [
//     ('Beginner', '🌱', '0–1 years'),
//     ('Intermediate', '⚡', '1–3 years'),
//     ('Advanced', '🔥', '3+ years'),
//   ];

//   static const _equipmentList = [
//     ('🏋️', 'Barbell'),
//     ('💪', 'Dumbbells'),
//     ('🔗', 'Cable Machine'),
//     ('🏃', 'Body Weight'),
//     ('🔔', 'Kettlebell'),
//     ('🎀', 'Resistance Bands'),
//     ('🔝', 'Pull-up Bar'),
//     ('🪑', 'Bench'),
//   ];

//   static const _injuryList = [
//     ('🩹', 'Lower Back'),
//     ('🤕', 'Shoulder'),
//     ('🦵', 'Knee'),
//     ('✋', 'Wrist'),
//     ('💪', 'Elbow'),
//     ('🍑', 'Hip'),
//     ('🦶', 'Ankle'),
//   ];

//   @override
//   void initState() {
//     super.initState();
//     _stepAnim = AnimationController(
//       vsync: this,
//       duration: const Duration(milliseconds: 350),
//     );
//     _fadeAnim = CurvedAnimation(parent: _stepAnim, curve: Curves.easeOut);
//     _stepAnim.forward();
//   }

//   @override
//   void dispose() {
//     _stepAnim.dispose();
//     super.dispose();
//   }

//   void _nextStep() {
//     if (_step == 1 && _equipment.isEmpty) {
//       ScaffoldMessenger.of(context).showSnackBar(
//         const SnackBar(
//           content: Text('Select at least one equipment option to continue.'),
//           backgroundColor: Colors.orange,
//           behavior: SnackBarBehavior.floating,
//         ),
//       );
//       return;
//     }
//     setState(() => _step++);
//     _stepAnim.forward(from: 0);
//   }

//   void _prevStep() {
//     if (_step == 0) {
//       Navigator.pop(context);
//       return;
//     }
//     setState(() => _step--);
//     _stepAnim.forward(from: 0);
//   }

//   @override
//   Widget build(BuildContext context) {
//     return BlocProvider(
//       create: (_) => GeneratePlanCubit(),
//       child: Builder(
//         builder: (ctx) {
//           return Scaffold(
//             backgroundColor: Colors.grey.shade100,
//             body: BlocConsumer<GeneratePlanCubit, GeneratePlanState>(
//               listener: (context, state) {
//                 if (state is GeneratePlanSuccess) {
//                   ScaffoldMessenger.of(context).showSnackBar(
//                     const SnackBar(
//                       content: Text('Workout plan generated! 💪'),
//                       backgroundColor: Colors.green,
//                       behavior: SnackBarBehavior.floating,
//                     ),
//                   );
//                   Navigator.pop(context, true);
//                 }
//                 if (state is GeneratePlanError) {
//                   final isToken = state.message.toLowerCase().contains('token');
//                   ScaffoldMessenger.of(context).showSnackBar(
//                     SnackBar(
//                       content: Row(
//                         children: [
//                           Icon(
//                             isToken ? Icons.toll_rounded : Icons.error_outline,
//                             color: Colors.white,
//                             size: 18,
//                           ),
//                           const SizedBox(width: 8),
//                           Expanded(child: Text(state.message)),
//                         ],
//                       ),
//                       backgroundColor: isToken
//                           ? Colors.orange
//                           : Colors.redAccent,
//                       behavior: SnackBarBehavior.floating,
//                       duration: const Duration(seconds: 5),
//                     ),
//                   );
//                 }
//               },
//               builder: (context, state) {
//                 final loading = state is GeneratePlanLoading;
//                 return Column(
//                   children: [
//                     _buildHeader(ctx),
//                     Expanded(
//                       child: FadeTransition(
//                         opacity: _fadeAnim,
//                         child: SingleChildScrollView(
//                           padding: const EdgeInsets.all(20),
//                           child: _step == 0
//                               ? _buildStep1()
//                               : _step == 1
//                               ? _buildStep2()
//                               : _buildStep3(context, state),
//                         ),
//                       ),
//                     ),
//                     _buildFooter(context, loading),
//                   ],
//                 );
//               },
//             ),
//           );
//         },
//       ),
//     );
//   }

//   Widget _buildHeader(BuildContext ctx) {
//     return Container(
//       decoration: const BoxDecoration(
//         gradient: LinearGradient(
//           colors: [Color(0xFF1A3A8F), Color(0xFF3F51B5)],
//           begin: Alignment.topLeft,
//           end: Alignment.bottomRight,
//         ),
//       ),
//       child: SafeArea(
//         bottom: false,
//         child: Column(
//           children: [
//             Padding(
//               padding: const EdgeInsets.fromLTRB(16, 12, 16, 0),
//               child: Row(
//                 children: [
//                   GestureDetector(
//                     onTap: _prevStep,
//                     child: Container(
//                       padding: const EdgeInsets.all(8),
//                       decoration: BoxDecoration(
//                         color: Colors.white.withOpacity(0.2),
//                         borderRadius: BorderRadius.circular(10),
//                       ),
//                       child: const Icon(
//                         Icons.arrow_back_ios_new_rounded,
//                         color: Colors.white,
//                         size: 16,
//                       ),
//                     ),
//                   ),
//                   const SizedBox(width: 12),
//                   const Column(
//                     crossAxisAlignment: CrossAxisAlignment.start,
//                     children: [
//                       Text(
//                         'AI Workout Planner',
//                         style: TextStyle(
//                           color: Colors.white,
//                           fontWeight: FontWeight.bold,
//                           fontSize: 18,
//                         ),
//                       ),
//                       Text(
//                         'Personalized plan in 3 steps',
//                         style: TextStyle(color: Colors.white70, fontSize: 12),
//                       ),
//                     ],
//                   ),
//                 ],
//               ),
//             ),
//             const SizedBox(height: 16),
//             _buildStepper(),
//             const SizedBox(height: 8),
//           ],
//         ),
//       ),
//     );
//   }

//   Widget _buildStepper() {
//     final steps = ['Goal & Level', 'Training Setup', 'Generate'];
//     return Padding(
//       padding: const EdgeInsets.symmetric(horizontal: 20),
//       child: Row(
//         children: List.generate(steps.length * 2 - 1, (i) {
//           if (i.isOdd) {
//             final lineIdx = i ~/ 2;
//             final done = _step > lineIdx;
//             return Expanded(
//               child: Container(
//                 height: 2,
//                 color: done ? Colors.white : Colors.white.withOpacity(0.25),
//               ),
//             );
//           }
//           final idx = i ~/ 2;
//           final done = _step > idx;
//           final active = _step == idx;
//           return Column(
//             children: [
//               AnimatedContainer(
//                 duration: const Duration(milliseconds: 300),
//                 width: 36,
//                 height: 36,
//                 decoration: BoxDecoration(
//                   color: done
//                       ? Colors.green
//                       : active
//                       ? Colors.white
//                       : Colors.white.withOpacity(0.2),
//                   shape: BoxShape.circle,
//                   border: Border.all(
//                     color: active ? Colors.white : Colors.transparent,
//                     width: 2,
//                   ),
//                 ),
//                 child: Center(
//                   child: done
//                       ? const Icon(
//                           Icons.check_rounded,
//                           color: Colors.white,
//                           size: 18,
//                         )
//                       : Text(
//                           '${idx + 1}',
//                           style: TextStyle(
//                             color: active
//                                 ? const Color(0xFF1A3A8F)
//                                 : Colors.white70,
//                             fontWeight: FontWeight.bold,
//                             fontSize: 14,
//                           ),
//                         ),
//                 ),
//               ),
//               const SizedBox(height: 4),
//               // تم إضافة SizedBox لتفادي خروج النص عن الشاشة
//               SizedBox(
//                 width: 70,
//                 child: Text(
//                   steps[idx],
//                   textAlign: TextAlign.center,
//                   maxLines: 2,
//                   style: TextStyle(
//                     color: active ? Colors.white : Colors.white60,
//                     fontSize: 10,
//                     fontWeight: active ? FontWeight.bold : FontWeight.normal,
//                   ),
//                 ),
//               ),
//             ],
//           );
//         }),
//       ),
//     );
//   }

//   Widget _buildStep1() {
//     return Column(
//       crossAxisAlignment: CrossAxisAlignment.start,
//       children: [
//         _sectionHeader('⚡', 'Primary Goal'),
//         const SizedBox(height: 12),
//         GridView.count(
//           crossAxisCount: 2,
//           shrinkWrap: true,
//           physics: const NeverScrollableScrollPhysics(),
//           crossAxisSpacing: 10,
//           mainAxisSpacing: 10,
//           // تم تقليل الـ AspectRatio لإعطاء مساحة أطول للعمود الداخلي ومنع الـ Overflow
//           childAspectRatio: 1.6,
//           children: _goals.map((g) {
//             final isSelected = _goal == g.$1;
//             return GestureDetector(
//               onTap: () => setState(() => _goal = g.$1),
//               child: AnimatedContainer(
//                 duration: const Duration(milliseconds: 200),
//                 padding: const EdgeInsets.symmetric(
//                   horizontal: 10,
//                   vertical: 8,
//                 ),
//                 decoration: BoxDecoration(
//                   color: isSelected
//                       ? const Color(0xFF1A3A8F).withOpacity(0.1)
//                       : Colors.white,
//                   borderRadius: BorderRadius.circular(14),
//                   border: Border.all(
//                     color: isSelected
//                         ? const Color(0xFF1A3A8F)
//                         : Colors.grey.shade200,
//                     width: isSelected ? 2 : 1,
//                   ),
//                 ),
//                 child: Row(
//                   children: [
//                     Text(g.$2, style: const TextStyle(fontSize: 18)),
//                     const SizedBox(width: 8),
//                     Expanded(
//                       child: Column(
//                         crossAxisAlignment: CrossAxisAlignment.start,
//                         mainAxisAlignment: MainAxisAlignment.center,
//                         children: [
//                           FittedBox(
//                             fit: BoxFit.scaleDown,
//                             child: Text(
//                               g.$1,
//                               style: TextStyle(
//                                 fontWeight: FontWeight.bold,
//                                 fontSize: 13,
//                                 color: isSelected
//                                     ? const Color(0xFF1A3A8F)
//                                     : Colors.black87,
//                               ),
//                             ),
//                           ),
//                           const SizedBox(height: 2),
//                           Text(
//                             g.$3,
//                             maxLines: 2,
//                             overflow: TextOverflow.ellipsis,
//                             style: TextStyle(
//                               fontSize: 10,
//                               color: Colors.grey.shade500,
//                             ),
//                           ),
//                         ],
//                       ),
//                     ),
//                   ],
//                 ),
//               ),
//             );
//           }).toList(),
//         ),
//         const SizedBox(height: 24),
//         _sectionHeader('🎯', 'Fitness Level'),
//         const SizedBox(height: 12),
//         Row(
//           children: _levels.map((l) {
//             final isSelected = _level == l.$1;
//             return Expanded(
//               child: GestureDetector(
//                 onTap: () => setState(() => _level = l.$1),
//                 child: AnimatedContainer(
//                   duration: const Duration(milliseconds: 200),
//                   margin: const EdgeInsets.symmetric(horizontal: 4),
//                   padding: const EdgeInsets.symmetric(
//                     vertical: 16,
//                     horizontal: 4,
//                   ),
//                   decoration: BoxDecoration(
//                     color: isSelected
//                         ? const Color(0xFF1A3A8F).withOpacity(0.06)
//                         : Colors.white,
//                     borderRadius: BorderRadius.circular(16),
//                     border: Border.all(
//                       color: isSelected
//                           ? const Color(0xFF1A3A8F)
//                           : Colors.grey.shade200,
//                       width: isSelected ? 2 : 1,
//                     ),
//                   ),
//                   child: Column(
//                     children: [
//                       Text(l.$2, style: const TextStyle(fontSize: 26)),
//                       const SizedBox(height: 6),
//                       FittedBox(
//                         fit: BoxFit.scaleDown,
//                         child: Text(
//                           l.$1,
//                           style: TextStyle(
//                             fontWeight: FontWeight.bold,
//                             fontSize: 13,
//                             color: isSelected
//                                 ? const Color(0xFF1A3A8F)
//                                 : Colors.black87,
//                           ),
//                         ),
//                       ),
//                       Text(
//                         l.$3,
//                         style: TextStyle(
//                           fontSize: 10,
//                           color: Colors.grey.shade500,
//                         ),
//                       ),
//                     ],
//                   ),
//                 ),
//               ),
//             );
//           }).toList(),
//         ),
//       ],
//     );
//   }

//   Widget _buildStep2() {
//     return Column(
//       crossAxisAlignment: CrossAxisAlignment.start,
//       children: [
//         _sectionHeader('📅', 'Days Per Week'),
//         const SizedBox(height: 12),
//         Row(
//           children: [3, 4, 5, 6].map((d) {
//             final isSel = _daysPerWeek == d;
//             return Expanded(
//               child: GestureDetector(
//                 onTap: () => setState(() => _daysPerWeek = d),
//                 child: AnimatedContainer(
//                   duration: const Duration(milliseconds: 200),
//                   margin: const EdgeInsets.symmetric(horizontal: 4),
//                   padding: const EdgeInsets.symmetric(vertical: 16),
//                   decoration: BoxDecoration(
//                     color: isSel ? const Color(0xFF1A3A8F) : Colors.white,
//                     borderRadius: BorderRadius.circular(14),
//                     border: Border.all(
//                       color: isSel
//                           ? const Color(0xFF1A3A8F)
//                           : Colors.grey.shade200,
//                     ),
//                   ),
//                   child: Center(
//                     child: Text(
//                       '$d',
//                       style: TextStyle(
//                         fontSize: 22,
//                         fontWeight: FontWeight.bold,
//                         color: isSel ? Colors.white : Colors.black87,
//                       ),
//                     ),
//                   ),
//                 ),
//               ),
//             );
//           }).toList(),
//         ),
//         const SizedBox(height: 24),
//         _sectionHeader('🏋️', 'Available Equipment'),
//         const SizedBox(height: 12),
//         Wrap(
//           spacing: 8,
//           runSpacing: 8,
//           children: _equipmentList.map((e) {
//             final isSel = _equipment.contains(e.$2);
//             return GestureDetector(
//               onTap: () => setState(
//                 () => isSel ? _equipment.remove(e.$2) : _equipment.add(e.$2),
//               ),
//               child: AnimatedContainer(
//                 duration: const Duration(milliseconds: 180),
//                 padding: const EdgeInsets.symmetric(
//                   horizontal: 14,
//                   vertical: 9,
//                 ),
//                 decoration: BoxDecoration(
//                   color: isSel
//                       ? const Color(0xFF1A3A8F).withOpacity(0.1)
//                       : Colors.white,
//                   borderRadius: BorderRadius.circular(30),
//                   border: Border.all(
//                     color: isSel
//                         ? const Color(0xFF1A3A8F)
//                         : Colors.grey.shade300,
//                     width: isSel ? 1.5 : 1,
//                   ),
//                 ),
//                 child: Row(
//                   mainAxisSize: MainAxisSize.min,
//                   children: [
//                     Text(e.$1, style: const TextStyle(fontSize: 15)),
//                     const SizedBox(width: 6),
//                     Text(
//                       e.$2,
//                       style: TextStyle(
//                         fontSize: 13,
//                         fontWeight: isSel ? FontWeight.bold : FontWeight.normal,
//                         color: isSel ? const Color(0xFF1A3A8F) : Colors.black87,
//                       ),
//                     ),
//                   ],
//                 ),
//               ),
//             );
//           }).toList(),
//         ),
//       ],
//     );
//   }

//   Widget _buildStep3(BuildContext ctx, GeneratePlanState state) {
//     return Column(
//       crossAxisAlignment: CrossAxisAlignment.start,
//       children: [
//         _sectionHeader('❤️', 'Current Injuries (optional)'),
//         const SizedBox(height: 12),
//         Wrap(
//           spacing: 8,
//           runSpacing: 8,
//           children: _injuryList.map((inj) {
//             final isSel = _injuries.contains(inj.$2);
//             return GestureDetector(
//               onTap: () => setState(
//                 () => isSel ? _injuries.remove(inj.$2) : _injuries.add(inj.$2),
//               ),
//               child: AnimatedContainer(
//                 duration: const Duration(milliseconds: 180),
//                 padding: const EdgeInsets.symmetric(
//                   horizontal: 14,
//                   vertical: 9,
//                 ),
//                 decoration: BoxDecoration(
//                   color: isSel ? Colors.red.withOpacity(0.08) : Colors.white,
//                   borderRadius: BorderRadius.circular(30),
//                   border: Border.all(
//                     color: isSel ? Colors.red.shade300 : Colors.grey.shade300,
//                   ),
//                 ),
//                 child: Row(
//                   mainAxisSize: MainAxisSize.min,
//                   children: [
//                     Text(inj.$1, style: const TextStyle(fontSize: 14)),
//                     const SizedBox(width: 6),
//                     Text(
//                       inj.$2,
//                       style: TextStyle(
//                         fontSize: 13,
//                         fontWeight: isSel ? FontWeight.bold : FontWeight.normal,
//                         color: isSel ? Colors.red.shade700 : Colors.black87,
//                       ),
//                     ),
//                   ],
//                 ),
//               ),
//             );
//           }).toList(),
//         ),
//         const SizedBox(height: 20),
//         Container(
//           padding: const EdgeInsets.all(16),
//           decoration: BoxDecoration(
//             color: Colors.grey.shade50,
//             borderRadius: BorderRadius.circular(16),
//             border: Border.all(color: Colors.grey.shade200),
//           ),
//           child: Column(
//             crossAxisAlignment: CrossAxisAlignment.start,
//             children: [
//               Text(
//                 'YOUR PLAN SUMMARY',
//                 style: TextStyle(
//                   color: Colors.grey.shade500,
//                   fontSize: 10,
//                   fontWeight: FontWeight.bold,
//                   letterSpacing: 1,
//                 ),
//               ),
//               const SizedBox(height: 12),
//               Row(
//                 children: [
//                   Expanded(child: _summaryItem('💪', _goal)),
//                   Expanded(child: _summaryItem('⚡', _level)),
//                 ],
//               ),
//               const SizedBox(height: 8),
//               Row(
//                 children: [
//                   Expanded(
//                     child: _summaryItem('📅', '$_daysPerWeek days / week'),
//                   ),
//                   Expanded(
//                     child: _summaryItem(
//                       '🏋️',
//                       '${_equipment.length} equipments',
//                     ),
//                   ),
//                 ],
//               ),
//             ],
//           ),
//         ),
//       ],
//     );
//   }

//   Widget _summaryItem(String emoji, String text) {
//     return Row(
//       children: [
//         Text(emoji, style: const TextStyle(fontSize: 16)),
//         const SizedBox(width: 6),
//         Flexible(
//           child: Text(
//             text,
//             style: const TextStyle(fontSize: 13, fontWeight: FontWeight.w500),
//           ),
//         ),
//       ],
//     );
//   }

//   Widget _sectionHeader(String emoji, String title) {
//     return Row(
//       children: [
//         Text(emoji, style: const TextStyle(fontSize: 18)),
//         const SizedBox(width: 8),
//         Text(
//           title,
//           style: const TextStyle(
//             fontSize: 16,
//             fontWeight: FontWeight.bold,
//             color: Color(0xFF1A1A2E),
//           ),
//         ),
//       ],
//     );
//   }

//   Widget _buildFooter(BuildContext ctx, bool loading) {
//     return Container(
//       color: Colors.white,
//       padding: EdgeInsets.fromLTRB(
//         20,
//         12,
//         20,
//         MediaQuery.of(ctx).padding.bottom + 12,
//       ),
//       child: Row(
//         children: [
//           if (_step > 0) ...[
//             Expanded(
//               flex: 2,
//               child: OutlinedButton(
//                 onPressed: loading ? null : _prevStep,
//                 style: OutlinedButton.styleFrom(
//                   padding: const EdgeInsets.symmetric(vertical: 14),
//                   side: BorderSide(color: Colors.grey.shade300),
//                   shape: RoundedRectangleBorder(
//                     borderRadius: BorderRadius.circular(14),
//                   ),
//                 ),
//                 child: const Text(
//                   'Back',
//                   style: TextStyle(
//                     color: Colors.black54,
//                     fontWeight: FontWeight.w600,
//                   ),
//                 ),
//               ),
//             ),
//             const SizedBox(width: 12),
//           ],
//           Expanded(
//             flex: 4,
//             child: loading
//                 ? Container(
//                     padding: const EdgeInsets.symmetric(vertical: 14),
//                     decoration: BoxDecoration(
//                       color: const Color(0xFF1A3A8F),
//                       borderRadius: BorderRadius.circular(14),
//                     ),
//                     child: const Row(
//                       mainAxisAlignment: MainAxisAlignment.center,
//                       children: [
//                         SizedBox(
//                           width: 18,
//                           height: 18,
//                           child: CircularProgressIndicator(
//                             color: Colors.white,
//                             strokeWidth: 2,
//                           ),
//                         ),
//                         SizedBox(width: 10),
//                         Text(
//                           'Generating...',
//                           style: TextStyle(
//                             color: Colors.white,
//                             fontWeight: FontWeight.bold,
//                           ),
//                         ),
//                       ],
//                     ),
//                   )
//                 : ElevatedButton(
//                     onPressed: _step < 2
//                         ? _nextStep
//                         : () => ctx.read<GeneratePlanCubit>().generatePlan(
//                             goal: _goal,
//                             level: _level,
//                             daysPerWeek: _daysPerWeek,
//                             equipment: _equipment.toList(),
//                             injuries: _injuries.toList(),
//                           ),
//                     style: ElevatedButton.styleFrom(
//                       backgroundColor: _step < 2
//                           ? const Color(0xFF1A3A8F)
//                           : const Color(0xFF6C5CE7),
//                       elevation: 0,
//                       padding: const EdgeInsets.symmetric(vertical: 14),
//                       shape: RoundedRectangleBorder(
//                         borderRadius: BorderRadius.circular(14),
//                       ),
//                     ),
//                     child: FittedBox(
//                       fit: BoxFit.scaleDown,
//                       child: Row(
//                         mainAxisAlignment: MainAxisAlignment.center,
//                         children: [
//                           if (_step == 2)
//                             const Icon(
//                               Icons.auto_awesome,
//                               color: Colors.white,
//                               size: 18,
//                             ),
//                           if (_step == 2) const SizedBox(width: 6),
//                           Text(
//                             _step < 2
//                                 ? (_step == 0
//                                       ? 'Next: Training Setup →'
//                                       : 'Next: Finish Setup →')
//                                 : 'Generate Workout Plan',
//                             style: const TextStyle(
//                               color: Colors.white,
//                               fontWeight: FontWeight.bold,
//                               fontSize: 15,
//                             ),
//                           ),
//                         ],
//                       ),
//                     ),
//                   ),
//           ),
//         ],
//       ),
//     );
//   }
// }

//-----------------------------------------------------------------------------------------------//

import 'package:flutter/material.dart';
import 'package:flutter_bloc/flutter_bloc.dart';
import '../cubit/generate_plan_cubit.dart';
import '../cubit/generate_plan_state.dart';

class GeneratePlanScreen extends StatefulWidget {
  const GeneratePlanScreen({super.key});
  @override
  State<GeneratePlanScreen> createState() => _GeneratePlanScreenState();
}

class _GeneratePlanScreenState extends State<GeneratePlanScreen>
    with TickerProviderStateMixin {
  int _step = 0; // 0=Goal&Level  1=Training  2=Generate

  // Step 1
  String _goal = 'Build Muscle';
  String _level = 'Intermediate';

  // Step 2
  int _daysPerWeek = 4; // القيمة الافتراضية
  final Set<String> _equipment = {};

  // Step 3
  final Set<String> _injuries = {};
  bool _includeUserContext = true;

  late AnimationController _stepAnim;
  late Animation<double> _fadeAnim;

  static const _goals = [
    ('Build Muscle', '💪', 'Hypertrophy & size'),
    ('Strength', '🛡️', 'Max force output'),
    ('Weight Loss', '🔥', 'Fat burning'),
    ('Cardio', '💨', 'Cardiovascular health'),
    ('Endurance', '🚴', 'Stamina & energy'),
  ];

  static const _levels = [
    ('Beginner', '🌱', '0–1 years'),
    ('Intermediate', '⚡', '1–3 years'),
    ('Advanced', '🔥', '3+ years'),
  ];

  static const _equipmentList = [
    ('🏋️', 'Barbell'),
    ('💪', 'Dumbbells'),
    ('🔗', 'Cable Machine'),
    ('🏃', 'Body Weight'),
    ('🔔', 'Kettlebell'),
    ('🎀', 'Resistance Bands'),
    ('🔝', 'Pull-up Bar'),
    ('🪑', 'Bench'),
  ];

  static const _injuryList = [
    ('🩹', 'Lower Back'),
    ('🤕', 'Shoulder'),
    ('🦵', 'Knee'),
    ('✋', 'Wrist'),
    ('💪', 'Elbow'),
    ('🍑', 'Hip'),
    ('🦶', 'Ankle'),
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
  }

  @override
  void dispose() {
    _stepAnim.dispose();
    super.dispose();
  }

  void _nextStep() {
    if (_step == 1 && _equipment.isEmpty) {
      ScaffoldMessenger.of(context).showSnackBar(
        const SnackBar(
          content: Text('Select at least one equipment option to continue.'),
          backgroundColor: Colors.orange,
          behavior: SnackBarBehavior.floating,
        ),
      );
      return;
    }
    setState(() => _step++);
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

  @override
  Widget build(BuildContext context) {
    return BlocProvider(
      create: (_) => GeneratePlanCubit(),
      child: Builder(
        builder: (ctx) {
          return Scaffold(
            backgroundColor: Colors.grey.shade100,
            body: BlocConsumer<GeneratePlanCubit, GeneratePlanState>(
              listener: (context, state) {
                if (state is GeneratePlanSuccess) {
                  ScaffoldMessenger.of(context).showSnackBar(
                    const SnackBar(
                      content: Text('Workout plan generated! 💪'),
                      backgroundColor: Colors.green,
                      behavior: SnackBarBehavior.floating,
                    ),
                  );
                  Navigator.pop(context, true);
                }
                if (state is GeneratePlanError) {
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
                final loading = state is GeneratePlanLoading;
                return Column(
                  children: [
                    _buildHeader(ctx),
                    Expanded(
                      child: FadeTransition(
                        opacity: _fadeAnim,
                        child: SingleChildScrollView(
                          padding: const EdgeInsets.all(20),
                          child: _step == 0
                              ? _buildStep1()
                              : _step == 1
                              ? _buildStep2()
                              : _buildStep3(context, state),
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

  // ══════════════════════════════════════════════
  // Header with stepper
  // ══════════════════════════════════════════════
  Widget _buildHeader(BuildContext ctx) {
    return Container(
      decoration: const BoxDecoration(
        gradient: LinearGradient(
          colors: [Color(0xFF1A3A8F), Color(0xFF3F51B5)],
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
                        'AI Workout Planner',
                        style: TextStyle(
                          color: Colors.white,
                          fontWeight: FontWeight.bold,
                          fontSize: 18,
                        ),
                      ),
                      Text(
                        'Personalized plan in 3 steps',
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
    final steps = ['Goal & Level', 'Training Setup', 'Generate'];
    return Padding(
      padding: const EdgeInsets.symmetric(horizontal: 20),
      child: Row(
        children: List.generate(steps.length * 2 - 1, (i) {
          if (i.isOdd) {
            // Line
            final lineIdx = i ~/ 2;
            final done = _step > lineIdx;
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
                width: 36,
                height: 36,
                decoration: BoxDecoration(
                  color: done
                      ? Colors.green
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
                          color: Colors.white,
                          size: 18,
                        )
                      : Text(
                          '${idx + 1}',
                          style: TextStyle(
                            color: active
                                ? const Color(0xFF1A3A8F)
                                : Colors.white70,
                            fontWeight: FontWeight.bold,
                            fontSize: 14,
                          ),
                        ),
                ),
              ),
              const SizedBox(height: 4),
              // SizedBox لمنع تجاوز النص الخاص بالخطوات
              SizedBox(
                width: 70,
                child: Text(
                  steps[idx],
                  textAlign: TextAlign.center,
                  maxLines: 2,
                  style: TextStyle(
                    color: active ? Colors.white : Colors.white60,
                    fontSize: 10,
                    fontWeight: active ? FontWeight.bold : FontWeight.normal,
                  ),
                ),
              ),
            ],
          );
        }),
      ),
    );
  }

  // ══════════════════════════════════════════════
  // Step 1: Goal & Level
  // ══════════════════════════════════════════════
  Widget _buildStep1() {
    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        _sectionHeader('⚡', 'Primary Goal'),
        const SizedBox(height: 12),
        GridView.count(
          crossAxisCount: 2,
          shrinkWrap: true,
          physics: const NeverScrollableScrollPhysics(),
          crossAxisSpacing: 10,
          mainAxisSpacing: 10,
          childAspectRatio: 1.6,
          children: _goals.map((g) {
            final isSelected = _goal == g.$1;
            return GestureDetector(
              onTap: () => setState(() => _goal = g.$1),
              child: AnimatedContainer(
                duration: const Duration(milliseconds: 200),
                padding: const EdgeInsets.symmetric(
                  horizontal: 10,
                  vertical: 8,
                ),
                decoration: BoxDecoration(
                  color: isSelected
                      ? const Color(0xFF1A3A8F).withOpacity(0.1)
                      : Colors.white,
                  borderRadius: BorderRadius.circular(14),
                  border: Border.all(
                    color: isSelected
                        ? const Color(0xFF1A3A8F)
                        : Colors.grey.shade200,
                    width: isSelected ? 2 : 1,
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
                    // تم تصغير الأيقونة هنا من 18 إلى 15
                    Text(g.$2, style: const TextStyle(fontSize: 15)),
                    const SizedBox(width: 8),
                    Expanded(
                      child: Column(
                        crossAxisAlignment: CrossAxisAlignment.start,
                        mainAxisAlignment: MainAxisAlignment.center,
                        children: [
                          FittedBox(
                            fit: BoxFit.scaleDown,
                            child: Text(
                              g.$1,
                              style: TextStyle(
                                fontWeight: FontWeight.bold,
                                fontSize: 13,
                                color: isSelected
                                    ? const Color(0xFF1A3A8F)
                                    : Colors.black87,
                              ),
                            ),
                          ),
                          const SizedBox(height: 2),
                          Text(
                            g.$3,
                            maxLines: 2,
                            overflow: TextOverflow.ellipsis,
                            style: TextStyle(
                              fontSize: 10,
                              color: Colors.grey.shade500,
                            ),
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
        _sectionHeader('🎯', 'Fitness Level'),
        const SizedBox(height: 12),
        Row(
          children: _levels.map((l) {
            final isSelected = _level == l.$1;
            return Expanded(
              child: GestureDetector(
                onTap: () => setState(() => _level = l.$1),
                child: AnimatedContainer(
                  duration: const Duration(milliseconds: 200),
                  margin: const EdgeInsets.symmetric(horizontal: 4),
                  padding: const EdgeInsets.symmetric(
                    vertical: 16,
                    horizontal: 4,
                  ),
                  decoration: BoxDecoration(
                    color: isSelected
                        ? const Color(0xFF1A3A8F).withOpacity(0.06)
                        : Colors.white,
                    borderRadius: BorderRadius.circular(16),
                    border: Border.all(
                      color: isSelected
                          ? const Color(0xFF1A3A8F)
                          : Colors.grey.shade200,
                      width: isSelected ? 2 : 1,
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
                    children: [
                      // تم تصغير الأيقونة هنا من 26 إلى 18
                      Text(l.$2, style: const TextStyle(fontSize: 18)),
                      const SizedBox(height: 8),
                      FittedBox(
                        fit: BoxFit.scaleDown,
                        child: Text(
                          l.$1,
                          style: TextStyle(
                            fontWeight: FontWeight.bold,
                            fontSize: 13,
                            color: isSelected
                                ? const Color(0xFF1A3A8F)
                                : Colors.black87,
                          ),
                        ),
                      ),
                      const SizedBox(height: 2),
                      Text(
                        l.$3,
                        style: TextStyle(
                          fontSize: 10,
                          color: Colors.grey.shade500,
                        ),
                      ),
                    ],
                  ),
                ),
              ),
            );
          }).toList(),
        ),
      ],
    );
  }

  // ══════════════════════════════════════════════
  // Step 2: Training Setup (التعديل الجديد: السكرول الأفقي)
  // ══════════════════════════════════════════════
  Widget _buildStep2() {
    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        _sectionHeader('📅', 'Days Per Week'),
        const SizedBox(height: 12),

        // شريط التمرير الأفقي للأيام من 1 إلى 7
        SingleChildScrollView(
          scrollDirection: Axis.horizontal,
          physics: const BouncingScrollPhysics(),
          child: Row(
            children: List.generate(7, (index) {
              final d = index + 1; // الأيام تبدأ من 1 وتنتهي بـ 7
              final isSel = _daysPerWeek == d;
              return GestureDetector(
                onTap: () => setState(() => _daysPerWeek = d),
                child: AnimatedContainer(
                  duration: const Duration(milliseconds: 200),
                  margin: const EdgeInsets.only(right: 10), // مسافة بين الأزرار
                  width: 65, // عرض المربع
                  padding: const EdgeInsets.symmetric(vertical: 16),
                  decoration: BoxDecoration(
                    color: isSel ? const Color(0xFF1A3A8F) : Colors.white,
                    borderRadius: BorderRadius.circular(14),
                    border: Border.all(
                      color: isSel
                          ? const Color(0xFF1A3A8F)
                          : Colors.grey.shade200,
                    ),
                    boxShadow: isSel
                        ? [
                            BoxShadow(
                              color: const Color(0xFF1A3A8F).withOpacity(0.3),
                              blurRadius: 8,
                              offset: const Offset(0, 3),
                            ),
                          ]
                        : null,
                  ),
                  child: Center(
                    child: Text(
                      '$d',
                      style: TextStyle(
                        fontSize: 22,
                        fontWeight: FontWeight.bold,
                        color: isSel ? Colors.white : Colors.black87,
                      ),
                    ),
                  ),
                ),
              );
            }),
          ),
        ),
        const SizedBox(height: 8),
        Center(
          child: Text(
            '$_daysPerWeek training days per week',
            style: TextStyle(color: Colors.grey.shade500, fontSize: 12),
          ),
        ),
        const SizedBox(height: 24),
        _sectionHeader('🏋️', 'Available Equipment'),
        const SizedBox(height: 12),
        Wrap(
          spacing: 8,
          runSpacing: 8,
          children: _equipmentList.map((e) {
            final isSel = _equipment.contains(e.$2);
            return GestureDetector(
              onTap: () => setState(
                () => isSel ? _equipment.remove(e.$2) : _equipment.add(e.$2),
              ),
              child: AnimatedContainer(
                duration: const Duration(milliseconds: 180),
                padding: const EdgeInsets.symmetric(
                  horizontal: 14,
                  vertical: 9,
                ),
                decoration: BoxDecoration(
                  color: isSel
                      ? const Color(0xFF1A3A8F).withOpacity(0.1)
                      : Colors.white,
                  borderRadius: BorderRadius.circular(30),
                  border: Border.all(
                    color: isSel
                        ? const Color(0xFF1A3A8F)
                        : Colors.grey.shade300,
                    width: isSel ? 1.5 : 1,
                  ),
                ),
                child: Row(
                  mainAxisSize: MainAxisSize.min,
                  children: [
                    Text(e.$1, style: const TextStyle(fontSize: 15)),
                    const SizedBox(width: 6),
                    Text(
                      e.$2,
                      style: TextStyle(
                        fontSize: 13,
                        fontWeight: isSel ? FontWeight.bold : FontWeight.normal,
                        color: isSel ? const Color(0xFF1A3A8F) : Colors.black87,
                      ),
                    ),
                  ],
                ),
              ),
            );
          }).toList(),
        ),
        if (_equipment.isEmpty) ...[
          const SizedBox(height: 12),
          Container(
            padding: const EdgeInsets.all(12),
            decoration: BoxDecoration(
              color: Colors.orange.shade50,
              borderRadius: BorderRadius.circular(10),
              border: Border.all(color: Colors.orange.shade200),
            ),
            child: Row(
              children: [
                Icon(
                  Icons.warning_amber_rounded,
                  color: Colors.orange.shade700,
                  size: 16,
                ),
                const SizedBox(width: 8),
                Expanded(
                  child: Text(
                    'Select at least one equipment option to continue.',
                    style: TextStyle(
                      color: Colors.orange.shade700,
                      fontSize: 12,
                    ),
                  ),
                ),
              ],
            ),
          ),
        ],
      ],
    );
  }

  // ══════════════════════════════════════════════
  // Step 3: Generate
  // ══════════════════════════════════════════════
  Widget _buildStep3(BuildContext ctx, GeneratePlanState state) {
    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        _sectionHeader('❤️', 'Current Injuries (optional)'),
        const SizedBox(height: 12),
        Wrap(
          spacing: 8,
          runSpacing: 8,
          children: _injuryList.map((inj) {
            final isSel = _injuries.contains(inj.$2);
            return GestureDetector(
              onTap: () => setState(
                () => isSel ? _injuries.remove(inj.$2) : _injuries.add(inj.$2),
              ),
              child: AnimatedContainer(
                duration: const Duration(milliseconds: 180),
                padding: const EdgeInsets.symmetric(
                  horizontal: 14,
                  vertical: 9,
                ),
                decoration: BoxDecoration(
                  color: isSel ? Colors.red.withOpacity(0.08) : Colors.white,
                  borderRadius: BorderRadius.circular(30),
                  border: Border.all(
                    color: isSel ? Colors.red.shade300 : Colors.grey.shade300,
                  ),
                ),
                child: Row(
                  mainAxisSize: MainAxisSize.min,
                  children: [
                    Text(inj.$1, style: const TextStyle(fontSize: 14)),
                    const SizedBox(width: 6),
                    Text(
                      inj.$2,
                      style: TextStyle(
                        fontSize: 13,
                        fontWeight: isSel ? FontWeight.bold : FontWeight.normal,
                        color: isSel ? Colors.red.shade700 : Colors.black87,
                      ),
                    ),
                  ],
                ),
              ),
            );
          }).toList(),
        ),
        const SizedBox(height: 20),
        // Plan summary card
        Container(
          padding: const EdgeInsets.all(16),
          decoration: BoxDecoration(
            color: Colors.grey.shade50,
            borderRadius: BorderRadius.circular(16),
            border: Border.all(color: Colors.grey.shade200),
          ),
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              Text(
                'YOUR PLAN SUMMARY',
                style: TextStyle(
                  color: Colors.grey.shade500,
                  fontSize: 10,
                  fontWeight: FontWeight.bold,
                  letterSpacing: 1,
                ),
              ),
              const SizedBox(height: 12),
              Row(
                children: [
                  Expanded(child: _summaryItem('💪', _goal)),
                  Expanded(child: _summaryItem('⚡', _level)),
                ],
              ),
              const SizedBox(height: 8),
              Row(
                children: [
                  Expanded(
                    // تحديث الرقم تلقائياً بناءً على اختيار المستخدم
                    child: _summaryItem('📅', '$_daysPerWeek days / week'),
                  ),
                  Expanded(
                    child: _summaryItem(
                      '🏋️',
                      '${_equipment.length} equipment types',
                    ),
                  ),
                ],
              ),
            ],
          ),
        ),
        const SizedBox(height: 16),
        // Include user context
        GestureDetector(
          onTap: () =>
              setState(() => _includeUserContext = !_includeUserContext),
          child: Container(
            padding: const EdgeInsets.all(14),
            decoration: BoxDecoration(
              color: _includeUserContext
                  ? const Color(0xFF1A3A8F).withOpacity(0.06)
                  : Colors.white,
              borderRadius: BorderRadius.circular(14),
              border: Border.all(
                color: _includeUserContext
                    ? const Color(0xFF1A3A8F).withOpacity(0.3)
                    : Colors.grey.shade200,
              ),
            ),
            child: Row(
              children: [
                AnimatedContainer(
                  duration: const Duration(milliseconds: 200),
                  width: 22,
                  height: 22,
                  decoration: BoxDecoration(
                    color: _includeUserContext
                        ? const Color(0xFF1A3A8F)
                        : Colors.white,
                    borderRadius: BorderRadius.circular(6),
                    border: Border.all(
                      color: _includeUserContext
                          ? const Color(0xFF1A3A8F)
                          : Colors.grey.shade400,
                    ),
                  ),
                  child: _includeUserContext
                      ? const Icon(
                          Icons.check_rounded,
                          color: Colors.white,
                          size: 14,
                        )
                      : null,
                ),
                const SizedBox(width: 12),
                const Expanded(
                  child: Text(
                    'Include strength profile & muscle scan',
                    style: TextStyle(fontWeight: FontWeight.w500, fontSize: 14),
                  ),
                ),
              ],
            ),
          ),
        ),
      ],
    );
  }

  Widget _summaryItem(String emoji, String text) {
    return Row(
      children: [
        Text(emoji, style: const TextStyle(fontSize: 16)),
        const SizedBox(width: 6),
        Flexible(
          child: Text(
            text,
            style: const TextStyle(fontSize: 13, fontWeight: FontWeight.w500),
          ),
        ),
      ],
    );
  }

  Widget _sectionHeader(String emoji, String title) {
    return Row(
      children: [
        Text(emoji, style: const TextStyle(fontSize: 18)),
        const SizedBox(width: 8),
        Text(
          title,
          style: const TextStyle(
            fontSize: 16,
            fontWeight: FontWeight.bold,
            color: Color(0xFF1A1A2E),
          ),
        ),
      ],
    );
  }

  // ══════════════════════════════════════════════
  // Footer buttons
  // ══════════════════════════════════════════════
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
                      color: const Color(0xFF1A3A8F),
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
                        : () => ctx.read<GeneratePlanCubit>().generatePlan(
                            goal: _goal,
                            level: _level,
                            daysPerWeek: _daysPerWeek,
                            equipment: _equipment.toList(),
                            injuries: _injuries.toList(),
                          ),
                    style: ElevatedButton.styleFrom(
                      backgroundColor: _step < 2
                          ? const Color(0xFF1A3A8F)
                          : const Color(0xFF6C5CE7),
                      elevation: 0,
                      padding: const EdgeInsets.symmetric(vertical: 14),
                      shape: RoundedRectangleBorder(
                        borderRadius: BorderRadius.circular(14),
                      ),
                    ),
                    child: FittedBox(
                      fit: BoxFit.scaleDown,
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
                            _step < 2
                                ? (_step == 0
                                      ? 'Next: Training Setup →'
                                      : 'Next: Finish Setup →')
                                : 'Generate Workout Plan',
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
          ),
        ],
      ),
    );
  }
}
