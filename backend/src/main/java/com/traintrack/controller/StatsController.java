package com.traintrack.controller;

import com.traintrack.model.Activity;
import com.traintrack.model.AuthStatus;
import com.traintrack.model.GarminTokens;
import com.traintrack.model.StravaTokens;
import com.traintrack.model.TrainingStats;
import com.traintrack.service.GarminService;
import com.traintrack.service.StatsService;
import com.traintrack.service.StravaService;
import jakarta.servlet.http.HttpSession;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.time.Instant;
import java.util.HashMap;
import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/stats")
public class StatsController {

    private static final Logger log = LoggerFactory.getLogger(StatsController.class);

    private final StravaService stravaService;
    private final GarminService garminService;
    private final StatsService statsService;

    public StatsController(StravaService stravaService, GarminService garminService, StatsService statsService) {
        this.stravaService = stravaService;
        this.garminService = garminService;
        this.statsService  = statsService;
    }

    @GetMapping("/summary")
    public ResponseEntity<?> getSummary(HttpSession session) {
        StravaTokens stravaTokens = (StravaTokens) session.getAttribute("stravaTokens");
        GarminTokens garminTokens = (GarminTokens) session.getAttribute("garminTokens");

        if (stravaTokens == null && garminTokens == null) {
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED).body(Map.of("error", "Not authenticated"));
        }

        try {
            List<Activity> activities;
            String provider;
            Object athleteStats = null;

            if (stravaTokens != null) {
                activities = stravaService.fetchActivities(stravaTokens, 1, 100);
                provider = "strava";
                try {
                    AuthStatus.AthleteInfo info = (AuthStatus.AthleteInfo) session.getAttribute("athlete");
                    if (info != null && info.getId() != null) {
                        athleteStats = stravaService.fetchAthleteStats(stravaTokens, info.getId());
                    }
                } catch (Exception ignored) {}
            } else {
                long now = Instant.now().getEpochSecond();
                activities = garminService.fetchActivities(garminTokens, now - 90L * 24 * 60 * 60, now);
                provider = "garmin";
            }

            TrainingStats stats = statsService.compute(activities);
            Map<String, Object> response = new HashMap<>();
            response.put("stats", stats);
            response.put("provider", provider);
            if (athleteStats != null) response.put("athleteStats", athleteStats);
            return ResponseEntity.ok(response);

        } catch (Exception ex) {
            log.error("Error computing stats summary", ex);
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).body(Map.of("error", "Failed to compute stats"));
        }
    }

    @GetMapping("/weekly")
    public ResponseEntity<?> getWeekly(
            @RequestParam(defaultValue = "12") int weeks,
            HttpSession session) {

        StravaTokens stravaTokens = (StravaTokens) session.getAttribute("stravaTokens");
        GarminTokens garminTokens = (GarminTokens) session.getAttribute("garminTokens");

        if (stravaTokens == null && garminTokens == null) {
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED).body(Map.of("error", "Not authenticated"));
        }

        try {
            List<Activity> activities;
            if (stravaTokens != null) {
                activities = stravaService.fetchActivities(stravaTokens, 1, weeks * 10);
            } else {
                long now = Instant.now().getEpochSecond();
                activities = garminService.fetchActivities(garminTokens, now - (long) weeks * 7 * 24 * 60 * 60, now);
            }

            TrainingStats stats = statsService.compute(activities);
            return ResponseEntity.ok(Map.of("weeklyVolume", stats.getWeeklyVolume(), "weeks", weeks));

        } catch (Exception ex) {
            log.error("Error computing weekly stats", ex);
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).body(Map.of("error", "Failed to compute weekly stats"));
        }
    }
}
