import 'package:flutter/material.dart';
import 'package:provider/provider.dart';
import 'package:table_calendar/table_calendar.dart';

import '../models/training_plan.dart';
import '../providers/app_provider.dart';
import '../widgets/tt_app_bar.dart';

// ── Workout type metadata ─────────────────────────────────────────────────

const _typeEmoji = {
  'REST': '😴',
  'RECOVERY': '🌊',
  'ENDURANCE': '🚴',
  'TEMPO': '⚡',
  'THRESHOLD': '🔥',
  'INTERVALS': '💥',
  'LONG_RIDE': '🏔️',
};

const _typeLabel = {
  'REST': 'Rest',
  'RECOVERY': 'Recovery',
  'ENDURANCE': 'Endurance',
  'TEMPO': 'Tempo',
  'THRESHOLD': 'Threshold',
  'INTERVALS': 'Intervals',
  'LONG_RIDE': 'Long Ride',
};

Color _typeColor(String type) => switch (type) {
      'REST' => const Color(0xFF374151),
      'RECOVERY' => const Color(0xFF1E3A5F),
      'ENDURANCE' => const Color(0xFF064E3B),
      'TEMPO' => const Color(0xFF78350F),
      'THRESHOLD' => const Color(0xFF7C2D12),
      'INTERVALS' => const Color(0xFF450A0A),
      'LONG_RIDE' => const Color(0xFF2E1065),
      _ => const Color(0xFF374151),
    };

Color _typeTextColor(String type) => switch (type) {
      'REST' => const Color(0xFF9CA3AF),
      'RECOVERY' => const Color(0xFF93C5FD),
      'ENDURANCE' => const Color(0xFF6EE7B7),
      'TEMPO' => const Color(0xFFFCD34D),
      'THRESHOLD' => const Color(0xFFFB923C),
      'INTERVALS' => const Color(0xFFF87171),
      'LONG_RIDE' => const Color(0xFFA78BFA),
      _ => const Color(0xFF9CA3AF),
    };

Color _zoneColor(int zone) => switch (zone) {
      1 => const Color(0xFF3B82F6),
      2 => const Color(0xFF10B981),
      3 => const Color(0xFFF59E0B),
      4 => const Color(0xFFF97316),
      5 => const Color(0xFFEF4444),
      _ => const Color(0xFF6B7280),
    };

// ── Plan Screen ───────────────────────────────────────────────────────────

class PlanScreen extends StatefulWidget {
  const PlanScreen({super.key});

  @override
  State<PlanScreen> createState() => _PlanScreenState();
}

class _PlanScreenState extends State<PlanScreen> {
  DateTime _focusedDay = DateTime.now();
  DateTime? _selectedDay;
  PlannedWorkout? _selectedWorkout;

  @override
  void initState() {
    super.initState();
    WidgetsBinding.instance.addPostFrameCallback((_) {
      context.read<AppProvider>().loadPlan();
    });
  }

  void _onDaySelected(DateTime day, DateTime focused) {
    final prov = context.read<AppProvider>();
    final key = _fmtDate(day);
    setState(() {
      _focusedDay = focused;
      _selectedDay = day;
      _selectedWorkout = prov.workoutsByDate[key];
    });
  }

  void _onPageChanged(DateTime month) {
    setState(() {
      _focusedDay = month;
      _selectedWorkout = null;
    });
    context.read<AppProvider>().loadWorkoutsForMonth(month);
  }

  @override
  Widget build(BuildContext context) {
    return Consumer<AppProvider>(builder: (ctx, prov, _) {
      if (prov.planLoading) {
        return const Scaffold(
          backgroundColor: Color(0xFF030712),
          body: Center(child: CircularProgressIndicator(color: Color(0xFF6366F1))),
        );
      }
      return Scaffold(
        backgroundColor: const Color(0xFF030712),
        appBar: TTAppBar(
          title: 'Training Plan',
          actions: [
            if (prov.plan != null)
              IconButton(
                icon: const Icon(Icons.delete_outline, color: Colors.redAccent),
                tooltip: 'End Plan',
                onPressed: () => _confirmDelete(prov),
              ),
          ],
        ),
        floatingActionButton: FloatingActionButton.extended(
          backgroundColor: const Color(0xFF6366F1),
          foregroundColor: Colors.white,
          icon: const Icon(Icons.add),
          label: Text(prov.plan == null ? 'Create Plan' : 'New Plan'),
          onPressed: () => _showCreateSheet(context, prov),
        ),
        body: prov.plan == null ? _EmptyState(onTap: () => _showCreateSheet(context, prov)) : _buildPlan(prov),
      );
    });
  }

