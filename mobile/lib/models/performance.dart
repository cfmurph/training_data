import 'training_plan.dart';

class DailyAssessment {
  final String date;
  final PlannedWorkout planned;
  final Map<String, dynamic>? actual;
  final int complianceScore;
  final String feedback;
  final String status; // COMPLETED | PARTIAL | MISSED | LOW

  DailyAssessment({
    required this.date,
    required this.planned,
    this.actual,
    required this.complianceScore,
    required this.feedback,
    required this.status,
  });

  factory DailyAssessment.fromJson(Map<String, dynamic> j) => DailyAssessment(
        date: j['date'] ?? '',
        planned: PlannedWorkout.fromJson(j['planned'] as Map<String, dynamic>),
        actual: j['actual'] as Map<String, dynamic>?,
        complianceScore: j['complianceScore'] ?? 0,
        feedback: j['feedback'] ?? '',
        status: j['status'] ?? 'MISSED',
      );
}

class PlanCompliance {
  final int totalWorkouts;
  final int completedWorkouts;
  final double complianceRate;
  final List<DailyAssessment> assessments;

  PlanCompliance({
    required this.totalWorkouts,
    required this.completedWorkouts,
    required this.complianceRate,
    required this.assessments,
  });

  factory PlanCompliance.fromJson(Map<String, dynamic> j) => PlanCompliance(
        totalWorkouts: j['totalWorkouts'] ?? 0,
        completedWorkouts: j['completedWorkouts'] ?? 0,
        complianceRate: (j['complianceRate'] ?? 0).toDouble(),
        assessments: (j['assessments'] as List<dynamic>? ?? [])
            .map((e) => DailyAssessment.fromJson(e as Map<String, dynamic>))
            .toList(),
      );
}
