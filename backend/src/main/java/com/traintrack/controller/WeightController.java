package com.traintrack.controller;

import com.traintrack.model.AuthStatus;
import com.traintrack.model.WeightEntry;
import com.traintrack.service.WeightService;
import com.traintrack.service.WeightService.WeightSummary;
import jakarta.servlet.http.HttpSession;
import org.springframework.format.annotation.DateTimeFormat;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.time.LocalDate;
import java.util.*;

@RestController
@RequestMapping("/api/weight")
public class WeightController {

    private static final String SESSION_ATHLETE = "athlete";

    private final WeightService weightService;

    public WeightController(WeightService weightService) {
        this.weightService = weightService;
    }

    private String requireAthleteId(HttpSession session) {
        AuthStatus.AthleteInfo athlete = (AuthStatus.AthleteInfo) session.getAttribute(SESSION_ATHLETE);
        if (athlete == null) throw new IllegalStateException("Not authenticated");
        return athlete.getId();
    }

    // ── Log / Upsert ───────────────────────────────────────────────────

    /**
     * POST /api/weight/log
     * Body: { "weightKg": 80.5, "date": "2024-01-15", "goalWeightKg": 72.0, "notes": "..." }
     */
    @PostMapping("/log")
    public ResponseEntity<?> logWeight(@RequestBody Map<String, Object> body,
                                        HttpSession session) {
        try {
            String athleteId = requireAthleteId(session);
            double weightKg = ((Number) body.get("weightKg")).doubleValue();

            LocalDate date = body.containsKey("date")
                ? LocalDate.parse((String) body.get("date"))
                : LocalDate.now();

            double goalWeightKg = body.containsKey("goalWeightKg")
                ? ((Number) body.get("goalWeightKg")).doubleValue() : 0;

            String notes = (String) body.getOrDefault("notes", null);

            WeightEntry entry = weightService.logWeight(athleteId, date, weightKg, goalWeightKg, notes);
            return ResponseEntity.ok(entry);
        } catch (IllegalStateException e) {
            return ResponseEntity.status(401).body(Map.of("error", "Not authenticated"));
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(Map.of("error", e.getMessage()));
        }
    }

    // ── History ────────────────────────────────────────────────────────

    /** GET /api/weight/history?from=&to= */
    @GetMapping("/history")
    public ResponseEntity<?> getHistory(
            HttpSession session,
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate from,
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate to) {
        try {
            String athleteId = requireAthleteId(session);
            List<WeightEntry> entries = (from != null && to != null)
                ? weightService.getHistory(athleteId, from, to)
                : weightService.getHistory(athleteId);
            return ResponseEntity.ok(entries);
        } catch (IllegalStateException e) {
            return ResponseEntity.status(401).body(Map.of("error", "Not authenticated"));
        }
    }

    /** GET /api/weight/summary — trend analysis + progress towards goal. */
    @GetMapping("/summary")
    public ResponseEntity<?> getSummary(HttpSession session) {
        try {
            String athleteId = requireAthleteId(session);
            WeightSummary summary = weightService.getSummary(athleteId);
            return ResponseEntity.ok(summary);
        } catch (IllegalStateException e) {
            return ResponseEntity.status(401).body(Map.of("error", "Not authenticated"));
        }
    }

    // ── Delete ─────────────────────────────────────────────────────────

    /** DELETE /api/weight/{id} */
    @DeleteMapping("/{id}")
    public ResponseEntity<?> deleteEntry(@PathVariable Long id, HttpSession session) {
        try {
            String athleteId = requireAthleteId(session);
            weightService.deleteEntry(id, athleteId);
            return ResponseEntity.ok(Map.of("success", true));
        } catch (IllegalStateException e) {
            return ResponseEntity.status(401).body(Map.of("error", "Not authenticated"));
        }
    }
}
