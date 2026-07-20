package com.traintrack.model;

import jakarta.persistence.*;
import java.time.LocalDate;
import java.time.LocalDateTime;

@Entity
@Table(name = "weight_entries",
       uniqueConstraints = @UniqueConstraint(columnNames = {"athleteId", "entryDate"}))
public class WeightEntry {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false)
    private String athleteId;

    @Column(nullable = false)
    private LocalDate entryDate;

    /** Weight in kilograms. */
    @Column(nullable = false)
    private double weightKg;

    /** Optional goal weight in kg (0 if not set). */
    private double goalWeightKg;

    @Column(length = 300)
    private String notes;

    private LocalDateTime createdAt = LocalDateTime.now();

    public WeightEntry() {}

    // ── Getters & Setters ──────────────────────────────────────────────

    public Long getId() { return id; }
    public void setId(Long id) { this.id = id; }

    public String getAthleteId() { return athleteId; }
    public void setAthleteId(String athleteId) { this.athleteId = athleteId; }

    public LocalDate getEntryDate() { return entryDate; }
    public void setEntryDate(LocalDate entryDate) { this.entryDate = entryDate; }

    public double getWeightKg() { return weightKg; }
    public void setWeightKg(double weightKg) { this.weightKg = weightKg; }

    public double getGoalWeightKg() { return goalWeightKg; }
    public void setGoalWeightKg(double goalWeightKg) { this.goalWeightKg = goalWeightKg; }

    public String getNotes() { return notes; }
    public void setNotes(String notes) { this.notes = notes; }

    public LocalDateTime getCreatedAt() { return createdAt; }
    public void setCreatedAt(LocalDateTime createdAt) { this.createdAt = createdAt; }
}
