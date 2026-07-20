package com.traintrack.service;

import com.traintrack.model.PlannedWorkout;
import com.traintrack.model.PlannedWorkout.WorkoutType;
import com.traintrack.model.TrainingPlan;
import com.traintrack.model.TrainingPlan.FitnessLevel;
import com.traintrack.model.TrainingPlan.PlanPhase;
import com.traintrack.repository.PlannedWorkoutRepository;
import com.traintrack.repository.TrainingPlanRepository;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDate;
import java.time.temporal.ChronoUnit;
import java.util.*;

/**
 * Generates periodized cycling training plans.
 *
 * Structure (3:1 periodization — 3 loading weeks + 1 recovery week):
 *   BEGINNER  : 8 weeks  (2 blocks × 4 weeks: BASE only)
 *   INTERMEDIATE: 12 weeks (3 blocks × 4 weeks: BASE → BUILD)
 *   ADVANCED  : 16 weeks (4 blocks × 4 weeks: BASE → BUILD → PEAK → TAPER)
 *
 * Weekly pattern (Mon=1 … Sun=7):
 *   1 REST · 2 INTERVALS(or RECOVERY for BASE) · 3 ENDURANCE · 4 RECOVERY
 *   5 TEMPO · 6 LONG_RIDE · 7 RECOVERY
 */
@Service
@Transactional
public class CyclingPlanService {

    private static final Logger log = LoggerFactory.getLogger(CyclingPlanService.class);

    private final TrainingPlanRepository planRepo;
    private final PlannedWorkoutRepository workoutRepo;

    public CyclingPlanService(TrainingPlanRepository planRepo,
                               PlannedWorkoutRepository workoutRepo) {
        this.planRepo   = planRepo;
        this.workoutRepo = workoutRepo;
    }

    // ── Public API ─────────────────────────────────────────────────────

    public TrainingPlan createPlan(String athleteId, String athleteName,
                                   FitnessLevel level, int weeklyHours,
                                   LocalDate startDate, String goalEvent,
                                   double goalWeightKg) {

        // Deactivate any existing active plan for this athlete
        planRepo.findByAthleteIdAndActiveTrue(athleteId).ifPresent(old -> {
            old.setActive(false);
            planRepo.save(old);
        });

        int totalWeeks = totalWeeks(level);
        LocalDate endDate = startDate.plusWeeks(totalWeeks).minusDays(1);

        TrainingPlan plan = new TrainingPlan();
        plan.setAthleteId(athleteId);
        plan.setAthleteName(athleteName);
        plan.setFitnessLevel(level);
        plan.setWeeklyHoursTarget(weeklyHours);
        plan.setStartDate(startDate);
        plan.setEndDate(endDate);
        plan.setGoalEvent(goalEvent);
        plan.setCurrentPhase(PlanPhase.BASE);
        plan.setActive(true);
        plan.setWeightGoalKg(goalWeightKg);
        plan = planRepo.save(plan);

        generateWorkouts(plan, totalWeeks);
        log.info("Created {} cycling plan for athlete {} ({} weeks)", level, athleteId, totalWeeks);
        return plan;
    }

    public Optional<TrainingPlan> getActivePlan(String athleteId) {
        return planRepo.findByAthleteIdAndActiveTrue(athleteId);
    }

    public List<TrainingPlan> getAllPlans(String athleteId) {
        return planRepo.findByAthleteIdOrderByCreatedAtDesc(athleteId);
    }

    public List<PlannedWorkout> getWorkoutsForWeek(Long planId, int week) {
        return workoutRepo.findByPlanIdAndPlanWeek(planId, week);
    }

    public List<PlannedWorkout> getWorkoutsInRange(Long planId, LocalDate from, LocalDate to) {
        return workoutRepo.findByPlanIdAndWorkoutDateBetweenOrderByWorkoutDate(planId, from, to);
    }

    public Optional<PlannedWorkout> getWorkoutForDate(Long planId, LocalDate date) {
        return workoutRepo.findByPlanIdAndWorkoutDate(planId, date);
    }

