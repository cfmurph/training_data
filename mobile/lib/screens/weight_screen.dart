import 'package:fl_chart/fl_chart.dart';
import 'package:flutter/material.dart';
import 'package:intl/intl.dart';
import 'package:provider/provider.dart';

import '../models/weight_entry.dart';
import '../providers/app_provider.dart';
import '../widgets/tt_app_bar.dart';

// ── Weight trend chart ────────────────────────────────────────────────────

class _WeightChart extends StatelessWidget {
  final WeightSummary summary;
  const _WeightChart(this.summary);

  @override
  Widget build(BuildContext context) {
    final history = summary.history.reversed.toList(); // oldest first
    if (history.isEmpty) return const SizedBox.shrink();

    // Build spots
    final spots = <FlSpot>[];
    final avgSpots = <FlSpot>[];

    for (int i = 0; i < history.length; i++) {
      spots.add(FlSpot(i.toDouble(), history[i].weightKg));
      // 7-day rolling avg
      final window = history.sublist(
          (i - 6).clamp(0, history.length - 1), i + 1);
      final avg = window.map((e) => e.weightKg).reduce((a, b) => a + b) /
          window.length;
      avgSpots.add(FlSpot(i.toDouble(), double.parse(avg.toStringAsFixed(1))));
    }

    final weights = history.map((e) => e.weightKg).toList();
    final minY = (weights.reduce((a, b) => a < b ? a : b) - 1).floorToDouble();
    final maxY = (weights.reduce((a, b) => a > b ? a : b) + 1).ceilToDouble();

    return Container(
      padding: const EdgeInsets.all(16),
      decoration: BoxDecoration(
        color: const Color(0xFF111827),
        border: Border.all(color: const Color(0xFF1F2937)),
        borderRadius: BorderRadius.circular(14),
      ),
      child: Column(crossAxisAlignment: CrossAxisAlignment.start, children: [
        const Text('Weight Trend',
            style: TextStyle(
                color: Colors.white, fontWeight: FontWeight.bold, fontSize: 14)),
        const SizedBox(height: 16),
        SizedBox(
          height: 180,
          child: LineChart(
            LineChartData(
              minY: minY,
              maxY: maxY,
              gridData: FlGridData(
                show: true,
                horizontalInterval: 1,
                getDrawingHorizontalLine: (_) =>
                    const FlLine(color: Color(0xFF1F2937), strokeWidth: 1),
                drawVerticalLine: false,
              ),
              borderData: FlBorderData(show: false),
              titlesData: FlTitlesData(
                rightTitles: const AxisTitles(sideTitles: SideTitles(showTitles: false)),
                topTitles: const AxisTitles(sideTitles: SideTitles(showTitles: false)),
                leftTitles: AxisTitles(
                  sideTitles: SideTitles(
                    showTitles: true,
                    reservedSize: 42,
                    getTitlesWidget: (v, _) => Text('${v.toInt()}kg',
                        style: TextStyle(color: Colors.grey[500], fontSize: 10)),
                  ),
                ),
                bottomTitles: AxisTitles(
                  sideTitles: SideTitles(
                    showTitles: true,
                    reservedSize: 20,
                    interval: (history.length / 5).ceilToDouble(),
                    getTitlesWidget: (v, _) {
                      final i = v.toInt();
                      if (i >= history.length) return const SizedBox.shrink();
                      final d = DateTime.tryParse(history[i].entryDate);
                      if (d == null) return const SizedBox.shrink();
                      return Text(DateFormat('M/d').format(d),
                          style: TextStyle(color: Colors.grey[500], fontSize: 10));
                    },
                  ),
                ),
              ),
              lineBarsData: [
                // Weight line
                LineChartBarData(
                  spots: spots,
                  isCurved: true,
                  color: const Color(0xFF6366F1),
                  barWidth: 2,
                  dotData: const FlDotData(show: false),
                  belowBarData: BarAreaData(
                    show: true,
                    gradient: LinearGradient(
                      begin: Alignment.topCenter,
                      end: Alignment.bottomCenter,
                      colors: [
                        const Color(0xFF6366F1).withOpacity(0.3),
                        const Color(0xFF6366F1).withOpacity(0),
                      ],
                    ),
                  ),
                ),
                // 7-day avg
                LineChartBarData(
                  spots: avgSpots,
                  isCurved: true,
                  color: const Color(0xFFF59E0B),
                  barWidth: 1.5,
                  dashArray: [4, 3],
                  dotData: const FlDotData(show: false),
                  belowBarData: BarAreaData(show: false),
                ),
              ],
              extraLinesData: summary.goalWeightKg > 0
                  ? ExtraLinesData(horizontalLines: [
                      HorizontalLine(
                        y: summary.goalWeightKg,
                        color: const Color(0xFF10B981),
                        strokeWidth: 1.5,
                        dashArray: [4, 3],
                        label: HorizontalLineLabel(
                          show: true,
                          style: const TextStyle(
                              color: Color(0xFF10B981), fontSize: 10),
                          labelResolver: (_) => 'Goal',
                        ),
                      ),
                    ])
                  : null,
            ),
          ),
        ),

        // Legend
        const SizedBox(height: 10),
        Row(children: [
          _LegendDot(color: const Color(0xFF6366F1), label: 'Weight'),
          const SizedBox(width: 12),
          _LegendDot(color: const Color(0xFFF59E0B), label: '7-day avg', dashed: true),
          if (summary.goalWeightKg > 0) ...[
            const SizedBox(width: 12),
            _LegendDot(color: const Color(0xFF10B981), label: 'Goal', dashed: true),
          ],
        ]),
      ]),
    );
  }
}

