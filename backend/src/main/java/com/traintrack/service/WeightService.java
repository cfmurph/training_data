package com.traintrack.service;

import com.traintrack.model.WeightEntry;
import com.traintrack.repository.WeightEntryRepository;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDate;
import java.util.*;

/**
 * Manages daily weight entries and provides trend/summary calculations.
 */
@Service
@Transactional
public class WeightService {

    private final WeightEntryRepository repo;

    public WeightService(WeightEntryRepository repo) {
        this.repo = repo;
    }

    // ── CRUD ───────────────────────────────────────────────────────────

    public WeightEntry logWeight(String athleteId, LocalDate date, double weightKg,
                                  double goalWeightKg, String notes) {
        // Upsert: update existing entry for the same date if present
        WeightEntry entry = repo.findByAthleteIdAndEntryDate(athleteId, date)
            .orElseGet(WeightEntry::new);
        entry.setAthleteId(athleteId);
        entry.setEntryDate(date);
        entry.setWeightKg(weightKg);
        if (goalWeightKg > 0) entry.setGoalWeightKg(goalWeightKg);
        if (notes != null) entry.setNotes(notes);
        return repo.save(entry);
    }

    public List<WeightEntry> getHistory(String athleteId) {
        return repo.findByAthleteIdOrderByEntryDateDesc(athleteId);
    }

    public List<WeightEntry> getHistory(String athleteId, LocalDate from, LocalDate to) {
        return repo.findByAthleteIdAndEntryDateBetweenOrderByEntryDate(athleteId, from, to);
    }

    public void deleteEntry(Long id, String athleteId) {
        repo.findById(id).ifPresent(e -> {
            if (e.getAthleteId().equals(athleteId)) repo.delete(e);
        });
    }

    // ── Summary & Trend ────────────────────────────────────────────────

    public WeightSummary getSummary(String athleteId) {
        List<WeightEntry> all = repo.findByAthleteIdOrderByEntryDateDesc(athleteId);
        if (all.isEmpty()) return WeightSummary.empty();

        WeightEntry latest  = all.get(0);
        WeightEntry earliest = all.get(all.size() - 1);

        double current   = latest.getWeightKg();
        double starting  = earliest.getWeightKg();
        double totalLoss = starting - current;  // positive = lost weight
        double goalWeight = latest.getGoalWeightKg();

        // 7-day moving average
        List<WeightEntry> chronological = new ArrayList<>(all);
        Collections.reverse(chronological);
        double movingAvg = sevenDayAvg(chronological);

        // Weekly rate (kg/week) — last 14 days
        double weeklyRate = 0;
        LocalDate twoWeeksAgo = LocalDate.now().minusDays(14);
        List<WeightEntry> recent = repo.findByAthleteIdAndEntryDateBetweenOrderByEntryDate(
            athleteId, twoWeeksAgo, LocalDate.now());
        if (recent.size() >= 2) {
            double deltaDays = recent.get(0).getEntryDate()
                .until(recent.get(recent.size() - 1).getEntryDate()).getDays();
            if (deltaDays > 0) {
                weeklyRate = (recent.get(0).getWeightKg() - recent.get(recent.size() - 1).getWeightKg())
                    / deltaDays * 7;
            }
        }

        // Days to goal (at current weekly rate)
        Integer daysToGoal = null;
        if (goalWeight > 0 && current > goalWeight && weeklyRate > 0) {
            double weeksLeft = (current - goalWeight) / weeklyRate;
            daysToGoal = (int) Math.ceil(weeksLeft * 7);
        }

        return new WeightSummary(current, starting, totalLoss, goalWeight,
            movingAvg, weeklyRate, daysToGoal, all.size(), chronological);
    }

    private double sevenDayAvg(List<WeightEntry> chronological) {
        int count = Math.min(7, chronological.size());
        List<WeightEntry> tail = chronological.subList(chronological.size() - count, chronological.size());
        return tail.stream().mapToDouble(WeightEntry::getWeightKg).average().orElse(0);
    }

    // ── Response DTO ──────────────────────────────────────────────────

    public record WeightSummary(
        double currentWeightKg,
        double startingWeightKg,
        double totalLossKg,
        double goalWeightKg,
        double sevenDayAvgKg,
        double weeklyRateKg,
        Integer estimatedDaysToGoal,
        int totalEntries,
        List<WeightEntry> history
    ) {
        static WeightSummary empty() {
            return new WeightSummary(0, 0, 0, 0, 0, 0, null, 0, List.of());
        }
    }
}
