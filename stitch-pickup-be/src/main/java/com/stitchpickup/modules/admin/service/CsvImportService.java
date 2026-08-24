package com.stitchpickup.modules.admin.service;

import com.stitchpickup.modules.admin.dto.CsvImportResultResponse;
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
import lombok.extern.slf4j.Slf4j;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.multipart.MultipartFile;

import java.io.BufferedReader;
import java.io.InputStreamReader;
import java.nio.charset.StandardCharsets;
import java.util.ArrayList;
import java.util.HashSet;
import java.util.List;
import java.util.Set;

@Service
@RequiredArgsConstructor
@Slf4j
public class CsvImportService {

    private final StudentRepository studentRepository;
    private final SchoolGroupRepository schoolGroupRepository;
    private final FamilyMemberRepository familyMemberRepository;
    private final TeacherUserRepository teacherUserRepository;
    private final ParentUserRepository parentUserRepository;
    private final PasswordEncoder passwordEncoder;

    @Transactional
    public CsvImportResultResponse importStudentsFromCsv(MultipartFile file) {
        int processed = 0;
        int success = 0;
        int errors = 0;
        List<String> errorMessages = new ArrayList<>();

        try (BufferedReader reader = new BufferedReader(
                new InputStreamReader(file.getInputStream(), StandardCharsets.UTF_8))) {

            String line;
            boolean isHeader = true;
            while ((line = reader.readLine()) != null) {
                if (line.isBlank()) continue;
                if (isHeader) { isHeader = false; continue; }

                processed++;
                try {
                    // Formato: Nombre,Nivel,Grado,Grupo,NombreTutor,TelefonoTutor,Parentesco
                    String[] tokens = line.split(",", -1);
                    if (tokens.length < 4) {
                        throw new IllegalArgumentException("Se requieren al menos 4 columnas: Nombre, Nivel, Grado, Grupo");
                    }

                    String name = tokens[0].trim();
                    String levelStr = tokens[1].trim().toUpperCase();
                    String grade = tokens[2].trim();
                    String groupName = tokens[3].trim();

                    Student.SchoolLevel level = Student.SchoolLevel.valueOf(levelStr);
                    var group = schoolGroupRepository.findByLevelAndName(level, groupName)
                            .orElseGet(() -> schoolGroupRepository.save(
                                    SchoolGroup.builder().level(level).name(groupName).build()
                            ));

                    Student student = Student.builder()
                            .name(name)
                            .level(level)
                            .grade(grade)
                            .group(group)
                            .active(true)
                            .build();

                    Student saved = studentRepository.save(student);

                    // Si incluye tutor opcional
                    if (tokens.length >= 5 && !tokens[4].trim().isBlank()) {
                        String tutorName = tokens[4].trim();
                        String tutorPhone = tokens.length >= 6 ? tokens[5].trim() : "";
                        String tutorRel = tokens.length >= 7 ? tokens[6].trim() : "Tutor";

                        FamilyMember fm = FamilyMember.builder()
                                .student(saved)
                                .name(tutorName)
                                .phone(tutorPhone)
                                .relationship(tutorRel)
                                .authorized(true)
                                .build();
                        familyMemberRepository.save(fm);
                    }

                    success++;
                } catch (Exception e) {
                    errors++;
                    errorMessages.add("Fila " + processed + ": " + e.getMessage());
                }
            }
        } catch (Exception e) {
            log.error("Error al leer CSV alumnos: {}", e.getMessage());
            return new CsvImportResultResponse(0, 0, 1, List.of("Error al leer archivo: " + e.getMessage()));
        }

        return new CsvImportResultResponse(processed, success, errors, errorMessages);
    }

