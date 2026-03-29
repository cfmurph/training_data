package com.traintrack.config;

import lombok.Data;
import org.springframework.boot.context.properties.ConfigurationProperties;
import org.springframework.context.annotation.Configuration;

@Data
@Configuration
@ConfigurationProperties(prefix = "garmin")
public class GarminProperties {
    private String consumerKey;
    private String consumerSecret;
    private String redirectUri;
}
