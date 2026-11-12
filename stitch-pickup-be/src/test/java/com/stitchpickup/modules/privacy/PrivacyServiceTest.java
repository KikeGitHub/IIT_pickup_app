package com.stitchpickup.modules.privacy;

import com.cloudinary.Cloudinary;
import com.stitchpickup.modules.image.dto.ImageUploadRequest;
import com.stitchpickup.modules.image.service.ImageUploadService;
import com.stitchpickup.modules.privacy.dto.AcceptPrivacyRequest;
import com.stitchpickup.modules.privacy.entity.PrivacyConsentLog;
import com.stitchpickup.modules.privacy.exception.PrivacyConsentRequiredException;
import com.stitchpickup.modules.privacy.repository.PrivacyConsentLogRepository;
import com.stitchpickup.modules.privacy.service.PrivacyService;
import com.stitchpickup.modules.student.dto.ParentStudentUpdateRequest;
import com.stitchpickup.modules.student.entity.SchoolGroup;
import com.stitchpickup.modules.student.entity.Student;
import com.stitchpickup.modules.student.repository.FamilyMemberRepository;
import com.stitchpickup.modules.student.repository.StudentRepository;
import com.stitchpickup.modules.student.service.StudentService;
import com.stitchpickup.modules.user.entity.ParentUser;
import com.stitchpickup.modules.user.repository.ParentUserRepository;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.io.TempDir;
import org.springframework.mock.web.MockHttpServletRequest;
import org.springframework.test.util.ReflectionTestUtils;

import java.lang.reflect.Proxy;
import java.nio.file.Files;
import java.nio.file.Path;
import java.util.*;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;

class PrivacyServiceTest {

    private List<PrivacyConsentLog> savedLogs;
    private Map<UUID, ParentUser> parentStore;
    private PrivacyService privacyService;

    @TempDir
    Path tempDir;

    @BeforeEach
    void setUp() {
        savedLogs = new ArrayList<>();
        parentStore = new HashMap<>();

        PrivacyConsentLogRepository consentRepo = (PrivacyConsentLogRepository) Proxy.newProxyInstance(
                PrivacyConsentLogRepository.class.getClassLoader(),
                new Class<?>[]{PrivacyConsentLogRepository.class},
                (proxy, method, args) -> {
                    if ("save".equals(method.getName())) {
                        PrivacyConsentLog log = (PrivacyConsentLog) args[0];
                        if (log.getId() == null) log.setId(UUID.randomUUID());
                        savedLogs.add(log);
                        return log;
                    }
                    if ("findByUserIdOrderByAcceptedAtDesc".equals(method.getName())) {
                        UUID uid = (UUID) args[0];
                        return savedLogs.stream().filter(l -> uid.equals(l.getUserId())).toList();
                    }
                    return null;
                }
        );

        ParentUserRepository parentRepo = (ParentUserRepository) Proxy.newProxyInstance(
                ParentUserRepository.class.getClassLoader(),
                new Class<?>[]{ParentUserRepository.class},
                (proxy, method, args) -> {
                    if ("save".equals(method.getName())) {
                        ParentUser p = (ParentUser) args[0];
                        parentStore.put(p.getId(), p);
                        return p;
                    }
                    if ("findById".equals(method.getName()) || "findByIdWithStudents".equals(method.getName())) {
                        return Optional.ofNullable(parentStore.get((UUID) args[0]));
                    }
                    return null;
                }
        );

        privacyService = new PrivacyService(consentRepo, parentRepo);
        ReflectionTestUtils.setField(privacyService, "currentVersion", "2026.1");
        ReflectionTestUtils.setField(privacyService, "effectiveDate", "2026-11-11");
        ReflectionTestUtils.setField(privacyService, "responsibleName", "Instituto Inglés de Toluca");
        ReflectionTestUtils.setField(privacyService, "responsibleAddress", "Toluca de Lerdo, Estado de México");
        ReflectionTestUtils.setField(privacyService, "arcoEmail", "privacidad@institutoingles.edu.mx");
        ReflectionTestUtils.setField(privacyService, "authorityName", "Secretaría Anticorrupción y Buen Gobierno");
        ReflectionTestUtils.invokeMethod(privacyService, "initDocument");
    }

    @Test
    void getCurrentPolicy_computesSha256AndUpdatedAuthority() {
        var doc = privacyService.getCurrentPolicy();
        assertThat(doc.version()).isEqualTo("2026.1");
        assertThat(doc.sha256Hash()).hasSize(64);
        assertThat(doc.sections()).hasSize(8);
        assertThat(doc.authorityName()).isEqualTo("Secretaría Anticorrupción y Buen Gobierno");
    }

    @Test
    void validateLoginConsent_rejectsWhenNeverAcceptedAndCheckboxUnchecked() {
        ParentUser parent = ParentUser.builder()
                .id(UUID.randomUUID())
                .email("papa@iit.mx")
                .nombre("Papá Test")
                .passwordHash("hash")
                .build();

        assertThatThrownBy(() ->
                privacyService.validateAndRecordParentLoginConsent(parent, false, "2026.1", new MockHttpServletRequest()))
                .isInstanceOf(PrivacyConsentRequiredException.class)
                .hasMessageContaining("2026.1");

        assertThat(savedLogs).isEmpty();
    }