  Widget _buildPlan(AppProvider prov) {
    final plan = prov.plan!;
    return Column(
      children: [
        // ── Plan header ──────────────────────────────────────────────
        Container(
          margin: const EdgeInsets.fromLTRB(16, 12, 16, 0),
          padding: const EdgeInsets.all(14),
          decoration: BoxDecoration(
            color: const Color(0xFF111827),
            border: Border.all(color: const Color(0xFF1F2937)),
            borderRadius: BorderRadius.circular(14),
          ),
          child: Row(children: [
            Expanded(
              child: Column(crossAxisAlignment: CrossAxisAlignment.start, children: [
                Row(children: [
                  _PhaseBadge(plan.currentPhase),
                  const SizedBox(width: 6),
                  _PhaseBadge(plan.fitnessLevel, isLevel: true),
                ]),
                const SizedBox(height: 4),
                Text(plan.goalEvent ?? '${_capitalize(plan.fitnessLevel)} Plan',
                    style: const TextStyle(
                        color: Colors.white, fontWeight: FontWeight.bold, fontSize: 15)),
                Text('${plan.startDate} – ${plan.endDate}',
                    style: TextStyle(color: Colors.grey[500], fontSize: 12)),
              ]),
            ),
            Column(crossAxisAlignment: CrossAxisAlignment.end, children: [
              Text('${plan.weeklyHoursTarget}h/week',
                  style: const TextStyle(
                      color: Colors.white, fontWeight: FontWeight.bold, fontSize: 18)),
              if (plan.weightGoalKg > 0)
                Text('Goal: ${plan.weightGoalKg}kg',
                    style: const TextStyle(color: Color(0xFF10B981), fontSize: 12)),
            ]),
          ]),
        ),

        // ── Calendar ─────────────────────────────────────────────────
        Expanded(
          child: SingleChildScrollView(
            child: Column(children: [
              TableCalendar(
                firstDay: DateTime.utc(2024),
                lastDay: DateTime.utc(2030),
                focusedDay: _focusedDay,
                selectedDayPredicate: (d) =>
                    _selectedDay != null && isSameDay(_selectedDay!, d),
                onDaySelected: _onDaySelected,
                onPageChanged: _onPageChanged,
                calendarFormat: CalendarFormat.month,
                startingDayOfWeek: StartingDayOfWeek.monday,
                headerStyle: HeaderStyle(
                  formatButtonVisible: false,
                  titleTextStyle: const TextStyle(
                      color: Colors.white, fontWeight: FontWeight.bold, fontSize: 16),
                  leftChevronIcon:
                      const Icon(Icons.chevron_left, color: Colors.white),
                  rightChevronIcon:
                      const Icon(Icons.chevron_right, color: Colors.white),
                  titleCentered: true,
                ),
                daysOfWeekStyle: DaysOfWeekStyle(
                  weekdayStyle:
                      TextStyle(color: Colors.grey[400], fontSize: 12),
                  weekendStyle:
                      TextStyle(color: Colors.grey[400], fontSize: 12),
                ),
                calendarStyle: CalendarStyle(
                  outsideDaysVisible: false,
                  defaultTextStyle:
                      const TextStyle(color: Colors.white, fontSize: 13),
                  weekendTextStyle:
                      const TextStyle(color: Colors.white, fontSize: 13),
                  todayDecoration: BoxDecoration(
                    border: Border.all(color: const Color(0xFF6366F1), width: 2),
                    shape: BoxShape.circle,
                  ),
                  todayTextStyle: const TextStyle(color: Color(0xFF6366F1)),
                  selectedDecoration: const BoxDecoration(
                    color: Color(0xFF6366F1),
                    shape: BoxShape.circle,
                  ),
                  selectedTextStyle:
                      const TextStyle(color: Colors.white, fontWeight: FontWeight.bold),
                ),
                calendarBuilders: CalendarBuilders(
                  markerBuilder: (ctx, day, events) {
                    final key = _fmtDate(day);
                    final w = prov.workoutsByDate[key];
                    if (w == null) return null;
                    return Positioned(
                      bottom: 2,
                      child: Container(
                        width: 6,
                        height: 6,
                        decoration: BoxDecoration(
                          color: w.completed
                              ? const Color(0xFF10B981)
                              : _typeTextColor(w.workoutType),
                          shape: BoxShape.circle,
                        ),
                      ),
                    );
                  },
                  defaultBuilder: (ctx, day, focused) =>
                      _dayCell(day, prov, isFocused: false),
                  focusedBuilder: (ctx, day, focused) =>
                      _dayCell(day, prov, isFocused: true),
                  todayBuilder: (ctx, day, focused) =>
                      _dayCell(day, prov, isToday: true),
                  selectedBuilder: (ctx, day, focused) =>
                      _dayCell(day, prov, isSelected: true),
                ),
                rowHeight: 52,
              ),

              // ── Selected workout detail ───────────────────────────
              if (_selectedWorkout != null) ...[
                const Divider(color: Color(0xFF1F2937), height: 1),
                _WorkoutDetail(workout: _selectedWorkout!),
              ],
              const SizedBox(height: 100),
            ]),
          ),
        ),
      ],
    );
  }

