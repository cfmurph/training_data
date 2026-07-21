import 'package:flutter/material.dart';
import 'package:intl/intl.dart';
import 'package:provider/provider.dart';

import '../providers/app_provider.dart';
import '../widgets/tt_app_bar.dart';

class DashboardScreen extends StatefulWidget {
  const DashboardScreen({super.key});

  @override
  State<DashboardScreen> createState() => _DashboardScreenState();
}

class _DashboardScreenState extends State<DashboardScreen> {
  @override
  void initState() {
    super.initState();
    WidgetsBinding.instance.addPostFrameCallback((_) {
      final prov = context.read<AppProvider>();
      prov.loadStats();
      prov.loadPlan();
      prov.loadWeight();
    });
  }

  @override
  Widget build(BuildContext context) {
    return Consumer<AppProvider>(builder: (ctx, prov, _) {
      final auth = prov.auth;
      final plan = prov.plan;
      final weight = prov.weightSummary;
      final today = _fmtDate(DateTime.now());
      final todayWorkout = plan != null ? prov.workoutsByDate[today] : null;

      return Scaffold(
        backgroundColor: const Color(0xFF030712),
        appBar: TTAppBar(
          title: 'Dashboard',
          actions: [
            IconButton(
              icon: const Icon(Icons.logout_outlined, color: Colors.grey),
              onPressed: () => _confirmLogout(context, prov),
            ),
          ],
        ),
        body: RefreshIndicator(
          color: const Color(0xFF6366F1),
          onRefresh: () async {
            await prov.loadStats();
            await prov.loadPlan();
            await prov.loadWeight();
          },
          child: ListView(
            padding: const EdgeInsets.all(16),
            children: [
              // ── Welcome ────────────────────────────────────────────
              if (auth.athlete != null) ...[
                Row(children: [
                  CircleAvatar(
                    backgroundColor: const Color(0xFF6366F1),
                    radius: 22,
                    child: Text(
                      auth.athlete!.name.isNotEmpty
                          ? auth.athlete!.name[0].toUpperCase()
                          : '?',
                      style: const TextStyle(
                          color: Colors.white, fontWeight: FontWeight.bold, fontSize: 18),
                    ),
                  ),
                  const SizedBox(width: 12),
                  Expanded(
                    child: Column(crossAxisAlignment: CrossAxisAlignment.start, children: [
                      Text('Hello, ${auth.athlete!.name.split(' ').first}!',
                          style: const TextStyle(
                              color: Colors.white, fontWeight: FontWeight.bold, fontSize: 20)),
                      Text(
                        'via ${auth.provider ?? 'unknown'}  •  ${DateFormat('EEE MMM d').format(DateTime.now())}',
                        style: TextStyle(color: Colors.grey[500], fontSize: 12),
                      ),
                    ]),
                  ),
                ]),
                const SizedBox(height: 20),
              ],

              // ── Today's Workout ────────────────────────────────────
              if (todayWorkout != null) ...[
                const _SectionHeader("Today's Workout"),
                const SizedBox(height: 8),
                _TodayWorkoutCard(workout: todayWorkout),
                const SizedBox(height: 16),
              ],

              // ── Quick stats ────────────────────────────────────────
              const _SectionHeader('Quick Stats'),
              const SizedBox(height: 10),
              GridView.count(
                crossAxisCount: 2,
                shrinkWrap: true,
                physics: const NeverScrollableScrollPhysics(),
                crossAxisSpacing: 10,
                mainAxisSpacing: 10,
                childAspectRatio: 1.5,
                children: [
                  _QuickCard(
                    icon: Icons.directions_bike,
                    color: const Color(0xFF6366F1),
                    label: 'Plan Phase',
                    value: plan?.currentPhase ?? '—',
                    sub: plan != null
                        ? '${plan.fitnessLevel.toLowerCase()} level'
                        : 'No active plan',
                  ),
                  _QuickCard(
                    icon: Icons.monitor_weight_outlined,
                    color: const Color(0xFF10B981),
                    label: 'Weight',
                    value: weight.totalEntries > 0
                        ? '${weight.currentWeightKg} kg'
                        : '—',
                    sub: weight.totalEntries > 0 && weight.totalLossKg > 0
                        ? '${weight.totalLossKg.toStringAsFixed(1)} kg lost'
                        : 'Not logged',
                  ),
                  _QuickCard(
                    icon: Icons.bolt,
                    color: const Color(0xFFF59E0B),
                    label: 'This Week',
                    value: '${_weeklyHours(prov)}h',
                    sub: 'target: ${plan?.weeklyHoursTarget ?? 0}h',
                  ),
                  _QuickCard(
                    icon: Icons.trending_down,
                    color: const Color(0xFF10B981),
                    label: 'Weekly Loss',
                    value: weight.totalEntries > 0
                        ? '${weight.weeklyRateKg.abs().toStringAsFixed(2)} kg/w'
                        : '—',
                    sub: weight.totalEntries > 0 ? 'past 14 days' : 'Log weight to track',
                  ),
                ],
              ),
              const SizedBox(height: 16),

              // ── Training activities from Strava/Garmin ─────────────
              if (prov.stats != null) ...[
                const _SectionHeader('Training Summary'),
                const SizedBox(height: 10),
                _TrainingStatsCard(prov.stats!),
                const SizedBox(height: 16),
              ],

              // ── Recent plan workouts ───────────────────────────────
              if (plan != null && prov.workoutsByDate.isNotEmpty) ...[
                const _SectionHeader('This Week\'s Plan'),
                const SizedBox(height: 10),
                _WeekPlanCard(prov),
                const SizedBox(height: 16),
              ],
            ],
          ),
        ),
      );
    });
  }

