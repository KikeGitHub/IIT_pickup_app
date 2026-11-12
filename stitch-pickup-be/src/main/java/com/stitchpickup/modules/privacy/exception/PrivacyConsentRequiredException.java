package com.stitchpickup.modules.privacy.exception;

import lombok.Getter;

/**
 * Lanzada cuando el padre de familia no ha otorgado su consentimiento expreso
 * para la versión vigente del Aviso de Privacidad.
 */
@Getter
public class PrivacyConsentRequiredException extends RuntimeException {

    private final String policyVersion;

    public PrivacyConsentRequiredException(String message, String policyVersion) {
        super(message);
        this.policyVersion = policyVersion;
    }
}

