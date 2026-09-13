package com.stitchpickup.modules.student.service;

import com.stitchpickup.modules.admin.dto.FamilyMemberRequest;
import com.stitchpickup.modules.admin.dto.FamilyMemberResponse;
import com.stitchpickup.modules.student.dto.TeacherGroupDetailResponse;
import com.stitchpickup.modules.student.dto.TeacherParentAccountDto;
import com.stitchpickup.modules.student.dto.TeacherStudentResponse;
import com.stitchpickup.modules.student.dto.TeacherStudentUpdateRequest;
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
import java.util.List;
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

        if (teacherOpt.isEmpty() || "ADMIN".equalsIgnoreCase(teacherOpt.get().getRole()) || teacherOpt.get().getGroups() == null || teacherOpt.get().getGroups().isEmpty()) {
            groupsToLoad = schoolGroupRepository.findAllByOrderByLevelAscNameAsc();
        } else {
            groupsToLoad = new ArrayList<>(teacherOpt.get().getGroups());
        }

        for (SchoolGroup group : groupsToLoad) {
            List<Student> students = studentRepository.findByGroupId(group.getId());

            List<TeacherStudentResponse> studentResponses = students.stream()
                    .filter(s -> Boolean.TRUE.equals(s.getActive()))
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
}
