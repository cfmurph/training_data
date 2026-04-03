package com.traintrack.service;

import com.fasterxml.jackson.databind.JsonNode;
import com.traintrack.config.StravaProperties;
import com.traintrack.model.Activity;
import com.traintrack.model.AuthStatus;
import com.traintrack.model.StravaTokens;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.stereotype.Service;
import org.springframework.web.reactive.function.BodyInserters;
import org.springframework.web.reactive.function.client.WebClient;
import org.springframework.web.util.UriComponentsBuilder;

import java.time.Instant;
import java.util.*;

@Service
public class StravaService {

    private static final Logger log = LoggerFactory.getLogger(StravaService.class);

    private static final String AUTH_URL  = "https://www.strava.com/oauth/authorize";
    private static final String TOKEN_URL = "https://www.strava.com/api/v3/oauth/token";
    private static final String API_BASE  = "https://www.strava.com/api/v3";

    private static final Map<String, Activity.SportType> TYPE_MAP = Map.ofEntries(
        Map.entry("Run",              Activity.SportType.RUN),
        Map.entry("TrailRun",         Activity.SportType.RUN),
        Map.entry("VirtualRun",       Activity.SportType.RUN),
        Map.entry("Ride",             Activity.SportType.RIDE),
        Map.entry("VirtualRide",      Activity.SportType.RIDE),
        Map.entry("MountainBikeRide", Activity.SportType.RIDE),
        Map.entry("GravelRide",       Activity.SportType.RIDE),
        Map.entry("Swim",             Activity.SportType.SWIM),
        Map.entry("Walk",             Activity.SportType.WALK),
        Map.entry("Hike",             Activity.SportType.HIKE),
        Map.entry("WeightTraining",   Activity.SportType.STRENGTH),
        Map.entry("Workout",          Activity.SportType.STRENGTH),
        Map.entry("Yoga",             Activity.SportType.YOGA)
    );

    private final StravaProperties props;
    private final WebClient webClient;

    public StravaService(StravaProperties props) {
        this.props = props;
        this.webClient = WebClient.create();
    }

    public record TokenExchangeResult(StravaTokens tokens, AuthStatus.AthleteInfo athlete) {}

    public String buildAuthUrl() {
        return UriComponentsBuilder.fromHttpUrl(AUTH_URL)
            .queryParam("client_id",       props.getClientId())
            .queryParam("redirect_uri",    props.getRedirectUri())
            .queryParam("response_type",   "code")
            .queryParam("approval_prompt", "auto")
            .queryParam("scope",           "read,activity:read_all,profile:read_all")
            .toUriString();
    }

    public TokenExchangeResult exchangeCode(String code) {
        JsonNode body = webClient.post()
            .uri(TOKEN_URL)
            .body(BodyInserters.fromFormData("client_id",    props.getClientId())
                .with("client_secret", props.getClientSecret())
                .with("code",          code)
                .with("grant_type",    "authorization_code"))
            .retrieve()
            .bodyToMono(JsonNode.class)
            .block();

        if (body == null) throw new RuntimeException("Empty response from Strava token endpoint");

        StravaTokens tokens = new StravaTokens(
            body.path("access_token").asText(),
            body.path("refresh_token").asText(),
            body.path("expires_at").asLong(),
            body.path("token_type").asText("Bearer")
        );

        JsonNode ath = body.path("athlete");
        AuthStatus.AthleteInfo athlete = AuthStatus.AthleteInfo.builder()
            .id(ath.path("id").asText())
            .name(ath.path("firstname").asText("") + " " + ath.path("lastname").asText(""))
            .username(ath.path("username").asText(null))
            .avatar(ath.path("profile").asText(null))
            .city(ath.path("city").asText(null))
            .country(ath.path("country").asText(null))
            .build();

        return new TokenExchangeResult(tokens, athlete);
    }

    public StravaTokens refreshIfNeeded(StravaTokens tokens) {
        if (Instant.now().getEpochSecond() < tokens.getExpiresAt() - 300) {
            return tokens;
        }
        log.debug("Refreshing Strava access token");
        JsonNode body = webClient.post()
            .uri(TOKEN_URL)
            .body(BodyInserters.fromFormData("client_id",    props.getClientId())
                .with("client_secret",  props.getClientSecret())
                .with("refresh_token",  tokens.getRefreshToken())
                .with("grant_type",     "refresh_token"))
            .retrieve()
            .bodyToMono(JsonNode.class)
            .block();

        if (body == null) throw new RuntimeException("Empty refresh response from Strava");

        return new StravaTokens(
            body.path("access_token").asText(),
            body.path("refresh_token").asText(tokens.getRefreshToken()),
            body.path("expires_at").asLong(),
            body.path("token_type").asText("Bearer")
        );
    }

    public List<Activity> fetchActivities(StravaTokens tokens, int page, int perPage) {
        StravaTokens valid = refreshIfNeeded(tokens);
        JsonNode[] raw = webClient.get()
            .uri(API_BASE + "/athlete/activities?page={p}&per_page={pp}", page, perPage)
            .header("Authorization", "Bearer " + valid.getAccessToken())
            .retrieve()
            .bodyToMono(JsonNode[].class)
            .block();

        if (raw == null) return Collections.emptyList();
        List<Activity> result = new ArrayList<>();
        for (JsonNode node : raw) result.add(normalizeActivity(node));
        return result;
    }

    public JsonNode fetchAthleteStats(StravaTokens tokens, String athleteId) {
        StravaTokens valid = refreshIfNeeded(tokens);
        return webClient.get()
            .uri(API_BASE + "/athletes/{id}/stats", athleteId)
            .header("Authorization", "Bearer " + valid.getAccessToken())
            .retrieve()
            .bodyToMono(JsonNode.class)
            .block();
    }

    private Activity normalizeActivity(JsonNode node) {
        String rawType = node.path("sport_type").asText(node.path("type").asText("other"));
        Activity.SportType type = TYPE_MAP.getOrDefault(rawType, Activity.SportType.OTHER);

        double avgSpeed = node.path("average_speed").asDouble(0);
        Double pace = avgSpeed > 0 ? 1000.0 / avgSpeed : null;

        return Activity.builder()
            .id("strava-" + node.path("id").asText())
            .provider(Activity.Provider.STRAVA)
            .name(node.path("name").asText("Activity"))
            .type(type)
            .startDate(node.path("start_date").asText())
            .durationSeconds(node.path("moving_time").asLong(node.path("elapsed_time").asLong(0)))
            .distanceMeters(node.path("distance").asDouble(0))
            .elevationGain(node.path("total_elevation_gain").asDouble(0))
            .averageHeartRate(node.has("average_heartrate") ? (int) node.path("average_heartrate").asDouble() : null)
            .maxHeartRate(node.has("max_heartrate") ? (int) node.path("max_heartrate").asDouble() : null)
            .averageSpeed(avgSpeed > 0 ? avgSpeed : null)
            .averagePace(pace)
            .calories(node.has("calories") ? node.path("calories").asInt() : null)
            .kudos(node.has("kudos_count") ? node.path("kudos_count").asInt() : null)
            .build();
    }
}
