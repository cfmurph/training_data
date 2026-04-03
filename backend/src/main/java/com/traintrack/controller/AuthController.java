package com.traintrack.controller;

import com.traintrack.config.GarminProperties;
import com.traintrack.model.AuthStatus;
import com.traintrack.model.GarminTokens;
import com.traintrack.model.StravaTokens;
import com.traintrack.service.GarminService;
import com.traintrack.service.StravaService;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import jakarta.servlet.http.HttpSession;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.io.IOException;
import java.security.SecureRandom;
import java.util.Base64;
import java.util.Map;

@RestController
@RequestMapping("/api/auth")
public class AuthController {

    private static final Logger log = LoggerFactory.getLogger(AuthController.class);

    private static final String SESSION_STRAVA_TOKENS   = "stravaTokens";
    private static final String SESSION_GARMIN_TOKENS   = "garminTokens";
    private static final String SESSION_ATHLETE         = "athlete";
    private static final String SESSION_PROVIDER        = "provider";
    private static final String SESSION_GARMIN_REQ_TOK  = "garminRequestToken";
    private static final String SESSION_OAUTH_STATE     = "oauthState";

    private static final SecureRandom SECURE_RANDOM = new SecureRandom();

    @Value("${frontend.url:http://localhost:5173}")
    private String frontendUrl;

    private final StravaService stravaService;
    private final GarminService garminService;
    private final GarminProperties garminProperties;

    public AuthController(StravaService stravaService, GarminService garminService,
                          GarminProperties garminProperties) {
        this.stravaService = stravaService;
        this.garminService = garminService;
        this.garminProperties = garminProperties;
    }

    // ── Helpers ──────────────────────────────────────────────────────────

    private static String generateState() {
        byte[] bytes = new byte[32];
        SECURE_RANDOM.nextBytes(bytes);
        return Base64.getUrlEncoder().withoutPadding().encodeToString(bytes);
    }

    /**
     * Rotates the session ID after successful login to prevent session fixation.
     * Copies all existing attributes into the new session.
     */
    private HttpSession rotateSession(HttpServletRequest request) {
        HttpSession old = request.getSession(false);
        Map<String, Object> attrs = new java.util.HashMap<>();
        if (old != null) {
            java.util.Enumeration<String> names = old.getAttributeNames();
            while (names.hasMoreElements()) {
                String name = names.nextElement();
                attrs.put(name, old.getAttribute(name));
            }
            old.invalidate();
        }
        HttpSession fresh = request.getSession(true);
        attrs.forEach(fresh::setAttribute);
        return fresh;
    }

    // ── Status / logout ───────────────────────────────────────────────────

    @GetMapping("/status")
    public AuthStatus status(HttpSession session) {
        boolean hasStrava = session.getAttribute(SESSION_STRAVA_TOKENS) != null;
        boolean hasGarmin = session.getAttribute(SESSION_GARMIN_TOKENS) != null;
        AuthStatus.AthleteInfo athlete = (AuthStatus.AthleteInfo) session.getAttribute(SESSION_ATHLETE);
        String provider = (String) session.getAttribute(SESSION_PROVIDER);

        return AuthStatus.builder()
            .strava(hasStrava)
            .garmin(hasGarmin)
            .athlete(athlete)
            .provider(provider)
            .build();
    }

    @PostMapping("/logout")
    public ResponseEntity<Map<String, Boolean>> logout(HttpSession session) {
        session.invalidate();
        return ResponseEntity.ok(Map.of("success", true));
    }

    // ── Strava OAuth ──────────────────────────────────────────────────────

    @GetMapping("/strava/connect")
    public void stravaConnect(HttpServletRequest request, HttpServletResponse response) throws IOException {
        String state = generateState();
        request.getSession(true).setAttribute(SESSION_OAUTH_STATE, state);
        response.sendRedirect(stravaService.buildAuthUrl(state));
    }

