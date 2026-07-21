package com.traintrack.service;

import com.traintrack.model.Activity;
import com.traintrack.model.PlannedWorkout;
import com.traintrack.model.TrainingPlan;
import com.traintrack.repository.PlannedWorkoutRepository;
import org.springframework.stereotype.Service;

import java.time.LocalDate;
import java.time.format.DateTimeFormatter;
import java.util.*;
import java.util.stream.Collectors;

/**
 * Compares planned workouts against actual Garmin / Strava activities
 * and produces a DailyAssessment for each day.
 */
@Service
public class PerformanceAssessmentService {

    private final PlannedWorkoutRepository workoutRepo;

    public PerformanceAssessmentService(PlannedWorkoutRepository workoutRepo) {
        this.workoutRepo = workoutRepo;
    }

    // ── Public API ─────────────────────────────────────────────────────

    /**
     * Generates assessments for the current week (Mon–today).
     */
    public List<DailyAssessment> assessCurrentWeek(TrainingPlan plan,
                                                    List<Activity> recentActivities) {
        LocalDate today = LocalDate.now();
        LocalDate monday = today.with(java.time.DayOfWeek.MONDAY);
        return assessDateRange(plan, recentActivities, monday, today);
    }

    /**
     * Generates assessments for an arbitrary date range.
     */
    public List<DailyAssessment> assessDateRange(TrainingPlan plan,
                                                  List<Activity> activities,
                                                  LocalDate from, LocalDate to) {
        List<PlannedWorkout> workouts = workoutRepo
            .findByPlanIdAndWorkoutDateBetweenOrderByWorkoutDate(plan.getId(), from, to);

        // Index activities by date
        Map<LocalDate, List<Activity>> actsByDate = activities.stream()
            .collect(Collectors.groupingBy(a -> parseDate(a.getStartDate())));

        List<DailyAssessment> results = new ArrayList<>();
        for (PlannedWorkout w : workouts) {
            List<Activity> dayActs = actsByDate.getOrDefault(w.getWorkoutDate(), List.of());
            Activity best = bestMatchingActivity(w, dayActs);
            results.add(buildAssessment(w, best));
        }
        return results;
    }

    /**
     * Overall plan compliance: percentage of non-REST workouts marked completed
     * or covered by an activity, up to today.
     */
    public PlanCompliance computeCompliance(TrainingPlan plan, List<Activity> activities) {
        LocalDate today = LocalDate.now();
        LocalDate start = plan.getStartDate();
        LocalDate cutoff = today.isBefore(plan.getEndDate()) ? today : plan.getEndDate();

        if (start.isAfter(cutoff)) {
            return new PlanCompliance(0, 0, 0.0, List.of());
        }

        List<PlannedWorkout> workouts = workoutRepo
            .findByPlanIdAndWorkoutDateBetweenOrderByWorkoutDate(plan.getId(), start, cutoff);

        Map<LocalDate, List<Activity>> actsByDate = activities.stream()
            .collect(Collectors.groupingBy(a -> parseDate(a.getStartDate())));

        int totalNonRest = 0;
        int completed = 0;
        List<DailyAssessment> assessments = new ArrayList<>();

        for (PlannedWorkout w : workouts) {
            if (w.getWorkoutType() == PlannedWorkout.WorkoutType.REST) continue;
            totalNonRest++;
            List<Activity> dayActs = actsByDate.getOrDefault(w.getWorkoutDate(), List.of());
            Activity best = bestMatchingActivity(w, dayActs);
            DailyAssessment da = buildAssessment(w, best);
            assessments.add(da);
            if (da.complianceScore() >= 60) completed++;
        }

        double rate = totalNonRest == 0 ? 0.0 : (completed * 100.0 / totalNonRest);
        return new PlanCompliance(totalNonRest, completed, Math.round(rate * 10) / 10.0, assessments);
    }

    // ── Scoring ────────────────────────────────────────────────────────

    private DailyAssessment buildAssessment(PlannedWorkout planned, Activity actual) {
        if (planned.getWorkoutType() == PlannedWorkout.WorkoutType.REST) {
            boolean exercised = actual != null;
            return new DailyAssessment(
                planned.getWorkoutDate(),
                planned,
                actual,
                exercised ? 80 : 100,
                exercised ? "Bonus session on rest day — make sure you recover well."
                          : "Rest day. Well done for taking it easy.",
                planned.getWorkoutType().name()
            );
        }

        if (actual == null) {
            return new DailyAssessment(
                planned.getWorkoutDate(),
                planned,
                null,
                0,
                "Workout missed. " + recoveryTip(planned.getWorkoutType()),
                "MISSED"
            );
        }

        int typeScore  = typeMatchScore(planned, actual);
        int durScore   = durationScore(planned, actual);
        int total      = typeScore + durScore;
        String feedback = buildFeedback(planned, actual, typeScore, durScore, total);

        return new DailyAssessment(
            planned.getWorkoutDate(),
            planned,
            actual,
            total,
            feedback,
            total >= 80 ? "COMPLETED" : total >= 50 ? "PARTIAL" : "LOW"
        );
    }

