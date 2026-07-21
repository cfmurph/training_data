package com.traintrack.config;

import com.traintrack.model.StravaTokens;
import com.traintrack.service.GarminService;
import com.traintrack.service.StravaService;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.AutoConfigureMockMvc;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.boot.test.mock.mockito.MockBean;
import org.springframework.test.web.servlet.MockMvc;

import java.util.Collections;

import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.anyInt;
import static org.mockito.Mockito.when;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

/**
 * Regression test for the auth-bypass bug: SecurityConfig requires
 * .authenticated() on /api/**, but this app's real login state lives in
 * HttpSession attributes (stravaTokens/garminTokens), not Spring Security's
 * SecurityContext. Without SessionAuthenticationFilter bridging the two,
 * every request to a protected endpoint gets rejected by Spring Security
 * itself with 401 — even for a session that has valid OAuth tokens.
 */
@SpringBootTest(properties = {
    "strava.client-id=test-client-id",
    "strava.client-secret=test-client-secret"
})
@AutoConfigureMockMvc
class SecurityConfigIntegrationTest {

    @Autowired
    private MockMvc mockMvc;

    @MockBean
    private StravaService stravaService;

    @MockBean
    private GarminService garminService;

    @Test
    void anonymousRequestToProtectedEndpointIsRejected() throws Exception {
        mockMvc.perform(get("/api/activities/recent"))
            .andExpect(status().isUnauthorized());
    }

    @Test
    void healthEndpointIsPublicEvenWithoutAuthentication() throws Exception {
        mockMvc.perform(get("/api/health"))
            .andExpect(status().isOk());
    }

    @Test
    void sessionWithStravaTokensIsTreatedAsAuthenticated() throws Exception {
        StravaTokens tokens = new StravaTokens("access", "refresh", Long.MAX_VALUE, "Bearer");
        when(stravaService.refreshIfNeeded(any())).thenReturn(tokens);
        when(stravaService.fetchActivities(any(), anyInt(), anyInt())).thenReturn(Collections.emptyList());

        mockMvc.perform(get("/api/activities/recent").sessionAttr("stravaTokens", tokens))
            .andExpect(status().isOk());
    }
}