    public PlannedWorkout markCompleted(Long workoutId, String linkedActivityId) {
        PlannedWorkout w = workoutRepo.findById(workoutId)
            .orElseThrow(() -> new NoSuchElementException("Workout " + workoutId + " not found"));
        w.setCompleted(true);
        w.setLinkedActivityId(linkedActivityId);
        return workoutRepo.save(w);
    }

    public void deactivatePlan(Long planId) {
        planRepo.findById(planId).ifPresent(p -> {
            p.setActive(false);
            planRepo.save(p);
        });
    }

    // ── Plan generation ────────────────────────────────────────────────

    private void generateWorkouts(TrainingPlan plan, int totalWeeks) {
        List<PlannedWorkout> all = new ArrayList<>();
        FitnessLevel level = plan.getFitnessLevel();
        double weeklyHours = plan.getWeeklyHoursTarget();

        for (int week = 1; week <= totalWeeks; week++) {
            PlanPhase phase = phaseForWeek(week, level);
            // 3:1 block: weeks 4, 8, 12, 16 are recovery (80% volume)
            double volumeFactor = isRecoveryWeek(week) ? 0.80 : buildVolumeFactor(week, level);
            double weeklyMinutes = weeklyHours * 60 * volumeFactor;

            for (int day = 1; day <= 7; day++) {
                LocalDate date = plan.getStartDate().plusWeeks(week - 1).plusDays(day - 1);
                PlannedWorkout w = buildWorkout(plan, week, day, date, level, phase,
                        weeklyMinutes, volumeFactor);
                all.add(w);
            }

            // Update plan's current phase to reflect latest computed phase
            plan.setCurrentPhase(phase);
        }

        workoutRepo.saveAll(all);
        planRepo.save(plan);
    }

    private PlannedWorkout buildWorkout(TrainingPlan plan, int week, int day,
                                        LocalDate date, FitnessLevel level,
                                        PlanPhase phase, double weeklyMinutes,
                                        double volumeFactor) {
        PlannedWorkout w = new PlannedWorkout();
        w.setPlan(plan);
        w.setPlanWeek(week);
        w.setPlanDay(day);
        w.setWorkoutDate(date);

        boolean recovery = isRecoveryWeek(week);
        WorkoutSpec spec = workoutSpec(day, level, phase, recovery, weeklyMinutes);

        w.setWorkoutType(spec.type);
        w.setTargetDurationMinutes(spec.durationMinutes);
        w.setIntensityZone(spec.zone);
        w.setDescription(spec.description);
        w.setWarmup(spec.warmup);
        w.setMainSet(spec.mainSet);
        w.setCooldown(spec.cooldown);
        w.setTargetDistanceKm(estimateDistanceKm(spec.durationMinutes, spec.zone));
        w.setCompleted(false);
        return w;
    }

    /** Determine which workout goes on a given day of the week. */
    private WorkoutSpec workoutSpec(int day, FitnessLevel level, PlanPhase phase,
                                    boolean recovery, double weeklyMinutes) {
        return switch (day) {
            case 1 -> rest();                                   // Monday = Rest
            case 2 -> recovery ? easyRide(level, weeklyMinutes)
                               : intensityWorkout(level, phase, weeklyMinutes);
            case 3 -> enduranceRide(level, weeklyMinutes);
            case 4 -> easyRide(level, weeklyMinutes);           // Thursday = easy
            case 5 -> recovery ? easyRide(level, weeklyMinutes)
                               : tempoRide(level, phase, weeklyMinutes);
            case 6 -> longRide(level, phase, weeklyMinutes);
            case 7 -> recoveryRide(level, weeklyMinutes);       // Sunday = recovery
            default -> rest();
        };
    }

    // ── Workout spec builders ──────────────────────────────────────────

    private WorkoutSpec rest() {
        return new WorkoutSpec(WorkoutType.REST, 0, 0,
            "Complete rest. Recovery is as important as training — let your body repair and adapt.",
            null, null, null);
    }

