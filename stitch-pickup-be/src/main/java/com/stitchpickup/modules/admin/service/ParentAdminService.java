package com.stitchpickup.modules.admin.service;

import com.stitchpickup.modules.admin.dto.ParentRequest;
import com.stitchpickup.modules.admin.dto.ParentResponse;
import com.stitchpickup.modules.admin.dto.StudentSummaryResponse;
import com.stitchpickup.modules.student.entity.Student;
import com.stitchpickup.modules.student.repository.StudentRepository;
import com.stitchpickup.modules.user.entity.ParentUser;
import com.stitchpickup.modules.user.repository.ParentUserRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.HashSet;
import java.util.List;
import java.util.Set;
import java.util.UUID;

@Service
@RequiredArgsConstructor
public class ParentAdminService {

    private final ParentUserRepository parentRepository;
    private final StudentRepository studentRepository;
    private final PasswordEncoder passwordEncoder;

    @Transactional(readOnly = true)
    public List<ParentResponse> getAllParents() {
        return parentRepository.findAllWithStudents().stream()
                .map(this::mapToResponse)
                .toList();
    }

    @Transactional(readOnly = true)
    public ParentResponse getParentById(UUID id) {
        ParentUser parent = parentRepository.findByIdWithStudents(id)
                .orElseThrow(() -> new IllegalArgumentException("Padre no encontrado: " + id));
        return mapToResponse(parent);
    }

    @Transactional
    public ParentResponse createParent(ParentRequest request) {
        if (parentRepository.existsByEmail(request.email())) {
            throw new IllegalArgumentException("Ya existe un usuario con el correo " + request.email());
        }

        String rawPassword = (request.password() != null && !request.password().isBlank())
                ? request.password() : "IIT2026";

        Set<Student> students = new HashSet<>();
        if (request.studentIds() != null && !request.studentIds().isEmpty()) {
            for (String sId : request.studentIds()) {
                studentRepository.findById(UUID.fromString(sId)).ifPresent(students::add);
            }
        }

        ParentUser parent = ParentUser.builder()
                .nombre(request.nombre().trim())
                .email(request.email().trim().toLowerCase())
                .passwordHash(passwordEncoder.encode(rawPassword))
                .phone(request.phone())
                .avatarUrl(request.avatarUrl())
                .active(request.active() != null ? request.active() : true)
                .tempPassword(true)
                .students(students)
                .build();

        ParentUser saved = parentRepository.save(parent);
        return mapToResponse(saved);
    }

    @Transactional
    public ParentResponse updateParent(UUID id, ParentRequest request) {
        ParentUser parent = parentRepository.findByIdWithStudents(id)
                .orElseThrow(() -> new IllegalArgumentException("Padre no encontrado: " + id));

        if (!parent.getEmail().equalsIgnoreCase(request.email().trim())
                && parentRepository.existsByEmail(request.email().trim())) {
            throw new IllegalArgumentException("Ya existe un usuario con el correo " + request.email());
        }

        parent.setNombre(request.nombre().trim());
        parent.setEmail(request.email().trim().toLowerCase());
        parent.setPhone(request.phone());

        if (request.avatarUrl() != null) {
            parent.setAvatarUrl(request.avatarUrl());
        }

        if (request.active() != null) {
            parent.setActive(request.active());
        }

        if (request.password() != null && !request.password().isBlank()) {
            parent.setPasswordHash(passwordEncoder.encode(request.password()));
        }

        Set<Student> students = new HashSet<>();
        if (request.studentIds() != null) {
            for (String sId : request.studentIds()) {
                studentRepository.findById(UUID.fromString(sId)).ifPresent(students::add);
            }
        }
        parent.setStudents(students);

        ParentUser saved = parentRepository.save(parent);
        return mapToResponse(saved);
    }

    @Transactional
    public void deleteParent(UUID id) {
        parentRepository.deleteById(id);
    }

    private ParentResponse mapToResponse(ParentUser parent) {
        List<StudentSummaryResponse> studentSummaries = parent.getStudents().stream()
                .map(s -> new StudentSummaryResponse(
                        s.getId().toString(),
                        s.getName(),
                        s.getLevel().name(),
                        s.getGroup() != null ? s.getGroup().getName() : ""
                ))
                .toList();

        return new ParentResponse(
                parent.getId().toString(),
                parent.getNombre(),
                parent.getEmail(),
                parent.getPhone(),
                parent.getAvatarUrl(),
                parent.getActive() != null ? parent.getActive() : true,
                parent.getTempPassword() != null ? parent.getTempPassword() : false,
                parent.getLastLogin(),
                studentSummaries
        );
    }
}
