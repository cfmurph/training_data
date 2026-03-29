package com.traintrack.model;

import com.fasterxml.jackson.annotation.JsonInclude;
import lombok.Builder;
import lombok.Data;

@Data
@Builder
@JsonInclude(JsonInclude.Include.NON_NULL)
public class AuthStatus {
    private boolean strava;
    private boolean garmin;
    private AthleteInfo athlete;
    private String provider;

    @Data
    @Builder
    @JsonInclude(JsonInclude.Include.NON_NULL)
    public static class AthleteInfo {
        private String id;
        private String name;
        private String username;
        private String avatar;
        private String city;
        private String country;
    }
}
