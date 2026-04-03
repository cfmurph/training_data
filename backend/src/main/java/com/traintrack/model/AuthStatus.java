package com.traintrack.model;

import com.fasterxml.jackson.annotation.JsonInclude;

@JsonInclude(JsonInclude.Include.NON_NULL)
public class AuthStatus {

    @JsonInclude(JsonInclude.Include.NON_NULL)
    public static class AthleteInfo {
        private final String id;
        private final String name;
        private final String username;
        private final String avatar;
        private final String city;
        private final String country;

        private AthleteInfo(Builder b) {
            this.id = b.id;
            this.name = b.name;
            this.username = b.username;
            this.avatar = b.avatar;
            this.city = b.city;
            this.country = b.country;
        }

        public static Builder builder() { return new Builder(); }

        public static class Builder {
            private String id, name, username, avatar, city, country;

            public Builder id(String v)       { this.id = v; return this; }
            public Builder name(String v)     { this.name = v; return this; }
            public Builder username(String v) { this.username = v; return this; }
            public Builder avatar(String v)   { this.avatar = v; return this; }
            public Builder city(String v)     { this.city = v; return this; }
            public Builder country(String v)  { this.country = v; return this; }
            public AthleteInfo build()        { return new AthleteInfo(this); }
        }

        public String getId()       { return id; }
        public String getName()     { return name; }
        public String getUsername() { return username; }
        public String getAvatar()   { return avatar; }
        public String getCity()     { return city; }
        public String getCountry()  { return country; }
    }

    private final boolean strava;
    private final boolean garmin;
    private final AthleteInfo athlete;
    private final String provider;

    private AuthStatus(Builder b) {
        this.strava = b.strava;
        this.garmin = b.garmin;
        this.athlete = b.athlete;
        this.provider = b.provider;
    }

    public static Builder builder() { return new Builder(); }

    public static class Builder {
        private boolean strava;
        private boolean garmin;
        private AthleteInfo athlete;
        private String provider;

        public Builder strava(boolean v)        { this.strava = v; return this; }
        public Builder garmin(boolean v)        { this.garmin = v; return this; }
        public Builder athlete(AthleteInfo v)   { this.athlete = v; return this; }
        public Builder provider(String v)       { this.provider = v; return this; }
        public AuthStatus build()               { return new AuthStatus(this); }
    }

    public boolean isStrava()       { return strava; }
    public boolean isGarmin()       { return garmin; }
    public AthleteInfo getAthlete() { return athlete; }
    public String getProvider()     { return provider; }
}
