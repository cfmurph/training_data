package com.traintrack.config;

import org.springframework.boot.context.properties.ConfigurationProperties;
import org.springframework.context.annotation.Configuration;

@Configuration
@ConfigurationProperties(prefix = "strava")
public class StravaProperties {
    private String clientId;
    private String clientSecret;
    private String redirectUri;

    public String getClientId()     { return clientId; }
    public String getClientSecret() { return clientSecret; }
    public String getRedirectUri()  { return redirectUri; }

    public void setClientId(String v)     { this.clientId = v; }
    public void setClientSecret(String v) { this.clientSecret = v; }
    public void setRedirectUri(String v)  { this.redirectUri = v; }
}
