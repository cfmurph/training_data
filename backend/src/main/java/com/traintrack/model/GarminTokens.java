package com.traintrack.model;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class GarminTokens {
    private String oauthToken;
    private String oauthTokenSecret;
}