class _LegendDot extends StatelessWidget {
  final Color color;
  final String label;
  final bool dashed;
  const _LegendDot({required this.color, required this.label, this.dashed = false});

  @override
  Widget build(BuildContext context) => Row(children: [
        Container(
            width: 16, height: 2,
            color: dashed ? null : color,
            decoration: dashed ? BoxDecoration(
              border: Border(bottom: BorderSide(color: color, width: 1.5)),
            ) : null),
        const SizedBox(width: 4),
        Text(label, style: TextStyle(color: Colors.grey[500], fontSize: 11)),
      ]);
}

// ── Goal progress bar ─────────────────────────────────────────────────────

class _GoalProgress extends StatelessWidget {
  final WeightSummary s;
  const _GoalProgress(this.s);

  @override
  Widget build(BuildContext context) {
    final range = s.startingWeightKg - s.goalWeightKg;
    final progress = range <= 0 ? 0.0 : ((s.totalLossKg / range).clamp(0.0, 1.0));

    return Container(
      padding: const EdgeInsets.all(14),
      decoration: BoxDecoration(
        color: const Color(0xFF111827),
        border: Border.all(color: const Color(0xFF1F2937)),
        borderRadius: BorderRadius.circular(14),
      ),
      child: Column(crossAxisAlignment: CrossAxisAlignment.start, children: [
        Row(children: [
          const Icon(Icons.flag, color: Color(0xFF10B981), size: 18),
          const SizedBox(width: 6),
          const Text('Goal Progress',
              style: TextStyle(color: Colors.white, fontWeight: FontWeight.bold, fontSize: 14)),
        ]),
        const SizedBox(height: 10),
        Row(mainAxisAlignment: MainAxisAlignment.spaceBetween, children: [
          Text('Start: ${s.startingWeightKg}kg',
              style: TextStyle(color: Colors.grey[400], fontSize: 12)),
          Text('Goal: ${s.goalWeightKg}kg',
              style: const TextStyle(color: Color(0xFF10B981), fontSize: 12)),
        ]),
        const SizedBox(height: 6),
        ClipRRect(
          borderRadius: BorderRadius.circular(4),
          child: LinearProgressIndicator(
            value: progress,
            backgroundColor: const Color(0xFF1F2937),
            valueColor: const AlwaysStoppedAnimation<Color>(Color(0xFF10B981)),
            minHeight: 10,
          ),
        ),
        const SizedBox(height: 6),
        Row(mainAxisAlignment: MainAxisAlignment.spaceBetween, children: [
          Text(
            '${(s.currentWeightKg - s.goalWeightKg).clamp(0, double.infinity).toStringAsFixed(1)} kg to go',
            style: TextStyle(color: Colors.grey[400], fontSize: 12),
          ),
          if (s.estimatedDaysToGoal != null)
            Text('~${s.estimatedDaysToGoal} days at current rate',
                style: TextStyle(color: Colors.grey[500], fontSize: 11)),
        ]),
      ]),
    );
  }
}

// ── Log Weight Sheet ──────────────────────────────────────────────────────

class _LogSheet extends StatefulWidget {
  const _LogSheet();

  @override
  State<_LogSheet> createState() => _LogSheetState();
}

