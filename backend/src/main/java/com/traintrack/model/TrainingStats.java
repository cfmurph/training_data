package com.traintrack.model;

import java.util.List;
import java.util.Map;

public class TrainingStats {

    public static class TypeSummary {
        private final int count;
        private final double distanceMeters;
        private final long durationSeconds;

        private TypeSummary(Builder b) {
            this.count = b.count;
            this.distanceMeters = b.distanceMeters;
            this.durationSeconds = b.durationSeconds;
        }

        public static Builder builder() { return new Builder(); }

        public static class Builder {
            private int count;
            private double distanceMeters;
            private long durationSeconds;

            public Builder count(int v)             { this.count = v; return this; }
            public Builder distanceMeters(double v) { this.distanceMeters = v; return this; }
            public Builder durationSeconds(long v)  { this.durationSeconds = v; return this; }
            public TypeSummary build()              { return new TypeSummary(this); }
        }

        public int getCount()              { return count; }
        public double getDistanceMeters()  { return distanceMeters; }
        public long getDurationSeconds()   { return durationSeconds; }
    }

    public static class WeeklyVolume {
        private final String weekStart;
        private final double totalDistanceMeters;
        private final long totalDurationSeconds;
        private final int count;
        private final List<String> activityTypes;

        private WeeklyVolume(Builder b) {
            this.weekStart = b.weekStart;
            this.totalDistanceMeters = b.totalDistanceMeters;
            this.totalDurationSeconds = b.totalDurationSeconds;
            this.count = b.count;
            this.activityTypes = b.activityTypes;
        }

        public static Builder builder() { return new Builder(); }

        public static class Builder {
            private String weekStart;
            private double totalDistanceMeters;
            private long totalDurationSeconds;
            private int count;
            private List<String> activityTypes;

            public Builder weekStart(String v)              { this.weekStart = v; return this; }
            public Builder totalDistanceMeters(double v)    { this.totalDistanceMeters = v; return this; }
            public Builder totalDurationSeconds(long v)     { this.totalDurationSeconds = v; return this; }
            public Builder count(int v)                     { this.count = v; return this; }
            public Builder activityTypes(List<String> v)    { this.activityTypes = v; return this; }
            public WeeklyVolume build()                     { return new WeeklyVolume(this); }
        }

        public String getWeekStart()              { return weekStart; }
        public double getTotalDistanceMeters()    { return totalDistanceMeters; }
        public long getTotalDurationSeconds()     { return totalDurationSeconds; }
        public int getCount()                     { return count; }
        public List<String> getActivityTypes()    { return activityTypes; }
    }

    private final int totalActivities;
    private final double totalDistanceMeters;
    private final long totalDurationSeconds;
    private final double totalElevationGain;
    private final Integer avgHeartRate;
    private final Map<String, TypeSummary> byType;
    private final List<WeeklyVolume> weeklyVolume;
    private final Activity longestActivity;

    private TrainingStats(Builder b) {
        this.totalActivities = b.totalActivities;
        this.totalDistanceMeters = b.totalDistanceMeters;
        this.totalDurationSeconds = b.totalDurationSeconds;
        this.totalElevationGain = b.totalElevationGain;
        this.avgHeartRate = b.avgHeartRate;
        this.byType = b.byType;
        this.weeklyVolume = b.weeklyVolume;
        this.longestActivity = b.longestActivity;
    }

    public static Builder builder() { return new Builder(); }

    public static class Builder {
        private int totalActivities;
        private double totalDistanceMeters;
        private long totalDurationSeconds;
        private double totalElevationGain;
        private Integer avgHeartRate;
        private Map<String, TypeSummary> byType;
        private List<WeeklyVolume> weeklyVolume;
        private Activity longestActivity;

        public Builder totalActivities(int v)                   { this.totalActivities = v; return this; }
        public Builder totalDistanceMeters(double v)            { this.totalDistanceMeters = v; return this; }
        public Builder totalDurationSeconds(long v)             { this.totalDurationSeconds = v; return this; }
        public Builder totalElevationGain(double v)             { this.totalElevationGain = v; return this; }
        public Builder avgHeartRate(Integer v)                  { this.avgHeartRate = v; return this; }
        public Builder byType(Map<String, TypeSummary> v)       { this.byType = v; return this; }
        public Builder weeklyVolume(List<WeeklyVolume> v)       { this.weeklyVolume = v; return this; }
        public Builder longestActivity(Activity v)              { this.longestActivity = v; return this; }
        public TrainingStats build()                            { return new TrainingStats(this); }
    }

    public int getTotalActivities()             { return totalActivities; }
    public double getTotalDistanceMeters()      { return totalDistanceMeters; }
    public long getTotalDurationSeconds()       { return totalDurationSeconds; }
    public double getTotalElevationGain()       { return totalElevationGain; }
    public Integer getAvgHeartRate()            { return avgHeartRate; }
    public Map<String, TypeSummary> getByType() { return byType; }
    public List<WeeklyVolume> getWeeklyVolume() { return weeklyVolume; }
    public Activity getLongestActivity()        { return longestActivity; }
}
