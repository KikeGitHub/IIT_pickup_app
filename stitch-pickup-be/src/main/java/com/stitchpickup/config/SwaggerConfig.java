package com.stitchpickup.config;

import io.swagger.v3.oas.models.Components;
import io.swagger.v3.oas.models.OpenAPI;
import io.swagger.v3.oas.models.info.Contact;
import io.swagger.v3.oas.models.info.Info;
import io.swagger.v3.oas.models.info.License;
import io.swagger.v3.oas.models.security.SecurityRequirement;
import io.swagger.v3.oas.models.security.SecurityScheme;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;

/**
 * SwaggerConfig — Configura Springdoc OpenAPI 3.
 *
 * Acceso: http://localhost:8080/swagger-ui.html
 *
 * SOLID — S: Solo configura la documentación de la API.
 */
@Configuration
public class SwaggerConfig {

    @Bean
    public OpenAPI openAPI() {
        final String securitySchemeName = "bearerAuth";

        return new OpenAPI()
                .info(new Info()
                        .title("Stitch Pickup API")
                        .description("""
                            Sistema de logística de recogida de alumnos para el **Instituto Inglés de Toluca**.
                            
                            ## Flujos principales
                            - **Padre** → Envía alerta de proximidad (offline-first)
                            - **Monitor/Maestro** → Recibe alertas en tiempo real vía WebSocket
                            - **Admin** → Gestión completa de usuarios, alumnos y KPIs
                            """)
                        .version("1.0.0")
                        .contact(new Contact()
                                .name("Instituto Inglés de Toluca")
                                .email("sistemas@iit.edu.mx"))
                        .license(new License()
                                .name("Privado — Uso interno IIT")
                                .url("#")))
                .addSecurityItem(new SecurityRequirement().addList(securitySchemeName))
                .components(new Components()
                        .addSecuritySchemes(securitySchemeName, new SecurityScheme()
                                .name(securitySchemeName)
                                .type(SecurityScheme.Type.HTTP)
                                .scheme("bearer")
                                .bearerFormat("JWT")
                                .description("Ingresa tu JWT token (sin el prefijo 'Bearer')")));
    }
}