class _LogSheetState extends State<_LogSheet> {
  final _weightCtrl = TextEditingController();
  final _goalCtrl = TextEditingController();
  final _notesCtrl = TextEditingController();
  DateTime _date = DateTime.now();
  bool _saving = false;

  String _fmt(DateTime d) =>
      '${d.year}-${d.month.toString().padLeft(2, '0')}-${d.day.toString().padLeft(2, '0')}';

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
                    color: Colors.grey[600], borderRadius: BorderRadius.circular(2))),
          ),
          const SizedBox(height: 16),
          const Text('Log Weight',
              style: TextStyle(
                  color: Colors.white, fontWeight: FontWeight.bold, fontSize: 20)),
          const SizedBox(height: 20),

          // Date
          GestureDetector(
            onTap: () async {
              final picked = await showDatePicker(
                context: context,
                initialDate: _date,
                firstDate: DateTime(2020),
                lastDate: DateTime.now(),
                builder: (ctx, child) => Theme(
                  data: Theme.of(ctx).copyWith(
                    colorScheme: const ColorScheme.dark(primary: Color(0xFF6366F1)),
                  ),
                  child: child!,
                ),
              );
              if (picked != null) setState(() => _date = picked);
            },
            child: Container(
              padding: const EdgeInsets.symmetric(horizontal: 14, vertical: 12),
              decoration: BoxDecoration(
                color: const Color(0xFF1F2937),
                borderRadius: BorderRadius.circular(12),
              ),
              child: Row(children: [
                const Icon(Icons.calendar_today, color: Color(0xFF6366F1), size: 16),
                const SizedBox(width: 8),
                Text(DateFormat('EEE, MMM d yyyy').format(_date),
                    style: const TextStyle(color: Colors.white, fontSize: 14)),
              ]),
            ),
          ),
          const SizedBox(height: 14),

          // Weight
          const Text('Weight (kg)',
              style: TextStyle(color: Colors.white, fontWeight: FontWeight.w600, fontSize: 14)),
          const SizedBox(height: 8),
          TextField(
            controller: _weightCtrl,
            keyboardType: const TextInputType.numberWithOptions(decimal: true),
            style: const TextStyle(color: Colors.white, fontSize: 16),
            decoration: InputDecoration(
              hintText: 'e.g. 80.5',
              hintStyle: TextStyle(color: Colors.grey[600]),
              filled: true, fillColor: const Color(0xFF1F2937),
              contentPadding: const EdgeInsets.symmetric(horizontal: 14, vertical: 12),
              border: OutlineInputBorder(
                  borderRadius: BorderRadius.circular(12), borderSide: BorderSide.none),
            ),
          ),
          const SizedBox(height: 14),

          // Goal weight
          const Text('Goal Weight (kg)',
              style: TextStyle(color: Colors.white, fontWeight: FontWeight.w600, fontSize: 14)),
          const SizedBox(height: 8),
          TextField(
            controller: _goalCtrl,
            keyboardType: const TextInputType.numberWithOptions(decimal: true),
            style: const TextStyle(color: Colors.white, fontSize: 14),
            decoration: InputDecoration(
              hintText: 'Optional — leave blank to keep current goal',
              hintStyle: TextStyle(color: Colors.grey[600]),
              filled: true, fillColor: const Color(0xFF1F2937),
              contentPadding: const EdgeInsets.symmetric(horizontal: 14, vertical: 12),
              border: OutlineInputBorder(
                  borderRadius: BorderRadius.circular(12), borderSide: BorderSide.none),
            ),
          ),
          const SizedBox(height: 14),

          // Notes
          const Text('Notes (optional)',
              style: TextStyle(color: Colors.white, fontWeight: FontWeight.w600, fontSize: 14)),
          const SizedBox(height: 8),
          TextField(
            controller: _notesCtrl,
            style: const TextStyle(color: Colors.white, fontSize: 14),
            decoration: InputDecoration(
              hintText: 'Morning, after workout…',
              hintStyle: TextStyle(color: Colors.grey[600]),
              filled: true, fillColor: const Color(0xFF1F2937),
              contentPadding: const EdgeInsets.symmetric(horizontal: 14, vertical: 12),
              border: OutlineInputBorder(
                  borderRadius: BorderRadius.circular(12), borderSide: BorderSide.none),
            ),
          ),
          const SizedBox(height: 24),

          SizedBox(
            width: double.infinity,
            height: 50,
            child: ElevatedButton(
              onPressed: _saving ? null : _save,
              style: ElevatedButton.styleFrom(
                backgroundColor: const Color(0xFF6366F1),
                foregroundColor: Colors.white,
                shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(14)),
              ),
              child: _saving
                  ? const CircularProgressIndicator(color: Colors.white, strokeWidth: 2)
                  : const Text('Save Entry',
                      style: TextStyle(fontWeight: FontWeight.bold, fontSize: 16)),
            ),
          ),
        ]),
      ),
    );
  }

  Future<void> _save() async {
    final w = double.tryParse(_weightCtrl.text);
    if (w == null || w <= 0) {
      ScaffoldMessenger.of(context).showSnackBar(
          const SnackBar(content: Text('Enter a valid weight')));
      return;
    }
    setState(() => _saving = true);
    try {
      await context.read<AppProvider>().logWeight(
            weightKg: w,
            date: _fmt(_date),
            goalWeightKg: double.tryParse(_goalCtrl.text) ?? 0,
            notes: _notesCtrl.text.trim().isEmpty ? null : _notesCtrl.text.trim(),
          );
      if (mounted) Navigator.pop(context);
    } catch (e) {
      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
            SnackBar(content: Text('Error: $e'), backgroundColor: Colors.redAccent));
      }
    } finally {
      if (mounted) setState(() => _saving = false);
    }
  }
}

