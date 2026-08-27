package com.stitchpickup.modules.admin.service;

import com.stitchpickup.modules.admin.dto.GroupResponse;
import com.stitchpickup.modules.admin.dto.TeacherRequest;
import com.stitchpickup.modules.admin.dto.TeacherResponse;
import com.stitchpickup.modules.student.entity.SchoolGroup;
import com.stitchpickup.modules.student.repository.SchoolGroupRepository;
import com.stitchpickup.modules.student.repository.StudentRepository;
import com.stitchpickup.modules.user.entity.TeacherUser;
import com.stitchpickup.modules.user.repository.TeacherUserRepository;
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
public class TeacherAdminService {

    private final TeacherUserRepository teacherRepository;
    private final SchoolGroupRepository groupRepository;
    private final StudentRepository studentRepository;
    private final PasswordEncoder passwordEncoder;

    @Transactional(readOnly = true)
    public List<TeacherResponse> getAllTeachers() {
        return teacherRepository.findAllWithGroups().stream()
                .map(this::mapToResponse)
                .toList();
    }

    @Transactional(readOnly = true)
    public TeacherResponse getTeacherById(UUID id) {
        TeacherUser teacher = teacherRepository.findByIdWithGroups(id)
                .orElseThrow(() -> new IllegalArgumentException("Maestro no encontrado: " + id));
        return mapToResponse(teacher);
    }

    @Transactional
    public TeacherResponse createTeacher(TeacherRequest request) {
        if (teacherRepository.existsByEmail(request.email())) {
            throw new IllegalArgumentException("Ya existe un usuario con el correo " + request.email());
        }

        String rawPassword = (request.password() != null && !request.password().isBlank())
                ? request.password() : "IIT2026";

        TeacherUser.SchoolLevel level = (request.level() != null && !request.level().isBlank())
                ? TeacherUser.SchoolLevel.valueOf(request.level().toUpperCase()) : null;

        Set<SchoolGroup> groups = new HashSet<>();
        if (request.groupIds() != null && !request.groupIds().isEmpty()) {
            for (String gId : request.groupIds()) {
                groupRepository.findById(UUID.fromString(gId)).ifPresent(groups::add);
            }
        }

        TeacherUser teacher = TeacherUser.builder()
                .nombre(request.nombre().trim())
                .email(request.email().trim().toLowerCase())
                .passwordHash(passwordEncoder.encode(rawPassword))
                .role(request.role() != null && !request.role().isBlank() ? request.role().toUpperCase() : "TEACHER")
                .level(level)
                .avatarUrl(request.avatarUrl())
                .active(request.active() != null ? request.active() : true)
                .tempPassword(true)
                .groups(groups)
                .build();

        TeacherUser saved = teacherRepository.save(teacher);
        return mapToResponse(saved);
    }

    @Transactional
    public TeacherResponse updateTeacher(UUID id, TeacherRequest request) {
        TeacherUser teacher = teacherRepository.findByIdWithGroups(id)
                .orElseThrow(() -> new IllegalArgumentException("Maestro no encontrado: " + id));

        if (!teacher.getEmail().equalsIgnoreCase(request.email().trim())
                && teacherRepository.existsByEmail(request.email().trim())) {
            throw new IllegalArgumentException("Ya existe un usuario con el correo " + request.email());
        }

        teacher.setNombre(request.nombre().trim());
        teacher.setEmail(request.email().trim().toLowerCase());

        if (request.role() != null && !request.role().isBlank()) {
            teacher.setRole(request.role().toUpperCase());
        }

        if (request.level() != null && !request.level().isBlank()) {
            teacher.setLevel(TeacherUser.SchoolLevel.valueOf(request.level().toUpperCase()));
        } else {
            teacher.setLevel(null);
        }

        if (request.avatarUrl() != null) {
            teacher.setAvatarUrl(request.avatarUrl());
        }

        if (request.active() != null) {
            teacher.setActive(request.active());
        }

        if (request.password() != null && !request.password().isBlank()) {
            teacher.setPasswordHash(passwordEncoder.encode(request.password()));
        }

        Set<SchoolGroup> groups = new HashSet<>();
        if (request.groupIds() != null) {
            for (String gId : request.groupIds()) {
                groupRepository.findById(UUID.fromString(gId)).ifPresent(groups::add);
            }
        }
        teacher.setGroups(groups);

        TeacherUser saved = teacherRepository.save(teacher);
        return mapToResponse(saved);
    }

    @Transactional
    public void deleteTeacher(UUID id) {
        teacherRepository.deleteById(id);
    }

    private TeacherResponse mapToResponse(TeacherUser teacher) {
        List<GroupResponse> groupResponses = teacher.getGroups().stream()
                .map(g -> new GroupResponse(
                        g.getId().toString(),
                        g.getLevel().name(),
                        g.getName(),
                        g.getActive() != null ? g.getActive() : true,
                        studentRepository.countByGroupId(g.getId())
                ))
                .toList();

        return new TeacherResponse(
                teacher.getId().toString(),
                teacher.getNombre(),
                teacher.getEmail(),
                teacher.getRole(),
                teacher.getLevel() != null ? teacher.getLevel().name() : null,
                teacher.getAvatarUrl(),
                teacher.getActive() != null ? teacher.getActive() : true,
                teacher.getTempPassword() != null ? teacher.getTempPassword() : false,
                teacher.getLastLogin(),
                groupResponses
        );
    }
}
