package com.traintrack.service;

import com.traintrack.model.Activity;
import com.traintrack.model.TrainingStats;
import org.springframework.stereotype.Service;

import java.time.*;
import java.time.temporal.WeekFields;
import java.util.*;
import java.util.stream.Collectors;

@Service
public class StatsService {

    public TrainingStats compute(List<Activity> activities) {
        if (activities == null || activities.isEmpty()) {
            return TrainingStats.builder()
                .totalActivities(0)
                .totalDistanceMeters(0)
                .totalDurationSeconds(0)
                .totalElevationGain(0)
                .weeklyVolume(Collections.emptyList())
                .byType(Collections.emptyMap())
                .build();
        }

        double totalDistance  = activities.stream().mapToDouble(Activity::getDistanceMeters).sum();
        long totalDuration    = activities.stream().mapToLong(Activity::getDurationSeconds).sum();
        double totalElevation = activities.stream().mapToDouble(Activity::getElevationGain).sum();

        OptionalDouble avgHr = activities.stream()
            .filter(a -> a.getAverageHeartRate() != null)
            .mapToInt(Activity::getAverageHeartRate)
            .average();

        Map<String, TrainingStats.TypeSummary> byType = activities.stream()
            .collect(Collectors.groupingBy(
                a -> a.getType().name().toLowerCase(),
                Collectors.collectingAndThen(Collectors.toList(), list ->
                    TrainingStats.TypeSummary.builder()
                        .count(list.size())
                        .distanceMeters(list.stream().mapToDouble(Activity::getDistanceMeters).sum())
                        .durationSeconds(list.stream().mapToLong(Activity::getDurationSeconds).sum())
                        .build()
                )
            ));

        Activity longest = activities.stream()
            .max(Comparator.comparingDouble(Activity::getDistanceMeters))
            .orElse(null);

        Map<LocalDate, List<Activity>> byWeek = activities.stream()
            .collect(Collectors.groupingBy(a -> mondayOf(parseDate(a.getStartDate()))));

        List<TrainingStats.WeeklyVolume> weeklyVolume = byWeek.entrySet().stream()
            .sorted(Map.Entry.comparingByKey())
            .map(e -> {
                List<Activity> wActs = e.getValue();
                return TrainingStats.WeeklyVolume.builder()
                    .weekStart(e.getKey().toString())
                    .totalDistanceMeters(wActs.stream().mapToDouble(Activity::getDistanceMeters).sum())
                    .totalDurationSeconds(wActs.stream().mapToLong(Activity::getDurationSeconds).sum())
                    .count(wActs.size())
                    .activityTypes(wActs.stream()
                        .map(a -> a.getType().name().toLowerCase())
                        .distinct()
                        .collect(Collectors.toList()))
                    .build();
            })
            .collect(Collectors.toList());

        return TrainingStats.builder()
            .totalActivities(activities.size())
            .totalDistanceMeters(totalDistance)
            .totalDurationSeconds(totalDuration)
            .totalElevationGain(totalElevation)
            .avgHeartRate(avgHr.isPresent() ? (int) Math.round(avgHr.getAsDouble()) : null)
            .byType(byType)
            .weeklyVolume(weeklyVolume)
            .longestActivity(longest)
            .build();
    }

    private LocalDate parseDate(String isoDate) {
        try {
            return Instant.parse(isoDate).atZone(ZoneOffset.UTC).toLocalDate();
        } catch (Exception e) {
            return LocalDate.now();
        }
    }

    private LocalDate mondayOf(LocalDate date) {
        return date.with(WeekFields.ISO.dayOfWeek(), 1);
    }
}
