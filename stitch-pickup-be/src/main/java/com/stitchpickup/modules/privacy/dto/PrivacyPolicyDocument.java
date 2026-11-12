package com.stitchpickup.modules.privacy.dto;

import java.util.List;

/**
 * Documento oficial versionado del Aviso de Privacidad Integral (LFPDPPP 2025).
 */
public record PrivacyPolicyDocument(
    String version,
    String effectiveDate,
    String sha256Hash,
    String title,
    String responsibleName,
    String responsibleAddress,
    String arcoEmail,
    String authorityName,
    String simplifiedSummary,
    List<PrivacyPolicySection> sections
) {
    public record PrivacyPolicySection(
        String id,
        String title,
        String body,
        List<String> highlights
    ) {}
}