// ── Main Screen ───────────────────────────────────────────────────────────

class WeightScreen extends StatefulWidget {
  const WeightScreen({super.key});

  @override
  State<WeightScreen> createState() => _WeightScreenState();
}

class _WeightScreenState extends State<WeightScreen> {
  @override
  void initState() {
    super.initState();
    WidgetsBinding.instance.addPostFrameCallback((_) {
      context.read<AppProvider>().loadWeight();
    });
  }

  @override
  Widget build(BuildContext context) {
    return Consumer<AppProvider>(builder: (ctx, prov, _) {
      final s = prov.weightSummary;

      return Scaffold(
        backgroundColor: const Color(0xFF030712),
        appBar: const TTAppBar(title: 'Weight Tracker'),
        floatingActionButton: FloatingActionButton.extended(
          backgroundColor: const Color(0xFF10B981),
          foregroundColor: Colors.white,
          icon: const Icon(Icons.add),
          label: const Text('Log Weight'),
          onPressed: () => showModalBottomSheet(
            context: context,
            isScrollControlled: true,
            backgroundColor: const Color(0xFF111827),
            shape: const RoundedRectangleBorder(
                borderRadius: BorderRadius.vertical(top: Radius.circular(20))),
            builder: (_) => ChangeNotifierProvider.value(
              value: prov,
              child: const _LogSheet(),
            ),
          ),
        ),
        body: prov.weightLoading
            ? const Center(child: CircularProgressIndicator(color: Color(0xFF10B981)))
            : RefreshIndicator(
                color: const Color(0xFF10B981),
                onRefresh: prov.loadWeight,
                child: s.totalEntries == 0
                    ? _emptyState()
                    : ListView(
                        padding: const EdgeInsets.fromLTRB(16, 16, 16, 100),
                        children: [
                          // Summary cards
                          GridView.count(
                            crossAxisCount: 2,
                            shrinkWrap: true,
                            physics: const NeverScrollableScrollPhysics(),
                            crossAxisSpacing: 10,
                            mainAxisSpacing: 10,
                            childAspectRatio: 1.6,
                            children: [
                              _StatCard('Current', '${s.currentWeightKg} kg',
                                  Colors.white, 'Latest entry'),
                              _StatCard('7-day avg', '${s.sevenDayAvgKg.toStringAsFixed(1)} kg',
                                  const Color(0xFFF59E0B), 'Rolling average'),
                              _StatCard(
                                  'Total change',
                                  '${s.totalLossKg >= 0 ? '-' : '+'}${s.totalLossKg.abs().toStringAsFixed(1)} kg',
                                  s.totalLossKg >= 0 ? const Color(0xFF10B981) : const Color(0xFFEF4444),
                                  s.totalLossKg >= 0 ? 'Lost since start' : 'Gained'),
                              _StatCard(
                                  'Weekly rate',
                                  '${s.weeklyRateKg >= 0 ? '-' : '+'}${s.weeklyRateKg.abs().toStringAsFixed(2)} kg/w',
                                  s.weeklyRateKg >= 0 ? const Color(0xFF10B981) : const Color(0xFFEF4444),
                                  'Last 14 days'),
                            ],
                          ),
                          const SizedBox(height: 14),

                          // Goal progress (if set)
                          if (s.goalWeightKg > 0) ...[
                            _GoalProgress(s),
                            const SizedBox(height: 14),
                          ],

                          // Chart
                          _WeightChart(s),
                          const SizedBox(height: 14),

                          // History
                          const Text('History',
                              style: TextStyle(
                                  color: Colors.white,
                                  fontWeight: FontWeight.bold,
                                  fontSize: 16)),
                          const SizedBox(height: 10),
                          ...s.history.take(30).map((e) => _HistoryTile(e, prov)),
                        ],
                      ),
              ),
      );
    });
  }

