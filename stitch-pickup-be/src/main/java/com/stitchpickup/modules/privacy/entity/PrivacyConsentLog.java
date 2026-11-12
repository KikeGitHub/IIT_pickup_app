package com.stitchpickup.modules.privacy.entity;

import jakarta.persistence.*;
import lombok.*;
import org.hibernate.annotations.CreationTimestamp;

import java.time.Instant;
import java.util.UUID;

/**
 * PrivacyConsentLog — Evidencia inmutable de consentimiento de Aviso de Privacidad.
 *
 * Permite al colegio acreditar fehacientemente cuándo, desde qué dispositivo y qué
 * versión exacta (SHA-256) aceptó cada padre de familia o tutor legal.
 */
@Entity
@Table(name = "privacy_consent_logs")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class PrivacyConsentLog {

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    private UUID id;

    @Column(name = "user_id", nullable = false)
    private UUID userId;

    @Column(name = "user_role", nullable = false, length = 20)
    private String userRole;

    @Column(name = "user_email", nullable = false, length = 200)
    private String userEmail;

    @Column(name = "policy_version", nullable = false, length = 20)
    private String policyVersion;

    @Column(name = "policy_hash", nullable = false, length = 64)
    private String policyHash;

    @Column(name = "consent_scope", nullable = false, length = 40)
    private String consentScope;

    @Column(nullable = false)
    @Builder.Default
    private Boolean accepted = true;

    @CreationTimestamp
    @Column(name = "accepted_at", nullable = false, updatable = false)
    private Instant acceptedAt;

    @Column(name = "ip_address", length = 45)
    private String ipAddress;

    @Column(name = "user_agent", columnDefinition = "TEXT")
    private String userAgent;
}

