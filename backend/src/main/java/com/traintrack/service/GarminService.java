package com.traintrack.service;

import com.fasterxml.jackson.databind.JsonNode;
import com.traintrack.config.GarminProperties;
import com.traintrack.model.Activity;
import com.traintrack.model.GarminTokens;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.web.reactive.function.client.WebClient;

import javax.crypto.Mac;
import javax.crypto.spec.SecretKeySpec;
import java.net.URLEncoder;
import java.nio.charset.StandardCharsets;
import java.security.SecureRandom;
import java.time.Instant;
import java.util.*;
import java.util.stream.Collectors;

@Slf4j
@Service
@RequiredArgsConstructor
public class GarminService {

    private static final String REQUEST_TOKEN_URL = "https://connectapi.garmin.com/oauth-service/oauth/request_token";
    private static final String AUTH_URL          = "https://connect.garmin.com/oauthConfirm";
    private static final String ACCESS_TOKEN_URL  = "https://connectapi.garmin.com/oauth-service/oauth/access_token";
    private static final String API_BASE          = "https://apis.garmin.com/wellness-api/rest";

    private static final Map<String, Activity.SportType> TYPE_MAP = Map.ofEntries(
        Map.entry("RUNNING",          Activity.SportType.RUN),
        Map.entry("CYCLING",          Activity.SportType.RIDE),
        Map.entry("SWIMMING",         Activity.SportType.SWIM),
        Map.entry("WALKING",          Activity.SportType.WALK),
        Map.entry("HIKING",           Activity.SportType.HIKE),
        Map.entry("STRENGTH_TRAINING", Activity.SportType.STRENGTH),
        Map.entry("FITNESS_EQUIPMENT", Activity.SportType.STRENGTH),
        Map.entry("YOGA",             Activity.SportType.YOGA)
    );

    private final GarminProperties props;
    private final WebClient webClient = WebClient.create();
    private final SecureRandom random = new SecureRandom();

    // ── OAuth 1.0a helpers ──────────────────────────────────────────────

    private String nonce() {
        byte[] bytes = new byte[16];
        random.nextBytes(bytes);
        return HexFormat.of().formatHex(bytes);
    }

    private String encode(String s) {
        return URLEncoder.encode(s, StandardCharsets.UTF_8);
    }

    private String hmacSha1(String signingKey, String data) {
        try {
            Mac mac = Mac.getInstance("HmacSHA1");
            mac.init(new SecretKeySpec(signingKey.getBytes(StandardCharsets.UTF_8), "HmacSHA1"));
            return Base64.getEncoder().encodeToString(mac.doFinal(data.getBytes(StandardCharsets.UTF_8)));
        } catch (Exception e) {
            throw new RuntimeException("HMAC-SHA1 error", e);
        }
    }

    private String buildOAuthHeader(String method, String url,
                                    String token, String tokenSecret,
                                    Map<String, String> extraParams) {
        String timestamp = String.valueOf(Instant.now().getEpochSecond());
        String nonce = nonce();

        Map<String, String> oauthParams = new TreeMap<>();
        oauthParams.put("oauth_consumer_key",     props.getConsumerKey());
        oauthParams.put("oauth_nonce",            nonce);
        oauthParams.put("oauth_signature_method", "HMAC-SHA1");
        oauthParams.put("oauth_timestamp",        timestamp);
        oauthParams.put("oauth_version",          "1.0");
        if (token != null) oauthParams.put("oauth_token", token);
        if (extraParams != null) oauthParams.putAll(extraParams);

        String paramString = oauthParams.entrySet().stream()
            .sorted(Map.Entry.comparingByKey())
            .map(e -> encode(e.getKey()) + "=" + encode(e.getValue()))
            .collect(Collectors.joining("&"));

        String signatureBase = method.toUpperCase() + "&" + encode(url) + "&" + encode(paramString);
        String signingKey = encode(props.getConsumerSecret()) + "&" + encode(tokenSecret != null ? tokenSecret : "");
        String signature = hmacSha1(signingKey, signatureBase);
        oauthParams.put("oauth_signature", signature);

        return "OAuth " + oauthParams.entrySet().stream()
            .map(e -> encode(e.getKey()) + "=\"" + encode(e.getValue()) + "\"")
            .collect(Collectors.joining(", "));
    }

