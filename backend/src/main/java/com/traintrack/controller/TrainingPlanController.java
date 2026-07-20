package com.traintrack.controller;

import com.traintrack.model.AuthStatus;
import com.traintrack.model.PlannedWorkout;
import com.traintrack.model.TrainingPlan;
import com.traintrack.model.TrainingPlan.FitnessLevel;
import com.traintrack.service.CyclingPlanService;
import com.traintrack.service.PerformanceAssessmentService;
import com.traintrack.service.PerformanceAssessmentService.PlanCompliance;
import com.traintrack.service.StravaService;
import com.traintrack.service.GarminService;
import com.traintrack.model.StravaTokens;
import com.traintrack.model.GarminTokens;
import com.traintrack.model.Activity;
import jakarta.servlet.http.HttpSession;
import org.springframework.format.annotation.DateTimeFormat;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.time.LocalDate;
import java.util.*;

@RestController
@RequestMapping("/api/plan")
public class TrainingPlanController {

    private static final String SESSION_STRAVA_TOKENS  = "stravaTokens";
    private static final String SESSION_GARMIN_TOKENS  = "garminTokens";
    private static final String SESSION_ATHLETE        = "athlete";

    private final CyclingPlanService planService;
    private final PerformanceAssessmentService assessmentService;
    private final StravaService stravaService;
    private final GarminService garminService;

    public TrainingPlanController(CyclingPlanService planService,
                                   PerformanceAssessmentService assessmentService,
                                   StravaService stravaService,
                                   GarminService garminService) {
        this.planService       = planService;
        this.assessmentService = assessmentService;
        this.stravaService     = stravaService;
        this.garminService     = garminService;
    }

    // ── Auth helper ────────────────────────────────────────────────────

    private String requireAthleteId(HttpSession session) {
        AuthStatus.AthleteInfo athlete = (AuthStatus.AthleteInfo) session.getAttribute(SESSION_ATHLETE);
        if (athlete == null) throw new IllegalStateException("Not authenticated");
        return athlete.getId();
    }

    private String athleteName(HttpSession session) {
        AuthStatus.AthleteInfo athlete = (AuthStatus.AthleteInfo) session.getAttribute(SESSION_ATHLETE);
        return athlete != null ? athlete.getName() : "Athlete";
    }

    // ── Plan CRUD ──────────────────────────────────────────────────────

    /** GET /api/plan/active — returns the current active plan (or 404). */
    @GetMapping("/active")
    public ResponseEntity<?> getActivePlan(HttpSession session) {
        try {
            String athleteId = requireAthleteId(session);
            return planService.getActivePlan(athleteId)
                .map(ResponseEntity::ok)
                .orElse(ResponseEntity.notFound().build());
        } catch (IllegalStateException e) {
            return ResponseEntity.status(401).body(Map.of("error", "Not authenticated"));
        }
    }

    /** GET /api/plan/all — all plans for this athlete. */
    @GetMapping("/all")
    public ResponseEntity<?> getAllPlans(HttpSession session) {
        try {
            String athleteId = requireAthleteId(session);
            return ResponseEntity.ok(planService.getAllPlans(athleteId));
        } catch (IllegalStateException e) {
            return ResponseEntity.status(401).body(Map.of("error", "Not authenticated"));
        }
    }

    /**
     * POST /api/plan/create — generate a new cycling training plan.
     *
     * Body (JSON):
     * {
     *   "fitnessLevel": "BEGINNER"|"INTERMEDIATE"|"ADVANCED",
     *   "weeklyHours": 10,
     *   "startDate": "2024-01-15",        // optional, defaults to next Monday
     *   "goalEvent": "Gran Fondo 2024",   // optional
     *   "goalWeightKg": 75.0              // optional, 0 = no goal
     * }
     */
    @PostMapping("/create")
    public ResponseEntity<?> createPlan(@RequestBody Map<String, Object> body,
                                         HttpSession session) {
        try {
            String athleteId = requireAthleteId(session);
            String athleteName = athleteName(session);

            FitnessLevel level = FitnessLevel.valueOf(
                ((String) body.getOrDefault("fitnessLevel", "INTERMEDIATE")).toUpperCase());
            int weeklyHours = ((Number) body.getOrDefault("weeklyHours", 10)).intValue();
            weeklyHours = Math.max(5, Math.min(20, weeklyHours));

            LocalDate startDate = body.containsKey("startDate")
                ? LocalDate.parse((String) body.get("startDate"))
                : nextMonday();

            String goalEvent = (String) body.getOrDefault("goalEvent", null);
            double goalWeightKg = ((Number) body.getOrDefault("goalWeightKg", 0)).doubleValue();

            TrainingPlan plan = planService.createPlan(athleteId, athleteName,
                level, weeklyHours, startDate, goalEvent, goalWeightKg);
            return ResponseEntity.ok(plan);
        } catch (IllegalStateException e) {
            return ResponseEntity.status(401).body(Map.of("error", "Not authenticated"));
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(Map.of("error", e.getMessage()));
        }
    }

