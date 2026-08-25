package com.stitchpickup.modules.student.service;

import com.stitchpickup.modules.admin.dto.FamilyMemberResponse;
import com.stitchpickup.modules.student.dto.TeacherGroupDetailResponse;
import com.stitchpickup.modules.student.dto.TeacherStudentResponse;
import com.stitchpickup.modules.student.dto.TeacherStudentUpdateRequest;
import com.stitchpickup.modules.student.entity.FamilyMember;
import com.stitchpickup.modules.student.entity.SchoolGroup;
import com.stitchpickup.modules.student.entity.Student;
import com.stitchpickup.modules.student.repository.FamilyMemberRepository;
import com.stitchpickup.modules.student.repository.SchoolGroupRepository;
import com.stitchpickup.modules.student.repository.StudentRepository;
import com.stitchpickup.modules.user.entity.TeacherUser;
import com.stitchpickup.modules.user.repository.TeacherUserRepository;
import lombok.RequiredArgsConstructor;
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

    @Transactional(readOnly = true)
    public List<TeacherGroupDetailResponse> getMyGroupsWithStudents(UUID teacherId) {
        TeacherUser teacher = teacherUserRepository.findByIdWithGroups(teacherId)
                .orElseThrow(() -> new IllegalArgumentException("Maestro no encontrado: " + teacherId));

        List<TeacherGroupDetailResponse> result = new ArrayList<>();

        for (SchoolGroup group : teacher.getGroups()) {
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

        // Validar que el alumno pertenece a uno de los grupos asignados al maestro
        if (student.getGroup() == null || teacher.getGroups().stream().noneMatch(g -> g.getId().equals(student.getGroup().getId()))) {
            throw new SecurityException("No tienes autorización para editar alumnos fuera de tus grupos asignados.");
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
                tutors
        );
    }
}