    @GetMapping("/strava/callback")
    public void stravaCallback(@RequestParam(required = false) String code,
                               @RequestParam(required = false) String error,
                               @RequestParam(required = false) String state,
                               HttpServletRequest request,
                               HttpServletResponse response) throws IOException {
        HttpSession session = request.getSession(false);
        String expectedState = session != null ? (String) session.getAttribute(SESSION_OAUTH_STATE) : null;

        if (error != null || code == null) {
            response.sendRedirect(frontendUrl + "/connect?error=strava_denied");
            return;
        }
        // Verify state to prevent CSRF
        if (state == null || !state.equals(expectedState)) {
            log.warn("Strava OAuth state mismatch — possible CSRF attempt");
            response.sendRedirect(frontendUrl + "/connect?error=strava_auth_failed");
            return;
        }

        try {
            StravaService.TokenExchangeResult result = stravaService.exchangeCode(code);
            // Rotate session ID to prevent session fixation
            HttpSession fresh = rotateSession(request);
            fresh.removeAttribute(SESSION_OAUTH_STATE);
            fresh.setAttribute(SESSION_STRAVA_TOKENS, result.tokens());
            fresh.setAttribute(SESSION_ATHLETE, result.athlete());
            fresh.setAttribute(SESSION_PROVIDER, "strava");
            response.sendRedirect(frontendUrl + "/dashboard?connected=strava");
        } catch (Exception ex) {
            log.error("Strava callback error", ex);
            response.sendRedirect(frontendUrl + "/connect?error=strava_auth_failed");
        }
    }

    // ── Garmin OAuth ──────────────────────────────────────────────────────

    @GetMapping("/garmin/connect")
    public void garminConnect(HttpServletRequest request, HttpServletResponse response) throws IOException {
        if (!garminProperties.isConfigured()) {
            response.sendRedirect(frontendUrl + "/connect?error=garmin_not_configured");
            return;
        }
        try {
            String state = generateState();
            GarminTokens requestToken = garminService.getRequestToken();
            HttpSession session = request.getSession(true);
            session.setAttribute(SESSION_GARMIN_REQ_TOK, requestToken);
            session.setAttribute(SESSION_OAUTH_STATE, state);
            response.sendRedirect(garminService.buildAuthUrl(requestToken.getOauthToken(), state));
        } catch (Exception ex) {
            log.error("Garmin connect error", ex);
            response.sendRedirect(frontendUrl + "/connect?error=garmin_init_failed");
        }
    }

    @GetMapping("/garmin/callback")
    public void garminCallback(@RequestParam(value = "oauth_token",    required = false) String oauthToken,
                               @RequestParam(value = "oauth_verifier", required = false) String oauthVerifier,
                               HttpServletRequest request,
                               HttpServletResponse response) throws IOException {
        HttpSession session = request.getSession(false);
        GarminTokens reqToken = session != null ? (GarminTokens) session.getAttribute(SESSION_GARMIN_REQ_TOK) : null;

        if (oauthToken == null || oauthVerifier == null || reqToken == null) {
            response.sendRedirect(frontendUrl + "/connect?error=garmin_denied");
            return;
        }
        // Verify the returned oauth_token matches what we issued
        if (!oauthToken.equals(reqToken.getOauthToken())) {
            log.warn("Garmin OAuth token mismatch — possible CSRF attempt");
            response.sendRedirect(frontendUrl + "/connect?error=garmin_auth_failed");
            return;
        }

        try {
            GarminTokens accessTokens = garminService.getAccessToken(
                oauthToken, reqToken.getOauthTokenSecret(), oauthVerifier);
            // Rotate session ID to prevent session fixation
            HttpSession fresh = rotateSession(request);
            fresh.removeAttribute(SESSION_GARMIN_REQ_TOK);
            fresh.removeAttribute(SESSION_OAUTH_STATE);
            fresh.setAttribute(SESSION_GARMIN_TOKENS, accessTokens);
            fresh.setAttribute(SESSION_PROVIDER, "garmin");
            if (fresh.getAttribute(SESSION_ATHLETE) == null) {
                fresh.setAttribute(SESSION_ATHLETE, AuthStatus.AthleteInfo.builder()
                    .id(oauthToken).name("Garmin Athlete").build());
            }
            response.sendRedirect(frontendUrl + "/dashboard?connected=garmin");
        } catch (Exception ex) {
            log.error("Garmin callback error", ex);
            response.sendRedirect(frontendUrl + "/connect?error=garmin_auth_failed");
        }
    }
}
