class TrainingPlan {
  final int id;
  final String athleteId;
  final String athleteName;
  final String startDate;
  final String endDate;
  final String? goalEvent;
  final int weeklyHoursTarget;
  final String fitnessLevel;
  final String currentPhase;
  final bool active;
  final double weightGoalKg;

  TrainingPlan({
    required this.id,
    required this.athleteId,
    required this.athleteName,
    required this.startDate,
    required this.endDate,
    this.goalEvent,
    required this.weeklyHoursTarget,
    required this.fitnessLevel,
    required this.currentPhase,
    required this.active,
    required this.weightGoalKg,
  });

  factory TrainingPlan.fromJson(Map<String, dynamic> j) => TrainingPlan(
        id: j['id'],
        athleteId: j['athleteId'] ?? '',
        athleteName: j['athleteName'] ?? '',
        startDate: j['startDate'] ?? '',
        endDate: j['endDate'] ?? '',
        goalEvent: j['goalEvent'],
        weeklyHoursTarget: j['weeklyHoursTarget'] ?? 10,
        fitnessLevel: j['fitnessLevel'] ?? 'INTERMEDIATE',
        currentPhase: j['currentPhase'] ?? 'BASE',
        active: j['active'] ?? true,
        weightGoalKg: (j['weightGoalKg'] ?? 0).toDouble(),
      );
}

class PlannedWorkout {
  final int id;
  final int planId;
  final String workoutDate;
  final String workoutType;
  final int targetDurationMinutes;
  final double targetDistanceKm;
  final int intensityZone;
  final String description;
  final String? warmup;
  final String? mainSet;
  final String? cooldown;
  final bool completed;
  final String? linkedActivityId;
  final int planWeek;
  final int planDay;

  PlannedWorkout({
    required this.id,
    required this.planId,
    required this.workoutDate,
    required this.workoutType,
    required this.targetDurationMinutes,
    required this.targetDistanceKm,
    required this.intensityZone,
    required this.description,
    this.warmup,
    this.mainSet,
    this.cooldown,
    required this.completed,
    this.linkedActivityId,
    required this.planWeek,
    required this.planDay,
  });

  factory PlannedWorkout.fromJson(Map<String, dynamic> j) => PlannedWorkout(
        id: j['id'],
        planId: j['planId'] ?? 0,
        workoutDate: j['workoutDate'] ?? '',
        workoutType: j['workoutType'] ?? 'REST',
        targetDurationMinutes: j['targetDurationMinutes'] ?? 0,
        targetDistanceKm: (j['targetDistanceKm'] ?? 0).toDouble(),
        intensityZone: j['intensityZone'] ?? 0,
        description: j['description'] ?? '',
        warmup: j['warmup'],
        mainSet: j['mainSet'],
        cooldown: j['cooldown'],
        completed: j['completed'] ?? false,
        linkedActivityId: j['linkedActivityId'],
        planWeek: j['planWeek'] ?? 1,
        planDay: j['planDay'] ?? 1,
      );
}
