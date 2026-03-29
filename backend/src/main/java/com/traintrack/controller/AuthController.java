package com.traintrack.controller;

import com.traintrack.model.AuthStatus;
import com.traintrack.model.GarminTokens;
import com.traintrack.model.StravaTokens;
import com.traintrack.service.GarminService;
import com.traintrack.service.StravaService;
import jakarta.servlet.http.HttpServletResponse;
import jakarta.servlet.http.HttpSession;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.io.IOException;
import java.util.Map;

@Slf4j
@RestController
@RequestMapping("/api/auth")
@RequiredArgsConstructor
public class AuthController {

    private static final String SESSION_STRAVA_TOKENS  = "stravaTokens";
    private static final String SESSION_GARMIN_TOKENS  = "garminTokens";
    private static final String SESSION_ATHLETE        = "athlete";
    private static final String SESSION_PROVIDER       = "provider";
    private static final String SESSION_GARMIN_REQ_TOK = "garminRequestToken";

    @Value("${frontend.url:http://localhost:5173}")
    private String frontendUrl;

    private final StravaService stravaService;
    private final GarminService garminService;

    // ── Status ──────────────────────────────────────────────────────────

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

    // ── Strava OAuth ────────────────────────────────────────────────────

    @GetMapping("/strava/connect")
    public void stravaConnect(HttpServletResponse response) throws IOException {
        response.sendRedirect(stravaService.buildAuthUrl());
    }

    @GetMapping("/strava/callback")
    public void stravaCallback(@RequestParam(required = false) String code,
                               @RequestParam(required = false) String error,
                               HttpSession session,
                               HttpServletResponse response) throws IOException {
        if (error != null || code == null) {
            response.sendRedirect(frontendUrl + "/connect?error=strava_denied");
            return;
        }
        try {
            StravaService.TokenExchangeResult result = stravaService.exchangeCode(code);
            session.setAttribute(SESSION_STRAVA_TOKENS, result.tokens());
            session.setAttribute(SESSION_ATHLETE, result.athlete());
            session.setAttribute(SESSION_PROVIDER, "strava");
            response.sendRedirect(frontendUrl + "/dashboard?connected=strava");
        } catch (Exception ex) {
            log.error("Strava callback error", ex);
            response.sendRedirect(frontendUrl + "/connect?error=strava_auth_failed");
        }
    }

    // ── Garmin OAuth ────────────────────────────────────────────────────

    @GetMapping("/garmin/connect")
    public void garminConnect(HttpSession session, HttpServletResponse response) throws IOException {
        try {
            GarminTokens requestToken = garminService.getRequestToken();
            session.setAttribute(SESSION_GARMIN_REQ_TOK, requestToken);
            response.sendRedirect(garminService.buildAuthUrl(requestToken.getOauthToken()));
        } catch (Exception ex) {
            log.error("Garmin connect error", ex);
            response.sendRedirect(frontendUrl + "/connect?error=garmin_init_failed");
        }
    }

    @GetMapping("/garmin/callback")
    public void garminCallback(@RequestParam(value = "oauth_token",    required = false) String oauthToken,
                               @RequestParam(value = "oauth_verifier", required = false) String oauthVerifier,
                               HttpSession session,
                               HttpServletResponse response) throws IOException {
        GarminTokens reqToken = (GarminTokens) session.getAttribute(SESSION_GARMIN_REQ_TOK);
        if (oauthToken == null || oauthVerifier == null || reqToken == null) {
            response.sendRedirect(frontendUrl + "/connect?error=garmin_denied");
            return;
        }
        try {
            GarminTokens accessTokens = garminService.getAccessToken(
                oauthToken, reqToken.getOauthTokenSecret(), oauthVerifier);
            session.setAttribute(SESSION_GARMIN_TOKENS, accessTokens);
            session.setAttribute(SESSION_PROVIDER, "garmin");
            if (session.getAttribute(SESSION_ATHLETE) == null) {
                session.setAttribute(SESSION_ATHLETE, AuthStatus.AthleteInfo.builder()
                    .id(oauthToken).name("Garmin Athlete").build());
            }
            response.sendRedirect(frontendUrl + "/dashboard?connected=garmin");
        } catch (Exception ex) {
            log.error("Garmin callback error", ex);
            response.sendRedirect(frontendUrl + "/connect?error=garmin_auth_failed");
        }
    }
}
