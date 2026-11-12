package com.stitchpickup.modules.privacy.dto;

import jakarta.validation.constraints.AssertTrue;
import jakarta.validation.constraints.NotBlank;

public record AcceptPrivacyRequest(
    @NotBlank(message = "La versión de la política de privacidad es obligatoria")
    String policyVersion,

    @AssertTrue(message = "Debes aceptar expresamente el Aviso de Privacidad para continuar")
    boolean accepted,

    String scope
) {}

