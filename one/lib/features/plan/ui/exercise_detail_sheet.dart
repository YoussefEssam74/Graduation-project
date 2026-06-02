import 'package:flutter/material.dart';
import '../model/plan_model.dart';

class ExerciseDetailSheet extends StatelessWidget {
  final PlanExerciseModel exercise;

  const ExerciseDetailSheet({super.key, required this.exercise});

  static void show(BuildContext context, PlanExerciseModel exercise) {
    showModalBottomSheet(
      context: context,
      isScrollControlled: true,
      backgroundColor: Colors.transparent,
      builder: (_) => ExerciseDetailSheet(exercise: exercise),
    );
  }

  @override
  Widget build(BuildContext context) {
    return DraggableScrollableSheet(
      initialChildSize: 0.75,
      minChildSize: 0.5,
      maxChildSize: 0.95,
      builder: (_, scrollController) {
        return Container(
          decoration: const BoxDecoration(
            color: Colors.white,
            borderRadius: BorderRadius.vertical(top: Radius.circular(28)),
          ),
          child: Column(
            children: [
              // ── Handle ─────────────────────────────
              Padding(
                padding: const EdgeInsets.only(top: 12, bottom: 4),
                child: Center(
                  child: Container(
                    width: 40,
                    height: 4,
                    decoration: BoxDecoration(
                      color: Colors.grey.shade300,
                      borderRadius: BorderRadius.circular(2),
                    ),
                  ),
                ),
              ),

              // ── Scrollable body ────────────────────
              Expanded(
                child: ListView(
                  controller: scrollController,
                  padding: EdgeInsets.zero,
                  children: [
                    // Exercise Image
                    _buildHeroImage(),

                    Padding(
                      padding: const EdgeInsets.fromLTRB(20, 20, 20, 32),
                      child: Column(
                        crossAxisAlignment: CrossAxisAlignment.start,
                        children: [
                          // Title + type tag
                          _buildTitleRow(),
                          const SizedBox(height: 16),

                          // Stats Grid
                          _buildStatsGrid(),
                          const SizedBox(height: 20),

                          // Description
                          if (exercise.description != null &&
                              exercise.description!.isNotEmpty) ...[
                            _buildSection(
                              icon: Icons.info_outline_rounded,
                              title: 'Description',
                              child: Text(
                                exercise.description!,
                                style: const TextStyle(
                                  color: Colors.black87,
                                  fontSize: 14,
                                  height: 1.6,
                                ),
                              ),
                            ),
                            const SizedBox(height: 20),
                          ],

                          // Target Muscles
                          if (exercise.targetMuscles.isNotEmpty) ...[
                            _buildSection(
                              icon: Icons.accessibility_new_rounded,
                              title: 'Target Muscles',
                              child: Wrap(
                                spacing: 8,
                                runSpacing: 8,
                                children: exercise.targetMuscles
                                    .map((m) => _muscleChip(m))
                                    .toList(),
                              ),
                            ),
                            const SizedBox(height: 20),
                          ],

                          // Equipment
                          if (_equipmentText != null) ...[
                            _buildSection(
                              icon: Icons.fitness_center_rounded,
                              title: 'Equipment',
                              child: Text(
                                _equipmentText!,
                                style: const TextStyle(
                                  color: Colors.black87,
                                  fontSize: 14,
                                ),
                              ),
                            ),
                            const SizedBox(height: 20),
                          ],

                          // Weight Recommendation
                          if (exercise.weightRecommendation != null &&
                              exercise.weightRecommendation!.isNotEmpty) ...[
                            _buildSection(
                              icon: Icons.monitor_weight_outlined,
                              title: 'Weight Recommendation',
                              child: Text(
                                exercise.weightRecommendation!,
                                style: const TextStyle(
                                  color: Colors.black87,
                                  fontSize: 14,
                                ),
                              ),
                            ),
                            const SizedBox(height: 20),
                          ],

                          // Tempo
                          if (exercise.tempo != null &&
                              exercise.tempo!.isNotEmpty) ...[
                            _buildSection(
                              icon: Icons.timer_outlined,
                              title: 'Tempo',
                              child: Row(
                                children: [
                                  Container(
                                    padding: const EdgeInsets.symmetric(
                                      horizontal: 14,
                                      vertical: 8,
                                    ),
                                    decoration: BoxDecoration(
                                      color: const Color(
                                        0xFF1A3A8F,
                                      ).withOpacity(0.08),
                                      borderRadius: BorderRadius.circular(10),
                                    ),
                                    child: Text(
                                      exercise.tempo!,
                                      style: const TextStyle(
                                        color: Color(0xFF1A3A8F),
                                        fontWeight: FontWeight.bold,
                                        fontSize: 16,
                                        letterSpacing: 2,
                                      ),
                                    ),
                                  ),
                                  const SizedBox(width: 12),
                                  const Text(
                                    'Eccentric – Pause – Concentric',
                                    style: TextStyle(
                                      color: Colors.grey,
                                      fontSize: 11,
                                    ),
                                  ),
                                ],
                              ),
                            ),
                            const SizedBox(height: 20),
                          ],

                          // Movement Pattern
                          if (exercise.movementPattern != null &&
                              exercise.movementPattern!.isNotEmpty) ...[
                            _buildSection(
                              icon: Icons.swap_horiz_rounded,
                              title: 'Movement Pattern',
                              child: _tagChip(
                                exercise.movementPattern!,
                                Colors.purple,
                              ),
                            ),
                            const SizedBox(height: 20),
                          ],

                          // Notes
                          if (exercise.notes != null &&
                              exercise.notes!.isNotEmpty) ...[
                            _buildSection(
                              icon: Icons.sticky_note_2_outlined,
                              title: 'Coach Notes',
                              child: Container(
                                width: double.infinity,
                                padding: const EdgeInsets.all(14),
                                decoration: BoxDecoration(
                                  color: Colors.amber.shade50,
                                  borderRadius: BorderRadius.circular(12),
                                  border: Border.all(
                                    color: Colors.amber.shade200,
                                  ),
                                ),
                                child: Text(
                                  exercise.notes!,
                                  style: TextStyle(
                                    color: Colors.amber.shade900,
                                    fontSize: 13,
                                    height: 1.5,
                                  ),
                                ),
                              ),
                            ),
                            const SizedBox(height: 20),
                          ],

                          // Alternatives
                          if (exercise.alternatives.isNotEmpty) ...[
                            _buildSection(
                              icon: Icons.swap_calls_rounded,
                              title: 'Alternative Exercises',
                              child: Wrap(
                                spacing: 8,
                                runSpacing: 8,
                                children: exercise.alternatives
                                    .map((a) => _tagChip(a, Colors.teal))
                                    .toList(),
                              ),
                            ),
                          ],
                        ],
                      ),
                    ),
                  ],
                ),
              ),
            ],
          ),
        );
      },
    );
  }

