package com.stitchpickup.modules.privacy.service;

import com.stitchpickup.modules.privacy.dto.AcceptPrivacyRequest;
import com.stitchpickup.modules.privacy.dto.PrivacyConsentRecordDto;
import com.stitchpickup.modules.privacy.dto.PrivacyPolicyDocument;
import com.stitchpickup.modules.privacy.dto.PrivacyPolicyDocument.PrivacyPolicySection;
import com.stitchpickup.modules.privacy.entity.PrivacyConsentLog;
import com.stitchpickup.modules.privacy.exception.PrivacyConsentRequiredException;
import com.stitchpickup.modules.privacy.repository.PrivacyConsentLogRepository;
import com.stitchpickup.modules.user.entity.ParentUser;
import com.stitchpickup.modules.user.repository.ParentUserRepository;
import jakarta.annotation.PostConstruct;
import jakarta.servlet.http.HttpServletRequest;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.nio.charset.StandardCharsets;
import java.security.MessageDigest;
import java.time.Instant;
import java.util.HexFormat;
import java.util.List;
import java.util.UUID;

/**
 * PrivacyService — Gestión del Aviso de Privacidad Integral y bitácora de consentimiento.
 *
 * Cumplimiento conforme a la Ley Federal de Protección de Datos Personales en Posesión
 * de los Particulares (LFPDPPP, DOF 20/03/2025) y lineamientos aplicables a datos de menores.
 */
@Service
@RequiredArgsConstructor
@Slf4j
public class PrivacyService {

    public static final String SCOPE_LOGIN = "LOGIN_PRIVACY_POLICY";

    private final PrivacyConsentLogRepository consentLogRepository;
    private final ParentUserRepository parentUserRepository;

    @Value("${iit-pickup.privacy.version:2026.1}")
    private String currentVersion;

    @Value("${iit-pickup.privacy.effective-date:2026-11-11}")
    private String effectiveDate;

    @Value("${iit-pickup.privacy.responsible-name:Instituto Inglés de Toluca}")
    private String responsibleName;

    @Value("${iit-pickup.privacy.responsible-address:Toluca de Lerdo, Estado de México (Domicilio institucional registrado ante la SEP)}")
    private String responsibleAddress;

    @Value("${iit-pickup.privacy.arco-email:privacidad@institutoingles.edu.mx}")
    private String arcoEmail;

    @Value("${iit-pickup.privacy.authority-name:Secretaría Anticorrupción y Buen Gobierno}")
    private String authorityName;

    private PrivacyPolicyDocument cachedDocument;

    @PostConstruct
    void initDocument() {
        List<PrivacyPolicySection> sections = buildSections();
        String hash = computeSha256(currentVersion, effectiveDate, responsibleName, responsibleAddress, arcoEmail, sections);
        String simplified = String.format(
                "%s, con domicilio en %s, es responsable del tratamiento de tus datos personales y los del menor a tu cargo "
                        + "exclusivamente para coordinar la entrega escolar segura en IIT Pickup. La fotografía del menor es estrictamente opcional, "
                        + "no se utiliza biometría ni existen fines publicitarios. Puedes consultar este aviso completo o ejercer tus derechos ARCO en %s.",
                responsibleName, responsibleAddress, arcoEmail
        );

        this.cachedDocument = new PrivacyPolicyDocument(
                currentVersion,
                effectiveDate,
                hash,
                "Aviso de Privacidad Integral y Protección de Datos de Menores — IIT Pickup",
                responsibleName,
                responsibleAddress,
                arcoEmail,
                authorityName,
                simplified,
                sections
        );
    }

    public PrivacyPolicyDocument getCurrentPolicy() {
        return cachedDocument;
    }

    public String getCurrentVersion() {
        return currentVersion;
    }

    public boolean hasAcceptedCurrentVersion(ParentUser parent) {
        return currentVersion.equals(parent.getPrivacyPolicyVersion())
                && parent.getPrivacyAcceptedAt() != null;
    }

    @Transactional
    public void validateAndRecordParentLoginConsent(
            ParentUser parent,
            Boolean acceptedPrivacyPolicy,
            String requestedVersion,
            HttpServletRequest httpRequest) {

        boolean acceptedExplicitly = Boolean.TRUE.equals(acceptedPrivacyPolicy);

        if (acceptedExplicitly) {
            if (requestedVersion != null && !requestedVersion.isBlank()
                    && !currentVersion.equals(requestedVersion.trim())) {
                throw new PrivacyConsentRequiredException(
                        "La versión del Aviso de Privacidad cambió. Revisa y acepta la versión vigente (" + currentVersion + ").",
                        currentVersion
                );
            }
            recordConsentInternal(parent, SCOPE_LOGIN, httpRequest);
            return;
        }

        if (!hasAcceptedCurrentVersion(parent)) {
            throw new PrivacyConsentRequiredException(
                    "Debes leer y aceptar el Aviso de Privacidad vigente (" + currentVersion + ") antes de ingresar.",
                    currentVersion
            );
        }
    }

