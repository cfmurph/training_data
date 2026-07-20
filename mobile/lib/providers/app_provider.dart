import 'package:flutter/foundation.dart';

import '../models/auth_status.dart';
import '../models/performance.dart';
import '../models/training_plan.dart';
import '../models/weight_entry.dart';
import '../services/api_service.dart';

class AppProvider extends ChangeNotifier {
  final ApiService _api = ApiService();

  // ── Auth ──────────────────────────────────────────────────────────────
  AuthStatus _auth = AuthStatus.disconnected();
  AuthStatus get auth => _auth;

  bool _authLoading = true;
  bool get authLoading => _authLoading;

  Future<void> checkAuth() async {
    _authLoading = true;
    notifyListeners();
    _auth = await _api.getAuthStatus();
    _authLoading = false;
    notifyListeners();
  }

  Future<void> logout() async {
    await _api.logout();
    _auth = AuthStatus.disconnected();
    _plan = null;
    _compliance = null;
    _weekAssessments = [];
    _weightSummary = WeightSummary.empty();
    notifyListeners();
  }

  // ── Training Plan ─────────────────────────────────────────────────────
  TrainingPlan? _plan;
  TrainingPlan? get plan => _plan;

  bool _planLoading = false;
  bool get planLoading => _planLoading;

  Map<String, PlannedWorkout> _workoutsByDate = {};
  Map<String, PlannedWorkout> get workoutsByDate => _workoutsByDate;

  Future<void> loadPlan() async {
    _planLoading = true;
    notifyListeners();
    try {
      _plan = await _api.getActivePlan();
      if (_plan != null) await loadWorkoutsForMonth(DateTime.now());
    } catch (_) {}
    _planLoading = false;
    notifyListeners();
  }

  Future<TrainingPlan> createPlan({
    required String fitnessLevel,
    required int weeklyHours,
    String? goalEvent,
    double goalWeightKg = 0,
  }) async {
    final p = await _api.createPlan(
      fitnessLevel: fitnessLevel,
      weeklyHours: weeklyHours,
      goalEvent: goalEvent,
      goalWeightKg: goalWeightKg,
    );
    _plan = p;
    await loadWorkoutsForMonth(DateTime.now());
    notifyListeners();
    return p;
  }

  Future<void> deactivatePlan() async {
    if (_plan == null) return;
    await _api.deactivatePlan(_plan!.id);
    _plan = null;
    _workoutsByDate = {};
    notifyListeners();
  }

  Future<void> loadWorkoutsForMonth(DateTime month) async {
    if (_plan == null) return;
    final first = DateTime(month.year, month.month, 1);
    final last = DateTime(month.year, month.month + 1, 0);
    final from = _fmtDate(first);
    final to = _fmtDate(last);
    try {
      final workouts = await _api.getPlanWorkouts(_plan!.id, from, to);
      for (final w in workouts) {
        _workoutsByDate[w.workoutDate] = w;
      }
      notifyListeners();
    } catch (_) {}
  }

  // ── Performance ───────────────────────────────────────────────────────
  PlanCompliance? _compliance;
  PlanCompliance? get compliance => _compliance;

  List<DailyAssessment> _weekAssessments = [];
  List<DailyAssessment> get weekAssessments => _weekAssessments;

  bool _perfLoading = false;
  bool get perfLoading => _perfLoading;

  Future<void> loadPerformance() async {
    if (_plan == null) return;
    _perfLoading = true;
    notifyListeners();
    try {
      _compliance = await _api.getPlanCompliance(_plan!.id);
      _weekAssessments = await _api.getWeekAssessment(_plan!.id);
    } catch (_) {}
    _perfLoading = false;
    notifyListeners();
  }

  // ── Weight ────────────────────────────────────────────────────────────
  WeightSummary _weightSummary = WeightSummary.empty();
  WeightSummary get weightSummary => _weightSummary;

  bool _weightLoading = false;
  bool get weightLoading => _weightLoading;

  Future<void> loadWeight() async {
    _weightLoading = true;
    notifyListeners();
    try {
      _weightSummary = await _api.getWeightSummary();
    } catch (_) {}
    _weightLoading = false;
    notifyListeners();
  }

  Future<void> logWeight({
    required double weightKg,
    required String date,
    double goalWeightKg = 0,
    String? notes,
  }) async {
    await _api.logWeight(
        weightKg: weightKg, date: date, goalWeightKg: goalWeightKg, notes: notes);
    await loadWeight();
  }

  Future<void> deleteWeightEntry(int id) async {
    await _api.deleteWeightEntry(id);
    await loadWeight();
  }

  // ── Stats ─────────────────────────────────────────────────────────────
  Map<String, dynamic>? _stats;
  Map<String, dynamic>? get stats => _stats;

  Future<void> loadStats() async {
    try {
      _stats = await _api.getStatsSummary();
      notifyListeners();
    } catch (_) {}
  }

  // ── Util ──────────────────────────────────────────────────────────────
  static String _fmtDate(DateTime d) =>
      '${d.year}-${d.month.toString().padLeft(2, '0')}-${d.day.toString().padLeft(2, '0')}';
}