  Widget? _dayCell(DateTime day, AppProvider prov,
      {bool isFocused = false, bool isToday = false, bool isSelected = false}) {
    final key = _fmtDate(day);
    final w = prov.workoutsByDate[key];
    if (w == null) return null;

    final bg = _typeColor(w.workoutType);
    final fg = _typeTextColor(w.workoutType);

    return Container(
      margin: const EdgeInsets.all(2),
      decoration: BoxDecoration(
        color: isSelected ? const Color(0xFF6366F1) : bg,
        borderRadius: BorderRadius.circular(8),
        border: isToday
            ? Border.all(color: const Color(0xFF6366F1), width: 2)
            : null,
      ),
      child: Column(
        mainAxisAlignment: MainAxisAlignment.center,
        children: [
          Text('${day.day}',
              style: TextStyle(
                color: isSelected ? Colors.white : fg,
                fontWeight: FontWeight.bold,
                fontSize: 12,
              )),
          Text(_typeEmoji[w.workoutType] ?? '', style: const TextStyle(fontSize: 12)),
        ],
      ),
    );
  }

  void _confirmDelete(AppProvider prov) {
    showDialog(
      context: context,
      builder: (ctx) => AlertDialog(
        backgroundColor: const Color(0xFF111827),
        title: const Text('End Plan', style: TextStyle(color: Colors.white)),
        content: const Text('Deactivate your current training plan?',
            style: TextStyle(color: Colors.grey)),
        actions: [
          TextButton(
              onPressed: () => Navigator.pop(ctx),
              child: const Text('Cancel')),
          TextButton(
            onPressed: () {
              Navigator.pop(ctx);
              prov.deactivatePlan();
            },
            child: const Text('End Plan', style: TextStyle(color: Colors.redAccent)),
          ),
        ],
      ),
    );
  }

  void _showCreateSheet(BuildContext context, AppProvider prov) {
    showModalBottomSheet(
      context: context,
      isScrollControlled: true,
      backgroundColor: const Color(0xFF111827),
      shape: const RoundedRectangleBorder(
          borderRadius: BorderRadius.vertical(top: Radius.circular(20))),
      builder: (_) => _CreatePlanSheet(prov: prov),
    );
  }

  static String _fmtDate(DateTime d) =>
      '${d.year}-${d.month.toString().padLeft(2, '0')}-${d.day.toString().padLeft(2, '0')}';

  static String _capitalize(String s) =>
      s.isEmpty ? s : s[0] + s.substring(1).toLowerCase();
}

// ── Phase/Level badge ──────────────────────────────────────────────────────