  // ── Hero Image ─────────────────────────────────────
  Widget _buildHeroImage() {
    if (exercise.imageUrl != null && exercise.imageUrl!.isNotEmpty) {
      return ClipRRect(
        borderRadius: const BorderRadius.vertical(top: Radius.circular(28)),
        child: Image.network(
          exercise.imageUrl!,
          height: 220,
          width: double.infinity,
          fit: BoxFit.cover,
          errorBuilder: (_, __, ___) => _imagePlaceholder(),
        ),
      );
    }
    return _imagePlaceholder();
  }

  Widget _imagePlaceholder() {
    return Container(
      height: 180,
      width: double.infinity,
      decoration: BoxDecoration(
        color: const Color(0xFF1A3A8F).withOpacity(0.06),
        borderRadius: const BorderRadius.vertical(top: Radius.circular(28)),
      ),
      child: Column(
        mainAxisAlignment: MainAxisAlignment.center,
        children: [
          Icon(
            Icons.fitness_center_rounded,
            size: 56,
            color: const Color(0xFF1A3A8F).withOpacity(0.3),
          ),
          const SizedBox(height: 8),
          Text(
            exercise.exerciseName ?? '',
            style: TextStyle(
              color: const Color(0xFF1A3A8F).withOpacity(0.4),
              fontSize: 13,
            ),
          ),
        ],
      ),
    );
  }

