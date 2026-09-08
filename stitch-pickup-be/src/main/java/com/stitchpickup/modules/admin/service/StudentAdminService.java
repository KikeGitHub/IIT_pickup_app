package com.stitchpickup.modules.admin.service;

import com.stitchpickup.modules.admin.dto.FamilyMemberRequest;
import com.stitchpickup.modules.admin.dto.FamilyMemberResponse;
import com.stitchpickup.modules.admin.dto.StudentDetailResponse;
import com.stitchpickup.modules.admin.dto.StudentRequest;
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
import java.util.Collections;
import java.util.List;
import java.util.Map;
import java.util.UUID;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class StudentAdminService {

    private final StudentRepository studentRepository;
    private final SchoolGroupRepository groupRepository;
    private final FamilyMemberRepository familyMemberRepository;
    private final TeacherUserRepository teacherUserRepository;

    @Transactional(readOnly = true)
    public List<StudentDetailResponse> getAllStudents() {
        // 1. Carga alumnos + grupo + tutores en UNA sola query JOIN FETCH.
        //    Elimina el N+1 que antes hacía 2 queries por alumno.
        List<Student> students = studentRepository.findAllWithGroupAndFamilyMembers();

        // 2. Carga todos los maestros con sus grupos en UNA sola query.
        //    Construye un mapa groupId → List<nombreMaestro> para consulta O(1).
        Map<UUID, List<String>> teachersByGroup = teacherUserRepository.findAllWithGroups()
                .stream()
                .flatMap(t -> t.getGroups().stream()
                        .map(g -> Map.entry(g.getId(), t.getNombre())))
                .collect(Collectors.groupingBy(
                        Map.Entry::getKey,
                        Collectors.mapping(Map.Entry::getValue, Collectors.toList())));

        return students.stream()
                .map(s -> mapToDetailResponse(s, teachersByGroup))
                .toList();
    }

    @Transactional(readOnly = true)
    public StudentDetailResponse getStudentById(UUID id) {
        Student student = studentRepository.findById(id)
                .orElseThrow(() -> new IllegalArgumentException("Alumno no encontrado: " + id));
        return mapToDetailResponse(student, buildTeacherMap());
    }

    @Transactional
    public StudentDetailResponse createStudent(StudentRequest request) {
        Student.SchoolLevel level = Student.SchoolLevel.valueOf(request.level().toUpperCase());

        SchoolGroup group = null;
        if (request.groupId() != null && !request.groupId().isBlank()) {
            group = groupRepository.findById(UUID.fromString(request.groupId()))
                    .orElse(null);
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
                .level(level)
                .grade(request.grade())
                .group(group)
                .birthday(bday)
                .gender(request.gender() != null && !request.gender().isBlank() ? request.gender().trim().toUpperCase() : null)
                .curp(request.curp() != null && !request.curp().isBlank() ? request.curp().trim().toUpperCase() : null)
                .avatarUrl(request.avatarUrl())
                .active(request.active() != null ? request.active() : true)
                .build();

        Student saved = studentRepository.save(student);

        // Guardar hasta 3 tutores de pickup
        if (request.familyMembers() != null) {
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

        return mapToDetailResponse(saved, buildTeacherMap());
    }

    @Transactional
    public StudentDetailResponse updateStudent(UUID id, StudentRequest request) {
        Student student = studentRepository.findById(id)
                .orElseThrow(() -> new IllegalArgumentException("Alumno no encontrado: " + id));

        student.setName(request.name().trim());
        student.setLevel(Student.SchoolLevel.valueOf(request.level().toUpperCase()));
        student.setGrade(request.grade());

        if (request.groupId() != null && !request.groupId().isBlank()) {
            SchoolGroup group = groupRepository.findById(UUID.fromString(request.groupId()))
                    .orElse(null);
            student.setGroup(group);
        } else {
            student.setGroup(null);
        }

        if (request.birthday() != null && !request.birthday().isBlank()) {
            try {
                LocalDate parsed = LocalDate.parse(request.birthday());
                if (parsed.isAfter(LocalDate.now())) {
                    throw new IllegalArgumentException("La fecha de nacimiento no puede ser una fecha futura (" + request.birthday() + ")");
                }
                student.setBirthday(parsed);
            } catch (IllegalArgumentException e) {
                throw e;
            } catch (Exception ignored) {}
        } else {
            student.setBirthday(null);
        }

        student.setGender(request.gender() != null && !request.gender().isBlank() ? request.gender().trim().toUpperCase() : null);
        student.setCurp(request.curp() != null && !request.curp().isBlank() ? request.curp().trim().toUpperCase() : null);

        if (request.avatarUrl() != null) {
            student.setAvatarUrl(request.avatarUrl());
        }

        if (request.active() != null) {
            student.setActive(request.active());
        }

        Student saved = studentRepository.save(student);

        // Actualizar tutores de pickup (reemplazar)
        if (request.familyMembers() != null) {
            List<FamilyMember> existingMembers = familyMemberRepository.findByStudentId(saved.getId());
            familyMemberRepository.deleteAll(existingMembers);

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

        return mapToDetailResponse(saved, buildTeacherMap());
    }

    /** Construye el mapa groupId → nombres de maestros consultando la BD una sola vez. */
    private Map<UUID, List<String>> buildTeacherMap() {
        return teacherUserRepository.findAllWithGroups()
                .stream()
                .flatMap(t -> t.getGroups().stream()
                        .map(g -> Map.entry(g.getId(), t.getNombre())))
                .collect(Collectors.groupingBy(
                        Map.Entry::getKey,
                        Collectors.mapping(Map.Entry::getValue, Collectors.toList())));
    }

    @Transactional
    public void deleteStudent(UUID id) {
        studentRepository.deleteById(id);
    }

    /**
     * Mapeo sin queries adicionales: recibe el mapa de maestros pre-cargado
     * y usa los familyMembers ya traídos por el JOIN FETCH del repositorio.
     * Complejidad: O(1) por alumno, en lugar de 2 queries N+1.
     */
    private StudentDetailResponse mapToDetailResponse(Student student,
                                                       Map<UUID, List<String>> teachersByGroup) {
        String groupId   = student.getGroup() != null ? student.getGroup().getId().toString() : null;
        String groupName = student.getGroup() != null ? student.getGroup().getName() : null;

        // Lectura del mapa en memoria — sin query a BD
        List<String> teacherNames = (student.getGroup() != null)
                ? teachersByGroup.getOrDefault(student.getGroup().getId(), Collections.emptyList())
                : Collections.emptyList();

        // familyMembers ya viene pre-cargado por el JOIN FETCH — sin query a BD
        List<FamilyMemberResponse> familyMembers = student.getFamilyMembers().stream()
                .map(fm -> new FamilyMemberResponse(
                        fm.getId().toString(),
                        fm.getName(),
                        fm.getRelationship(),
                        fm.getPhone(),
                        fm.getPhotoUrl(),
                        fm.getAuthorized() != null ? fm.getAuthorized() : true
                ))
                .toList();

        return new StudentDetailResponse(
                student.getId().toString(),
                student.getName(),
                student.getLevel().name(),
                student.getGrade(),
                groupId,
                groupName,
                student.getBirthday() != null ? student.getBirthday().toString() : null,
                student.getGender(),
                student.getCurp(),
                student.getAvatarUrl(),
                student.getActive() != null ? student.getActive() : true,
                teacherNames,
                familyMembers
        );
    }
}
