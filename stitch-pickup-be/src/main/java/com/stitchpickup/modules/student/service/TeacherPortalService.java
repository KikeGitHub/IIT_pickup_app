package com.stitchpickup.modules.student.service;

import com.stitchpickup.modules.admin.dto.FamilyMemberRequest;
import com.stitchpickup.modules.admin.dto.FamilyMemberResponse;
import com.stitchpickup.modules.student.dto.*;
import com.stitchpickup.modules.student.entity.FamilyMember;
import com.stitchpickup.modules.student.entity.SchoolGroup;
import com.stitchpickup.modules.student.entity.Student;
import com.stitchpickup.modules.student.repository.FamilyMemberRepository;
import com.stitchpickup.modules.student.repository.SchoolGroupRepository;
import com.stitchpickup.modules.student.repository.StudentRepository;
import com.stitchpickup.modules.user.entity.ParentUser;
import com.stitchpickup.modules.user.entity.TeacherUser;
import com.stitchpickup.modules.user.repository.ParentUserRepository;
import com.stitchpickup.modules.user.repository.TeacherUserRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDate;
import java.util.ArrayList;
import java.util.HashSet;
import java.util.List;
import java.util.Set;
import java.util.UUID;

@Service
@RequiredArgsConstructor
public class TeacherPortalService {

    private final TeacherUserRepository teacherUserRepository;
    private final SchoolGroupRepository schoolGroupRepository;
    private final StudentRepository studentRepository;
    private final FamilyMemberRepository familyMemberRepository;
    private final ParentUserRepository parentUserRepository;
    private final PasswordEncoder passwordEncoder;

    @Transactional(readOnly = true)
    public List<TeacherGroupDetailResponse> getMyGroupsWithStudents(UUID teacherId) {
        var teacherOpt = teacherUserRepository.findByIdWithGroups(teacherId);
        if (teacherOpt.isEmpty()) {
            teacherOpt = teacherUserRepository.findById(teacherId);
        }

        List<TeacherGroupDetailResponse> result = new ArrayList<>();
        List<SchoolGroup> groupsToLoad;

        if (teacherOpt.isEmpty() || "ADMIN".equalsIgnoreCase(teacherOpt.get().getRole())) {
            groupsToLoad = schoolGroupRepository.findAllByOrderByLevelAscNameAsc();
        } else {
            TeacherUser teacher = teacherOpt.get();
            if (teacher.getGroups() != null && !teacher.getGroups().isEmpty()) {
                groupsToLoad = new ArrayList<>(teacher.getGroups());
            } else if (teacher.getLevel() != null) {
                // Si el docente no tiene salones específicos asignados (ej. secundaria o talleres),
                // cargar ÚNICAMENTE los grupos correspondientes a su nivel escolar.
                try {
                    Student.SchoolLevel studentLevel = Student.SchoolLevel.valueOf(teacher.getLevel().name());
                    groupsToLoad = schoolGroupRepository.findByLevel(studentLevel);
                } catch (Exception e) {
                    groupsToLoad = List.of();
                }
            } else {
                groupsToLoad = List.of();
            }
        }

        for (SchoolGroup group : groupsToLoad) {
            List<Student> students = studentRepository.findByGroupId(group.getId());

            List<TeacherStudentResponse> studentResponses = students.stream()
                    .map(this::mapToStudentResponse)
                    .toList();

            result.add(new TeacherGroupDetailResponse(
                    group.getId().toString(),
                    group.getLevel().name(),
                    group.getName(),
                    studentResponses
            ));
        }

        return result;
    }

