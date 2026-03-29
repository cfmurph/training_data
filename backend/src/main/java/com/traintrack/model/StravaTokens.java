package com.traintrack.model;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class StravaTokens {
    private String accessToken;
    private String refreshToken;
    private long expiresAt;
    private String tokenType;
}
