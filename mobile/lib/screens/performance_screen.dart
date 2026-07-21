import 'package:fl_chart/fl_chart.dart';
import 'package:flutter/material.dart';
import 'package:provider/provider.dart';

import '../models/performance.dart';
import '../providers/app_provider.dart';
import '../widgets/tt_app_bar.dart';

Color _scoreColor(int score) {
  if (score >= 80) return const Color(0xFF10B981);
  if (score >= 60) return const Color(0xFFF59E0B);
  if (score >= 30) return const Color(0xFFF97316);
  return const Color(0xFFEF4444);
}

// ── Compliance Gauge (Arc) ────────────────────────────────────────────────

class _ComplianceGauge extends StatelessWidget {
  final double rate;
  const _ComplianceGauge(this.rate);

  @override
  Widget build(BuildContext context) {
    final color = _scoreColor(rate.round());
    return SizedBox(
      width: 140,
      height: 140,
      child: Stack(
        alignment: Alignment.center,
        children: [
          PieChart(
            PieChartData(
              startDegreeOffset: -90,
              sections: [
                PieChartSectionData(
                  value: rate,
                  color: color,
                  radius: 16,
                  showTitle: false,
                ),
                PieChartSectionData(
                  value: 100 - rate,
                  color: const Color(0xFF1F2937),
                  radius: 16,
                  showTitle: false,
                ),
              ],
              centerSpaceRadius: 48,
              sectionsSpace: 2,
            ),
          ),
          Column(mainAxisSize: MainAxisSize.min, children: [
            Text('${rate.round()}%',
                style: TextStyle(
                    color: color, fontWeight: FontWeight.bold, fontSize: 26)),
            const Text('compliance',
                style: TextStyle(color: Colors.grey, fontSize: 12)),
          ]),
        ],
      ),
    );
  }
}

// ── Week bar chart ────────────────────────────────────────────────────────

class _WeekBarChart extends StatelessWidget {
  final List<DailyAssessment> assessments;
  const _WeekBarChart(this.assessments);

  @override
  Widget build(BuildContext context) {
    final filtered = assessments
        .where((a) => a.planned.workoutType != 'REST')
        .toList();
    if (filtered.isEmpty) return const SizedBox.shrink();

    return Container(
      padding: const EdgeInsets.all(16),
      decoration: BoxDecoration(
        color: const Color(0xFF111827),
        border: Border.all(color: const Color(0xFF1F2937)),
        borderRadius: BorderRadius.circular(14),
      ),
      child: Column(crossAxisAlignment: CrossAxisAlignment.start, children: [
        const Text('This Week',
            style: TextStyle(
                color: Colors.white, fontWeight: FontWeight.bold, fontSize: 14)),
        const SizedBox(height: 16),
        SizedBox(
          height: 120,
          child: BarChart(
            BarChartData(
              maxY: 100,
              minY: 0,
              gridData: FlGridData(
                show: true,
                horizontalInterval: 25,
                getDrawingHorizontalLine: (_) =>
                    const FlLine(color: Color(0xFF1F2937), strokeWidth: 1),
                drawVerticalLine: false,
              ),
              borderData: FlBorderData(show: false),
              titlesData: FlTitlesData(
                leftTitles: const AxisTitles(sideTitles: SideTitles(showTitles: false)),
                rightTitles: const AxisTitles(sideTitles: SideTitles(showTitles: false)),
                topTitles: const AxisTitles(sideTitles: SideTitles(showTitles: false)),
                bottomTitles: AxisTitles(
                  sideTitles: SideTitles(
                    showTitles: true,
                    getTitlesWidget: (v, _) {
                      final i = v.toInt();
                      if (i >= filtered.length) return const SizedBox.shrink();
                      final date = filtered[i].date;
                      // Parse day of week abbreviation
                      final d = DateTime.tryParse(date);
                      const days = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];
                      final label = d != null ? days[d.weekday - 1] : '?';
                      return Text(label,
                          style: TextStyle(color: Colors.grey[500], fontSize: 10));
                    },
                    reservedSize: 20,
                  ),
                ),
              ),
              barGroups: List.generate(filtered.length, (i) {
                final a = filtered[i];
                return BarChartGroupData(
                  x: i,
                  barRods: [
                    BarChartRodData(
                      toY: a.complianceScore.toDouble(),
                      color: _scoreColor(a.complianceScore),
                      width: 18,
                      borderRadius: const BorderRadius.vertical(top: Radius.circular(4)),
                    ),
                  ],
                );
              }),
            ),
          ),
        ),
      ]),
    );
  }
}

// ── Daily Assessment Card ─────────────────────────────────────────────────