    @Transactional
    public CsvImportResultResponse importTeachersFromCsv(MultipartFile file) {
        int processed = 0;
        int success = 0;
        int errors = 0;
        List<String> errorMessages = new ArrayList<>();

        try (BufferedReader reader = new BufferedReader(
                new InputStreamReader(file.getInputStream(), StandardCharsets.UTF_8))) {

            String line;
            boolean isHeader = true;
            while ((line = reader.readLine()) != null) {
                if (line.isBlank()) continue;
                if (isHeader) { isHeader = false; continue; }

                processed++;
                try {
                    // Formato: Nombre,Email,Nivel,Grupos (ej: 3A;5B)
                    String[] tokens = line.split(",", -1);
                    if (tokens.length < 2) {
                        throw new IllegalArgumentException("Se requieren al menos Nombre y Email");
                    }

                    String nombre = tokens[0].trim();
                    String email = tokens[1].trim().toLowerCase();
                    String levelStr = tokens.length >= 3 ? tokens[2].trim().toUpperCase() : "";
                    String groupsStr = tokens.length >= 4 ? tokens[3].trim() : "";

                    TeacherUser.SchoolLevel level = (!levelStr.isBlank())
                            ? TeacherUser.SchoolLevel.valueOf(levelStr) : null;

                    TeacherUser teacher = teacherUserRepository.findByEmail(email)
                            .orElse(TeacherUser.builder()
                                    .email(email)
                                    .passwordHash(passwordEncoder.encode("demo1234"))
                                    .role("TEACHER")
                                    .tempPassword(true)
                                    .active(true)
                                    .build());

                    teacher.setNombre(nombre);
                    teacher.setLevel(level);

                    if (!groupsStr.isBlank()) {
                        Set<SchoolGroup> groups = new HashSet<>();
                        for (String gName : groupsStr.split(";")) {
                            String trimmed = gName.trim();
                            if (!trimmed.isBlank()) {
                                Student.SchoolLevel sLevel = level != null ? Student.SchoolLevel.valueOf(level.name()) : Student.SchoolLevel.PRIMARIA;
                                schoolGroupRepository.findByLevelAndName(sLevel, trimmed).ifPresent(groups::add);
                            }
                        }
                        teacher.setGroups(groups);
                    }

                    teacherUserRepository.save(teacher);
                    success++;
                } catch (Exception e) {
                    errors++;
                    errorMessages.add("Fila " + processed + ": " + e.getMessage());
                }
            }
        } catch (Exception e) {
            log.error("Error al leer CSV maestros: {}", e.getMessage());
            return new CsvImportResultResponse(0, 0, 1, List.of("Error al leer archivo: " + e.getMessage()));
        }

        return new CsvImportResultResponse(processed, success, errors, errorMessages);
    }

    @Transactional
    public CsvImportResultResponse importParentsFromCsv(MultipartFile file) {
        int processed = 0;
        int success = 0;
        int errors = 0;
        List<String> errorMessages = new ArrayList<>();

        try (BufferedReader reader = new BufferedReader(
                new InputStreamReader(file.getInputStream(), StandardCharsets.UTF_8))) {

            String line;
            boolean isHeader = true;
            while ((line = reader.readLine()) != null) {
                if (line.isBlank()) continue;
                if (isHeader) { isHeader = false; continue; }

                processed++;
                try {
                    // Formato: Nombre,Email,Telefono,NombresAlumnos (ej: Sofia Ramirez;Mateo Gonzalez)
                    String[] tokens = line.split(",", -1);
                    if (tokens.length < 2) {
                        throw new IllegalArgumentException("Se requieren al menos Nombre y Email");
                    }

                    String nombre = tokens[0].trim();
                    String email = tokens[1].trim().toLowerCase();
                    String phone = tokens.length >= 3 ? tokens[2].trim() : "";
                    String studentsStr = tokens.length >= 4 ? tokens[3].trim() : "";

                    ParentUser parent = parentUserRepository.findByEmail(email)
                            .orElse(ParentUser.builder()
                                    .email(email)
                                    .passwordHash(passwordEncoder.encode("demo1234"))
                                    .tempPassword(true)
                                    .active(true)
                                    .build());

                    parent.setNombre(nombre);
                    parent.setPhone(phone);

                    if (!studentsStr.isBlank()) {
                        Set<Student> students = new HashSet<>(parent.getStudents());
                        for (String sName : studentsStr.split(";")) {
                            String trimmed = sName.trim();
                            if (!trimmed.isBlank()) {
                                List<Student> found = studentRepository.findByNameContainingIgnoreCase(trimmed);
                                if (!found.isEmpty()) {
                                    students.add(found.get(0));
                                }
                            }
                        }
                        parent.setStudents(students);
                    }

                    parentUserRepository.save(parent);
                    success++;
                } catch (Exception e) {
                    errors++;
                    errorMessages.add("Fila " + processed + ": " + e.getMessage());
                }
            }
        } catch (Exception e) {
            log.error("Error al leer CSV padres: {}", e.getMessage());
            return new CsvImportResultResponse(0, 0, 1, List.of("Error al leer archivo: " + e.getMessage()));
        }

        return new CsvImportResultResponse(processed, success, errors, errorMessages);
    }
}
