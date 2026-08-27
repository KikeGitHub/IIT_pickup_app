package com.stitchpickup.security;

import com.stitchpickup.modules.user.repository.ParentUserRepository;
import com.stitchpickup.modules.user.repository.TeacherUserRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.security.core.authority.SimpleGrantedAuthority;
import org.springframework.security.core.userdetails.User;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.security.core.userdetails.UserDetailsService;
import org.springframework.security.core.userdetails.UsernameNotFoundException;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

/**
 * UserDetailsServiceImpl — Carga usuarios desde BD para Spring Security.
 *
 * Busca primero en parent_users, luego en teacher_users.
 * El email es el username en ambos casos.
 *
 * SOLID — S: Solo carga UserDetails. No genera tokens ni valida roles.
 */
@Service
@RequiredArgsConstructor
public class UserDetailsServiceImpl implements UserDetailsService {

    private final ParentUserRepository parentRepo;
    private final TeacherUserRepository teacherRepo;

    @Override
    @Transactional(readOnly = true)
    public UserDetails loadUserByUsername(String email) throws UsernameNotFoundException {

        // Buscar en maestros/admin
        var teacher = teacherRepo.findByEmail(email);
        if (teacher.isEmpty()) {
            teacher = teacherRepo.findByEmail(email.toUpperCase());
        }
        if (teacher.isPresent()) {
            var t = teacher.get();
            String springRole = "ADMIN".equalsIgnoreCase(t.getRole()) ? "ROLE_ADMIN" : "ROLE_TEACHER";
            return User.builder()
                    .username(t.getEmail())
                    .password(t.getPasswordHash())
                    .authorities(List.of(new SimpleGrantedAuthority(springRole)))
                    .accountExpired(false)
                    .accountLocked(!Boolean.TRUE.equals(t.getActive()))
                    .credentialsExpired(false)
                    .disabled(!Boolean.TRUE.equals(t.getActive()))
                    .build();
        }

        // Buscar en padres
        var parent = parentRepo.findByEmail(email);
        if (parent.isEmpty()) {
            parent = parentRepo.findByEmail(email.toUpperCase());
        }
        if (parent.isPresent()) {
            var p = parent.get();
            return User.builder()
                    .username(p.getEmail())
                    .password(p.getPasswordHash())
                    .authorities(List.of(new SimpleGrantedAuthority("ROLE_PARENT")))
                    .accountExpired(false)
                    .accountLocked(!Boolean.TRUE.equals(p.getActive()))
                    .credentialsExpired(false)
                    .disabled(!Boolean.TRUE.equals(p.getActive()))
                    .build();
        }

        throw new UsernameNotFoundException("Usuario no encontrado: " + email);
    }
}
