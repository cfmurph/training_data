package com.traintrack.model;

import lombok.Builder;
import lombok.Data;

import java.util.List;
import java.util.Map;

@Data
@Builder
public class TrainingStats {

    @Data
    @Builder
    public static class TypeSummary {
        private int count;
        private double distanceMeters;
        private long durationSeconds;
    }

    @Data
    @Builder
    public static class WeeklyVolume {
        private String weekStart;
        private double totalDistanceMeters;
        private long totalDurationSeconds;
        private int count;
        private List<String> activityTypes;
    }

    private int totalActivities;
    private double totalDistanceMeters;
    private long totalDurationSeconds;
    private double totalElevationGain;
    private Integer avgHeartRate;
    private Map<String, TypeSummary> byType;
    private List<WeeklyVolume> weeklyVolume;
    private Activity longestActivity;
}
