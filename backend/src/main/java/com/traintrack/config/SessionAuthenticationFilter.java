package com.traintrack.config;

import jakarta.servlet.FilterChain;
import jakarta.servlet.ServletException;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import jakarta.servlet.http.HttpSession;
import org.springframework.security.core.authority.SimpleGrantedAuthority;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.security.web.authentication.preauth.PreAuthenticatedAuthenticationToken;
import org.springframework.web.filter.OncePerRequestFilter;

import java.io.IOException;
import java.util.List;

/**
 * Bridges this app's manual, session-based OAuth login (Strava/Garmin tokens
 * stored as {@code HttpSession} attributes by {@code AuthController}) into
 * Spring Security's {@code SecurityContext}.
 *
 * <p>Without this filter, {@code SecurityConfig} requires
 * {@code .authenticated()} on {@code /api/**}, but nothing ever populates a
 * non-anonymous {@code Authentication} — every request would receive an
 * {@code AnonymousAuthenticationToken}, which Spring Security's
 * {@code authenticated()} rule always rejects with 401, regardless of the
 * session's actual OAuth login state.</p>
 */
public class SessionAuthenticationFilter extends OncePerRequestFilter {

    private static final String SESSION_STRAVA_TOKENS = "stravaTokens";
    private static final String SESSION_GARMIN_TOKENS = "garminTokens";

    @Override
    protected void doFilterInternal(HttpServletRequest request, HttpServletResponse response, FilterChain filterChain)
            throws ServletException, IOException {

        if (SecurityContextHolder.getContext().getAuthentication() == null) {
            HttpSession session = request.getSession(false);
            if (session != null) {
                boolean hasStrava = session.getAttribute(SESSION_STRAVA_TOKENS) != null;
                boolean hasGarmin = session.getAttribute(SESSION_GARMIN_TOKENS) != null;
                if (hasStrava || hasGarmin) {
                    String provider = hasStrava ? "strava" : "garmin";
                    PreAuthenticatedAuthenticationToken auth = new PreAuthenticatedAuthenticationToken(
                        provider, null, List.of(new SimpleGrantedAuthority("ROLE_USER")));
                    SecurityContextHolder.getContext().setAuthentication(auth);
                }
            }
        }

        filterChain.doFilter(request, response);
    }
}