  Widget _emptyState() => Center(
        child: Padding(
          padding: const EdgeInsets.all(32),
          child: Column(mainAxisAlignment: MainAxisAlignment.center, children: [
            const Text('⚖️', style: TextStyle(fontSize: 64)),
            const SizedBox(height: 16),
            const Text('Start Tracking',
                style: TextStyle(color: Colors.white, fontWeight: FontWeight.bold, fontSize: 22)),
            const SizedBox(height: 8),
            Text('Log your first weight to see trends and progress.',
                textAlign: TextAlign.center,
                style: TextStyle(color: Colors.grey[400], fontSize: 14)),
          ]),
        ),
      );
}

class _StatCard extends StatelessWidget {
  final String label;
  final String value;
  final Color color;
  final String sub;
  const _StatCard(this.label, this.value, this.color, this.sub);

  @override
  Widget build(BuildContext context) => Container(
        padding: const EdgeInsets.all(12),
        decoration: BoxDecoration(
          color: const Color(0xFF111827),
          border: Border.all(color: const Color(0xFF1F2937)),
          borderRadius: BorderRadius.circular(12),
        ),
        child: Column(crossAxisAlignment: CrossAxisAlignment.start, children: [
          Text(label, style: TextStyle(color: Colors.grey[500], fontSize: 11)),
          const Spacer(),
          Text(value,
              style: TextStyle(
                  color: color, fontWeight: FontWeight.bold, fontSize: 18)),
          Text(sub, style: TextStyle(color: Colors.grey[600], fontSize: 10)),
        ]),
      );
}

class _HistoryTile extends StatelessWidget {
  final WeightEntry entry;
  final AppProvider prov;
  const _HistoryTile(this.entry, this.prov);

  @override
  Widget build(BuildContext context) {
    final d = DateTime.tryParse(entry.entryDate);
    final label = d != null ? DateFormat('EEE, MMM d yyyy').format(d) : entry.entryDate;

    return Dismissible(
      key: Key('weight-${entry.id}'),
      direction: DismissDirection.endToStart,
      background: Container(
        alignment: Alignment.centerRight,
        padding: const EdgeInsets.only(right: 16),
        color: Colors.redAccent.withOpacity(0.7),
        child: const Icon(Icons.delete, color: Colors.white),
      ),
      confirmDismiss: (_) async {
        return await showDialog<bool>(
          context: context,
          builder: (ctx) => AlertDialog(
            backgroundColor: const Color(0xFF111827),
            title: const Text('Delete entry?',
                style: TextStyle(color: Colors.white)),
            actions: [
              TextButton(
                  onPressed: () => Navigator.pop(ctx, false),
                  child: const Text('Cancel')),
              TextButton(
                  onPressed: () => Navigator.pop(ctx, true),
                  child: const Text('Delete',
                      style: TextStyle(color: Colors.redAccent))),
            ],
          ),
        );
      },
      onDismissed: (_) => prov.deleteWeightEntry(entry.id),
      child: Container(
        margin: const EdgeInsets.only(bottom: 8),
        padding: const EdgeInsets.symmetric(horizontal: 14, vertical: 12),
        decoration: BoxDecoration(
          color: const Color(0xFF111827),
          border: Border.all(color: const Color(0xFF1F2937)),
          borderRadius: BorderRadius.circular(12),
        ),
        child: Row(children: [
          Expanded(
            child: Column(crossAxisAlignment: CrossAxisAlignment.start, children: [
              Text(label,
                  style: const TextStyle(
                      color: Colors.white, fontSize: 13, fontWeight: FontWeight.w500)),
              if (entry.notes != null && entry.notes!.isNotEmpty)
                Text(entry.notes!,
                    style: TextStyle(color: Colors.grey[500], fontSize: 11)),
            ]),
          ),
          Text('${entry.weightKg} kg',
              style: const TextStyle(
                  color: Colors.white, fontWeight: FontWeight.bold, fontSize: 16)),
        ]),
      ),
    );
  }
}