    @Transactional
    public TeacherStudentResponse updateStudentByTeacher(
            UUID teacherId, UUID studentId, TeacherStudentUpdateRequest request) {

        TeacherUser teacher = teacherUserRepository.findByIdWithGroups(teacherId)
                .orElseThrow(() -> new IllegalArgumentException("Maestro no encontrado: " + teacherId));

        Student student = studentRepository.findById(studentId)
                .orElseThrow(() -> new IllegalArgumentException("Alumno no encontrado: " + studentId));

        // Validar que el alumno pertenece a uno de los grupos asignados al maestro (a menos que sea ADMIN o de acceso general)
        if (!"ADMIN".equalsIgnoreCase(teacher.getRole()) && !teacher.getGroups().isEmpty()) {
            if (student.getGroup() == null || teacher.getGroups().stream().noneMatch(g -> g.getId().equals(student.getGroup().getId()))) {
                throw new SecurityException("No tienes autorización para editar alumnos fuera de tus grupos asignados.");
            }
        }

        student.setName(request.name().trim());
        if (request.grade() != null) student.setGrade(request.grade().trim());

        if (request.birthday() != null && !request.birthday().isBlank()) {
            try {
                student.setBirthday(LocalDate.parse(request.birthday()));
            } catch (Exception ignored) {}
        } else {
            student.setBirthday(null);
        }

        student.setGender(request.gender() != null && !request.gender().isBlank() ? request.gender().trim().toUpperCase() : null);
        student.setCurp(request.curp() != null && !request.curp().isBlank() ? request.curp().trim().toUpperCase() : null);

        if (request.avatarUrl() != null) {
            student.setAvatarUrl(request.avatarUrl().trim());
        }

        Student saved = studentRepository.save(student);

        // Actualizar tutores de pickup autorizados (reemplazar si se envían)
        if (request.familyMembers() != null) {
            List<FamilyMember> existingMembers = familyMemberRepository.findByStudentId(saved.getId());
            familyMemberRepository.deleteAll(existingMembers);

            for (FamilyMemberRequest fm : request.familyMembers()) {
                if (fm.name() != null && !fm.name().isBlank()) {
                    FamilyMember member = FamilyMember.builder()
                            .student(saved)
                            .name(fm.name().trim())
                            .relationship(fm.relationship() != null && !fm.relationship().isBlank() ? fm.relationship().trim() : "Tutor")
                            .phone(fm.phone() != null ? fm.phone().trim() : "")
                            .photoUrl(fm.photoUrl())
                            .authorized(fm.authorized() != null ? fm.authorized() : true)
                            .build();
                    familyMemberRepository.save(member);
                }
            }
        }

        return mapToStudentResponse(saved);
    }

    private TeacherStudentResponse mapToStudentResponse(Student s) {
        List<FamilyMemberResponse> tutors = familyMemberRepository.findByStudentId(s.getId()).stream()
                .map(fm -> new FamilyMemberResponse(
                        fm.getId().toString(),
                        fm.getName(),
                        fm.getRelationship(),
                        fm.getPhone(),
                        fm.getPhotoUrl(),
                        Boolean.TRUE.equals(fm.getAuthorized())
                ))
                .toList();

        List<TeacherParentAccountDto> parentAccounts = parentUserRepository.findByStudentId(s.getId()).stream()
                .map(p -> new TeacherParentAccountDto(
                        p.getId().toString(),
                        p.getNombre(),
                        p.getEmail(),
                        p.getPhone(),
                        Boolean.TRUE.equals(p.getTempPassword())
                ))
                .toList();

        return new TeacherStudentResponse(
                s.getId().toString(),
                s.getName(),
                s.getLevel().name(),
                s.getGrade(),
                s.getGroup() != null ? s.getGroup().getId().toString() : null,
                s.getGroup() != null ? s.getGroup().getName() : null,
                s.getBirthday() != null ? s.getBirthday().toString() : null,
                s.getGender(),
                s.getCurp(),
                s.getAvatarUrl(),
                Boolean.TRUE.equals(s.getActive()),
                tutors,
                parentAccounts
        );
    }

    @Transactional
    public TeacherParentAccountDto resetParentTempPassword(UUID teacherId, UUID parentId) {
        TeacherUser teacher = teacherUserRepository.findByIdWithGroups(teacherId)
                .orElseThrow(() -> new IllegalArgumentException("Maestro no encontrado: " + teacherId));

        ParentUser parent = parentUserRepository.findByIdWithStudents(parentId)
                .orElseThrow(() -> new IllegalArgumentException("Usuario padre no encontrado: " + parentId));

        // Validar que el padre pertenece a al menos un alumno de los grupos asignados al maestro
        if (!"ADMIN".equalsIgnoreCase(teacher.getRole()) && !teacher.getGroups().isEmpty()) {
            boolean hasAccess = parent.getStudents().stream().anyMatch(student ->
                    student.getGroup() != null && teacher.getGroups().stream().anyMatch(g -> g.getId().equals(student.getGroup().getId()))
            );
            if (!hasAccess) {
                throw new SecurityException("No tienes autorización para restablecer contraseñas de padres fuera de tus grupos.");
            }
        }

        parent.setPasswordHash(passwordEncoder.encode("IIT2026"));
        parent.setTempPassword(true);
        ParentUser updated = parentUserRepository.save(parent);

        return new TeacherParentAccountDto(
                updated.getId().toString(),
                updated.getNombre(),
                updated.getEmail(),
                updated.getPhone(),
                true
        );
    }