    private WorkoutSpec recoveryRide(FitnessLevel level, double weeklyMinutes) {
        int dur = minutes(weeklyMinutes, level == FitnessLevel.BEGINNER ? 0.08 : 0.07);
        dur = clamp(dur, 20, 45);
        return new WorkoutSpec(WorkoutType.RECOVERY, dur, 1,
            "Active recovery spin. Keep heart rate below Zone 2. Spin easy to flush out lactic acid.",
            null,
            "Spin at very easy pace, cadence 85–95 rpm, zero resistance. Heart rate should stay below 120 bpm.",
            null);
    }

    private WorkoutSpec easyRide(FitnessLevel level, double weeklyMinutes) {
        int dur = minutes(weeklyMinutes, 0.12);
        dur = clamp(dur, 30, 75);
        return new WorkoutSpec(WorkoutType.ENDURANCE, dur, 2,
            "Easy Zone 2 endurance ride. Conversational pace — you should be able to hold a full sentence.",
            "10 min easy spin",
            "Ride at steady Zone 2 pace. Focus on smooth pedaling and consistent cadence (85–90 rpm).",
            "5 min easy cool-down");
    }

    private WorkoutSpec enduranceRide(FitnessLevel level, double weeklyMinutes) {
        double fraction = level == FitnessLevel.ADVANCED ? 0.20 : 0.17;
        int dur = minutes(weeklyMinutes, fraction);
        dur = clamp(dur, 60, 150);
        return new WorkoutSpec(WorkoutType.ENDURANCE, dur, 2,
            "Zone 2 endurance ride. The foundation of cycling fitness. Steady aerobic effort.",
            "15 min easy build",
            "Sustained Zone 2 effort. Maintain 85–90 rpm cadence. Focus on fueling — eat every 45 min.",
            "10 min easy spin-down");
    }

    private WorkoutSpec tempoRide(FitnessLevel level, PlanPhase phase, double weeklyMinutes) {
        int dur = minutes(weeklyMinutes, level == FitnessLevel.BEGINNER ? 0.14 : 0.16);
        dur = clamp(dur, 45, 120);
        int zone = phase == PlanPhase.BASE ? 3 : (phase == PlanPhase.PEAK ? 4 : 3);
        String mainSet = switch (phase) {
            case BASE -> "2 × 15 min at Zone 3 (tempo), 5 min recovery between";
            case BUILD -> "3 × 15 min at Zone 3–4 (tempo/threshold), 5 min recovery between";
            case PEAK -> "2 × 20 min at Zone 4 (threshold), 5 min recovery between";
            default -> "30 min steady Zone 3 effort";
        };
        return new WorkoutSpec(WorkoutType.TEMPO, dur, zone,
            "Tempo/threshold ride. 'Comfortably uncomfortable' effort. Builds lactate threshold.",
            "15 min easy build into Zone 3",
            mainSet,
            "10 min Zone 1–2 cool-down, leg stretches");
    }

    private WorkoutSpec intensityWorkout(FitnessLevel level, PlanPhase phase, double weeklyMinutes) {
        if (level == FitnessLevel.BEGINNER || phase == PlanPhase.BASE) {
            return tempoRide(level, phase, weeklyMinutes);
        }
        int dur = minutes(weeklyMinutes, 0.15);
        dur = clamp(dur, 60, 90);
        String mainSet = switch (phase) {
            case BUILD -> "6 × 5 min at Zone 4–5 (VO2 max pace), 5 min easy between";
            case PEAK  -> "8 × 3 min all-out Zone 5 efforts, 3 min easy between";
            default    -> "5 × 5 min Zone 4 efforts, 4 min easy between";
        };
        int zone = phase == PlanPhase.PEAK ? 5 : 4;
        return new WorkoutSpec(WorkoutType.INTERVALS, dur, zone,
            "High-intensity interval training. Short bursts near or above VO2 max. Builds aerobic power.",
            "20 min progressive warm-up (end at Zone 3)",
            mainSet,
            "15 min easy spin. Hydrate well and fuel with carbohydrates post-ride.");
    }