    /**
     * +40 if activity type matches (RIDE / CYCLING).
     * +20 if close match.
     */
    private int typeMatchScore(PlannedWorkout planned, Activity actual) {
        Activity.SportType t = actual.getType();
        boolean isCycling = t == Activity.SportType.RIDE;
        if (isCycling) return 40;
        // Run or swim counts as cross-training
        if (t == Activity.SportType.RUN || t == Activity.SportType.SWIM) return 20;
        return 0;
    }

    /**
     * +60 scaled by (actual / target) duration, capped at 60.
     */
    private int durationScore(PlannedWorkout planned, Activity actual) {
        if (planned.getTargetDurationMinutes() <= 0) return 60;
        double target = planned.getTargetDurationMinutes() * 60.0; // convert to seconds
        double actualSec = actual.getDurationSeconds();
        double ratio = Math.min(actualSec / target, 1.0);
        return (int) Math.round(ratio * 60);
    }

    private String buildFeedback(PlannedWorkout planned, Activity actual,
                                  int typeScore, int durScore, int total) {
        List<String> parts = new ArrayList<>();
        if (typeScore < 40) {
            parts.add("Cross-training counted — add a cycling ride to maximise plan benefits.");
        }
        int actualMin = (int) (actual.getDurationSeconds() / 60);
        int targetMin = planned.getTargetDurationMinutes();
        if (actualMin < targetMin * 0.85) {
            parts.add(String.format("Duration %d min vs target %d min — try to match the target next time.", actualMin, targetMin));
        } else if (actualMin > targetMin * 1.15) {
            parts.add("Great effort — slightly over target duration. Ensure adequate recovery.");
        } else {
            parts.add("Duration on target. ");
        }
        if (total >= 90) parts.add(0, "Excellent session! ");
        else if (total >= 70) parts.add(0, "Good workout! ");
        else if (total >= 50) parts.add(0, "Partial completion — every session counts. ");
        return String.join("", parts).trim();
    }

    private String recoveryTip(PlannedWorkout.WorkoutType type) {
        return switch (type) {
            case LONG_RIDE   -> "The long ride is critical for base fitness. Try to reschedule later in the week.";
            case INTERVALS   -> "Intervals can be done tomorrow — rest if fatigued.";
            case THRESHOLD   -> "Consider a shorter threshold session tomorrow if time allows.";
            case TEMPO       -> "A missed tempo can be made up with a slightly harder endurance ride.";
            case ENDURANCE   -> "Easy to reschedule — add 20 min to your next endurance ride.";
            case RECOVERY    -> "No action needed — you got an extra rest day.";
            default          -> "Focus on consistency in the upcoming days.";
        };
    }

    // ── Matching ───────────────────────────────────────────────────────

    /**
     * From the day's activities, pick the one that best matches the planned workout.
     * Cycling activities are preferred; longest activity breaks ties.
     */
    private Activity bestMatchingActivity(PlannedWorkout planned, List<Activity> activities) {
        if (activities.isEmpty()) return null;
        return activities.stream()
            .max(Comparator.<Activity, Integer>comparing(a ->
                    a.getType() == Activity.SportType.RIDE ? 2 :
                    a.getType() == Activity.SportType.RUN  ? 1 : 0)
                .thenComparingLong(Activity::getDurationSeconds))
            .orElse(null);
    }

    private static LocalDate parseDate(String isoDate) {
        if (isoDate == null || isoDate.isBlank()) return LocalDate.EPOCH;
        try {
            return LocalDate.parse(isoDate.substring(0, 10));
        } catch (Exception e) {
            return LocalDate.EPOCH;
        }
    }

    // ── Response DTOs ──────────────────────────────────────────────────

    public record DailyAssessment(
        LocalDate date,
        PlannedWorkout planned,
        Activity actual,
        int complianceScore,
        String feedback,
        String status          // "COMPLETED" | "PARTIAL" | "MISSED" | "LOW"
    ) {}

    public record PlanCompliance(
        int totalWorkouts,
        int completedWorkouts,
        double complianceRate,
        List<DailyAssessment> assessments
    ) {}
}
