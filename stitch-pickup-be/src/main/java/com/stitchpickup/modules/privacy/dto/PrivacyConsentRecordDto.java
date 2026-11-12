package com.stitchpickup.modules.privacy.dto;

import java.time.Instant;

public record PrivacyConsentRecordDto(
    String id,
    String policyVersion,
    String policyHash,
    String consentScope,
    boolean accepted,
    Instant acceptedAt
) {}

