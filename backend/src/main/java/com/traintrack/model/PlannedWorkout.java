package com.traintrack.model;

import com.fasterxml.jackson.annotation.JsonBackReference;
import jakarta.persistence.*;
import java.time.LocalDate;

@Entity
@Table(name = "planned_workouts")
public class PlannedWorkout {

    public enum WorkoutType {
        REST, RECOVERY, ENDURANCE, TEMPO, THRESHOLD, INTERVALS, LONG_RIDE
    }

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "plan_id", nullable = false)
    @JsonBackReference
    private TrainingPlan plan;

    @Column(nullable = false)
    private LocalDate workoutDate;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    private WorkoutType workoutType;

    /** Target duration in minutes (0 for REST days). */
    private int targetDurationMinutes;

    /** Approximate target distance in km (0 if not specified). */
    private double targetDistanceKm;

    /** Training zone 1-5 (0 for REST). */
    private int intensityZone;

    @Column(length = 500)
    private String description;

    @Column(length = 300)
    private String warmup;

    @Column(length = 500)
    private String mainSet;

    @Column(length = 300)
    private String cooldown;

    private boolean completed;

    /** ID of the actual Strava/Garmin activity linked to this workout. */
    private String linkedActivityId;

    /** Week number within the plan (1-based). */
    private int planWeek;

    /** Day of week (1=Monday … 7=Sunday). */
    private int planDay;

    public PlannedWorkout() {}

    // ── Getters & Setters ──────────────────────────────────────────────

    public Long getId() { return id; }
    public void setId(Long id) { this.id = id; }

    public TrainingPlan getPlan() { return plan; }
    public void setPlan(TrainingPlan plan) { this.plan = plan; }

    public LocalDate getWorkoutDate() { return workoutDate; }
    public void setWorkoutDate(LocalDate workoutDate) { this.workoutDate = workoutDate; }

    public WorkoutType getWorkoutType() { return workoutType; }
    public void setWorkoutType(WorkoutType workoutType) { this.workoutType = workoutType; }

    public int getTargetDurationMinutes() { return targetDurationMinutes; }
    public void setTargetDurationMinutes(int targetDurationMinutes) { this.targetDurationMinutes = targetDurationMinutes; }

    public double getTargetDistanceKm() { return targetDistanceKm; }
    public void setTargetDistanceKm(double targetDistanceKm) { this.targetDistanceKm = targetDistanceKm; }

    public int getIntensityZone() { return intensityZone; }
    public void setIntensityZone(int intensityZone) { this.intensityZone = intensityZone; }

    public String getDescription() { return description; }
    public void setDescription(String description) { this.description = description; }

    public String getWarmup() { return warmup; }
    public void setWarmup(String warmup) { this.warmup = warmup; }

    public String getMainSet() { return mainSet; }
    public void setMainSet(String mainSet) { this.mainSet = mainSet; }

    public String getCooldown() { return cooldown; }
    public void setCooldown(String cooldown) { this.cooldown = cooldown; }

    public boolean isCompleted() { return completed; }
    public void setCompleted(boolean completed) { this.completed = completed; }

    public String getLinkedActivityId() { return linkedActivityId; }
    public void setLinkedActivityId(String linkedActivityId) { this.linkedActivityId = linkedActivityId; }

    public int getPlanWeek() { return planWeek; }
    public void setPlanWeek(int planWeek) { this.planWeek = planWeek; }

    public int getPlanDay() { return planDay; }
    public void setPlanDay(int planDay) { this.planDay = planDay; }

    /** Convenience: plan ID without loading the plan entity. */
    public Long getPlanId() {
        return plan != null ? plan.getId() : null;
    }
}
