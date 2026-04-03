package com.traintrack.model;

import com.fasterxml.jackson.annotation.JsonInclude;

@JsonInclude(JsonInclude.Include.NON_NULL)
public class Activity {

    public enum SportType { RUN, RIDE, SWIM, WALK, HIKE, STRENGTH, YOGA, OTHER }
    public enum Provider { STRAVA, GARMIN }

    private String id;
    private Provider provider;
    private String name;
    private SportType type;
    private String startDate;
    private long durationSeconds;
    private double distanceMeters;
    private double elevationGain;
    private Integer averageHeartRate;
    private Integer maxHeartRate;
    private Double averagePace;
    private Double averageSpeed;
    private Integer calories;
    private Integer kudos;

    public Activity() {}

    private Activity(Builder b) {
        this.id = b.id;
        this.provider = b.provider;
        this.name = b.name;
        this.type = b.type;
        this.startDate = b.startDate;
        this.durationSeconds = b.durationSeconds;
        this.distanceMeters = b.distanceMeters;
        this.elevationGain = b.elevationGain;
        this.averageHeartRate = b.averageHeartRate;
        this.maxHeartRate = b.maxHeartRate;
        this.averagePace = b.averagePace;
        this.averageSpeed = b.averageSpeed;
        this.calories = b.calories;
        this.kudos = b.kudos;
    }

    public static Builder builder() { return new Builder(); }

    public static class Builder {
        private String id;
        private Provider provider;
        private String name;
        private SportType type;
        private String startDate;
        private long durationSeconds;
        private double distanceMeters;
        private double elevationGain;
        private Integer averageHeartRate;
        private Integer maxHeartRate;
        private Double averagePace;
        private Double averageSpeed;
        private Integer calories;
        private Integer kudos;

        public Builder id(String v)                  { this.id = v; return this; }
        public Builder provider(Provider v)          { this.provider = v; return this; }
        public Builder name(String v)                { this.name = v; return this; }
        public Builder type(SportType v)             { this.type = v; return this; }
        public Builder startDate(String v)           { this.startDate = v; return this; }
        public Builder durationSeconds(long v)       { this.durationSeconds = v; return this; }
        public Builder distanceMeters(double v)      { this.distanceMeters = v; return this; }
        public Builder elevationGain(double v)       { this.elevationGain = v; return this; }
        public Builder averageHeartRate(Integer v)   { this.averageHeartRate = v; return this; }
        public Builder maxHeartRate(Integer v)       { this.maxHeartRate = v; return this; }
        public Builder averagePace(Double v)         { this.averagePace = v; return this; }
        public Builder averageSpeed(Double v)        { this.averageSpeed = v; return this; }
        public Builder calories(Integer v)           { this.calories = v; return this; }
        public Builder kudos(Integer v)              { this.kudos = v; return this; }
        public Activity build()                      { return new Activity(this); }
    }

    public String getId()                   { return id; }
    public Provider getProvider()           { return provider; }
    public String getName()                 { return name; }
    public SportType getType()              { return type; }
    public String getStartDate()            { return startDate; }
    public long getDurationSeconds()        { return durationSeconds; }
    public double getDistanceMeters()       { return distanceMeters; }
    public double getElevationGain()        { return elevationGain; }
    public Integer getAverageHeartRate()    { return averageHeartRate; }
    public Integer getMaxHeartRate()        { return maxHeartRate; }
    public Double getAveragePace()          { return averagePace; }
    public Double getAverageSpeed()         { return averageSpeed; }
    public Integer getCalories()            { return calories; }
    public Integer getKudos()               { return kudos; }
}
