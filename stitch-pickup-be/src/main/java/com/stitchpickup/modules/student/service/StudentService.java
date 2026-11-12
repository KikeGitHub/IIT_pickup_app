package com.stitchpickup.modules.student.service;

import com.stitchpickup.modules.admin.dto.FamilyMemberRequest;
import com.stitchpickup.modules.image.service.ImageUploadService;
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
    private final ImageUploadService imageUploadService;

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

        String previousUrl = student.getAvatarUrl();
        boolean shouldRemove = Boolean.TRUE.equals(request.removePhoto())
                || (request.avatarUrl() != null && request.avatarUrl().isBlank());

        if (shouldRemove) {
            student.setAvatarUrl(null);
            Student saved = studentRepository.save(student);
            imageUploadService.deleteByUrl(previousUrl);
            return mapToStudentResponse(saved);
        }

        // El padre únicamente puede subir/actualizar la fotografía opcional del alumno
        if (request.avatarUrl() != null) {
            String nextUrl = request.avatarUrl().trim();
            student.setAvatarUrl(nextUrl);
            Student saved = studentRepository.save(student);
            if (previousUrl != null && !previousUrl.equals(nextUrl)) {
                imageUploadService.deleteByUrl(previousUrl);
            }
            return mapToStudentResponse(saved);
        }

        return mapToStudentResponse(student);
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

        // Minimización de datos para portal de padres: no exponer CURP ni fecha de nacimiento
        return new StudentResponse(
                s.getId().toString(),
                s.getName(),
                s.getLevel().name(),
                s.getGrade(),
                groupName,
                null,
                s.getGender(),
                null,
                s.getAvatarUrl(),
                memberDtos
        );
    }
}
