package com.traintrack.config;

import jakarta.validation.constraints.NotBlank;
import org.springframework.boot.context.properties.ConfigurationProperties;
import org.springframework.context.annotation.Configuration;
import org.springframework.validation.annotation.Validated;

@Validated
@Configuration
@ConfigurationProperties(prefix = "strava")
public class StravaProperties {

    /**
     * Required. Set via STRAVA_CLIENT_ID environment variable.
     * Get credentials at https://www.strava.com/settings/api
     */
    @NotBlank(message = "STRAVA_CLIENT_ID must be set")
    private String clientId;

    @NotBlank(message = "STRAVA_CLIENT_SECRET must be set")
    private String clientSecret;

    private String redirectUri = "http://localhost:3001/api/auth/strava/callback";

    public String getClientId()     { return clientId; }
    public String getClientSecret() { return clientSecret; }
    public String getRedirectUri()  { return redirectUri; }

    public void setClientId(String v)     { this.clientId = v; }
    public void setClientSecret(String v) { this.clientSecret = v; }
    public void setRedirectUri(String v)  { this.redirectUri = v; }
}