class _PhaseBadge extends StatelessWidget {
  final String label;
  final bool isLevel;
  const _PhaseBadge(this.label, {this.isLevel = false});

  @override
  Widget build(BuildContext context) {
    return Container(
      padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 3),
      decoration: BoxDecoration(
        color: isLevel
            ? const Color(0xFF1F2937)
            : const Color(0xFF6366F1).withOpacity(0.2),
        border: Border.all(
          color: isLevel
              ? const Color(0xFF374151)
              : const Color(0xFF6366F1).withOpacity(0.4),
        ),
        borderRadius: BorderRadius.circular(6),
      ),
      child: Text(label,
          style: TextStyle(
            color: isLevel ? Colors.grey[300] : const Color(0xFF818CF8),
            fontSize: 11,
            fontWeight: FontWeight.w600,
          )),
    );
  }
}

// ── Empty state ───────────────────────────────────────────────────────────

class _EmptyState extends StatelessWidget {
  final VoidCallback onTap;
  const _EmptyState({required this.onTap});

  @override
  Widget build(BuildContext context) {
    return Center(
      child: Padding(
        padding: const EdgeInsets.all(32),
        child: Column(mainAxisAlignment: MainAxisAlignment.center, children: [
          const Text('🚴', style: TextStyle(fontSize: 64)),
          const SizedBox(height: 16),
          const Text('No Active Plan',
              style: TextStyle(
                  color: Colors.white, fontWeight: FontWeight.bold, fontSize: 22)),
          const SizedBox(height: 8),
          Text(
            'Generate a personalized periodized cycling plan tailored to your fitness and available time.',
            textAlign: TextAlign.center,
            style: TextStyle(color: Colors.grey[400], fontSize: 14),
          ),
          const SizedBox(height: 24),
          ElevatedButton.icon(
            onPressed: onTap,
            icon: const Icon(Icons.add),
            label: const Text('Create My Plan'),
            style: ElevatedButton.styleFrom(
              backgroundColor: const Color(0xFF6366F1),
              foregroundColor: Colors.white,
              padding: const EdgeInsets.symmetric(horizontal: 24, vertical: 14),
              shape: RoundedRectangleBorder(
                  borderRadius: BorderRadius.circular(12)),
            ),
          ),
        ]),
      ),
    );
  }
}

// ── Workout detail panel ──────────────────────────────────────────────────

class _WorkoutDetail extends StatelessWidget {
  final PlannedWorkout workout;
  const _WorkoutDetail({required this.workout});

  @override
  Widget build(BuildContext context) {
    final w = workout;
    return Container(
      margin: const EdgeInsets.all(16),
      padding: const EdgeInsets.all(16),
      decoration: BoxDecoration(
        color: _typeColor(w.workoutType).withOpacity(0.6),
        border: Border.all(color: _typeTextColor(w.workoutType).withOpacity(0.3)),
        borderRadius: BorderRadius.circular(16),
      ),
      child: Column(crossAxisAlignment: CrossAxisAlignment.start, children: [
        Row(children: [
          Text(_typeEmoji[w.workoutType] ?? '', style: const TextStyle(fontSize: 28)),
          const SizedBox(width: 10),
          Expanded(
            child: Column(crossAxisAlignment: CrossAxisAlignment.start, children: [
              Text(_typeLabel[w.workoutType] ?? w.workoutType,
                  style: const TextStyle(
                      color: Colors.white, fontWeight: FontWeight.bold, fontSize: 16)),
              Text('Week ${w.planWeek}  •  ${w.workoutDate}',
                  style: TextStyle(color: Colors.grey[400], fontSize: 12)),
            ]),
          ),
          if (w.workoutType != 'REST') ...[
            _ZoneChip(w.intensityZone),
            const SizedBox(width: 8),
            Container(
              padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 4),
              decoration: BoxDecoration(
                color: Colors.black26,
                borderRadius: BorderRadius.circular(8),
              ),
              child: Text('${w.targetDurationMinutes} min',
                  style: const TextStyle(color: Colors.white, fontSize: 12)),
            ),
          ],
        ]),
        const SizedBox(height: 10),
        Text(w.description,
            style: TextStyle(color: Colors.grey[300], fontSize: 13, height: 1.4)),

        if (w.warmup != null || w.mainSet != null || w.cooldown != null) ...[
          const Divider(color: Colors.white10, height: 20),
          if (w.warmup != null) _StructuredBlock('Warm-up', w.warmup!, Colors.blue),
          if (w.mainSet != null) _StructuredBlock('Main Set', w.mainSet!, Colors.orange),
          if (w.cooldown != null) _StructuredBlock('Cool-down', w.cooldown!, Colors.green),
        ],

        if (w.completed) ...[
          const SizedBox(height: 8),
          Row(children: [
            const Icon(Icons.check_circle, color: Color(0xFF10B981), size: 16),
            const SizedBox(width: 4),
            const Text('Completed', style: TextStyle(color: Color(0xFF10B981), fontSize: 13)),
          ]),
        ],
      ]),
    );
  }
}

