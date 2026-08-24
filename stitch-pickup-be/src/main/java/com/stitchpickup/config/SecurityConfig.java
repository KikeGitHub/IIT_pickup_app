package com.stitchpickup.config;

import com.stitchpickup.security.JwtAuthenticationFilter;
import com.stitchpickup.security.UserDetailsServiceImpl;
import lombok.RequiredArgsConstructor;
import org.springframework.web.cors.CorsConfigurationSource;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.http.HttpMethod;
import org.springframework.security.authentication.AuthenticationManager;
import org.springframework.security.authentication.AuthenticationProvider;
import org.springframework.security.authentication.dao.DaoAuthenticationProvider;
import org.springframework.security.config.annotation.authentication.configuration.AuthenticationConfiguration;
import org.springframework.security.config.annotation.method.configuration.EnableMethodSecurity;
import org.springframework.security.config.annotation.web.builders.HttpSecurity;
import org.springframework.security.config.annotation.web.configuration.EnableWebSecurity;
import org.springframework.security.config.annotation.web.configurers.AbstractHttpConfigurer;
import org.springframework.security.config.http.SessionCreationPolicy;
import org.springframework.security.crypto.bcrypt.BCryptPasswordEncoder;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.security.web.SecurityFilterChain;
import org.springframework.security.web.authentication.UsernamePasswordAuthenticationFilter;

/**
 * SecurityConfig — Configuración central de Spring Security.
 *
 * Principios (ADR-002-jwt-stateless):
 * - STATELESS: sin sesiones HTTP ni CSRF (JWT es el mecanismo de estado)
 * - CORS habilitado con CorsConfigurationSource
 * - Rutas públicas: /api/v1/auth/**, /swagger-ui/**, /api-docs/**
 * - Rutas protegidas: según el rol requerido
 *
 * SOLID — S: Solo configura seguridad HTTP. Lógica de negocio en servicios.
 */
@Configuration
@EnableWebSecurity
@EnableMethodSecurity
@RequiredArgsConstructor
public class SecurityConfig {

    private final JwtAuthenticationFilter jwtFilter;
    private final UserDetailsServiceImpl userDetailsService;
    private final CorsConfigurationSource corsConfigurationSource;

    // ─── Endpoints públicos ───────────────────────────────────────────────────
    private static final String[] PUBLIC_ENDPOINTS = {
        "/api/v1/auth/**",
        "/swagger-ui/**",
        "/swagger-ui.html",
        "/api-docs/**",
        "/v3/api-docs/**",
        "/actuator/health",
        "/ws/**"                // WebSocket handshake — Spring Security lo maneja aparte
    };

    @Bean
    public SecurityFilterChain filterChain(HttpSecurity http) throws Exception {
        http
            // Habilitar CORS explícitamente en el pipeline de Spring Security
            .cors(cors -> cors.configurationSource(corsConfigurationSource))

            // Deshabilitar CSRF (JWT es stateless — no usamos cookies de sesión)
            .csrf(AbstractHttpConfigurer::disable)

            // Sin sesiones HTTP
            .sessionManagement(session ->
                session.sessionCreationPolicy(SessionCreationPolicy.STATELESS))

            // Reglas de autorización
            .authorizeHttpRequests(auth -> auth
                // Permitir solicitudes preflight OPTIONS en todas las rutas
                .requestMatchers(HttpMethod.OPTIONS, "/**").permitAll()
                // Públicos
                .requestMatchers(PUBLIC_ENDPOINTS).permitAll()
                // Solo ADMIN
                .requestMatchers("/api/v1/admin/**").hasRole("ADMIN")
                .requestMatchers("/api/v1/users/**").hasRole("ADMIN")
                .requestMatchers("/api/v1/kpis/**").hasRole("ADMIN")
                // TEACHER y ADMIN — monitor de entregas
                .requestMatchers("/api/v1/deliveries/*/dispatch").hasAnyRole("TEACHER", "ADMIN")
                .requestMatchers(HttpMethod.GET, "/api/v1/alerts/today").hasAnyRole("TEACHER", "ADMIN")
                .requestMatchers(HttpMethod.GET, "/api/v1/deliveries/today").hasAnyRole("TEACHER", "ADMIN")
                // Solo PARENT — envío de alertas
                .requestMatchers(HttpMethod.POST, "/api/v1/alerts").hasRole("PARENT")
                .requestMatchers(HttpMethod.GET, "/api/v1/students/my-students").hasRole("PARENT")
                // Todo lo demás requiere autenticación
                .anyRequest().authenticated()
            )

            // Proveedor de autenticación
            .authenticationProvider(authenticationProvider())

            // Insertar filtro JWT antes del filtro estándar de Spring
            .addFilterBefore(jwtFilter, UsernamePasswordAuthenticationFilter.class);

        return http.build();
    }

    @Bean
    public AuthenticationProvider authenticationProvider() {
        DaoAuthenticationProvider provider = new DaoAuthenticationProvider();
        provider.setUserDetailsService(userDetailsService);
        provider.setPasswordEncoder(passwordEncoder());
        return provider;
    }

    @Bean
    public AuthenticationManager authenticationManager(AuthenticationConfiguration config)
            throws Exception {
        return config.getAuthenticationManager();
    }

    @Bean
    public PasswordEncoder passwordEncoder() {
        return new BCryptPasswordEncoder(12);  // Coste 12 (seguro para producción)
    }
}