    private WorkoutSpec longRide(FitnessLevel level, PlanPhase phase, double weeklyMinutes) {
        double fraction = switch (level) {
            case BEGINNER    -> 0.30;
            case INTERMEDIATE -> 0.35;
            case ADVANCED    -> 0.38;
        };
        int dur = minutes(weeklyMinutes, fraction);
        dur = switch (level) {
            case BEGINNER    -> clamp(dur, 60, 120);
            case INTERMEDIATE -> clamp(dur, 90, 180);
            case ADVANCED    -> clamp(dur, 120, 240);
        };
        int zone = phase == PlanPhase.PEAK ? 3 : 2;
        String mainSet = phase == PlanPhase.PEAK
            ? "Ride at Zone 2–3. Include 2 × 20 min moderate climbs or headwind efforts."
            : "Steady Zone 2 endurance. Practice race-day nutrition: eat every 45 min, drink 500 ml/hour.";
        return new WorkoutSpec(WorkoutType.LONG_RIDE, dur, zone,
            "Weekly long ride — the cornerstone of cycling fitness. Focus on consistency and fueling.",
            "20 min easy build",
            mainSet,
            "15 min easy spin. Post-ride recovery: protein + carbs within 30 min.");
    }

    // ── Utility ────────────────────────────────────────────────────────

    private static int totalWeeks(FitnessLevel level) {
        return switch (level) {
            case BEGINNER     -> 8;
            case INTERMEDIATE -> 12;
            case ADVANCED     -> 16;
        };
    }

    private static PlanPhase phaseForWeek(int week, FitnessLevel level) {
        return switch (level) {
            case BEGINNER     -> PlanPhase.BASE;
            case INTERMEDIATE -> week <= 8 ? PlanPhase.BASE : PlanPhase.BUILD;
            case ADVANCED     -> {
                if (week <= 8)       yield PlanPhase.BASE;
                else if (week <= 12) yield PlanPhase.BUILD;
                else if (week <= 15) yield PlanPhase.PEAK;
                else                 yield PlanPhase.TAPER;
            }
        };
    }

    /** Recovery weeks are every 4th week (weeks 4, 8, 12, 16). */
    private static boolean isRecoveryWeek(int week) {
        return week % 4 == 0;
    }

    /**
     * Progressive overload factor within a 3-week loading block.
     * Week 1 of block = 1.00, week 2 = 1.10, week 3 = 1.20.
     */
    private static double buildVolumeFactor(int week, FitnessLevel level) {
        int positionInBlock = ((week - 1) % 4) + 1; // 1, 2, 3, or 4
        double base = switch (level) {
            case BEGINNER     -> 0.90;
            case INTERMEDIATE -> 1.00;
            case ADVANCED     -> 1.05;
        };
        return base + (positionInBlock - 1) * 0.05;
    }

    private static int minutes(double weeklyMinutes, double fraction) {
        return (int) Math.round(weeklyMinutes * fraction);
    }

    private static int clamp(int value, int min, int max) {
        return Math.max(min, Math.min(max, value));
    }

    /** Rough distance estimate assuming average speed varies by zone. */
    private static double estimateDistanceKm(int durationMinutes, int zone) {
        if (durationMinutes == 0) return 0;
        double avgSpeedKmh = switch (zone) {
            case 1 -> 20.0;
            case 2 -> 25.0;
            case 3 -> 28.0;
            case 4 -> 30.0;
            case 5 -> 32.0;
            default -> 22.0;
        };
        return Math.round(durationMinutes / 60.0 * avgSpeedKmh * 10.0) / 10.0;
    }

    // ── Inner DTO ──────────────────────────────────────────────────────

    private record WorkoutSpec(WorkoutType type, int durationMinutes, int zone,
                                String description, String warmup,
                                String mainSet, String cooldown) {}
}