class _ZoneChip extends StatelessWidget {
  final int zone;
  const _ZoneChip(this.zone);

  @override
  Widget build(BuildContext context) {
    return Container(
      padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 4),
      decoration: BoxDecoration(
        color: _zoneColor(zone).withOpacity(0.25),
        border: Border.all(color: _zoneColor(zone).withOpacity(0.5)),
        borderRadius: BorderRadius.circular(8),
      ),
      child: Text('Z$zone',
          style: TextStyle(
              color: _zoneColor(zone), fontSize: 12, fontWeight: FontWeight.bold)),
    );
  }
}

class _StructuredBlock extends StatelessWidget {
  final String label;
  final String text;
  final Color accent;
  const _StructuredBlock(this.label, this.text, this.accent);

  @override
  Widget build(BuildContext context) {
    return Padding(
      padding: const EdgeInsets.only(bottom: 8),
      child: Column(crossAxisAlignment: CrossAxisAlignment.start, children: [
        Text(label.toUpperCase(),
            style: TextStyle(
                color: accent, fontSize: 10, fontWeight: FontWeight.w700,
                letterSpacing: 1)),
        const SizedBox(height: 3),
        Text(text, style: TextStyle(color: Colors.grey[300], fontSize: 13, height: 1.4)),
      ]),
    );
  }
}

// ── Create Plan Sheet ─────────────────────────────────────────────────────

class _CreatePlanSheet extends StatefulWidget {
  final AppProvider prov;
  const _CreatePlanSheet({required this.prov});

  @override
  State<_CreatePlanSheet> createState() => _CreatePlanSheetState();
}

class _CreatePlanSheetState extends State<_CreatePlanSheet> {
  String _level = 'INTERMEDIATE';
  double _hours = 10;
  final _goalCtrl = TextEditingController();
  final _weightCtrl = TextEditingController();
  bool _creating = false;

  static const _levelInfo = {
    'BEGINNER': '8 weeks · Zone 2 base · 5–8 h/week',
    'INTERMEDIATE': '12 weeks · Base + Build · 8–14 h/week',
    'ADVANCED': '16 weeks · Base → Peak → Taper · 14–20 h/week',
  };