class _DayCard extends StatelessWidget {
  final DailyAssessment a;
  const _DayCard(this.a);

  @override
  Widget build(BuildContext context) {
    final statusColor = switch (a.status) {
      'COMPLETED' => const Color(0xFF10B981),
      'PARTIAL' => const Color(0xFFF59E0B),
      'MISSED' => const Color(0xFFEF4444),
      _ => const Color(0xFFF97316),
    };
    final statusIcon = switch (a.status) {
      'COMPLETED' => Icons.check_circle,
      'PARTIAL' => Icons.warning_amber,
      'MISSED' => Icons.cancel,
      _ => Icons.warning_amber,
    };

    final w = a.planned;

    return Container(
      margin: const EdgeInsets.only(bottom: 10),
      padding: const EdgeInsets.all(14),
      decoration: BoxDecoration(
        color: const Color(0xFF111827),
        border: Border.all(color: const Color(0xFF1F2937)),
        borderRadius: BorderRadius.circular(14),
      ),
      child: Column(crossAxisAlignment: CrossAxisAlignment.start, children: [
        Row(children: [
          Expanded(
            child: Column(crossAxisAlignment: CrossAxisAlignment.start, children: [
              Text(a.date,
                  style: const TextStyle(
                      color: Colors.white, fontWeight: FontWeight.w600, fontSize: 14)),
              Text(
                '${w.workoutType.toLowerCase().replaceAll('_', ' ')}'
                    '${w.targetDurationMinutes > 0 ? ' · ${w.targetDurationMinutes} min' : ''}',
                style: TextStyle(color: Colors.grey[500], fontSize: 12),
              ),
            ]),
          ),
          Container(
            padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 4),
            decoration: BoxDecoration(
              color: statusColor.withOpacity(0.15),
              border: Border.all(color: statusColor.withOpacity(0.4)),
              borderRadius: BorderRadius.circular(8),
            ),
            child: Row(mainAxisSize: MainAxisSize.min, children: [
              Icon(statusIcon, color: statusColor, size: 14),
              const SizedBox(width: 4),
              Text(
                a.status == 'MISSED' ? 'Missed' : '${a.complianceScore}/100',
                style: TextStyle(color: statusColor, fontSize: 12, fontWeight: FontWeight.w600),
              ),
            ]),
          ),
        ]),

        if (a.actual != null) ...[
          const SizedBox(height: 8),
          Container(
            padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 6),
            decoration: BoxDecoration(
              color: const Color(0xFF1F2937),
              borderRadius: BorderRadius.circular(8),
            ),
            child: Row(children: [
              const Icon(Icons.directions_bike, color: Color(0xFF6366F1), size: 14),
              const SizedBox(width: 6),
              Expanded(
                child: Text(a.actual!['name'] ?? 'Activity',
                    style: const TextStyle(color: Colors.white, fontSize: 12),
                    overflow: TextOverflow.ellipsis),
              ),
              Text(
                '${((a.actual!['durationSeconds'] ?? 0) / 60).round()} min',
                style: TextStyle(color: Colors.grey[400], fontSize: 12),
              ),
            ]),
          ),
        ],

        const SizedBox(height: 8),
        Text(a.feedback,
            style: TextStyle(
                color: Colors.grey[300], fontSize: 12, height: 1.4)),
      ]),
    );
  }
}

// ── Main Screen ───────────────────────────────────────────────────────────

class PerformanceScreen extends StatefulWidget {
  const PerformanceScreen({super.key});

  @override
  State<PerformanceScreen> createState() => _PerformanceScreenState();
}

class _PerformanceScreenState extends State<PerformanceScreen> {
  @override
  void initState() {
    super.initState();
    WidgetsBinding.instance.addPostFrameCallback((_) {
      final prov = context.read<AppProvider>();
      if (prov.plan != null) prov.loadPerformance();
    });
  }

  @override
  Widget build(BuildContext context) {
    return Consumer<AppProvider>(builder: (ctx, prov, _) {
      final plan = prov.plan;

      return Scaffold(
        backgroundColor: const Color(0xFF030712),
        appBar: TTAppBar(
          title: 'Performance',
          actions: [
            IconButton(
              icon: const Icon(Icons.refresh, color: Colors.grey),
              onPressed: () => prov.loadPerformance(),
            ),
          ],
        ),
        body: plan == null
            ? _noPlanState()
            : prov.perfLoading
                ? const Center(child: CircularProgressIndicator(color: Color(0xFF6366F1)))
                : _buildContent(prov, plan),
      );
    });
  }

