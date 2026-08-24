package com.stitchpickup.modules.student.service;

import com.stitchpickup.modules.admin.dto.FamilyMemberRequest;
import com.stitchpickup.modules.student.dto.FamilyMemberResponse;
import com.stitchpickup.modules.student.dto.ParentStudentUpdateRequest;
import com.stitchpickup.modules.student.dto.StudentResponse;
import com.stitchpickup.modules.student.entity.FamilyMember;
import com.stitchpickup.modules.student.entity.Student;
import com.stitchpickup.modules.student.repository.FamilyMemberRepository;
import com.stitchpickup.modules.student.repository.StudentRepository;
import com.stitchpickup.modules.user.entity.ParentUser;
import com.stitchpickup.modules.user.repository.ParentUserRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDate;
import java.util.List;
import java.util.UUID;

@Service
@RequiredArgsConstructor
public class StudentService {

    private final StudentRepository studentRepository;
    private final FamilyMemberRepository familyMemberRepository;
    private final ParentUserRepository parentUserRepository;

    @Transactional(readOnly = true)
    public List<StudentResponse> getStudentsByParentId(UUID parentId) {
        List<Student> students = studentRepository.findActiveStudentsByParentId(parentId);

        return students.stream().map(this::mapToStudentResponse).toList();
    }

    @Transactional
    public StudentResponse updateStudentByParent(UUID parentId, UUID studentId, ParentStudentUpdateRequest request) {
        ParentUser parent = parentUserRepository.findByIdWithStudents(parentId)
                .orElseThrow(() -> new IllegalArgumentException("Padre no encontrado: " + parentId));

        Student student = studentRepository.findById(studentId)
                .orElseThrow(() -> new IllegalArgumentException("Alumno no encontrado: " + studentId));

        // Validar que el alumno esté vinculado a este padre
        if (parent.getStudents().stream().noneMatch(s -> s.getId().equals(studentId))) {
            throw new SecurityException("No tienes autorización para editar este alumno.");
        }

        if (request.avatarUrl() != null) {
            student.setAvatarUrl(request.avatarUrl().trim());
        }

        if (request.birthday() != null && !request.birthday().isBlank()) {
            try {
                student.setBirthday(LocalDate.parse(request.birthday()));
            } catch (Exception ignored) {}
        }

        Student saved = studentRepository.save(student);

        // Actualizar familiares autorizados si se envían
        if (request.familyMembers() != null) {
            List<FamilyMember> existing = familyMemberRepository.findByStudentId(saved.getId());
            familyMemberRepository.deleteAll(existing);

            for (FamilyMemberRequest fm : request.familyMembers()) {
                if (fm.name() != null && !fm.name().isBlank()) {
                    FamilyMember member = FamilyMember.builder()
                            .student(saved)
                            .name(fm.name().trim())
                            .relationship(fm.relationship())
                            .phone(fm.phone())
                            .photoUrl(fm.photoUrl())
                            .authorized(fm.authorized() != null ? fm.authorized() : true)
                            .build();
                    familyMemberRepository.save(member);
                }
            }
        }

        return mapToStudentResponse(saved);
    }

    private StudentResponse mapToStudentResponse(Student s) {
        var members = familyMemberRepository.findByStudentIdAndAuthorizedTrue(s.getId());
        var memberDtos = members.stream().map(m -> new FamilyMemberResponse(
                m.getId().toString(),
                m.getName(),
                m.getRelationship(),
                m.getPhone(),
                m.getPhotoUrl(),
                m.getAuthorized()
        )).toList();

        String groupName = s.getGroup() != null ? s.getGroup().getName() : "";

        return new StudentResponse(
                s.getId().toString(),
                s.getName(),
                s.getLevel().name(),
                s.getGrade(),
                groupName,
                s.getAvatarUrl(),
                memberDtos
        );
    }
}