    // ── OAuth flow ──────────────────────────────────────────────────────

    public GarminTokens getRequestToken() {
        String header = buildOAuthHeader("POST", REQUEST_TOKEN_URL, null, null,
            Map.of("oauth_callback", props.getRedirectUri()));

        String body = webClient.post()
            .uri(REQUEST_TOKEN_URL)
            .header("Authorization", header)
            .retrieve()
            .bodyToMono(String.class)
            .block();

        return parseTokenResponse(body);
    }

    public String buildAuthUrl(String requestToken) {
        return AUTH_URL + "?oauth_token=" + requestToken;
    }

    public GarminTokens getAccessToken(String requestToken, String requestTokenSecret, String verifier) {
        String header = buildOAuthHeader("POST", ACCESS_TOKEN_URL, requestToken, requestTokenSecret,
            Map.of("oauth_verifier", verifier));

        String body = webClient.post()
            .uri(ACCESS_TOKEN_URL)
            .header("Authorization", header)
            .retrieve()
            .bodyToMono(String.class)
            .block();

        return parseTokenResponse(body);
    }

    private GarminTokens parseTokenResponse(String body) {
        if (body == null) throw new RuntimeException("Empty token response from Garmin");
        Map<String, String> params = Arrays.stream(body.split("&"))
            .map(s -> s.split("=", 2))
            .filter(a -> a.length == 2)
            .collect(Collectors.toMap(a -> a[0], a -> a[1]));
        return new GarminTokens(
            params.getOrDefault("oauth_token", ""),
            params.getOrDefault("oauth_token_secret", "")
        );
    }

    // ── Data fetching ────────────────────────────────────────────────────

    public List<Activity> fetchActivities(GarminTokens tokens, long startSeconds, long endSeconds) {
        String url = API_BASE + "/activities";
        Map<String, String> extra = Map.of(
            "uploadStartTimeInSeconds", String.valueOf(startSeconds),
            "uploadEndTimeInSeconds",   String.valueOf(endSeconds)
        );
        String header = buildOAuthHeader("GET", url, tokens.getOauthToken(), tokens.getOauthTokenSecret(), extra);

        JsonNode response = webClient.get()
            .uri(url + "?uploadStartTimeInSeconds={s}&uploadEndTimeInSeconds={e}", startSeconds, endSeconds)
            .header("Authorization", header)
            .retrieve()
            .bodyToMono(JsonNode.class)
            .block();

        List<Activity> result = new ArrayList<>();
        if (response != null && response.has("activityList")) {
            for (JsonNode node : response.path("activityList")) {
                result.add(normalizeActivity(node));
            }
        }
        return result;
    }

    private Activity normalizeActivity(JsonNode node) {
        String rawType = node.path("activityType").asText("OTHER").toUpperCase();
        Activity.SportType type = TYPE_MAP.getOrDefault(rawType, Activity.SportType.OTHER);

        long startSeconds = node.path("startTimeInSeconds").asLong(0);
        double avgSpeed = node.path("averageSpeedInMetersPerSecond").asDouble(0);
        Double pace = avgSpeed > 0 ? 1000.0 / avgSpeed : null;

        return Activity.builder()
            .id("garmin-" + node.path("activityId").asText())
            .provider(Activity.Provider.GARMIN)
            .name(node.path("activityName").asText(node.path("activityType").asText("Activity")))
            .type(type)
            .startDate(Instant.ofEpochSecond(startSeconds).toString())
            .durationSeconds(node.path("durationInSeconds").asLong(0))
            .distanceMeters(node.path("distanceInMeters").asDouble(0))
            .elevationGain(node.path("totalElevationGainInMeters").asDouble(0))
            .averageHeartRate(node.has("averageHeartRateInBeatsPerMinute")
                ? node.path("averageHeartRateInBeatsPerMinute").asInt() : null)
            .maxHeartRate(node.has("maxHeartRateInBeatsPerMinute")
                ? node.path("maxHeartRateInBeatsPerMinute").asInt() : null)
            .averageSpeed(avgSpeed > 0 ? avgSpeed : null)
            .averagePace(pace)
            .calories(node.has("activeKilocalories") ? node.path("activeKilocalories").asInt() : null)
            .build();
    }
}