  Widget _noPlanState() => Center(
        child: Padding(
          padding: const EdgeInsets.all(32),
          child: Column(mainAxisAlignment: MainAxisAlignment.center, children: [
            const Icon(Icons.bolt, color: Color(0xFF374151), size: 64),
            const SizedBox(height: 16),
            const Text('No Active Plan',
                style: TextStyle(color: Colors.white, fontWeight: FontWeight.bold, fontSize: 20)),
            const SizedBox(height: 8),
            Text('Create a training plan first to see your performance assessments.',
                textAlign: TextAlign.center,
                style: TextStyle(color: Colors.grey[400], fontSize: 14)),
          ]),
        ),
      );

  Widget _buildContent(AppProvider prov, plan) {
    final compliance = prov.compliance;
    final weeks = prov.weekAssessments;

    return RefreshIndicator(
      color: const Color(0xFF6366F1),
      onRefresh: prov.loadPerformance,
      child: ListView(
        padding: const EdgeInsets.all(16),
        children: [
          // Compliance summary row
          if (compliance != null) ...[
            Row(children: [
              Expanded(
                child: Container(
                  padding: const EdgeInsets.all(16),
                  decoration: BoxDecoration(
                    color: const Color(0xFF111827),
                    border: Border.all(color: const Color(0xFF1F2937)),
                    borderRadius: BorderRadius.circular(14),
                  ),
                  child: Column(children: [
                    _ComplianceGauge(compliance.complianceRate),
                    const SizedBox(height: 12),
                    Row(
                        mainAxisAlignment: MainAxisAlignment.spaceAround,
                        children: [
                          _StatMini('Planned', '${compliance.totalWorkouts}', Colors.grey[300]!),
                          _StatMini('Done', '${compliance.completedWorkouts}', const Color(0xFF10B981)),
                          _StatMini('Missed',
                              '${compliance.totalWorkouts - compliance.completedWorkouts}',
                              const Color(0xFFEF4444)),
                        ]),
                  ]),
                ),
              ),
            ]),
            const SizedBox(height: 12),

            // Compliance message
            _complianceMessage(compliance.complianceRate),
            const SizedBox(height: 16),
          ],

          // Week bar chart
          if (weeks.isNotEmpty) ...[
            _WeekBarChart(weeks),
            const SizedBox(height: 16),
          ],

          // Daily cards
          if (weeks.isNotEmpty) ...[
            const Text('Daily Breakdown',
                style: TextStyle(
                    color: Colors.white, fontWeight: FontWeight.bold, fontSize: 16)),
            const SizedBox(height: 10),
            ...weeks.map((a) => _DayCard(a)),
          ] else
            Container(
              padding: const EdgeInsets.all(32),
              decoration: BoxDecoration(
                color: const Color(0xFF111827),
                border: Border.all(color: const Color(0xFF1F2937), style: BorderStyle.solid),
                borderRadius: BorderRadius.circular(14),
              ),
              child: Column(children: [
                const Icon(Icons.hourglass_empty, color: Color(0xFF374151), size: 40),
                const SizedBox(height: 8),
                Text('No assessments this week yet.',
                    style: TextStyle(color: Colors.grey[400], fontSize: 13),
                    textAlign: TextAlign.center),
                const SizedBox(height: 4),
                Text('Activity data from Strava or Garmin will be compared automatically.',
                    style: TextStyle(color: Colors.grey[600], fontSize: 12),
                    textAlign: TextAlign.center),
              ]),
            ),
        ],
      ),
    );
  }

  Widget _complianceMessage(double rate) => Container(
        padding: const EdgeInsets.all(12),
        decoration: BoxDecoration(
          color: const Color(0xFF1F2937),
          borderRadius: BorderRadius.circular(10),
        ),
        child: Row(children: [
          Text(
            rate >= 80 ? '🎉' : rate >= 60 ? '👍' : rate >= 40 ? '💪' : '⚠️',
            style: const TextStyle(fontSize: 20),
          ),
          const SizedBox(width: 8),
          Expanded(
            child: Text(
              rate >= 80
                  ? 'Excellent compliance — keep it up!'
                  : rate >= 60
                      ? 'Good consistency. Aim for 80%+.'
                      : rate >= 40
                          ? 'Room for improvement. Hit each planned session.'
                          : 'Low compliance. Reassess your schedule.',
              style: const TextStyle(color: Colors.white, fontSize: 13),
            ),
          ),
        ]),
      );
}

class _StatMini extends StatelessWidget {
  final String label;
  final String value;
  final Color color;
  const _StatMini(this.label, this.value, this.color);

  @override
  Widget build(BuildContext context) => Column(children: [
        Text(value,
            style:
                TextStyle(color: color, fontWeight: FontWeight.bold, fontSize: 20)),
        Text(label, style: TextStyle(color: Colors.grey[500], fontSize: 11)),
      ]);
}