    @Transactional
    public TeacherStudentResponse createStudentByTeacher(UUID teacherId, TeacherStudentCreateRequest request) {
        TeacherUser teacher = teacherUserRepository.findByIdWithGroups(teacherId)
                .orElseThrow(() -> new IllegalArgumentException("Maestro no encontrado: " + teacherId));

        UUID groupId = UUID.fromString(request.groupId());
        SchoolGroup group = schoolGroupRepository.findById(groupId)
                .orElseThrow(() -> new IllegalArgumentException("Grupo escolar no encontrado: " + request.groupId()));

        // Validar que el maestro tenga asignado este grupo (salvo que sea ADMIN)
        if (!"ADMIN".equalsIgnoreCase(teacher.getRole()) && !teacher.getGroups().isEmpty()) {
            if (teacher.getGroups().stream().noneMatch(g -> g.getId().equals(groupId))) {
                throw new SecurityException("No tienes autorización para registrar alumnos fuera de tus grupos asignados.");
            }
        }

        LocalDate bday = null;
        if (request.birthday() != null && !request.birthday().isBlank()) {
            try {
                LocalDate parsed = LocalDate.parse(request.birthday());
                if (parsed.isAfter(LocalDate.now())) {
                    throw new IllegalArgumentException("La fecha de nacimiento no puede ser una fecha futura (" + request.birthday() + ")");
                }
                bday = parsed;
            } catch (IllegalArgumentException e) {
                throw e;
            } catch (Exception ignored) {}
        }

        Student student = Student.builder()
                .name(request.name().trim())
                .group(group)
                .level(group.getLevel())
                .grade(request.grade() != null && !request.grade().isBlank() ? request.grade().trim() : group.getName())
                .birthday(bday)
                .gender(request.gender() != null && !request.gender().isBlank() ? request.gender().trim().toUpperCase() : null)
                .curp(request.curp() != null && !request.curp().isBlank() ? request.curp().trim().toUpperCase() : null)
                .avatarUrl(request.avatarUrl() != null && !request.avatarUrl().isBlank() ? request.avatarUrl().trim() : null)
                .active(true)
                .build();

        Student saved = studentRepository.save(student);

        // Guardar tutores de pickup autorizados
        if (request.familyMembers() != null) {
            for (FamilyMemberRequest fm : request.familyMembers()) {
                if (fm.name() != null && !fm.name().isBlank()) {
                    FamilyMember member = FamilyMember.builder()
                            .student(saved)
                            .name(fm.name().trim())
                            .relationship(fm.relationship() != null && !fm.relationship().isBlank() ? fm.relationship().trim() : "Tutor")
                            .phone(fm.phone() != null ? fm.phone().trim() : "")
                            .photoUrl(fm.photoUrl())
                            .authorized(fm.authorized() != null ? fm.authorized() : true)
                            .build();
                    familyMemberRepository.save(member);
                }
            }
        }

        // Crear o vincular cuentas de padres para acceso al portal
        if (request.parentAccounts() != null) {
            for (TeacherParentAccountInputDto pDto : request.parentAccounts()) {
                if (pDto.email() != null && !pDto.email().isBlank()) {
                    String cleanEmail = pDto.email().trim().toLowerCase();
                    String cleanPhone = pDto.phone() != null ? pDto.phone().trim() : null;
                    String cleanNombre = pDto.nombre() != null && !pDto.nombre().isBlank()
                            ? pDto.nombre().trim()
                            : "Tutor de " + saved.getName();

                    var existingOpt = parentUserRepository.findByEmailWithStudents(cleanEmail);
                    if (existingOpt.isPresent()) {
                        ParentUser parent = existingOpt.get();
                        parent.getStudents().add(saved);
                        if ((parent.getPhone() == null || parent.getPhone().isBlank()) && cleanPhone != null) {
                            parent.setPhone(cleanPhone);
                        }
                        parentUserRepository.save(parent);
                    } else {
                        ParentUser newParent = ParentUser.builder()
                                .nombre(cleanNombre)
                                .email(cleanEmail)
                                .phone(cleanPhone)
                                .passwordHash(passwordEncoder.encode("IIT2026"))
                                .tempPassword(true)
                                .active(true)
                                .students(new HashSet<>(List.of(saved)))
                                .build();
                        parentUserRepository.save(newParent);
                    }
                }
            }
        }

        return mapToStudentResponse(saved);
    }

    @Transactional
    public TeacherStudentResponse toggleStudentActiveByTeacher(UUID teacherId, UUID studentId) {
        TeacherUser teacher = teacherUserRepository.findByIdWithGroups(teacherId)
                .orElseThrow(() -> new IllegalArgumentException("Maestro no encontrado: " + teacherId));

        Student student = studentRepository.findById(studentId)
                .orElseThrow(() -> new IllegalArgumentException("Alumno no encontrado: " + studentId));

        // Validar que el alumno pertenece a uno de los grupos asignados al maestro
        if (!"ADMIN".equalsIgnoreCase(teacher.getRole()) && !teacher.getGroups().isEmpty()) {
            if (student.getGroup() == null || teacher.getGroups().stream().noneMatch(g -> g.getId().equals(student.getGroup().getId()))) {
                throw new SecurityException("No tienes autorización para gestionar alumnos fuera de tus grupos asignados.");
            }
        }

        boolean newStatus = !Boolean.TRUE.equals(student.getActive());
        student.setActive(newStatus);
        Student updated = studentRepository.save(student);

        return mapToStudentResponse(updated);
    }
}
