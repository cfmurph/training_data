package com.traintrack.service;

import com.fasterxml.jackson.databind.JsonNode;
import com.traintrack.config.TrainingPeaksProperties;
import com.traintrack.model.Activity;
import com.traintrack.model.AuthStatus;
import io.netty.channel.ChannelOption;
import io.netty.handler.timeout.ReadTimeoutHandler;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.http.client.reactive.ReactorClientHttpConnector;
import org.springframework.stereotype.Service;
import org.springframework.web.reactive.function.BodyInserters;
import org.springframework.web.reactive.function.client.WebClient;
import org.springframework.web.util.UriComponentsBuilder;
import reactor.netty.http.client.HttpClient;

import java.time.Duration;
import java.util.*;

/**
 * Training Peaks OAuth 2.0 integration.
 *
 * Training Peaks requires a partnership application before the API is accessible.
 * Register at https://www.trainingpeaks.com/developer/
 *
 * OAuth endpoints:
 *   Auth:  https://oauth.trainingpeaks.com/OAuth/Authorize
 *   Token: https://oauth.trainingpeaks.com/OAuth/Token
 *   API:   https://api.trainingpeaks.com/v1/
 */
@Service
public class TrainingPeaksService {

    private static final Logger log = LoggerFactory.getLogger(TrainingPeaksService.class);

    private static final String AUTH_URL  = "https://oauth.trainingpeaks.com/OAuth/Authorize";
    private static final String TOKEN_URL = "https://oauth.trainingpeaks.com/OAuth/Token";
    private static final String API_BASE  = "https://api.trainingpeaks.com/v1";

    private final TrainingPeaksProperties props;
    private final WebClient webClient;

    public TrainingPeaksService(TrainingPeaksProperties props) {
        this.props = props;
        HttpClient httpClient = HttpClient.create()
            .option(ChannelOption.CONNECT_TIMEOUT_MILLIS, 5_000)
            .responseTimeout(Duration.ofSeconds(15))
            .doOnConnected(conn -> conn.addHandlerLast(new ReadTimeoutHandler(15)));
        this.webClient = WebClient.builder()
            .clientConnector(new ReactorClientHttpConnector(httpClient))
            .build();
    }

    public record TokenResult(String accessToken, String refreshToken,
                               long expiresAt, AuthStatus.AthleteInfo athlete) {}

    public boolean isConfigured() {
        return props.isConfigured();
    }

    public String buildAuthUrl(String state) {
        return UriComponentsBuilder.fromHttpUrl(AUTH_URL)
            .queryParam("response_type",  "code")
            .queryParam("client_id",      props.getClientId())
            .queryParam("redirect_uri",   props.getRedirectUri())
            .queryParam("scope",          "workouts:read athlete:read")
            .queryParam("state",          state)
            .toUriString();
    }

    public TokenResult exchangeCode(String code) {
        JsonNode body = webClient.post()
            .uri(TOKEN_URL)
            .body(BodyInserters.fromFormData("grant_type",    "authorization_code")
                .with("code",          code)
                .with("client_id",     props.getClientId())
                .with("client_secret", props.getClientSecret())
                .with("redirect_uri",  props.getRedirectUri()))
            .retrieve()
            .bodyToMono(JsonNode.class)
            .block();

        if (body == null) throw new RuntimeException("Empty response from Training Peaks token endpoint");

        long expiresAt = System.currentTimeMillis() / 1000
            + body.path("expires_in").asLong(3600);

        return new TokenResult(
            body.path("access_token").asText(),
            body.path("refresh_token").asText(),
            expiresAt,
            fetchAthlete(body.path("access_token").asText())
        );
    }

    public List<Activity> fetchActivities(String accessToken, int page, int perPage) {
        try {
            JsonNode[] raw = webClient.get()
                .uri(API_BASE + "/workouts?pageIndex={p}&pageSize={pp}", page, perPage)
                .header("Authorization", "Bearer " + accessToken)
                .retrieve()
                .bodyToMono(JsonNode[].class)
                .block();

            if (raw == null) return Collections.emptyList();
            List<Activity> result = new ArrayList<>();
            for (JsonNode node : raw) result.add(normalizeWorkout(node));
            return result;
        } catch (Exception e) {
            log.error("Failed to fetch Training Peaks activities", e);
            return Collections.emptyList();
        }
    }

    private AuthStatus.AthleteInfo fetchAthlete(String accessToken) {
        try {
            JsonNode ath = webClient.get()
                .uri(API_BASE + "/athlete/profile")
                .header("Authorization", "Bearer " + accessToken)
                .retrieve()
                .bodyToMono(JsonNode.class)
                .block();

            if (ath == null) return AuthStatus.AthleteInfo.builder().name("Training Peaks Athlete").build();

            return AuthStatus.AthleteInfo.builder()
                .id(ath.path("Id").asText())
                .name(ath.path("FirstName").asText("") + " " + ath.path("LastName").asText(""))
                .username(ath.path("Username").asText(null))
                .build();
        } catch (Exception e) {
            log.warn("Could not fetch Training Peaks athlete profile: {}", e.getMessage());
            return AuthStatus.AthleteInfo.builder().name("Training Peaks Athlete").build();
        }
    }

    private Activity normalizeWorkout(JsonNode node) {
        String type = node.path("WorkoutTypeValueId").asText("0");
        Activity.SportType sportType = switch (type) {
            case "2" -> Activity.SportType.RIDE;   // Bike
            case "1" -> Activity.SportType.RUN;    // Run
            case "3" -> Activity.SportType.SWIM;   // Swim
            default  -> Activity.SportType.OTHER;
        };

        return Activity.builder()
            .id("tp-" + node.path("Id").asText())
            .provider(Activity.Provider.GARMIN) // re-use GARMIN enum; TP treated as additional source
            .name(node.path("Title").asText("Training Peaks Workout"))
            .type(sportType)
            .startDate(node.path("WorkoutDay").asText())
            .durationSeconds((long)(node.path("TotalTime").asDouble(0) * 60))
            .distanceMeters(node.path("Distance").asDouble(0) * 1000)
            .elevationGain(node.path("Elevation").asDouble(0))
            .averageHeartRate(node.has("HeartRateAverage")
                ? node.path("HeartRateAverage").asInt() : null)
            .calories(node.has("Calories") ? node.path("Calories").asInt() : null)
            .build();
    }
}