  @override
  Widget build(BuildContext context) {
    return Padding(
      padding: EdgeInsets.fromLTRB(
          20, 20, 20, MediaQuery.of(context).viewInsets.bottom + 20),
      child: SingleChildScrollView(
        child: Column(crossAxisAlignment: CrossAxisAlignment.start, children: [
          Center(
            child: Container(
              width: 40, height: 4,
              decoration: BoxDecoration(
                  color: Colors.grey[600], borderRadius: BorderRadius.circular(2)),
            ),
          ),
          const SizedBox(height: 16),
          const Text('Create Cycling Plan',
              style: TextStyle(
                  color: Colors.white, fontWeight: FontWeight.bold, fontSize: 20)),
          const SizedBox(height: 20),

          // Fitness Level
          const _SectionLabel('Fitness Level'),
          const SizedBox(height: 8),
          Row(children: ['BEGINNER', 'INTERMEDIATE', 'ADVANCED'].map((l) =>
            Expanded(
              child: GestureDetector(
                onTap: () => setState(() => _level = l),
                child: Container(
                  margin: const EdgeInsets.only(right: 6),
                  padding: const EdgeInsets.symmetric(vertical: 10),
                  decoration: BoxDecoration(
                    color: _level == l ? const Color(0xFF6366F1) : const Color(0xFF1F2937),
                    borderRadius: BorderRadius.circular(10),
                  ),
                  child: Text(
                    l[0] + l.substring(1).toLowerCase(),
                    textAlign: TextAlign.center,
                    style: TextStyle(
                        color: _level == l ? Colors.white : Colors.grey[400],
                        fontSize: 12, fontWeight: FontWeight.w600),
                  ),
                ),
              ),
            ),
          ).toList()),
          const SizedBox(height: 6),
          Text(_levelInfo[_level] ?? '',
              style: TextStyle(color: Colors.grey[500], fontSize: 12)),

          const SizedBox(height: 18),

          // Weekly Hours
          _SectionLabel('Weekly Hours: ${_hours.round()}h'),
          Slider(
            value: _hours,
            min: 5, max: 20, divisions: 15,
            activeColor: const Color(0xFF6366F1),
            inactiveColor: const Color(0xFF1F2937),
            onChanged: (v) => setState(() => _hours = v),
          ),

          // Goal event
          const _SectionLabel('Goal Event (optional)'),
          const SizedBox(height: 8),
          _TField(ctrl: _goalCtrl, hint: 'e.g. Gran Fondo 2025'),

          const SizedBox(height: 14),

          // Goal weight
          const _SectionLabel('Goal Weight in kg (optional)'),
          const SizedBox(height: 8),
          _TField(ctrl: _weightCtrl, hint: '0 = no weight goal', keyboardType: TextInputType.number),

          const SizedBox(height: 24),

          SizedBox(
            width: double.infinity,
            height: 50,
            child: ElevatedButton(
              onPressed: _creating ? null : _submit,
              style: ElevatedButton.styleFrom(
                backgroundColor: const Color(0xFF6366F1),
                foregroundColor: Colors.white,
                shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(14)),
              ),
              child: _creating
                  ? const CircularProgressIndicator(color: Colors.white, strokeWidth: 2)
                  : const Text('Generate Plan', style: TextStyle(fontWeight: FontWeight.bold, fontSize: 16)),
            ),
          ),
        ]),
      ),
    );
  }

  Future<void> _submit() async {
    setState(() => _creating = true);
    try {
      await widget.prov.createPlan(
        fitnessLevel: _level,
        weeklyHours: _hours.round(),
        goalEvent: _goalCtrl.text.trim().isEmpty ? null : _goalCtrl.text.trim(),
        goalWeightKg: double.tryParse(_weightCtrl.text) ?? 0,
      );
      if (mounted) Navigator.pop(context);
    } catch (e) {
      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
            SnackBar(content: Text('Error: $e'), backgroundColor: Colors.redAccent));
      }
    } finally {
      if (mounted) setState(() => _creating = false);
    }
  }
}

class _SectionLabel extends StatelessWidget {
  final String text;
  const _SectionLabel(this.text);
  @override
  Widget build(BuildContext context) => Text(text,
      style: const TextStyle(color: Colors.white, fontWeight: FontWeight.w600, fontSize: 14));
}

class _TField extends StatelessWidget {
  final TextEditingController ctrl;
  final String hint;
  final TextInputType? keyboardType;
  const _TField({required this.ctrl, required this.hint, this.keyboardType});

  @override
  Widget build(BuildContext context) => TextField(
        controller: ctrl,
        style: const TextStyle(color: Colors.white, fontSize: 14),
        keyboardType: keyboardType,
        decoration: InputDecoration(
          hintText: hint,
          hintStyle: TextStyle(color: Colors.grey[600]),
          filled: true,
          fillColor: const Color(0xFF1F2937),
          contentPadding: const EdgeInsets.symmetric(horizontal: 14, vertical: 12),
          border: OutlineInputBorder(
            borderRadius: BorderRadius.circular(12),
            borderSide: BorderSide.none,
          ),
        ),
      );
}