    @Transactional
    public PrivacyConsentRecordDto acceptPolicyAuthenticated(
            UUID parentId,
            AcceptPrivacyRequest request,
            HttpServletRequest httpRequest) {

        if (!currentVersion.equals(request.policyVersion().trim())) {
            throw new PrivacyConsentRequiredException(
                    "Debes aceptar la versión vigente del Aviso de Privacidad (" + currentVersion + ").",
                    currentVersion
            );
        }

        ParentUser parent = parentUserRepository.findById(parentId)
                .orElseThrow(() -> new IllegalArgumentException("Usuario padre no encontrado"));

        String scope = (request.scope() != null && !request.scope().isBlank())
                ? request.scope().trim()
                : SCOPE_LOGIN;

        PrivacyConsentLog saved = recordConsentInternal(parent, scope, httpRequest);
        return toDto(saved);
    }

    @Transactional(readOnly = true)
    public List<PrivacyConsentRecordDto> getParentConsentHistory(UUID parentId) {
        return consentLogRepository.findByUserIdOrderByAcceptedAtDesc(parentId)
                .stream()
                .map(this::toDto)
                .toList();
    }

    private PrivacyConsentLog recordConsentInternal(
            ParentUser parent,
            String scope,
            HttpServletRequest httpRequest) {

        Instant now = Instant.now();
        parent.setPrivacyPolicyVersion(currentVersion);
        parent.setPrivacyAcceptedAt(now);
        parentUserRepository.save(parent);

        PrivacyConsentLog entry = PrivacyConsentLog.builder()
                .userId(parent.getId())
                .userRole("PARENT")
                .userEmail(parent.getEmail())
                .policyVersion(currentVersion)
                .policyHash(cachedDocument.sha256Hash())
                .consentScope(scope)
                .accepted(true)
                .ipAddress(extractClientIp(httpRequest))
                .userAgent(extractUserAgent(httpRequest))
                .build();

        PrivacyConsentLog saved = consentLogRepository.save(entry);
        log.info("[Privacy] Consentimiento registrado: user={} version={} scope={} ip={}",
                parent.getEmail(), currentVersion, scope, saved.getIpAddress());
        return saved;
    }

    private PrivacyConsentRecordDto toDto(PrivacyConsentLog logEntry) {
        return new PrivacyConsentRecordDto(
                logEntry.getId().toString(),
                logEntry.getPolicyVersion(),
                logEntry.getPolicyHash(),
                logEntry.getConsentScope(),
                Boolean.TRUE.equals(logEntry.getAccepted()),
                logEntry.getAcceptedAt()
        );
    }

    private String extractClientIp(HttpServletRequest request) {
        if (request == null) return null;
        String realIp = request.getHeader("X-Real-IP");
        if (realIp != null && !realIp.isBlank()) {
            return truncate(realIp.trim(), 45);
        }
        String forwarded = request.getHeader("X-Forwarded-For");
        if (forwarded != null && !forwarded.isBlank()) {
            return truncate(forwarded.split(",")[0].trim(), 45);
        }
        return truncate(request.getRemoteAddr(), 45);
    }

    private String extractUserAgent(HttpServletRequest request) {
        if (request == null) return null;
        String ua = request.getHeader("User-Agent");
        return ua != null ? truncate(ua.trim(), 512) : null;
    }

    private String truncate(String value, int maxLen) {
        if (value == null) return null;
        return value.length() <= maxLen ? value : value.substring(0, maxLen);
    }

