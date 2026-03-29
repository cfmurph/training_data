package com.traintrack.controller;

import com.traintrack.model.Activity;
import com.traintrack.model.GarminTokens;
import com.traintrack.model.StravaTokens;
import com.traintrack.model.TrainingStats;
import com.traintrack.service.GarminService;
import com.traintrack.service.StatsService;
import com.traintrack.service.StravaService;
import jakarta.servlet.http.HttpSession;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.time.Instant;
import java.util.HashMap;
import java.util.List;
import java.util.Map;

@Slf4j
@RestController
@RequestMapping("/api/stats")
@RequiredArgsConstructor
public class StatsController {

    private final StravaService stravaService;
    private final GarminService garminService;
    private final StatsService statsService;

    @GetMapping("/summary")
    public ResponseEntity<?> getSummary(HttpSession session) {
        StravaTokens stravaTokens = (StravaTokens) session.getAttribute("stravaTokens");
        GarminTokens garminTokens = (GarminTokens) session.getAttribute("garminTokens");

        if (stravaTokens == null && garminTokens == null) {
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED)
                .body(Map.of("error", "Not authenticated"));
        }

        try {
            List<Activity> activities;
            String provider;
            Object athleteStats = null;

            if (stravaTokens != null) {
                activities = stravaService.fetchActivities(stravaTokens, 1, 100);
                provider = "strava";
                try {
                    var authStatus = (com.traintrack.model.AuthStatus.AthleteInfo) session.getAttribute("athlete");
                    if (authStatus != null && authStatus.getId() != null) {
                        athleteStats = stravaService.fetchAthleteStats(stravaTokens, authStatus.getId());
                    }
                } catch (Exception ignored) {}
            } else {
                long now = Instant.now().getEpochSecond();
                long ninetyDaysAgo = now - 90L * 24 * 60 * 60;
                activities = garminService.fetchActivities(garminTokens, ninetyDaysAgo, now);
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
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                .body(Map.of("error", "Failed to compute stats"));
        }
    }

    @GetMapping("/weekly")
    public ResponseEntity<?> getWeekly(
            @RequestParam(defaultValue = "12") int weeks,
            HttpSession session) {

        StravaTokens stravaTokens = (StravaTokens) session.getAttribute("stravaTokens");
        GarminTokens garminTokens = (GarminTokens) session.getAttribute("garminTokens");

        if (stravaTokens == null && garminTokens == null) {
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED)
                .body(Map.of("error", "Not authenticated"));
        }

        try {
            List<Activity> activities;
            if (stravaTokens != null) {
                activities = stravaService.fetchActivities(stravaTokens, 1, weeks * 10);
            } else {
                long now = Instant.now().getEpochSecond();
                long start = now - (long) weeks * 7 * 24 * 60 * 60;
                activities = garminService.fetchActivities(garminTokens, start, now);
            }

            TrainingStats stats = statsService.compute(activities);
            return ResponseEntity.ok(Map.of(
                "weeklyVolume", stats.getWeeklyVolume(),
                "weeks", weeks
            ));
        } catch (Exception ex) {
            log.error("Error computing weekly stats", ex);
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                .body(Map.of("error", "Failed to compute weekly stats"));
        }
    }
}
