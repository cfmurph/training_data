package com.traintrack.model;

public class GarminTokens {
    private String oauthToken;
    private String oauthTokenSecret;

    public GarminTokens() {}

    public GarminTokens(String oauthToken, String oauthTokenSecret) {
        this.oauthToken = oauthToken;
        this.oauthTokenSecret = oauthTokenSecret;
    }

    public String getOauthToken()       { return oauthToken; }
    public String getOauthTokenSecret() { return oauthTokenSecret; }

    public void setOauthToken(String v)       { this.oauthToken = v; }
    public void setOauthTokenSecret(String v) { this.oauthTokenSecret = v; }
}
