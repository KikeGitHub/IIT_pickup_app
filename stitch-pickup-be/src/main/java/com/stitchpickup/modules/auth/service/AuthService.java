package com.stitchpickup.modules.auth.service;

import com.stitchpickup.modules.auth.dto.ChangePasswordRequest;
import com.stitchpickup.modules.auth.dto.LoginRequest;
import com.stitchpickup.modules.auth.dto.LoginResponse;
import com.stitchpickup.modules.user.entity.ParentUser;
import com.stitchpickup.modules.user.entity.TeacherUser;
import com.stitchpickup.modules.user.repository.ParentUserRepository;
import com.stitchpickup.modules.user.repository.TeacherUserRepository;
import com.stitchpickup.security.JwtTokenProvider;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.security.authentication.BadCredentialsException;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.Instant;
import java.util.List;
import java.util.UUID;

/**
 * AuthService — Lógica de negocio de autenticación.
 *
 * SOLID — S: Solo gestiona autenticación y cambio de contraseña.
 *         — D: Depende de abstracciones (repositorios, JwtTokenProvider).
 */
@Service
@RequiredArgsConstructor
@Slf4j
public class AuthService {

    private final ParentUserRepository parentRepo;
    private final TeacherUserRepository teacherRepo;
    private final JwtTokenProvider tokenProvider;
    private final PasswordEncoder passwordEncoder;

    // ─── Login Padre ──────────────────────────────────────────────────────────

    @Transactional
    public LoginResponse loginParent(LoginRequest request) {
        ParentUser parent = parentRepo
                .findByEmailWithStudents(request.email())
                .filter(ParentUser::getActive)
                .orElseThrow(() -> new BadCredentialsException("Credenciales inválidas"));

        if (!passwordEncoder.matches(request.password(), parent.getPasswordHash())) {
            log.warn("Intento de login fallido para padre: {}", request.email());
            throw new BadCredentialsException("Credenciales inválidas");
        }

        // Actualizar lastLogin
        parent.setLastLogin(Instant.now());

        List<String> studentIds = parent.getStudents().stream()
                .map(s -> s.getId().toString())
                .toList();

        String token = tokenProvider.generateParentToken(
                parent.getId(), parent.getEmail(), parent.getNombre(),
                studentIds, parent.getTempPassword()
        );

        log.info("Login exitoso — Padre: {}", parent.getEmail());
        return buildParentResponse(parent, token, studentIds);
    }

    // ─── Login Maestro / Admin ────────────────────────────────────────────────

    @Transactional
    public LoginResponse loginTeacher(LoginRequest request) {
        TeacherUser teacher = teacherRepo
                .findByEmailWithGroups(request.email())
                .filter(TeacherUser::getActive)
                .orElseThrow(() -> new BadCredentialsException("Credenciales inválidas"));

        if (!passwordEncoder.matches(request.password(), teacher.getPasswordHash())) {
            log.warn("Intento de login fallido para maestro: {}", request.email());
            throw new BadCredentialsException("Credenciales inválidas");
        }

        teacher.setLastLogin(Instant.now());

        List<String> groups = teacher.getGroups().stream()
                .map(g -> g.getLevel().name() + "-" + g.getName())
                .toList();

        String level = teacher.getLevel() != null ? teacher.getLevel().name() : null;

        String token = tokenProvider.generateTeacherToken(
                teacher.getId(), teacher.getEmail(), teacher.getNombre(),
                teacher.getRole(), level, groups, teacher.getTempPassword()
        );

        log.info("Login exitoso — {}: {}", teacher.getRole(), teacher.getEmail());
        return buildTeacherResponse(teacher, token, level, groups);
    }

    // ─── Cambio de Contraseña ─────────────────────────────────────────────────

    @Transactional
    public void changePasswordParent(UUID parentId, ChangePasswordRequest request) {
        ParentUser parent = parentRepo.findById(parentId)
                .orElseThrow(() -> new IllegalArgumentException("Usuario no encontrado"));

        validateCurrentPassword(request.currentPassword(), parent.getPasswordHash());

        parent.setPasswordHash(passwordEncoder.encode(request.newPassword()));
        parent.setTempPassword(false);
        log.info("Contraseña actualizada — Padre: {}", parent.getEmail());
    }

    @Transactional
    public void changePasswordTeacher(UUID teacherId, ChangePasswordRequest request) {
        TeacherUser teacher = teacherRepo.findById(teacherId)
                .orElseThrow(() -> new IllegalArgumentException("Usuario no encontrado"));

        validateCurrentPassword(request.currentPassword(), teacher.getPasswordHash());

        teacher.setPasswordHash(passwordEncoder.encode(request.newPassword()));
        teacher.setTempPassword(false);
        log.info("Contraseña actualizada — {}: {}", teacher.getRole(), teacher.getEmail());
    }

    // ─── Helpers Privados ─────────────────────────────────────────────────────

    private void validateCurrentPassword(String raw, String encoded) {
        if (!passwordEncoder.matches(raw, encoded)) {
            throw new BadCredentialsException("La contraseña actual es incorrecta");
        }
    }

    private LoginResponse buildParentResponse(
            ParentUser p, String token, List<String> studentIds) {
        return new LoginResponse(
            token, p.getId().toString(), p.getEmail(), p.getNombre(),
            "PARENT", p.getTempPassword(), studentIds, null, null
        );
    }

    private LoginResponse buildTeacherResponse(
            TeacherUser t, String token, String level, List<String> groups) {
        return new LoginResponse(
            token, t.getId().toString(), t.getEmail(), t.getNombre(),
            t.getRole(), t.getTempPassword(), null, level, groups
        );
    }
}
