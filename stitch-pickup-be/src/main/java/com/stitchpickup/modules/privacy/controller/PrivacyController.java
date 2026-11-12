package com.stitchpickup.modules.privacy.controller;

import com.stitchpickup.modules.privacy.dto.AcceptPrivacyRequest;
import com.stitchpickup.modules.privacy.dto.PrivacyConsentRecordDto;
import com.stitchpickup.modules.privacy.dto.PrivacyPolicyDocument;
import com.stitchpickup.modules.privacy.service.PrivacyService;
import com.stitchpickup.security.JwtTokenProvider;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.security.SecurityRequirement;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.UUID;

@RestController
@RequestMapping("/api/v1/privacy")
@RequiredArgsConstructor
@Tag(name = "Privacy", description = "Aviso de Privacidad Integral y auditoría de consentimiento")
public class PrivacyController {

    private final PrivacyService privacyService;
    private final JwtTokenProvider tokenProvider;

    @GetMapping("/current")
    @Operation(
        summary = "Obtener Aviso de Privacidad vigente (Público)",
        description = "Retorna la versión vigente del Aviso de Privacidad Integral, su huella SHA-256 y secciones legales."
    )
    public ResponseEntity<PrivacyPolicyDocument> getCurrentPolicy() {
        return ResponseEntity.ok(privacyService.getCurrentPolicy());
    }

    @PostMapping("/accept")
    @PreAuthorize("hasRole('PARENT')")
    @SecurityRequirement(name = "bearerAuth")
    @Operation(
        summary = "Registrar aceptación explícita de Aviso de Privacidad (Padre)",
        description = "Registra en la bitácora inmutable de consentimiento la aceptación de la versión vigente."
    )
    public ResponseEntity<PrivacyConsentRecordDto> acceptCurrentPolicy(
            @Valid @RequestBody AcceptPrivacyRequest body,
            HttpServletRequest httpRequest) {

        UUID parentId = extractUserId(httpRequest);
        return ResponseEntity.ok(privacyService.acceptPolicyAuthenticated(parentId, body, httpRequest));
    }

    @GetMapping("/my-consents")
    @PreAuthorize("hasRole('PARENT')")
    @SecurityRequirement(name = "bearerAuth")
    @Operation(
        summary = "Consultar historial de consentimientos del padre autenticado"
    )
    public ResponseEntity<List<PrivacyConsentRecordDto>> getMyConsents(HttpServletRequest httpRequest) {
        UUID parentId = extractUserId(httpRequest);
        return ResponseEntity.ok(privacyService.getParentConsentHistory(parentId));
    }

    private UUID extractUserId(HttpServletRequest request) {
        String token = request.getHeader("Authorization").substring(7);
        return UUID.fromString(tokenProvider.getUserIdFromToken(token));
    }
}