  // ── Title Row ──────────────────────────────────────
  Widget _buildTitleRow() {
    return Row(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        Expanded(
          child: Text(
            exercise.exerciseName ?? 'Exercise',
            style: const TextStyle(
              fontSize: 22,
              fontWeight: FontWeight.bold,
              color: Color(0xFF1A1A2E),
            ),
          ),
        ),
        if (exercise.exerciseType != null) ...[
          const SizedBox(width: 8),
          Container(
            padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 5),
            decoration: BoxDecoration(
              color: const Color(0xFF1A3A8F).withOpacity(0.1),
              borderRadius: BorderRadius.circular(8),
            ),
            child: Text(
              exercise.exerciseType!.toUpperCase(),
              style: const TextStyle(
                color: Color(0xFF1A3A8F),
                fontWeight: FontWeight.bold,
                fontSize: 10,
                letterSpacing: 0.5,
              ),
            ),
          ),
        ],
      ],
    );
  }

  // ── Stats Grid ─────────────────────────────────────
  Widget _buildStatsGrid() {
    final stats = <_StatItem>[
      _StatItem(
        'SETS',
        '${exercise.sets ?? "—"}',
        Icons.repeat_rounded,
        const Color(0xFF1A3A8F),
      ),
      _StatItem(
        'REPS',
        exercise.repsDisplay,
        Icons.fitness_center_rounded,
        Colors.deepOrange,
      ),
      _StatItem(
        'REST',
        exercise.restDisplay,
        Icons.timer_outlined,
        Colors.green,
      ),
      if (exercise.weightKg != null)
        _StatItem(
          'WEIGHT',
          '${exercise.weightKg!.toStringAsFixed(1)} kg',
          Icons.monitor_weight_outlined,
          Colors.purple,
        ),
    ];

    return GridView.count(
      crossAxisCount: stats.length >= 4 ? 4 : stats.length,
      shrinkWrap: true,
      physics: const NeverScrollableScrollPhysics(),
      crossAxisSpacing: 10,
      mainAxisSpacing: 10,
      childAspectRatio: 0.95,
      children: stats.map((s) => _statCard(s)).toList(),
    );
  }

  Widget _statCard(_StatItem s) {
    return Container(
      padding: const EdgeInsets.all(12),
      decoration: BoxDecoration(
        color: s.color.withOpacity(0.06),
        borderRadius: BorderRadius.circular(14),
        border: Border.all(color: s.color.withOpacity(0.15)),
      ),
      child: Column(
        mainAxisAlignment: MainAxisAlignment.center,
        children: [
          Icon(s.icon, color: s.color, size: 20),
          const SizedBox(height: 6),
          Text(
            s.value,
            style: TextStyle(
              color: s.color,
              fontWeight: FontWeight.bold,
              fontSize: 18,
            ),
          ),
          const SizedBox(height: 2),
          Text(
            s.label,
            style: TextStyle(
              color: s.color.withOpacity(0.7),
              fontSize: 9,
              fontWeight: FontWeight.w600,
              letterSpacing: 0.5,
            ),
          ),
        ],
      ),
    );
  }

  // ── Section Builder ────────────────────────────────
  Widget _buildSection({
    required IconData icon,
    required String title,
    required Widget child,
  }) {
    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        Row(
          children: [
            Container(
              padding: const EdgeInsets.all(6),
              decoration: BoxDecoration(
                color: const Color(0xFF1A3A8F).withOpacity(0.08),
                borderRadius: BorderRadius.circular(8),
              ),
              child: Icon(icon, color: const Color(0xFF1A3A8F), size: 16),
            ),
            const SizedBox(width: 8),
            Text(
              title,
              style: const TextStyle(
                fontWeight: FontWeight.bold,
                fontSize: 15,
                color: Color(0xFF1A1A2E),
              ),
            ),
          ],
        ),
        const SizedBox(height: 10),
        child,
      ],
    );
  }

  // ── Chips ──────────────────────────────────────────
  Widget _muscleChip(String label) {
    return Container(
      padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 6),
      decoration: BoxDecoration(
        color: Colors.deepOrange.withOpacity(0.08),
        borderRadius: BorderRadius.circular(20),
        border: Border.all(color: Colors.deepOrange.withOpacity(0.2)),
      ),
      child: Text(
        label,
        style: const TextStyle(
          color: Colors.deepOrange,
          fontSize: 12,
          fontWeight: FontWeight.w600,
        ),
      ),
    );
  }

  Widget _tagChip(String label, Color color) {
    return Container(
      padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 6),
      decoration: BoxDecoration(
        color: color.withOpacity(0.08),
        borderRadius: BorderRadius.circular(20),
        border: Border.all(color: color.withOpacity(0.2)),
      ),
      child: Text(
        label,
        style: TextStyle(
          color: color,
          fontSize: 12,
          fontWeight: FontWeight.w600,
        ),
      ),
    );
  }

  // ── Helpers ────────────────────────────────────────
  String? get _equipmentText {
    final e = exercise.equipment ?? exercise.equipmentRequired;
    return (e != null && e.isNotEmpty) ? e : null;
  }
}

class _StatItem {
  final String label;
  final String value;
  final IconData icon;
  final Color color;
  const _StatItem(this.label, this.value, this.icon, this.color);
}