  String _weeklyHours(AppProvider prov) {
    if (prov.plan == null) return '0';
    final now = DateTime.now();
    final monday = now.subtract(Duration(days: (now.weekday - 1)));
    int total = 0;
    for (int i = 0; i < 7; i++) {
      final d = monday.add(Duration(days: i));
      final key = _fmtDate(d);
      final w = prov.workoutsByDate[key];
      if (w != null) total += w.targetDurationMinutes;
    }
    return (total / 60).toStringAsFixed(1);
  }

  static String _fmtDate(DateTime d) =>
      '${d.year}-${d.month.toString().padLeft(2, '0')}-${d.day.toString().padLeft(2, '0')}';

  void _confirmLogout(BuildContext context, AppProvider prov) {
    showDialog(
      context: context,
      builder: (ctx) => AlertDialog(
        backgroundColor: const Color(0xFF111827),
        title: const Text('Disconnect', style: TextStyle(color: Colors.white)),
        content: const Text('Disconnect your account?',
            style: TextStyle(color: Colors.grey)),
        actions: [
          TextButton(onPressed: () => Navigator.pop(ctx), child: const Text('Cancel')),
          TextButton(
            onPressed: () {
              Navigator.pop(ctx);
              prov.logout();
            },
            child: const Text('Disconnect', style: TextStyle(color: Colors.redAccent)),
          ),
        ],
      ),
    );
  }
}

// ── Today's workout banner ────────────────────────────────────────────────

class _TodayWorkoutCard extends StatelessWidget {
  final workout;
  const _TodayWorkoutCard({required this.workout});

  static const _emoji = {
    'REST': '😴', 'RECOVERY': '🌊', 'ENDURANCE': '🚴',
    'TEMPO': '⚡', 'THRESHOLD': '🔥', 'INTERVALS': '💥', 'LONG_RIDE': '🏔️',
  };

  @override
  Widget build(BuildContext context) {
    final w = workout;
    final type = w.workoutType as String;
    return Container(
      padding: const EdgeInsets.all(16),
      decoration: BoxDecoration(
        gradient: const LinearGradient(
          colors: [Color(0xFF4F46E5), Color(0xFF7C3AED)],
          begin: Alignment.topLeft,
          end: Alignment.bottomRight,
        ),
        borderRadius: BorderRadius.circular(16),
      ),
      child: Row(children: [
        Text(_emoji[type] ?? '🚴', style: const TextStyle(fontSize: 36)),
        const SizedBox(width: 14),
        Expanded(
          child: Column(crossAxisAlignment: CrossAxisAlignment.start, children: [
            Text(type.toLowerCase().replaceAll('_', ' ').capitalize(),
                style: const TextStyle(
                    color: Colors.white, fontWeight: FontWeight.bold, fontSize: 17)),
            Text('Week ${w.planWeek}  •  ${w.targetDurationMinutes} min',
                style: const TextStyle(color: Colors.white70, fontSize: 13)),
          ]),
        ),
        if (w.completed)
          const Icon(Icons.check_circle, color: Color(0xFF10B981), size: 28),
      ]),
    );
  }
}

// ── Quick stat card ───────────────────────────────────────────────────────

class _QuickCard extends StatelessWidget {
  final IconData icon;
  final Color color;
  final String label;
  final String value;
  final String sub;
  const _QuickCard(
      {required this.icon, required this.color, required this.label,
       required this.value, required this.sub});

  @override
  Widget build(BuildContext context) => Container(
        padding: const EdgeInsets.all(12),
        decoration: BoxDecoration(
          color: const Color(0xFF111827),
          border: Border.all(color: const Color(0xFF1F2937)),
          borderRadius: BorderRadius.circular(14),
        ),
        child: Column(crossAxisAlignment: CrossAxisAlignment.start, children: [
          Icon(icon, color: color, size: 22),
          const Spacer(),
          Text(value,
              style: const TextStyle(
                  color: Colors.white, fontWeight: FontWeight.bold, fontSize: 18),
              overflow: TextOverflow.ellipsis),
          Text(label,
              style: TextStyle(color: Colors.grey[500], fontSize: 11)),
          Text(sub,
              style: TextStyle(color: Colors.grey[600], fontSize: 10),
              overflow: TextOverflow.ellipsis),
        ]),
      );
}

// ── Training stats card ───────────────────────────────────────────────────

class _TrainingStatsCard extends StatelessWidget {
  final Map<String, dynamic> stats;
  const _TrainingStatsCard(this.stats);

