import 'package:flutter/material.dart';
import 'package:flutter_bloc/flutter_bloc.dart';
import 'package:intl/intl.dart';
import '../cubit/bookings_cubit.dart';
import '../cubit/bookings_state.dart';
import '../models/equipment_model.dart';
import '../models/coach_model.dart';

class BookingsScreen extends StatefulWidget {
  const BookingsScreen({super.key});
  @override
  State<BookingsScreen> createState() => _BookingsScreenState();
}

class _BookingsScreenState extends State<BookingsScreen>
    with SingleTickerProviderStateMixin {
  late TabController _tab;
  final _dates = List.generate(
    14,
    (i) => DateTime.now().add(Duration(days: i)),
  );

  @override
  void initState() {
    super.initState();
    _tab = TabController(length: 2, vsync: this);
  }

  @override
  void dispose() {
    _tab.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    return BlocProvider(
      create: (_) => BookingsCubit()..fetchEquipment(),
      child: Builder(
        builder: (ctx) {
          return Scaffold(
            backgroundColor: const Color(0xFFF5F7FA),
            body: Stack(
              children: [
                // ── Gym background (transparent) ──────
                Positioned.fill(
                  child: Image.asset(
                    'assets/images/gym_bg.jpg',
                    fit: BoxFit.cover,
                    errorBuilder: (_, __, ___) =>
                        Container(color: const Color(0xFF0D1B2A)),
                  ),
                ),
                // ── Dark overlay ──────────────────────
                Positioned.fill(
                  child: Container(color: Colors.black.withOpacity(0.55)),
                ),
                // ── White content area ─────────────────
                SafeArea(
                  child: Column(
                    children: [
                      _buildTopBar(ctx),
                      _buildTabBar(ctx),
                      Expanded(
                        child: Container(
                          decoration: const BoxDecoration(
                            color: Color(0xFFF5F7FA),
                            borderRadius: BorderRadius.vertical(
                              top: Radius.circular(24),
                            ),
                          ),
                          child: ClipRRect(
                            borderRadius: const BorderRadius.vertical(
                              top: Radius.circular(24),
                            ),
                            child: BlocConsumer<BookingsCubit, BookingsState>(
                              listener: (context, state) {
                                if (state is BookingSuccessState) {
                                  _showSnack(
                                    context,
                                    state.message,
                                    Colors.green,
                                  );
                                }
                                if (state is BookingsError) {
                                  _showSnack(
                                    context,
                                    state.message,
                                    Colors.redAccent,
                                  );
                                }
                              },
                              builder: (context, state) => TabBarView(
                                controller: _tab,
                                physics: const NeverScrollableScrollPhysics(),
                                children: [
                                  _buildEquipmentTab(context, state),
                                  _buildCoachTab(context, state),
                                ],
                              ),
                            ),
                          ),
                        ),
                      ),
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

  // ══════════════════════════════════════════════════
  // Top Bar  ← زرار الرجوع شغال
  // ══════════════════════════════════════════════════
  Widget _buildTopBar(BuildContext ctx) {
    return BlocBuilder<BookingsCubit, BookingsState>(
      builder: (context, state) {
        int balance = 0;
        if (state is BookingsLoaded) balance = state.userTokenBalance;
        if (state is CoachesLoaded) balance = state.userTokenBalance;

        return Padding(
          padding: const EdgeInsets.fromLTRB(16, 14, 16, 0),
          child: Row(
            children: [
              // ← Back  —  يشتغل دايماً حتى لو مش nested
              GestureDetector(
                onTap: () {
                  if (Navigator.of(ctx).canPop()) {
                    Navigator.of(ctx).pop();
                  }
                },
                child: Container(
                  padding: const EdgeInsets.all(9),
                  decoration: BoxDecoration(
                    color: Colors.white.withOpacity(0.15),
                    borderRadius: BorderRadius.circular(10),
                    border: Border.all(color: Colors.white.withOpacity(0.25)),
                  ),
                  child: const Icon(
                    Icons.arrow_back_ios_new_rounded,
                    color: Colors.white,
                    size: 16,
                  ),
                ),
              ),
              const SizedBox(width: 12),
              const Expanded(
                child: Text(
                  'Bookings',
                  style: TextStyle(
                    fontSize: 22,
                    fontWeight: FontWeight.bold,
                    color: Colors.white,
                  ),
                ),
              ),
              Container(
                padding: const EdgeInsets.symmetric(
                  horizontal: 12,
                  vertical: 6,
                ),
                decoration: BoxDecoration(
                  color: Colors.white.withOpacity(0.15),
                  borderRadius: BorderRadius.circular(20),
                  border: Border.all(color: Colors.white.withOpacity(0.25)),
                ),
                child: Row(
                  mainAxisSize: MainAxisSize.min,
                  children: [
                    const Icon(
                      Icons.toll_rounded,
                      color: Colors.white,
                      size: 14,
                    ),
                    const SizedBox(width: 4),
                    Text(
                      '$balance',
                      style: const TextStyle(
                        color: Colors.white,
                        fontWeight: FontWeight.bold,
                        fontSize: 13,
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

  // ══════════════════════════════════════════════════
  // Tab Bar (floating over bg)
  // ══════════════════════════════════════════════════
  Widget _buildTabBar(BuildContext ctx) {
    return Padding(
      padding: const EdgeInsets.fromLTRB(16, 12, 16, 0),
      child: Container(
        height: 44,
        decoration: BoxDecoration(
          color: Colors.white.withOpacity(0.15),
          borderRadius: BorderRadius.circular(14),
          border: Border.all(color: Colors.white.withOpacity(0.2)),
        ),
        child: TabBar(
          controller: _tab,
          labelColor: const Color(0xFF1A3A8F),
          unselectedLabelColor: Colors.white70,
          labelStyle: const TextStyle(
            fontWeight: FontWeight.bold,
            fontSize: 13,
          ),
          unselectedLabelStyle: const TextStyle(fontSize: 13),
          indicator: BoxDecoration(
            color: Colors.white,
            borderRadius: BorderRadius.circular(11),
          ),
          indicatorSize: TabBarIndicatorSize.tab,
          dividerColor: Colors.transparent,
          padding: const EdgeInsets.all(3),
          onTap: (i) {
            if (i == 0) {
              ctx.read<BookingsCubit>().fetchEquipment();
            } else {
              ctx.read<BookingsCubit>().fetchCoaches();
            }
          },
          tabs: const [
            Tab(
              child: Row(
                mainAxisAlignment: MainAxisAlignment.center,
                children: [
                  Icon(Icons.fitness_center_rounded, size: 14),
                  SizedBox(width: 6),
                  Text('Equipment'),
                ],
              ),
            ),
            Tab(
              child: Row(
                mainAxisAlignment: MainAxisAlignment.center,
                children: [
                  Icon(Icons.person_rounded, size: 14),
                  SizedBox(width: 6),
                  Text('Book Coach'),
                ],
              ),
            ),
          ],
        ),
      ),
    );
  }

  // ══════════════════════════════════════════════════
  // EQUIPMENT TAB
  // ══════════════════════════════════════════════════
  Widget _buildEquipmentTab(BuildContext context, BookingsState state) {
    if (state is BookingsInitial || state is BookingsLoading) {
      return const Center(
        child: CircularProgressIndicator(color: Color(0xFF1A3A8F)),
      );
    }
    if (state is BookingsLoaded) {
      return _buildEquipmentContent(context, state);
    }
    if (state is BookingsError) {
      return _buildError(
        context,
        state.message,
        () => context.read<BookingsCubit>().fetchEquipment(),
      );
    }
    return const Center(
      child: CircularProgressIndicator(color: Color(0xFF1A3A8F)),
    );
  }

  Widget _buildEquipmentContent(BuildContext context, BookingsLoaded state) {
    return RefreshIndicator(
      color: const Color(0xFF1A3A8F),
      onRefresh: () => context.read<BookingsCubit>().fetchEquipment(),
      child: Column(
        children: [
          const SizedBox(height: 12),
          _buildDatePicker(context, state.selectedDate, isCoach: false),
          const SizedBox(height: 6),
          _buildCategoryChips(context, state.selectedCategory),
          const SizedBox(height: 10),
          Padding(
            padding: const EdgeInsets.symmetric(horizontal: 16),
            child: Row(
              mainAxisAlignment: MainAxisAlignment.spaceBetween,
              children: [
                const Text(
                  'Available Machines',
                  style: TextStyle(
                    fontSize: 15,
                    fontWeight: FontWeight.bold,
                    color: Color(0xFF1A1A2E),
                  ),
                ),
                _countBadge('${state.filteredEquipment.length} Results'),
              ],
            ),
          ),
          const SizedBox(height: 8),
          Expanded(
            child: state.filteredEquipment.isEmpty
                ? _buildEmptyState(
                    'No equipment available',
                    Icons.fitness_center_outlined,
                  )
                : ListView.builder(
                    padding: const EdgeInsets.symmetric(horizontal: 16),
                    itemCount: state.filteredEquipment.length,
                    itemBuilder: (_, i) => _buildEquipmentCard(
                      context,
                      state.filteredEquipment[i],
                      state.selectedDate,
                    ),
                  ),
          ),
        ],
      ),
    );
  }

  Widget _buildEquipmentCard(
    BuildContext context,
    EquipmentModel eq,
    DateTime date,
  ) {
    return Container(
      margin: const EdgeInsets.only(bottom: 10),
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
      child: Padding(
        padding: const EdgeInsets.all(14),
        child: Row(
          children: [
            // Image or icon placeholder
            ClipRRect(
              borderRadius: BorderRadius.circular(12),
              child: eq.imageUrl.isNotEmpty
                  ? Image.network(
                      eq.imageUrl,
                      width: 58,
                      height: 58,
                      fit: BoxFit.cover,
                      errorBuilder: (_, __, ___) => _eqIcon(),
                    )
                  : _eqIcon(),
            ),
            const SizedBox(width: 12),
            Expanded(
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Text(
                    eq.name,
                    style: const TextStyle(
                      fontSize: 14,
                      fontWeight: FontWeight.bold,
                      color: Color(0xFF1A1A2E),
                    ),
                  ),
                  const SizedBox(height: 2),
                  Row(
                    children: [
                      const Icon(
                        Icons.location_on_outlined,
                        size: 11,
                        color: Colors.grey,
                      ),
                      const SizedBox(width: 2),
                      Text(
                        eq.location?.isNotEmpty == true
                            ? eq.location!
                            : eq.categoryName,
                        style: const TextStyle(
                          color: Colors.grey,
                          fontSize: 11,
                        ),
                      ),
                    ],
                  ),
                  const SizedBox(height: 6),
                  Row(
                    children: [
                      _statusBadge(eq.isAvailable),
                      const SizedBox(width: 8),
                      const Icon(
                        Icons.toll_rounded,
                        size: 11,
                        color: Color(0xFF1A3A8F),
                      ),
                      const SizedBox(width: 3),
                      Text(
                        '${eq.tokensCostPerHour} tokens/hr',
                        style: const TextStyle(
                          color: Color(0xFF1A3A8F),
                          fontSize: 11,
                          fontWeight: FontWeight.w600,
                        ),
                      ),
                    ],
                  ),
                ],
              ),
            ),
            if (eq.isAvailable)
              GestureDetector(
                onTap: () => _showEquipmentSheet(context, eq, date),
                child: Container(
                  padding: const EdgeInsets.symmetric(
                    horizontal: 14,
                    vertical: 8,
                  ),
                  decoration: BoxDecoration(
                    color: const Color(0xFF1A3A8F),
                    borderRadius: BorderRadius.circular(10),
                  ),
                  child: const Text(
                    'Book',
                    style: TextStyle(
                      color: Colors.white,
                      fontWeight: FontWeight.bold,
                      fontSize: 13,
                    ),
                  ),
                ),
              ),
          ],
        ),
      ),
    );
  }

  Widget _eqIcon() => Container(
    width: 58,
    height: 58,
    color: const Color(0xFF1A3A8F).withOpacity(0.08),
    child: const Icon(
      Icons.fitness_center_rounded,
      color: Color(0xFF1A3A8F),
      size: 24,
    ),
  );

  // ══════════════════════════════════════════════════
  // COACH TAB
  // ══════════════════════════════════════════════════
  Widget _buildCoachTab(BuildContext context, BookingsState state) {
    if (state is CoachesLoading) {
      return const Center(
        child: CircularProgressIndicator(color: Color(0xFF1A3A8F)),
      );
    }
    if (state is CoachesLoaded) {
      return _buildCoachContent(context, state);
    }
    if (state is BookingsError) {
      return _buildError(
        context,
        state.message,
        () => context.read<BookingsCubit>().fetchCoaches(),
      );
    }
    return const Center(
      child: CircularProgressIndicator(color: Color(0xFF1A3A8F)),
    );
  }

  Widget _buildCoachContent(BuildContext context, CoachesLoaded state) {
    return RefreshIndicator(
      color: const Color(0xFF1A3A8F),
      onRefresh: () => context.read<BookingsCubit>().fetchCoaches(),
      child: Column(
        children: [
          const SizedBox(height: 12),
          _buildDatePicker(context, state.selectedDate, isCoach: true),
          const SizedBox(height: 10),
          Padding(
            padding: const EdgeInsets.symmetric(horizontal: 16),
            child: Row(
              mainAxisAlignment: MainAxisAlignment.spaceBetween,
              children: [
                const Text(
                  'Our Coaches',
                  style: TextStyle(
                    fontSize: 15,
                    fontWeight: FontWeight.bold,
                    color: Color(0xFF1A1A2E),
                  ),
                ),
                _countBadge('${state.coaches.length} Available'),
              ],
            ),
          ),
          const SizedBox(height: 8),
          Expanded(
            child: state.coaches.isEmpty
                ? _buildEmptyState(
                    'No coaches available',
                    Icons.person_off_outlined,
                  )
                : ListView.builder(
                    padding: const EdgeInsets.symmetric(horizontal: 16),
                    itemCount: state.coaches.length,
                    itemBuilder: (_, i) => _buildCoachCard(
                      context,
                      state.coaches[i],
                      state.selectedDate,
                    ),
                  ),
          ),
        ],
      ),
    );
  }

  Widget _buildCoachCard(
    BuildContext context,
    CoachModel coach,
    DateTime date,
  ) {
    return Container(
      margin: const EdgeInsets.only(bottom: 12),
      decoration: BoxDecoration(
        color: Colors.white,
        borderRadius: BorderRadius.circular(18),
        boxShadow: [
          BoxShadow(
            color: Colors.grey.withOpacity(0.08),
            blurRadius: 10,
            offset: const Offset(0, 4),
          ),
        ],
      ),
      child: Padding(
        padding: const EdgeInsets.all(16),
        child: Column(
          children: [
            Row(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                ClipRRect(
                  borderRadius: BorderRadius.circular(16),
                  child: Container(
                    width: 58,
                    height: 58,
                    color: const Color(0xFF1A3A8F).withOpacity(0.08),
                    child: coach.profileImageUrl != null
                        ? Image.network(
                            coach.profileImageUrl!,
                            fit: BoxFit.cover,
                            errorBuilder: (_, __, ___) => const Icon(
                              Icons.person_rounded,
                              color: Color(0xFF1A3A8F),
                              size: 28,
                            ),
                          )
                        : const Icon(
                            Icons.person_rounded,
                            color: Color(0xFF1A3A8F),
                            size: 28,
                          ),
                  ),
                ),
                const SizedBox(width: 12),
                Expanded(
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      Row(
                        children: [
                          Expanded(
                            child: Text(
                              coach.name,
                              style: const TextStyle(
                                fontSize: 15,
                                fontWeight: FontWeight.bold,
                                color: Color(0xFF1A1A2E),
                              ),
                            ),
                          ),
                          if (coach.isAvailable) _statusBadge(true),
                        ],
                      ),
                      const SizedBox(height: 3),
                      Text(
                        coach.displaySpecialization,
                        style: const TextStyle(
                          color: Color(0xFF1A3A8F),
                          fontSize: 12,
                          fontWeight: FontWeight.w600,
                        ),
                      ),
                      const SizedBox(height: 5),
                      Row(
                        children: [
                          const Icon(
                            Icons.star_rounded,
                            color: Colors.amber,
                            size: 13,
                          ),
                          const SizedBox(width: 3),
                          Text(
                            coach.ratingDisplay,
                            style: const TextStyle(
                              fontWeight: FontWeight.bold,
                              fontSize: 12,
                            ),
                          ),
                          Text(
                            ' (${coach.totalReviews})',
                            style: const TextStyle(
                              color: Colors.grey,
                              fontSize: 11,
                            ),
                          ),
                          if (coach.experienceYears != null) ...[
                            const SizedBox(width: 8),
                            Text(
                              '${coach.experienceYears}y exp',
                              style: const TextStyle(
                                color: Colors.grey,
                                fontSize: 11,
                              ),
                            ),
                          ],
                        ],
                      ),
                    ],
                  ),
                ),
              ],
            ),
            if (coach.bio != null && coach.bio!.isNotEmpty) ...[
              const SizedBox(height: 10),
              Container(
                width: double.infinity,
                padding: const EdgeInsets.all(10),
                decoration: BoxDecoration(
                  color: const Color(0xFFF4F6FB),
                  borderRadius: BorderRadius.circular(10),
                ),
                child: Text(
                  coach.bio!,
                  style: const TextStyle(
                    color: Colors.grey,
                    fontSize: 12,
                    height: 1.4,
                  ),
                  maxLines: 2,
                  overflow: TextOverflow.ellipsis,
                ),
              ),
            ],
            if (coach.certifications.isNotEmpty) ...[
              const SizedBox(height: 8),
              Wrap(
                spacing: 6,
                runSpacing: 4,
                children: coach.certifications.take(3).map((c) {
                  return Container(
                    padding: const EdgeInsets.symmetric(
                      horizontal: 8,
                      vertical: 3,
                    ),
                    decoration: BoxDecoration(
                      color: const Color(0xFF1A3A8F).withOpacity(0.07),
                      borderRadius: BorderRadius.circular(7),
                    ),
                    child: Text(
                      c,
                      style: const TextStyle(
                        color: Color(0xFF1A3A8F),
                        fontSize: 10,
                        fontWeight: FontWeight.w600,
                      ),
                    ),
                  );
                }).toList(),
              ),
            ],
            const SizedBox(height: 12),
            Row(
              children: [
                _coachStat(
                  Icons.people_outline_rounded,
                  '${coach.totalClients}',
                  'Clients',
                ),
                _coachStat(
                  Icons.star_border_rounded,
                  coach.ratingDisplay,
                  'Rating',
                ),
                if (coach.hourlyRate != null)
                  _coachStat(
                    Icons.toll_rounded,
                    '${coach.hourlyRate!.toInt()}',
                    'Tokens/hr',
                  ),
              ],
            ),
            const SizedBox(height: 12),
            SizedBox(
              width: double.infinity,
              child: ElevatedButton.icon(
                onPressed: () => _showCoachSheet(context, coach, date),
                icon: const Icon(Icons.event_available_rounded, size: 16),
                label: const Text(
                  'Book a Session',
                  style: TextStyle(fontWeight: FontWeight.bold, fontSize: 13),
                ),
                style: ElevatedButton.styleFrom(
                  backgroundColor: const Color(0xFF1A3A8F),
                  foregroundColor: Colors.white,
                  elevation: 0,
                  padding: const EdgeInsets.symmetric(vertical: 11),
                  shape: RoundedRectangleBorder(
                    borderRadius: BorderRadius.circular(12),
                  ),
                ),
              ),
            ),
          ],
        ),
      ),
    );
  }

  Widget _coachStat(IconData icon, String value, String label) {
    return Expanded(
      child: Column(
        children: [
          Row(
            mainAxisAlignment: MainAxisAlignment.center,
            children: [
              Icon(icon, size: 12, color: Colors.grey),
              const SizedBox(width: 3),
              Text(
                value,
                style: const TextStyle(
                  fontWeight: FontWeight.bold,
                  fontSize: 13,
                  color: Color(0xFF1A1A2E),
                ),
              ),
            ],
          ),
          Text(label, style: const TextStyle(color: Colors.grey, fontSize: 10)),
        ],
      ),
    );
  }

  // ══════════════════════════════════════════════════
  // Date Picker
  // ══════════════════════════════════════════════════
  Widget _buildDatePicker(
    BuildContext context,
    DateTime selected, {
    required bool isCoach,
  }) {
    return SizedBox(
      height: 76,
      child: ListView.builder(
        scrollDirection: Axis.horizontal,
        padding: const EdgeInsets.symmetric(horizontal: 12),
        itemCount: _dates.length,
        itemBuilder: (_, i) {
          final date = _dates[i];
          final isSel =
              date.day == selected.day && date.month == selected.month;
          final isToday =
              date.day == DateTime.now().day &&
              date.month == DateTime.now().month;
          return GestureDetector(
            onTap: () => isCoach
                ? context.read<BookingsCubit>().selectCoachDate(date)
                : context.read<BookingsCubit>().selectDate(date),
            child: AnimatedContainer(
              duration: const Duration(milliseconds: 200),
              width: 50,
              margin: const EdgeInsets.symmetric(horizontal: 4, vertical: 4),
              decoration: BoxDecoration(
                gradient: isSel
                    ? const LinearGradient(
                        colors: [Color(0xFF1A3A8F), Color(0xFF0D47A1)],
                        begin: Alignment.topLeft,
                        end: Alignment.bottomRight,
                      )
                    : null,
                color: isSel ? null : Colors.white,
                borderRadius: BorderRadius.circular(13),
                boxShadow: isSel
                    ? [
                        BoxShadow(
                          color: const Color(0xFF1A3A8F).withOpacity(0.35),
                          blurRadius: 7,
                          offset: const Offset(0, 3),
                        ),
                      ]
                    : [
                        BoxShadow(
                          color: Colors.grey.withOpacity(0.08),
                          blurRadius: 4,
                        ),
                      ],
              ),
              child: Column(
                mainAxisAlignment: MainAxisAlignment.center,
                children: [
                  Text(
                    DateFormat('E').format(date).toUpperCase(),
                    style: TextStyle(
                      color: isSel ? Colors.white70 : Colors.grey,
                      fontSize: 9,
                      fontWeight: FontWeight.bold,
                    ),
                  ),
                  const SizedBox(height: 3),
                  Text(
                    DateFormat('d').format(date),
                    style: TextStyle(
                      color: isSel ? Colors.white : Colors.black87,
                      fontSize: 16,
                      fontWeight: FontWeight.bold,
                    ),
                  ),
                  if (isToday && !isSel)
                    Container(
                      width: 4,
                      height: 4,
                      decoration: const BoxDecoration(
                        color: Color(0xFF1A3A8F),
                        shape: BoxShape.circle,
                      ),
                    ),
                ],
              ),
            ),
          );
        },
      ),
    );
  }

  // ══════════════════════════════════════════════════
  // Category Chips
  // ══════════════════════════════════════════════════
  Widget _buildCategoryChips(BuildContext context, String selected) {
    final cats = [
      'All Equipment',
      'Cardio',
      'Strength',
      'Functional',
      'Stretching',
    ];
    return SizedBox(
      height: 36,
      child: ListView.builder(
        scrollDirection: Axis.horizontal,
        padding: const EdgeInsets.symmetric(horizontal: 12),
        itemCount: cats.length,
        itemBuilder: (_, i) {
          final cat = cats[i];
          final isSel = cat == selected;
          return GestureDetector(
            onTap: () => context.read<BookingsCubit>().filterByCategory(cat),
            child: AnimatedContainer(
              duration: const Duration(milliseconds: 200),
              margin: const EdgeInsets.only(right: 8),
              padding: const EdgeInsets.symmetric(horizontal: 14, vertical: 7),
              decoration: BoxDecoration(
                color: isSel ? const Color(0xFF1A3A8F) : Colors.white,
                borderRadius: BorderRadius.circular(20),
                boxShadow: [
                  BoxShadow(
                    color: isSel
                        ? const Color(0xFF1A3A8F).withOpacity(0.25)
                        : Colors.grey.withOpacity(0.08),
                    blurRadius: 4,
                  ),
                ],
              ),
              child: Text(
                cat,
                style: TextStyle(
                  color: isSel ? Colors.white : Colors.grey,
                  fontSize: 11,
                  fontWeight: isSel ? FontWeight.bold : FontWeight.normal,
                ),
              ),
            ),
          );
        },
      ),
    );
  }

  // ══════════════════════════════════════════════════
  // Sheet launchers
  // ══════════════════════════════════════════════════
  void _showEquipmentSheet(
    BuildContext context,
    EquipmentModel eq,
    DateTime date,
  ) {
    showModalBottomSheet(
      context: context,
      isScrollControlled: true,
      backgroundColor: Colors.transparent,
      builder: (_) => BlocProvider.value(
        value: context.read<BookingsCubit>(),
        child: _EquipmentSheet(equipment: eq, date: date),
      ),
    ).then((_) {
      if (context.mounted) {
        context.read<BookingsCubit>().fetchEquipment();
      }
    });
  }

  void _showCoachSheet(BuildContext context, CoachModel coach, DateTime date) {
    showModalBottomSheet(
      context: context,
      isScrollControlled: true,
      backgroundColor: Colors.transparent,
      builder: (_) => BlocProvider.value(
        value: context.read<BookingsCubit>(),
        child: _CoachSheet(coach: coach, date: date),
      ),
    ).then((_) {
      if (context.mounted) {
        context.read<BookingsCubit>().fetchCoaches();
      }
    });
  }

  // ══════════════════════════════════════════════════
  // Helpers
  // ══════════════════════════════════════════════════
  Widget _statusBadge(bool available) {
    return Container(
      padding: const EdgeInsets.symmetric(horizontal: 7, vertical: 2),
      decoration: BoxDecoration(
        color: available
            ? Colors.green.withOpacity(0.1)
            : Colors.red.withOpacity(0.1),
        borderRadius: BorderRadius.circular(7),
      ),
      child: Text(
        available ? 'Available' : 'Occupied',
        style: TextStyle(
          color: available ? Colors.green : Colors.red,
          fontSize: 10,
          fontWeight: FontWeight.bold,
        ),
      ),
    );
  }

  Widget _countBadge(String text) {
    return Container(
      padding: const EdgeInsets.symmetric(horizontal: 9, vertical: 3),
      decoration: BoxDecoration(
        color: const Color(0xFF1A3A8F).withOpacity(0.1),
        borderRadius: BorderRadius.circular(10),
      ),
      child: Text(
        text,
        style: const TextStyle(
          color: Color(0xFF1A3A8F),
          fontSize: 11,
          fontWeight: FontWeight.w600,
        ),
      ),
    );
  }

  Widget _buildEmptyState(String msg, IconData icon) {
    return Center(
      child: Column(
        mainAxisAlignment: MainAxisAlignment.center,
        children: [
          Icon(icon, size: 56, color: Colors.grey.shade300),
          const SizedBox(height: 12),
          Text(msg, style: const TextStyle(color: Colors.grey, fontSize: 13)),
        ],
      ),
    );
  }

  Widget _buildError(BuildContext context, String msg, VoidCallback retry) {
    return Center(
      child: Padding(
        padding: const EdgeInsets.all(24),
        child: Column(
          mainAxisAlignment: MainAxisAlignment.center,
          children: [
            Icon(Icons.wifi_off_rounded, size: 56, color: Colors.grey.shade300),
            const SizedBox(height: 14),
            Text(
              msg,
              textAlign: TextAlign.center,
              style: const TextStyle(color: Colors.grey, fontSize: 13),
            ),
            const SizedBox(height: 20),
            ElevatedButton.icon(
              onPressed: retry,
              icon: const Icon(Icons.refresh_rounded),
              label: const Text('Try Again'),
              style: ElevatedButton.styleFrom(
                backgroundColor: const Color(0xFF1A3A8F),
                foregroundColor: Colors.white,
                shape: RoundedRectangleBorder(
                  borderRadius: BorderRadius.circular(12),
                ),
              ),
            ),
          ],
        ),
      ),
    );
  }

  void _showSnack(BuildContext context, String msg, Color color) {
    ScaffoldMessenger.of(context).showSnackBar(
      SnackBar(
        content: Text(msg),
        backgroundColor: color,
        behavior: SnackBarBehavior.floating,
        shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(12)),
        duration: const Duration(seconds: 3),
      ),
    );
  }
}

// ══════════════════════════════════════════════════════
// Equipment Sheet — custom time picker
// ══════════════════════════════════════════════════════
class _EquipmentSheet extends StatefulWidget {
  final EquipmentModel equipment;
  final DateTime date;
  const _EquipmentSheet({required this.equipment, required this.date});

  @override
  State<_EquipmentSheet> createState() => _EquipmentSheetState();
}

class _EquipmentSheetState extends State<_EquipmentSheet> {
  int _startHour = 8;
  int _startMinute = 0;
  int _durationMinutes = 60;

  static const _durations = [15, 30, 45, 60, 90, 120];

  DateTime get _startTime => DateTime(
    widget.date.year,
    widget.date.month,
    widget.date.day,
    _startHour,
    _startMinute,
  );

  DateTime get _endTime => _startTime.add(Duration(minutes: _durationMinutes));

  String _fmt(DateTime dt) =>
      '${dt.hour.toString().padLeft(2, '0')}:${dt.minute.toString().padLeft(2, '0')}';

  String get _durationLabel {
    if (_durationMinutes < 60) return '$_durationMinutes min';
    final h = _durationMinutes ~/ 60;
    final m = _durationMinutes % 60;
    return m > 0 ? '${h}h ${m}m' : '${h}h';
  }

  int get _estimatedCost {
    final fraction = _durationMinutes / 60.0;
    return (widget.equipment.tokensCostPerHour * fraction).ceil();
  }

  @override
  Widget build(BuildContext context) {
    return Container(
      decoration: const BoxDecoration(
        color: Colors.white,
        borderRadius: BorderRadius.vertical(top: Radius.circular(24)),
      ),
      padding: EdgeInsets.fromLTRB(
        20,
        16,
        20,
        MediaQuery.of(context).viewInsets.bottom + 20,
      ),
      child: SingleChildScrollView(
        child: Column(
          mainAxisSize: MainAxisSize.min,
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            // Handle
            Center(
              child: Container(
                width: 38,
                height: 4,
                decoration: BoxDecoration(
                  color: Colors.grey.shade300,
                  borderRadius: BorderRadius.circular(2),
                ),
              ),
            ),
            const SizedBox(height: 16),

            // Header
            Row(
              children: [
                Container(
                  padding: const EdgeInsets.all(9),
                  decoration: BoxDecoration(
                    color: const Color(0xFF1A3A8F).withOpacity(0.08),
                    borderRadius: BorderRadius.circular(12),
                  ),
                  child: const Icon(
                    Icons.fitness_center_rounded,
                    color: Color(0xFF1A3A8F),
                    size: 20,
                  ),
                ),
                const SizedBox(width: 12),
                Expanded(
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      Text(
                        widget.equipment.name,
                        style: const TextStyle(
                          fontSize: 15,
                          fontWeight: FontWeight.bold,
                          color: Color(0xFF1A1A2E),
                        ),
                      ),
                      Text(
                        DateFormat('EEE, MMM d').format(widget.date),
                        style: const TextStyle(
                          color: Colors.grey,
                          fontSize: 11,
                        ),
                      ),
                    ],
                  ),
                ),
              ],
            ),

            const SizedBox(height: 16),
            const Divider(height: 1),
            const SizedBox(height: 16),

            // ── Start Time ─────────────────────
            _sLabel(Icons.access_time_rounded, 'Start Time'),
            const SizedBox(height: 10),

            const Text(
              'Hour',
              style: TextStyle(
                color: Colors.grey,
                fontSize: 11,
                fontWeight: FontWeight.w600,
              ),
            ),
            const SizedBox(height: 7),
            SizedBox(
              height: 42,
              child: ListView.builder(
                scrollDirection: Axis.horizontal,
                itemCount: 15,
                itemBuilder: (_, i) {
                  final h = 6 + i;
                  final isSel = h == _startHour;
                  return GestureDetector(
                    onTap: () => setState(() => _startHour = h),
                    child: _timeChip(
                      '${h.toString().padLeft(2, '0')}:00',
                      isSel,
                    ),
                  );
                },
              ),
            ),
            const SizedBox(height: 10),
            const Text(
              'Minute',
              style: TextStyle(
                color: Colors.grey,
                fontSize: 11,
                fontWeight: FontWeight.w600,
              ),
            ),
            const SizedBox(height: 7),
            Row(
              children: [0, 15, 30, 45].map((m) {
                final isSel = m == _startMinute;
                return Expanded(
                  child: GestureDetector(
                    onTap: () => setState(() => _startMinute = m),
                    child: Container(
                      margin: const EdgeInsets.only(right: 8),
                      padding: const EdgeInsets.symmetric(vertical: 10),
                      decoration: BoxDecoration(
                        color: isSel ? const Color(0xFF1A3A8F) : Colors.white,
                        borderRadius: BorderRadius.circular(10),
                        border: Border.all(
                          color: isSel
                              ? Colors.transparent
                              : Colors.grey.shade200,
                        ),
                        boxShadow: isSel
                            ? [
                                BoxShadow(
                                  color: const Color(
                                    0xFF1A3A8F,
                                  ).withOpacity(0.3),
                                  blurRadius: 6,
                                  offset: const Offset(0, 3),
                                ),
                              ]
                            : null,
                      ),
                      child: Center(
                        child: Text(
                          ':${m.toString().padLeft(2, '0')}',
                          style: TextStyle(
                            color: isSel ? Colors.white : Colors.black87,
                            fontWeight: FontWeight.bold,
                            fontSize: 13,
                          ),
                        ),
                      ),
                    ),
                  ),
                );
              }).toList(),
            ),

            const SizedBox(height: 16),

            // ── Duration ───────────────────────
            _sLabel(Icons.timer_outlined, 'Duration'),
            const SizedBox(height: 10),
            Wrap(
              spacing: 8,
              runSpacing: 8,
              children: _durations.map((d) {
                final isSel = d == _durationMinutes;
                final lbl = d < 60
                    ? '$d min'
                    : (d % 60 == 0 ? '${d ~/ 60}h' : '${d ~/ 60}h ${d % 60}m');
                return GestureDetector(
                  onTap: () => setState(() => _durationMinutes = d),
                  child: AnimatedContainer(
                    duration: const Duration(milliseconds: 180),
                    padding: const EdgeInsets.symmetric(
                      horizontal: 14,
                      vertical: 9,
                    ),
                    decoration: BoxDecoration(
                      color: isSel ? const Color(0xFF1A3A8F) : Colors.white,
                      borderRadius: BorderRadius.circular(10),
                      border: Border.all(
                        color: isSel
                            ? Colors.transparent
                            : Colors.grey.shade200,
                      ),
                      boxShadow: isSel
                          ? [
                              BoxShadow(
                                color: const Color(0xFF1A3A8F).withOpacity(0.3),
                                blurRadius: 6,
                                offset: const Offset(0, 3),
                              ),
                            ]
                          : null,
                    ),
                    child: Text(
                      lbl,
                      style: TextStyle(
                        color: isSel ? Colors.white : Colors.black87,
                        fontWeight: FontWeight.w600,
                        fontSize: 13,
                      ),
                    ),
                  ),
                );
              }).toList(),
            ),

            const SizedBox(height: 16),

            // ── Summary Card ───────────────────
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
                mainAxisAlignment: MainAxisAlignment.spaceAround,
                children: [
                  _sumItem(Icons.play_arrow_rounded, _fmt(_startTime), 'Start'),
                  _divider(),
                  _sumItem(Icons.stop_rounded, _fmt(_endTime), 'End'),
                  _divider(),
                  _sumItem(Icons.timer_outlined, _durationLabel, 'Duration'),
                  _divider(),
                  _sumItem(Icons.toll_rounded, '$_estimatedCost', 'Tokens'),
                ],
              ),
            ),

            const SizedBox(height: 16),

            // ── Confirm ────────────────────────
            SizedBox(
              width: double.infinity,
              child: ElevatedButton(
                onPressed: () => _confirm(context),
                style: ElevatedButton.styleFrom(
                  backgroundColor: const Color(0xFF1A3A8F),
                  foregroundColor: Colors.white,
                  elevation: 0,
                  padding: const EdgeInsets.symmetric(vertical: 13),
                  shape: RoundedRectangleBorder(
                    borderRadius: BorderRadius.circular(14),
                  ),
                ),
                child: Text(
                  'Book ${widget.equipment.name} · ${_fmt(_startTime)} → ${_fmt(_endTime)}',
                  style: const TextStyle(
                    fontWeight: FontWeight.bold,
                    fontSize: 13,
                  ),
                ),
              ),
            ),
          ],
        ),
      ),
    );
  }

  Widget _sLabel(IconData icon, String text) {
    return Row(
      children: [
        Container(
          padding: const EdgeInsets.all(6),
          decoration: BoxDecoration(
            color: const Color(0xFF1A3A8F).withOpacity(0.08),
            borderRadius: BorderRadius.circular(8),
          ),
          child: Icon(icon, color: const Color(0xFF1A3A8F), size: 14),
        ),
        const SizedBox(width: 8),
        Text(
          text,
          style: const TextStyle(
            fontWeight: FontWeight.bold,
            fontSize: 14,
            color: Color(0xFF1A1A2E),
          ),
        ),
      ],
    );
  }

  Widget _timeChip(String label, bool selected) {
    return AnimatedContainer(
      duration: const Duration(milliseconds: 180),
      width: 56,
      margin: const EdgeInsets.only(right: 8),
      decoration: BoxDecoration(
        color: selected ? const Color(0xFF1A3A8F) : Colors.white,
        borderRadius: BorderRadius.circular(10),
        border: Border.all(
          color: selected ? Colors.transparent : Colors.grey.shade200,
        ),
        boxShadow: selected
            ? [
                BoxShadow(
                  color: const Color(0xFF1A3A8F).withOpacity(0.3),
                  blurRadius: 6,
                  offset: const Offset(0, 3),
                ),
              ]
            : null,
      ),
      child: Center(
        child: Text(
          label,
          style: TextStyle(
            color: selected ? Colors.white : Colors.black87,
            fontWeight: FontWeight.w600,
            fontSize: 11,
          ),
        ),
      ),
    );
  }

  Widget _sumItem(IconData icon, String value, String label) {
    return Column(
      children: [
        Icon(icon, color: const Color(0xFF1A3A8F), size: 15),
        const SizedBox(height: 3),
        Text(
          value,
          style: const TextStyle(
            color: Color(0xFF1A3A8F),
            fontWeight: FontWeight.bold,
            fontSize: 13,
          ),
        ),
        Text(label, style: const TextStyle(color: Colors.grey, fontSize: 9)),
      ],
    );
  }

  Widget _divider() => Container(
    width: 1,
    height: 36,
    color: const Color(0xFF1A3A8F).withOpacity(0.15),
  );

  Future<void> _confirm(BuildContext context) async {
    if (_startTime.isBefore(DateTime.now())) {
      ScaffoldMessenger.of(context).showSnackBar(
        const SnackBar(
          content: Text('Please select a future time'),
          backgroundColor: Colors.orange,
          behavior: SnackBarBehavior.floating,
        ),
      );
      return;
    }

    final err = await context.read<BookingsCubit>().createEquipmentBooking(
      widget.equipment.equipmentId,
      widget.equipment.name,
      _startTime,
      _endTime,
      _estimatedCost,
    );

    if (!context.mounted) return;
    Navigator.pop(context);

    if (err == null) {
      context.read<BookingsCubit>().finishBookingSuccess(_estimatedCost);
    } else {
      context.read<BookingsCubit>().finishBookingError(err);
    }
  }
}

// ══════════════════════════════════════════════════════
// Coach Sheet
// ══════════════════════════════════════════════════════
class _CoachSheet extends StatefulWidget {
  final CoachModel coach;
  final DateTime date;
  const _CoachSheet({required this.coach, required this.date});

  @override
  State<_CoachSheet> createState() => _CoachSheetState();
}

class _CoachSheetState extends State<_CoachSheet> {
  int _startHour = 9;
  int _startMinute = 0;
  int _durationMinutes = 60;
  final _notesCtrl = TextEditingController();

  static const _durations = [15, 30, 45, 60, 90, 120];

  @override
  void dispose() {
    _notesCtrl.dispose();
    super.dispose();
  }

  DateTime get _startTime => DateTime(
    widget.date.year,
    widget.date.month,
    widget.date.day,
    _startHour,
    _startMinute,
  );

  DateTime get _endTime => _startTime.add(Duration(minutes: _durationMinutes));

  String _fmt(DateTime dt) =>
      '${dt.hour.toString().padLeft(2, '0')}:${dt.minute.toString().padLeft(2, '0')}';

  String get _durationLabel {
    if (_durationMinutes < 60) return '$_durationMinutes min';
    final h = _durationMinutes ~/ 60;
    final m = _durationMinutes % 60;
    return m > 0 ? '${h}h ${m}m' : '${h}h';
  }

  @override
  Widget build(BuildContext context) {
    return Container(
      decoration: const BoxDecoration(
        color: Colors.white,
        borderRadius: BorderRadius.vertical(top: Radius.circular(24)),
      ),
      padding: EdgeInsets.fromLTRB(
        20,
        16,
        20,
        MediaQuery.of(context).viewInsets.bottom + 20,
      ),
      child: SingleChildScrollView(
        child: Column(
          mainAxisSize: MainAxisSize.min,
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Center(
              child: Container(
                width: 38,
                height: 4,
                decoration: BoxDecoration(
                  color: Colors.grey.shade300,
                  borderRadius: BorderRadius.circular(2),
                ),
              ),
            ),
            const SizedBox(height: 16),

            // Coach header
            Row(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                ClipRRect(
                  borderRadius: BorderRadius.circular(14),
                  child: Container(
                    width: 50,
                    height: 50,
                    color: const Color(0xFF1A3A8F).withOpacity(0.08),
                    child: widget.coach.profileImageUrl != null
                        ? Image.network(
                            widget.coach.profileImageUrl!,
                            fit: BoxFit.cover,
                            errorBuilder: (_, __, ___) => const Icon(
                              Icons.person_rounded,
                              color: Color(0xFF1A3A8F),
                            ),
                          )
                        : const Icon(
                            Icons.person_rounded,
                            color: Color(0xFF1A3A8F),
                            size: 26,
                          ),
                  ),
                ),
                const SizedBox(width: 12),
                Expanded(
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      Text(
                        widget.coach.name,
                        style: const TextStyle(
                          fontSize: 15,
                          fontWeight: FontWeight.bold,
                          color: Color(0xFF1A1A2E),
                        ),
                      ),
                      Text(
                        widget.coach.displaySpecialization,
                        style: const TextStyle(
                          color: Color(0xFF1A3A8F),
                          fontSize: 12,
                          fontWeight: FontWeight.w600,
                        ),
                      ),
                      Text(
                        DateFormat('EEE, MMM d').format(widget.date),
                        style: const TextStyle(
                          color: Colors.grey,
                          fontSize: 11,
                        ),
                      ),
                    ],
                  ),
                ),
              ],
            ),

            const SizedBox(height: 16),
            const Divider(height: 1),
            const SizedBox(height: 16),

            // Hour
            _sLabel(Icons.access_time_rounded, 'Start Time'),
            const SizedBox(height: 10),
            const Text(
              'Hour',
              style: TextStyle(
                color: Colors.grey,
                fontSize: 11,
                fontWeight: FontWeight.w600,
              ),
            ),
            const SizedBox(height: 7),
            SizedBox(
              height: 42,
              child: ListView.builder(
                scrollDirection: Axis.horizontal,
                itemCount: 15,
                itemBuilder: (_, i) {
                  final h = 6 + i;
                  final isSel = h == _startHour;
                  return GestureDetector(
                    onTap: () => setState(() => _startHour = h),
                    child: _timeChip(
                      '${h.toString().padLeft(2, '0')}:00',
                      isSel,
                    ),
                  );
                },
              ),
            ),
            const SizedBox(height: 10),

            // Minute
            const Text(
              'Minute',
              style: TextStyle(
                color: Colors.grey,
                fontSize: 11,
                fontWeight: FontWeight.w600,
              ),
            ),
            const SizedBox(height: 7),
            Row(
              children: [0, 15, 30, 45].map((m) {
                final isSel = m == _startMinute;
                return Expanded(
                  child: GestureDetector(
                    onTap: () => setState(() => _startMinute = m),
                    child: Container(
                      margin: const EdgeInsets.only(right: 8),
                      padding: const EdgeInsets.symmetric(vertical: 10),
                      decoration: BoxDecoration(
                        color: isSel ? const Color(0xFF1A3A8F) : Colors.white,
                        borderRadius: BorderRadius.circular(10),
                        border: Border.all(
                          color: isSel
                              ? Colors.transparent
                              : Colors.grey.shade200,
                        ),
                        boxShadow: isSel
                            ? [
                                BoxShadow(
                                  color: const Color(
                                    0xFF1A3A8F,
                                  ).withOpacity(0.3),
                                  blurRadius: 6,
                                  offset: const Offset(0, 3),
                                ),
                              ]
                            : null,
                      ),
                      child: Center(
                        child: Text(
                          ':${m.toString().padLeft(2, '0')}',
                          style: TextStyle(
                            color: isSel ? Colors.white : Colors.black87,
                            fontWeight: FontWeight.bold,
                            fontSize: 13,
                          ),
                        ),
                      ),
                    ),
                  ),
                );
              }).toList(),
            ),

            const SizedBox(height: 16),

            // Duration
            _sLabel(Icons.timer_outlined, 'Duration'),
            const SizedBox(height: 10),
            Wrap(
              spacing: 8,
              runSpacing: 8,
              children: _durations.map((d) {
                final isSel = d == _durationMinutes;
                final lbl = d < 60
                    ? '$d min'
                    : (d % 60 == 0 ? '${d ~/ 60}h' : '${d ~/ 60}h ${d % 60}m');
                return GestureDetector(
                  onTap: () => setState(() => _durationMinutes = d),
                  child: AnimatedContainer(
                    duration: const Duration(milliseconds: 180),
                    padding: const EdgeInsets.symmetric(
                      horizontal: 14,
                      vertical: 9,
                    ),
                    decoration: BoxDecoration(
                      color: isSel ? const Color(0xFF1A3A8F) : Colors.white,
                      borderRadius: BorderRadius.circular(10),
                      border: Border.all(
                        color: isSel
                            ? Colors.transparent
                            : Colors.grey.shade200,
                      ),
                      boxShadow: isSel
                          ? [
                              BoxShadow(
                                color: const Color(0xFF1A3A8F).withOpacity(0.3),
                                blurRadius: 6,
                                offset: const Offset(0, 3),
                              ),
                            ]
                          : null,
                    ),
                    child: Text(
                      lbl,
                      style: TextStyle(
                        color: isSel ? Colors.white : Colors.black87,
                        fontWeight: FontWeight.w600,
                        fontSize: 13,
                      ),
                    ),
                  ),
                );
              }).toList(),
            ),

            const SizedBox(height: 16),

            // Summary
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
                mainAxisAlignment: MainAxisAlignment.spaceAround,
                children: [
                  _sumItem(Icons.play_arrow_rounded, _fmt(_startTime), 'Start'),
                  _divider(),
                  _sumItem(Icons.stop_rounded, _fmt(_endTime), 'End'),
                  _divider(),
                  _sumItem(Icons.timer_outlined, _durationLabel, 'Duration'),
                ],
              ),
            ),

            const SizedBox(height: 14),

            // Notes
            const Text(
              'Notes (optional)',
              style: TextStyle(
                fontWeight: FontWeight.w600,
                fontSize: 13,
                color: Colors.black87,
              ),
            ),
            const SizedBox(height: 7),
            Container(
              decoration: BoxDecoration(
                color: const Color(0xFFF4F6FB),
                borderRadius: BorderRadius.circular(12),
                border: Border.all(color: Colors.grey.shade200),
              ),
              child: TextField(
                controller: _notesCtrl,
                maxLines: 2,
                decoration: const InputDecoration(
                  hintText: 'e.g. Focus on upper body...',
                  hintStyle: TextStyle(color: Colors.grey, fontSize: 12),
                  border: InputBorder.none,
                  contentPadding: EdgeInsets.all(12),
                ),
              ),
            ),

            const SizedBox(height: 16),

            // Confirm
            SizedBox(
              width: double.infinity,
              child: ElevatedButton(
                onPressed: () => _confirm(context),
                style: ElevatedButton.styleFrom(
                  backgroundColor: const Color(0xFF1A3A8F),
                  foregroundColor: Colors.white,
                  elevation: 0,
                  padding: const EdgeInsets.symmetric(vertical: 13),
                  shape: RoundedRectangleBorder(
                    borderRadius: BorderRadius.circular(14),
                  ),
                ),
                child: Text(
                  'Book Session · ${_fmt(_startTime)} → ${_fmt(_endTime)}',
                  style: const TextStyle(
                    fontWeight: FontWeight.bold,
                    fontSize: 14,
                  ),
                ),
              ),
            ),
          ],
        ),
      ),
    );
  }

  Widget _sLabel(IconData icon, String text) {
    return Row(
      children: [
        Container(
          padding: const EdgeInsets.all(6),
          decoration: BoxDecoration(
            color: const Color(0xFF1A3A8F).withOpacity(0.08),
            borderRadius: BorderRadius.circular(8),
          ),
          child: Icon(icon, color: const Color(0xFF1A3A8F), size: 14),
        ),
        const SizedBox(width: 8),
        Text(
          text,
          style: const TextStyle(
            fontWeight: FontWeight.bold,
            fontSize: 14,
            color: Color(0xFF1A1A2E),
          ),
        ),
      ],
    );
  }

  Widget _timeChip(String label, bool selected) {
    return AnimatedContainer(
      duration: const Duration(milliseconds: 180),
      width: 56,
      margin: const EdgeInsets.only(right: 8),
      decoration: BoxDecoration(
        color: selected ? const Color(0xFF1A3A8F) : Colors.white,
        borderRadius: BorderRadius.circular(10),
        border: Border.all(
          color: selected ? Colors.transparent : Colors.grey.shade200,
        ),
        boxShadow: selected
            ? [
                BoxShadow(
                  color: const Color(0xFF1A3A8F).withOpacity(0.3),
                  blurRadius: 6,
                  offset: const Offset(0, 3),
                ),
              ]
            : null,
      ),
      child: Center(
        child: Text(
          label,
          style: TextStyle(
            color: selected ? Colors.white : Colors.black87,
            fontWeight: FontWeight.w600,
            fontSize: 11,
          ),
        ),
      ),
    );
  }

  Widget _sumItem(IconData icon, String value, String label) {
    return Column(
      children: [
        Icon(icon, color: const Color(0xFF1A3A8F), size: 15),
        const SizedBox(height: 3),
        Text(
          value,
          style: const TextStyle(
            color: Color(0xFF1A3A8F),
            fontWeight: FontWeight.bold,
            fontSize: 13,
          ),
        ),
        Text(label, style: const TextStyle(color: Colors.grey, fontSize: 9)),
      ],
    );
  }

  Widget _divider() => Container(
    width: 1,
    height: 36,
    color: const Color(0xFF1A3A8F).withOpacity(0.15),
  );

  Future<void> _confirm(BuildContext context) async {
    if (_startTime.isBefore(DateTime.now())) {
      ScaffoldMessenger.of(context).showSnackBar(
        const SnackBar(
          content: Text('Please select a future time'),
          backgroundColor: Colors.orange,
          behavior: SnackBarBehavior.floating,
        ),
      );
      return;
    }

    final err = await context.read<BookingsCubit>().createCoachBooking(
      widget.coach.coachProfileId,
      widget.coach.name,
      _startTime,
      _endTime,
      _notesCtrl.text.trim(),
    );

    if (!context.mounted) return;
    Navigator.pop(context);

    ScaffoldMessenger.of(context).showSnackBar(
      SnackBar(
        content: Text(
          err == null
              ? 'Session with ${widget.coach.name} booked! ${_fmt(_startTime)} → ${_fmt(_endTime)} 🎉'
              : err,
        ),
        backgroundColor: err == null ? Colors.green : Colors.redAccent,
        behavior: SnackBarBehavior.floating,
        shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(12)),
        duration: const Duration(seconds: 4),
      ),
    );
  }
}
