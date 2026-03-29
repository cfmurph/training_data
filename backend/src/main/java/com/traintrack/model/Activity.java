package com.traintrack.model;

import com.fasterxml.jackson.annotation.JsonInclude;
import lombok.Builder;
import lombok.Data;

@Data
@Builder
@JsonInclude(JsonInclude.Include.NON_NULL)
public class Activity {

    public enum SportType {
        RUN, RIDE, SWIM, WALK, HIKE, STRENGTH, YOGA, OTHER
    }

    public enum Provider {
        STRAVA, GARMIN
    }

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
}
