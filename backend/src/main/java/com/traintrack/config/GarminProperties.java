package com.traintrack.config;

import org.springframework.boot.context.properties.ConfigurationProperties;
import org.springframework.context.annotation.Configuration;

@Configuration
@ConfigurationProperties(prefix = "garmin")
public class GarminProperties {

    private String consumerKey;
    private String consumerSecret;
    private String redirectUri = "http://localhost:3001/api/auth/garmin/callback";

    public boolean isConfigured() {
        return consumerKey != null && !consumerKey.isBlank()
            && consumerSecret != null && !consumerSecret.isBlank();
    }

    public String getConsumerKey()    { return consumerKey; }
    public String getConsumerSecret() { return consumerSecret; }
    public String getRedirectUri()    { return redirectUri; }

    public void setConsumerKey(String v)    { this.consumerKey = v; }
    public void setConsumerSecret(String v) { this.consumerSecret = v; }
    public void setRedirectUri(String v)    { this.redirectUri = v; }
}
