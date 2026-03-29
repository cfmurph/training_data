package com.traintrack.config;

import lombok.Data;
import org.springframework.boot.context.properties.ConfigurationProperties;
import org.springframework.context.annotation.Configuration;

@Data
@Configuration
@ConfigurationProperties(prefix = "strava")
public class StravaProperties {
    private String clientId;
    private String clientSecret;
    private String redirectUri;
}
