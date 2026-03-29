package com.traintrack.controller;

import com.traintrack.model.Activity;
import com.traintrack.model.GarminTokens;
import com.traintrack.model.StravaTokens;
import com.traintrack.service.GarminService;
import com.traintrack.service.StravaService;
import jakarta.servlet.http.HttpSession;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.time.Instant;
import java.util.List;
import java.util.Map;

@Slf4j
@RestController
@RequestMapping("/api/activities")
@RequiredArgsConstructor
public class ActivityController {

    private final StravaService stravaService;
    private final GarminService garminService;

    @GetMapping
    public ResponseEntity<?> getActivities(
            @RequestParam(defaultValue = "1") int page,
            @RequestParam(name = "per_page", defaultValue = "20") int perPage,
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
                activities = stravaService.fetchActivities(stravaTokens, page, perPage);
                // Persist refreshed tokens back to session
                session.setAttribute("stravaTokens", stravaTokens);
            } else {
                long now = Instant.now().getEpochSecond();
                long thirtyDaysAgo = now - 30L * 24 * 60 * 60;
                activities = garminService.fetchActivities(garminTokens, thirtyDaysAgo, now);
            }
            return ResponseEntity.ok(Map.of("activities", activities, "total", activities.size()));
        } catch (Exception ex) {
            log.error("Error fetching activities", ex);
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                .body(Map.of("error", "Failed to fetch activities"));
        }
    }

    @GetMapping("/recent")
    public ResponseEntity<?> getRecentActivities(
            @RequestParam(defaultValue = "5") int limit,
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
                activities = stravaService.fetchActivities(stravaTokens, 1, limit);
            } else {
                long now = Instant.now().getEpochSecond();
                long sevenDaysAgo = now - 7L * 24 * 60 * 60;
                List<Activity> all = garminService.fetchActivities(garminTokens, sevenDaysAgo, now);
                activities = all.size() > limit ? all.subList(0, limit) : all;
            }
            return ResponseEntity.ok(Map.of("activities", activities));
        } catch (Exception ex) {
            log.error("Error fetching recent activities", ex);
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                .body(Map.of("error", "Failed to fetch recent activities"));
        }
    }
}