    /** DELETE /api/plan/{planId} — deactivate a plan. */
    @DeleteMapping("/{planId}")
    public ResponseEntity<?> deactivatePlan(@PathVariable Long planId, HttpSession session) {
        try {
            requireAthleteId(session);
            planService.deactivatePlan(planId);
            return ResponseEntity.ok(Map.of("success", true));
        } catch (IllegalStateException e) {
            return ResponseEntity.status(401).body(Map.of("error", "Not authenticated"));
        }
    }

    // ── Workouts ───────────────────────────────────────────────────────

    /** GET /api/plan/{planId}/workouts?from=&to= */
    @GetMapping("/{planId}/workouts")
    public ResponseEntity<?> getWorkouts(
            @PathVariable Long planId,
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate from,
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate to,
            HttpSession session) {
        try {
            requireAthleteId(session);
            if (from == null) from = LocalDate.now().withDayOfMonth(1);
            if (to == null)   to   = from.plusMonths(1).minusDays(1);
            List<PlannedWorkout> workouts = planService.getWorkoutsInRange(planId, from, to);
            return ResponseEntity.ok(workouts);
        } catch (IllegalStateException e) {
            return ResponseEntity.status(401).body(Map.of("error", "Not authenticated"));
        }
    }

    /** GET /api/plan/{planId}/week/{week} — workouts for a plan week. */
    @GetMapping("/{planId}/week/{week}")
    public ResponseEntity<?> getWeekWorkouts(@PathVariable Long planId,
                                              @PathVariable int week,
                                              HttpSession session) {
        try {
            requireAthleteId(session);
            return ResponseEntity.ok(planService.getWorkoutsForWeek(planId, week));
        } catch (IllegalStateException e) {
            return ResponseEntity.status(401).body(Map.of("error", "Not authenticated"));
        }
    }

    /** POST /api/plan/workout/{workoutId}/complete — mark workout as done. */
    @PostMapping("/workout/{workoutId}/complete")
    public ResponseEntity<?> completeWorkout(@PathVariable Long workoutId,
                                              @RequestBody(required = false) Map<String, Object> body,
                                              HttpSession session) {
        try {
            requireAthleteId(session);
            String linkedId = body != null ? (String) body.getOrDefault("linkedActivityId", null) : null;
            PlannedWorkout updated = planService.markCompleted(workoutId, linkedId);
            return ResponseEntity.ok(updated);
        } catch (IllegalStateException e) {
            return ResponseEntity.status(401).body(Map.of("error", "Not authenticated"));
        } catch (NoSuchElementException e) {
            return ResponseEntity.notFound().build();
        }
    }

    // ── Performance assessment ─────────────────────────────────────────

    /** GET /api/plan/{planId}/assessment — compliance for the full plan so far. */
    @GetMapping("/{planId}/assessment")
    public ResponseEntity<?> getPlanAssessment(@PathVariable Long planId,
                                                HttpSession session) {
        try {
            String athleteId = requireAthleteId(session);
            Optional<TrainingPlan> planOpt = planService.getAllPlans(athleteId).stream()
                .filter(p -> p.getId().equals(planId))
                .findFirst();
            if (planOpt.isEmpty()) return ResponseEntity.notFound().build();

            List<Activity> activities = fetchActivities(session);
            PlanCompliance compliance = assessmentService.computeCompliance(planOpt.get(), activities);
            return ResponseEntity.ok(compliance);
        } catch (IllegalStateException e) {
            return ResponseEntity.status(401).body(Map.of("error", "Not authenticated"));
        }
    }

    /** GET /api/plan/{planId}/assessment/week — current week assessment. */
    @GetMapping("/{planId}/assessment/week")
    public ResponseEntity<?> getWeekAssessment(@PathVariable Long planId,
                                                HttpSession session) {
        try {
            String athleteId = requireAthleteId(session);
            Optional<TrainingPlan> planOpt = planService.getAllPlans(athleteId).stream()
                .filter(p -> p.getId().equals(planId))
                .findFirst();
            if (planOpt.isEmpty()) return ResponseEntity.notFound().build();

            List<Activity> activities = fetchActivities(session);
            List<PerformanceAssessmentService.DailyAssessment> week =
                assessmentService.assessCurrentWeek(planOpt.get(), activities);
            return ResponseEntity.ok(week);
        } catch (IllegalStateException e) {
            return ResponseEntity.status(401).body(Map.of("error", "Not authenticated"));
        }
    }

    // ── Private helpers ────────────────────────────────────────────────

    private List<Activity> fetchActivities(HttpSession session) {
        StravaTokens strava = (StravaTokens) session.getAttribute(SESSION_STRAVA_TOKENS);
        if (strava != null) {
            try {
                return stravaService.fetchActivities(strava, 1, 50);
            } catch (Exception e) {
                return Collections.emptyList();
            }
        }
        GarminTokens garmin = (GarminTokens) session.getAttribute(SESSION_GARMIN_TOKENS);
        if (garmin != null) {
            try {
                return garminService.fetchActivities(garmin);
            } catch (Exception e) {
                return Collections.emptyList();
            }
        }
        return Collections.emptyList();
    }

    private static LocalDate nextMonday() {
        LocalDate today = LocalDate.now();
        int daysUntilMonday = (8 - today.getDayOfWeek().getValue()) % 7;
        return daysUntilMonday == 0 ? today : today.plusDays(daysUntilMonday);
    }
}
