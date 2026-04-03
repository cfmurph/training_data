package com.traintrack.model;

public class StravaTokens {
    private String accessToken;
    private String refreshToken;
    private long expiresAt;
    private String tokenType;

    public StravaTokens() {}

    public StravaTokens(String accessToken, String refreshToken, long expiresAt, String tokenType) {
        this.accessToken = accessToken;
        this.refreshToken = refreshToken;
        this.expiresAt = expiresAt;
        this.tokenType = tokenType;
    }

    public String getAccessToken()  { return accessToken; }
    public String getRefreshToken() { return refreshToken; }
    public long getExpiresAt()      { return expiresAt; }
    public String getTokenType()    { return tokenType; }

    public void setAccessToken(String v)  { this.accessToken = v; }
    public void setRefreshToken(String v) { this.refreshToken = v; }
    public void setExpiresAt(long v)      { this.expiresAt = v; }
    public void setTokenType(String v)    { this.tokenType = v; }
}