    @Test
    void validateLoginConsent_recordsAuditLogWithIpAndHashWhenAccepted() {
        ParentUser parent = ParentUser.builder()
                .id(UUID.randomUUID())
                .email("mama@iit.mx")
                .nombre("Mamá Test")
                .passwordHash("hash")
                .build();

        MockHttpServletRequest req = new MockHttpServletRequest();
        req.addHeader("X-Real-IP", "189.203.10.22");
        req.addHeader("User-Agent", "Mozilla/5.0 Test");

        privacyService.validateAndRecordParentLoginConsent(parent, true, "2026.1", req);

        assertThat(parent.getPrivacyPolicyVersion()).isEqualTo("2026.1");
        assertThat(parent.getPrivacyAcceptedAt()).isNotNull();
        assertThat(savedLogs).hasSize(1);
        assertThat(savedLogs.get(0).getIpAddress()).isEqualTo("189.203.10.22");
        assertThat(savedLogs.get(0).getUserAgent()).isEqualTo("Mozilla/5.0 Test");
        assertThat(savedLogs.get(0).getPolicyHash()).isEqualTo(privacyService.getCurrentPolicy().sha256Hash());
    }

    @Test
    void validateLoginConsent_rejectsStaleVersionOnPolicyUpdate() {
        ParentUser parent = ParentUser.builder()
                .id(UUID.randomUUID())
                .email("papa@iit.mx")
                .nombre("Papá Test")
                .passwordHash("hash")
                .build();

        assertThatThrownBy(() ->
                privacyService.validateAndRecordParentLoginConsent(parent, true, "2025.0", new MockHttpServletRequest()))
                .isInstanceOf(PrivacyConsentRequiredException.class);
    }

    @Test
    void acceptPolicyAuthenticated_savesConsentRecord() {
        UUID parentId = UUID.randomUUID();
        ParentUser parent = ParentUser.builder()
                .id(parentId)
                .email("tutor@iit.mx")
                .nombre("Tutor Test")
                .passwordHash("hash")
                .build();
        parentStore.put(parentId, parent);

        var dto = privacyService.acceptPolicyAuthenticated(
                parentId,
                new AcceptPrivacyRequest("2026.1", true, "POLICY_UPDATE"),
                new MockHttpServletRequest()
        );

        assertThat(dto.policyVersion()).isEqualTo("2026.1");
        assertThat(dto.accepted()).isTrue();
        assertThat(dto.consentScope()).isEqualTo("POLICY_UPDATE");
    }

    @Test
    void imageUploadAndStudentService_hideStudentNameInUrlAndDeleteRemovedPhotoAndMinimizeCurp() throws Exception {
        // Cloudinary vacío fuerza fallback local determinista en tempDir
        ImageUploadService imageService = new ImageUploadService(new Cloudinary());
        ReflectionTestUtils.setField(imageService, "uploadDir", tempDir.toString());

        String tinyPngBase64 = Base64.getEncoder().encodeToString(new byte[]{1, 2, 3, 4});
        String uploadedUrl = imageService.upload(new ImageUploadRequest("student", "id-1", "Mateo Perez Lopez", tinyPngBase64));

        assertThat(uploadedUrl).startsWith("/api/v1/images/file/student_");
        assertThat(uploadedUrl.toLowerCase()).doesNotContain("mateo").doesNotContain("perez");
        String filename = uploadedUrl.substring(uploadedUrl.lastIndexOf('/') + 1);
        assertThat(Files.exists(tempDir.resolve(filename))).isTrue();

        UUID studentId = UUID.randomUUID();
        UUID parentId = UUID.randomUUID();
        Student student = Student.builder()
                .id(studentId)
                .name("Mateo Pérez López")
                .level(Student.SchoolLevel.PRIMARIA)
                .grade("3A")
                .group(SchoolGroup.builder().id(UUID.randomUUID()).level(Student.SchoolLevel.PRIMARIA).name("3A").build())
                .curp("PELM180101HMCRRR01")
                .avatarUrl(uploadedUrl)
                .build();

        ParentUser parent = ParentUser.builder()
                .id(parentId)
                .email("papa@iit.mx")
                .nombre("Papá")
                .passwordHash("hash")
                .students(Set.of(student))
                .build();

        StudentRepository studentRepo = (StudentRepository) Proxy.newProxyInstance(
                StudentRepository.class.getClassLoader(),
                new Class<?>[]{StudentRepository.class},
                (proxy, method, args) -> {
                    if ("findById".equals(method.getName())) return Optional.of(student);
                    if ("save".equals(method.getName())) return args[0];
                    return null;
                }
        );
        FamilyMemberRepository familyRepo = (FamilyMemberRepository) Proxy.newProxyInstance(
                FamilyMemberRepository.class.getClassLoader(),
                new Class<?>[]{FamilyMemberRepository.class},
                (proxy, method, args) -> List.of()
        );
        ParentUserRepository parentRepo = (ParentUserRepository) Proxy.newProxyInstance(
                ParentUserRepository.class.getClassLoader(),
                new Class<?>[]{ParentUserRepository.class},
                (proxy, method, args) -> "findByIdWithStudents".equals(method.getName()) ? Optional.of(parent) : Optional.empty()
        );

        StudentService studentService = new StudentService(studentRepo, familyRepo, parentRepo, imageService);
        var updated = studentService.updateStudentByParent(parentId, studentId, new ParentStudentUpdateRequest("", true));

        assertThat(updated.avatarUrl()).isNull();
        assertThat(updated.curp()).isNull();
        assertThat(updated.birthday()).isNull();
        assertThat(Files.exists(tempDir.resolve(filename))).isFalse();
    }
}
