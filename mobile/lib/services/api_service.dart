import 'package:cookie_jar/cookie_jar.dart';
import 'package:dio/dio.dart';
import 'package:dio_cookie_manager/dio_cookie_manager.dart';
import 'package:shared_preferences/shared_preferences.dart';

import '../config.dart';
import '../models/auth_status.dart';
import '../models/performance.dart';
import '../models/training_plan.dart';
import '../models/weight_entry.dart';

/// Singleton HTTP client that persists session cookies set by the Spring Boot
/// backend after Strava / Garmin / Training Peaks OAuth.
class ApiService {
  static final ApiService _instance = ApiService._internal();
  factory ApiService() => _instance;

  late Dio _dio;
  final CookieJar _cookieJar = CookieJar();

  ApiService._internal() {
    _dio = Dio(BaseOptions(
      connectTimeout: const Duration(seconds: 10),
      receiveTimeout: const Duration(seconds: 20),
      headers: {'Accept': 'application/json'},
    ));
    _dio.interceptors.add(CookieManager(_cookieJar));

    // CSRF header interceptor — reads XSRF-TOKEN cookie and echoes it
    _dio.interceptors.add(InterceptorsWrapper(
      onRequest: (options, handler) async {
        final cookies =
            await _cookieJar.loadForRequest(Uri.parse(AppConfig.baseUrl));
        final xsrf = cookies
            .where((c) => c.name == 'XSRF-TOKEN')
            .map((c) => c.value)
            .firstOrNull;
        if (xsrf != null) {
          options.headers['X-XSRF-TOKEN'] = xsrf;
        }
        handler.next(options);
      },
    ));
  }

  String get base => AppConfig.baseUrl;

  // ── Auth ────────────────────────────────────────────────────────────

  Future<AuthStatus> getAuthStatus() async {
    try {
      final r = await _dio.get('$base/api/auth/status');
      return AuthStatus.fromJson(r.data as Map<String, dynamic>);
    } catch (_) {
      return AuthStatus.disconnected();
    }
  }

  Future<void> logout() async {
    await _dio.post('$base/api/auth/logout');
    await _cookieJar.deleteAll();
  }

  /// After the WebView completes OAuth, call this to inject the cookies it set
  /// into the Dio cookie jar so all subsequent requests are authenticated.
  Future<void> syncCookiesFromWebView(List<String> setCookieHeaders) async {
    final uri = Uri.parse(base);
    final cookies = setCookieHeaders
        .map((h) => Cookie.fromSetCookieValue(h))
        .toList();
    await _cookieJar.saveFromResponse(uri, cookies);
  }

  /// Clears all stored cookies (used on logout).
  Future<void> clearCookies() => _cookieJar.deleteAll();

  // ── Training Plan ───────────────────────────────────────────────────

  Future<TrainingPlan?> getActivePlan() async {
    try {
      final r = await _dio.get('$base/api/plan/active');
      if (r.statusCode == 404) return null;
      return TrainingPlan.fromJson(r.data as Map<String, dynamic>);
    } on DioException catch (e) {
      if (e.response?.statusCode == 404) return null;
      rethrow;
    }
  }

  Future<TrainingPlan> createPlan({
    required String fitnessLevel,
    required int weeklyHours,
    String? goalEvent,
    double goalWeightKg = 0,
  }) async {
    final r = await _dio.post('$base/api/plan/create', data: {
      'fitnessLevel': fitnessLevel,
      'weeklyHours': weeklyHours,
      if (goalEvent != null && goalEvent.isNotEmpty) 'goalEvent': goalEvent,
      'goalWeightKg': goalWeightKg,
    });
    return TrainingPlan.fromJson(r.data as Map<String, dynamic>);
  }

  Future<void> deactivatePlan(int planId) =>
      _dio.delete('$base/api/plan/$planId');

  Future<List<PlannedWorkout>> getPlanWorkouts(
      int planId, String from, String to) async {
    final r = await _dio.get('$base/api/plan/$planId/workouts',
        queryParameters: {'from': from, 'to': to});
    return (r.data as List<dynamic>)
        .map((e) => PlannedWorkout.fromJson(e as Map<String, dynamic>))
        .toList();
  }

  // ── Performance Assessment ──────────────────────────────────────────

  Future<PlanCompliance> getPlanCompliance(int planId) async {
    final r = await _dio.get('$base/api/plan/$planId/assessment');
    return PlanCompliance.fromJson(r.data as Map<String, dynamic>);
  }

  Future<List<DailyAssessment>> getWeekAssessment(int planId) async {
    final r = await _dio.get('$base/api/plan/$planId/assessment/week');
    return (r.data as List<dynamic>)
        .map((e) => DailyAssessment.fromJson(e as Map<String, dynamic>))
        .toList();
  }

  // ── Weight ──────────────────────────────────────────────────────────

  Future<WeightSummary> getWeightSummary() async {
    try {
      final r = await _dio.get('$base/api/weight/summary');
      return WeightSummary.fromJson(r.data as Map<String, dynamic>);
    } catch (_) {
      return WeightSummary.empty();
    }
  }

  Future<WeightEntry> logWeight({
    required double weightKg,
    required String date,
    double goalWeightKg = 0,
    String? notes,
  }) async {
    final r = await _dio.post('$base/api/weight/log', data: {
      'weightKg': weightKg,
      'date': date,
      if (goalWeightKg > 0) 'goalWeightKg': goalWeightKg,
      if (notes != null && notes.isNotEmpty) 'notes': notes,
    });
    return WeightEntry.fromJson(r.data as Map<String, dynamic>);
  }

  Future<void> deleteWeightEntry(int id) =>
      _dio.delete('$base/api/weight/$id');

  // ── Activities (for stats) ──────────────────────────────────────────

  Future<Map<String, dynamic>> getStatsSummary() async {
    final r = await _dio.get('$base/api/stats/summary');
    return r.data as Map<String, dynamic>;
  }

  // ── Settings persistence ────────────────────────────────────────────

  static Future<void> loadSavedUrl() async {
    final prefs = await SharedPreferences.getInstance();
    final saved = prefs.getString('backend_url') ?? '';
    AppConfig.setBaseUrl(saved);
  }

  static Future<void> saveUrl(String url) async {
    final prefs = await SharedPreferences.getInstance();
    await prefs.setString('backend_url', url);
    AppConfig.setBaseUrl(url);
  }
}
