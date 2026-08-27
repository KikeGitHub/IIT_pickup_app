package com.stitchpickup.security;

import jakarta.servlet.FilterChain;
import jakarta.servlet.ServletException;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.security.web.authentication.WebAuthenticationDetailsSource;
import org.springframework.stereotype.Component;
import org.springframework.util.StringUtils;
import org.springframework.web.filter.OncePerRequestFilter;

import java.io.IOException;

/**
 * JwtAuthenticationFilter — Intercepta cada request y valida el Bearer token.
 *
 * Flujo:
 * 1. Extrae "Authorization: Bearer <token>" del header
 * 2. Valida el token con JwtTokenProvider
 * 3. Carga UserDetails desde BD
 * 4. Establece el Authentication en el SecurityContext
 *
 * SOLID — S: Solo autentica la request. No genera tokens ni verifica roles.
 */
@Component
@RequiredArgsConstructor
@Slf4j
public class JwtAuthenticationFilter extends OncePerRequestFilter {

    private final JwtTokenProvider tokenProvider;
    private final UserDetailsServiceImpl userDetailsService;

    @Override
    protected void doFilterInternal(
            HttpServletRequest request,
            HttpServletResponse response,
            FilterChain filterChain) throws ServletException, IOException {

        try {
            String token = extractToken(request);

            if (StringUtils.hasText(token) && tokenProvider.validateToken(token)) {
                String email = tokenProvider.getEmailFromToken(token);
                String role = tokenProvider.getRoleFromToken(token);

                if (role == null || role.isBlank()) {
                    role = "PARENT";
                }

                String springRole = role.startsWith("ROLE_") ? role : "ROLE_" + role.toUpperCase();
                var authority = new org.springframework.security.core.authority.SimpleGrantedAuthority(springRole);
                var authorities = java.util.List.of(authority);

                UserDetails userDetails = org.springframework.security.core.userdetails.User.builder()
                        .username(email)
                        .password("")
                        .authorities(authorities)
                        .build();

                var authToken = new UsernamePasswordAuthenticationToken(
                        userDetails, null, authorities
                );
                authToken.setDetails(new WebAuthenticationDetailsSource().buildDetails(request));
                SecurityContextHolder.getContext().setAuthentication(authToken);
            }
        } catch (Exception e) {
            log.debug("No se pudo autenticar la solicitud: {}", e.getMessage());
        }

        filterChain.doFilter(request, response);
    }

    private String extractToken(HttpServletRequest request) {
        String bearerToken = request.getHeader("Authorization");
        if (StringUtils.hasText(bearerToken) && bearerToken.startsWith("Bearer ")) {
            return bearerToken.substring(7);
        }
        return null;
    }
}