  @override
  Widget build(BuildContext context) {
    final s = stats['stats'] as Map<String, dynamic>?;
    if (s == null) return const SizedBox.shrink();

    final distM = (s['totalDistanceMeters'] ?? 0).toDouble();
    final durSec = (s['totalDurationSeconds'] ?? 0).toDouble();
    final acts = s['totalActivities'] ?? 0;

    return Container(
      padding: const EdgeInsets.all(14),
      decoration: BoxDecoration(
        color: const Color(0xFF111827),
        border: Border.all(color: const Color(0xFF1F2937)),
        borderRadius: BorderRadius.circular(14),
      ),
      child: Row(
        mainAxisAlignment: MainAxisAlignment.spaceAround,
        children: [
          _MinStat('Activities', '$acts'),
          _vDivider(),
          _MinStat('Distance', '${(distM / 1000).toStringAsFixed(0)} km'),
          _vDivider(),
          _MinStat('Time', _fmtHours(durSec)),
        ],
      ),
    );
  }

  Widget _vDivider() => Container(
      width: 1, height: 40, color: const Color(0xFF1F2937));

  String _fmtHours(double sec) {
    final h = (sec / 3600).floor();
    final m = ((sec % 3600) / 60).floor();
    return '${h}h ${m}m';
  }
}

class _MinStat extends StatelessWidget {
  final String label;
  final String value;
  const _MinStat(this.label, this.value);

  @override
  Widget build(BuildContext context) => Column(children: [
        Text(value,
            style: const TextStyle(
                color: Colors.white, fontWeight: FontWeight.bold, fontSize: 18)),
        Text(label, style: TextStyle(color: Colors.grey[500], fontSize: 11)),
      ]);
}

// ── Week plan mini view ───────────────────────────────────────────────────

class _WeekPlanCard extends StatelessWidget {
  final AppProvider prov;
  const _WeekPlanCard(this.prov);

  static String _fmtDate(DateTime d) =>
      '${d.year}-${d.month.toString().padLeft(2, '0')}-${d.day.toString().padLeft(2, '0')}';

  @override
  Widget build(BuildContext context) {
    final now = DateTime.now();
    final monday = now.subtract(Duration(days: now.weekday - 1));

    final days = List.generate(7, (i) => monday.add(Duration(days: i)));

    return Container(
      padding: const EdgeInsets.all(14),
      decoration: BoxDecoration(
        color: const Color(0xFF111827),
        border: Border.all(color: const Color(0xFF1F2937)),
        borderRadius: BorderRadius.circular(14),
      ),
      child: Row(
        mainAxisAlignment: MainAxisAlignment.spaceAround,
        children: days.map((d) {
          final key = _fmtDate(d);
          final w = prov.workoutsByDate[key];
          final isToday = isSameDay(d, now);
          return Column(mainAxisSize: MainAxisSize.min, children: [
            Text(DateFormat('E').format(d).substring(0, 2),
                style: TextStyle(
                    color: isToday ? const Color(0xFF6366F1) : Colors.grey[500],
                    fontSize: 10,
                    fontWeight: isToday ? FontWeight.bold : FontWeight.normal)),
            const SizedBox(height: 4),
            Container(
              width: 32,
              height: 32,
              decoration: BoxDecoration(
                color: w != null ? _typeColor(w.workoutType) : const Color(0xFF1F2937),
                borderRadius: BorderRadius.circular(8),
                border: isToday
                    ? Border.all(color: const Color(0xFF6366F1), width: 2)
                    : null,
              ),
              child: Center(
                child: Text(
                  w != null ? _emoji[w.workoutType] ?? '?' : '·',
                  style: const TextStyle(fontSize: 14),
                ),
              ),
            ),
          ]);
        }).toList(),
      ),
    );
  }

  static bool isSameDay(DateTime a, DateTime b) =>
      a.year == b.year && a.month == b.month && a.day == b.day;

  static const _emoji = {
    'REST': '😴', 'RECOVERY': '🌊', 'ENDURANCE': '🚴',
    'TEMPO': '⚡', 'THRESHOLD': '🔥', 'INTERVALS': '💥', 'LONG_RIDE': '🏔️',
  };

  static Color _typeColor(String type) => switch (type) {
        'REST' => const Color(0xFF374151),
        'RECOVERY' => const Color(0xFF1E3A5F),
        'ENDURANCE' => const Color(0xFF064E3B),
        'TEMPO' => const Color(0xFF78350F),
        'THRESHOLD' => const Color(0xFF7C2D12),
        'INTERVALS' => const Color(0xFF450A0A),
        'LONG_RIDE' => const Color(0xFF2E1065),
        _ => const Color(0xFF374151),
      };
}

class _SectionHeader extends StatelessWidget {
  final String text;
  const _SectionHeader(this.text);

  @override
  Widget build(BuildContext context) => Text(text,
      style: const TextStyle(
          color: Colors.white, fontWeight: FontWeight.bold, fontSize: 16));
}

extension on String {
  String capitalize() =>
      isEmpty ? this : '${this[0].toUpperCase()}${substring(1)}';
}
