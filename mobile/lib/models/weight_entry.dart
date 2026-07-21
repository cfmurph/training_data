class WeightEntry {
  final int id;
  final String athleteId;
  final String entryDate;
  final double weightKg;
  final double goalWeightKg;
  final String? notes;
  final String createdAt;

  WeightEntry({
    required this.id,
    required this.athleteId,
    required this.entryDate,
    required this.weightKg,
    required this.goalWeightKg,
    this.notes,
    required this.createdAt,
  });

  factory WeightEntry.fromJson(Map<String, dynamic> j) => WeightEntry(
        id: j['id'],
        athleteId: j['athleteId'] ?? '',
        entryDate: j['entryDate'] ?? '',
        weightKg: (j['weightKg'] ?? 0).toDouble(),
        goalWeightKg: (j['goalWeightKg'] ?? 0).toDouble(),
        notes: j['notes'],
        createdAt: j['createdAt'] ?? '',
      );
}

class WeightSummary {
  final double currentWeightKg;
  final double startingWeightKg;
  final double totalLossKg;
  final double goalWeightKg;
  final double sevenDayAvgKg;
  final double weeklyRateKg;
  final int? estimatedDaysToGoal;
  final int totalEntries;
  final List<WeightEntry> history;

  WeightSummary({
    required this.currentWeightKg,
    required this.startingWeightKg,
    required this.totalLossKg,
    required this.goalWeightKg,
    required this.sevenDayAvgKg,
    required this.weeklyRateKg,
    this.estimatedDaysToGoal,
    required this.totalEntries,
    required this.history,
  });

  factory WeightSummary.fromJson(Map<String, dynamic> j) => WeightSummary(
        currentWeightKg: (j['currentWeightKg'] ?? 0).toDouble(),
        startingWeightKg: (j['startingWeightKg'] ?? 0).toDouble(),
        totalLossKg: (j['totalLossKg'] ?? 0).toDouble(),
        goalWeightKg: (j['goalWeightKg'] ?? 0).toDouble(),
        sevenDayAvgKg: (j['sevenDayAvgKg'] ?? 0).toDouble(),
        weeklyRateKg: (j['weeklyRateKg'] ?? 0).toDouble(),
        estimatedDaysToGoal: j['estimatedDaysToGoal'],
        totalEntries: j['totalEntries'] ?? 0,
        history: (j['history'] as List<dynamic>? ?? [])
            .map((e) => WeightEntry.fromJson(e as Map<String, dynamic>))
            .toList(),
      );

  factory WeightSummary.empty() => WeightSummary(
        currentWeightKg: 0,
        startingWeightKg: 0,
        totalLossKg: 0,
        goalWeightKg: 0,
        sevenDayAvgKg: 0,
        weeklyRateKg: 0,
        totalEntries: 0,
        history: [],
      );
}