    private List<PrivacyPolicySection> buildSections() {
        return List.of(
                new PrivacyPolicySection(
                        "responsable",
                        "1. Identidad y Domicilio del Responsable",
                        responsibleName + ", con domicilio en " + responsibleAddress
                                + ", es el Responsable del uso, custodia y protección de los datos personales recabados a través de la plataforma IIT Pickup, "
                                + "en cumplimiento de la Ley Federal de Protección de Datos Personales en Posesión de los Particulares (LFPDPPP vigente).",
                        List.of(
                                "Titular y Responsable del tratamiento: " + responsibleName + ".",
                                "El desarrollador tecnológico actúa únicamente como Encargado de infraestructura sin derechos de uso comercial ni propiedad sobre los datos."
                        )
                ),
                new PrivacyPolicySection(
                        "datos-menores",
                        "2. Datos Personales Recabados y Protección Reforzada a Menores",
                        "Aplicando el principio de minimización de datos y el interés superior de la niñez, la plataforma trata únicamente la información estrictamente indispensable para validar la entrega segura del alumno a sus tutores autorizados.",
                        List.of(
                                "Del padre, madre o tutor legal: nombre completo, usuario/correo de acceso y registro de alertas/recepción.",
                                "Del alumno (menor de edad): nombre completo, nivel/grado/grupo escolar y, de forma 100% OPCIONAL, fotografía de identificación visual.",
                                "Personas autorizadas adicionales (cuando sean registradas por el plantel): nombre, parentesco y teléfono de contacto de emergencia.",
                                "SIN BIOMETRÍA NI RASTREO GPS: IIT Pickup NO realiza reconocimiento facial automatizado ni rastrea la ubicación GPS continua de los tutores."
                        )
                ),
                new PrivacyPolicySection(
                        "foto-opcional",
                        "3. Fotografía Opcional del Alumno y Eliminación Inmediata",
                        "La carga de fotografía del menor es completamente voluntaria. El sistema de recogida funciona al 100% únicamente con el nombre y grupo del alumno.",
                        List.of(
                                "Si decides subir una fotografía desde el portal de padres, esta se utiliza exclusivamente para que el docente o monitor confirme visualmente la identidad en puerta.",
                                "Puedes eliminar o reemplazar la fotografía en cualquier momento mediante el botón 'Quitar foto actual' en tu portal; al hacerlo, el archivo se borra de forma definitiva de nuestros servidores."
                        )
                ),
                new PrivacyPolicySection(
                        "finalidades",
                        "4. Finalidades del Tratamiento (Cero Uso Comercial)",
                        "Tus datos y los del menor se tratan única y exclusivamente para finalidades primarias indispensables para la seguridad escolar:",
                        List.of(
                                "Notificar en tiempo real la llegada del padre o tutor autorizado al plantel.",
                                "Mostrar al personal docente autorizado el listado operativo de entrega del día.",
                                "Generar bitácoras históricas internas con fecha, hora y modalidad de entrega para seguridad y control escolar.",
                                "Finalidades secundarias: NINGUNA. No enviamos publicidad, no perfilamos menores ni comercializamos bases de datos."
                        )
                ),
                new PrivacyPolicySection(
                        "encargados-transferencias",
                        "5. Encargados Tecnológicos y Transferencias",
                        responsibleName + " no vende, alquila ni transfiere tus datos personales a terceros ajenos a la prestación del servicio educativo y de seguridad escolar.",
                        List.of(
                                "Infraestructura en la nube (servidor de aplicación y base de datos cifrada en tránsito TLS/HTTPS) operando bajo relación de Encargado.",
                                "Servicio de almacenamiento multimedia (Cloudinary) utilizado únicamente si decides cargar una fotografía opcional, con identificadores opacos que no exponen el nombre del menor en la URL."
                        )
                ),
                new PrivacyPolicySection(
                        "seguridad",
                        "6. Medidas de Seguridad Técnicas y Administrativas",
                        "La plataforma implementa controles de seguridad acordes al riesgo de tratar datos de menores de edad:",
                        List.of(
                                "Comunicaciones cifradas mediante HTTPS/TLS y autenticación basada en tokens firmados (JWT) con control estricto por rol.",
                                "Aislamiento de consultas para que cada padre visualice exclusivamente a sus propios hijos vinculados.",
                                "Bitácora auditable e inmutable de aceptación de este Aviso de Privacidad (versión, fecha/hora, huella criptográfica SHA-256 e IP)."
                        )
                ),
                new PrivacyPolicySection(
                        "arco",
                        "7. Derechos ARCO, Revocación del Consentimiento y Autoridad",
                        "Como titular o representante legal del menor, puedes ejercer en todo momento tus derechos de Acceso, Rectificación, Cancelación y Oposición (ARCO), así como revocar tu consentimiento.",
                        List.of(
                                "Canal oficial de atención ARCO: envía un correo electrónico a " + arcoEmail + " o acude directamente a la Dirección del plantel acreditando tu identidad como padre o tutor.",
                                "Plazos legales de respuesta: máximo 20 días hábiles para comunicar la determinación y 15 días hábiles adicionales para hacerla efectiva.",
                                "Autoridad garante en México: si consideras vulnerado tu derecho a la protección de datos personales, puedes acudir ante la " + authorityName + "."
                        )
                ),
                new PrivacyPolicySection(
                        "cambios",
                        "8. Cambios al Aviso de Privacidad y Consentimiento Expreso",
                        "Cualquier modificación sustancial al presente Aviso de Privacidad será publicada en esta misma sección con un nuevo número de versión y fecha de entrada en vigor, solicitando nuevamente tu aceptación expresa al ingresar al sistema.",
                        List.of(
                                "Versión vigente: " + currentVersion + " (Vigente desde " + effectiveDate + ")."
                        )
                )
        );
    }

    private String computeSha256(
            String version,
            String date,
            String respName,
            String respAddr,
            String email,
            List<PrivacyPolicySection> sections) {
        try {
            MessageDigest digest = MessageDigest.getInstance("SHA-256");
            StringBuilder canonical = new StringBuilder();
            canonical.append(version).append('|').append(date).append('|')
                    .append(respName).append('|').append(respAddr).append('|').append(email);
            for (PrivacyPolicySection s : sections) {
                canonical.append('|').append(s.id()).append('|').append(s.title()).append('|').append(s.body());
                for (String h : s.highlights()) {
                    canonical.append('|').append(h);
                }
            }
            byte[] hash = digest.digest(canonical.toString().getBytes(StandardCharsets.UTF_8));
            return HexFormat.of().formatHex(hash);
        } catch (Exception e) {
            throw new IllegalStateException("No se pudo calcular el hash del Aviso de Privacidad", e);
        }
    }
}

