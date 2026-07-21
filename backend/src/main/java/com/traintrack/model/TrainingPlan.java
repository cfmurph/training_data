package com.traintrack.model;

import com.fasterxml.jackson.annotation.JsonIgnoreProperties;
import com.fasterxml.jackson.annotation.JsonManagedReference;
import jakarta.persistence.*;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;

@Entity
@Table(name = "training_plans")
@JsonIgnoreProperties({"hibernateLazyInitializer", "handler"})
public class TrainingPlan {

    public enum FitnessLevel { BEGINNER, INTERMEDIATE, ADVANCED }
    public enum PlanPhase { BASE, BUILD, PEAK, TAPER }

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false)
    private String athleteId;

    private String athleteName;

    @Column(nullable = false)
    private LocalDate startDate;

    @Column(nullable = false)
    private LocalDate endDate;

    private String goalEvent;

    @Column(nullable = false)
    private int weeklyHoursTarget;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    private FitnessLevel fitnessLevel;

    @Enumerated(EnumType.STRING)
    private PlanPhase currentPhase;

    @Column(nullable = false)
    private boolean active = true;

    private LocalDateTime createdAt = LocalDateTime.now();

    /** Target weight loss in kg (0 = no weight goal linked). */
    private double weightGoalKg;

    @OneToMany(mappedBy = "plan", cascade = CascadeType.ALL, fetch = FetchType.LAZY)
    @JsonManagedReference
    private List<PlannedWorkout> workouts = new ArrayList<>();

    public TrainingPlan() {}

    // ── Getters & Setters ──────────────────────────────────────────────

    public Long getId() { return id; }
    public void setId(Long id) { this.id = id; }

    public String getAthleteId() { return athleteId; }
    public void setAthleteId(String athleteId) { this.athleteId = athleteId; }

    public String getAthleteName() { return athleteName; }
    public void setAthleteName(String athleteName) { this.athleteName = athleteName; }

    public LocalDate getStartDate() { return startDate; }
    public void setStartDate(LocalDate startDate) { this.startDate = startDate; }

    public LocalDate getEndDate() { return endDate; }
    public void setEndDate(LocalDate endDate) { this.endDate = endDate; }

    public String getGoalEvent() { return goalEvent; }
    public void setGoalEvent(String goalEvent) { this.goalEvent = goalEvent; }

    public int getWeeklyHoursTarget() { return weeklyHoursTarget; }
    public void setWeeklyHoursTarget(int weeklyHoursTarget) { this.weeklyHoursTarget = weeklyHoursTarget; }

    public FitnessLevel getFitnessLevel() { return fitnessLevel; }
    public void setFitnessLevel(FitnessLevel fitnessLevel) { this.fitnessLevel = fitnessLevel; }

    public PlanPhase getCurrentPhase() { return currentPhase; }
    public void setCurrentPhase(PlanPhase currentPhase) { this.currentPhase = currentPhase; }

    public boolean isActive() { return active; }
    public void setActive(boolean active) { this.active = active; }

    public LocalDateTime getCreatedAt() { return createdAt; }
    public void setCreatedAt(LocalDateTime createdAt) { this.createdAt = createdAt; }

    public double getWeightGoalKg() { return weightGoalKg; }
    public void setWeightGoalKg(double weightGoalKg) { this.weightGoalKg = weightGoalKg; }

    public List<PlannedWorkout> getWorkouts() { return workouts; }
    public void setWorkouts(List<PlannedWorkout> workouts) { this.workouts = workouts; }
}
