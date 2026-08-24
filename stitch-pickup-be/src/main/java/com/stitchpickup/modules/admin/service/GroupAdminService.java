package com.stitchpickup.modules.admin.service;

import com.stitchpickup.modules.admin.dto.GroupRequest;
import com.stitchpickup.modules.admin.dto.GroupResponse;
import com.stitchpickup.modules.student.entity.SchoolGroup;
import com.stitchpickup.modules.student.entity.Student;
import com.stitchpickup.modules.student.repository.SchoolGroupRepository;
import com.stitchpickup.modules.student.repository.StudentRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.UUID;

@Service
@RequiredArgsConstructor
public class GroupAdminService {

    private final SchoolGroupRepository groupRepository;
    private final StudentRepository studentRepository;

    @Transactional(readOnly = true)
    public List<GroupResponse> getAllGroups() {
        return groupRepository.findAllByOrderByLevelAscNameAsc().stream()
                .map(this::mapToResponse)
                .toList();
    }

    @Transactional
    public GroupResponse createGroup(GroupRequest request) {
        Student.SchoolLevel level = Student.SchoolLevel.valueOf(request.level().toUpperCase());
        groupRepository.findByLevelAndName(level, request.name()).ifPresent(g -> {
            throw new IllegalArgumentException("Ya existe un grupo con el nombre " + request.name() + " en " + level);
        });

        SchoolGroup group = SchoolGroup.builder()
                .level(level)
                .name(request.name().trim())
                .active(true)
                .build();

        SchoolGroup saved = groupRepository.save(group);
        return mapToResponse(saved);
    }

    @Transactional
    public GroupResponse updateGroup(UUID id, GroupRequest request) {
        SchoolGroup group = groupRepository.findById(id)
                .orElseThrow(() -> new IllegalArgumentException("Grupo no encontrado: " + id));

        Student.SchoolLevel level = Student.SchoolLevel.valueOf(request.level().toUpperCase());
        group.setLevel(level);
        group.setName(request.name().trim());

        SchoolGroup saved = groupRepository.save(group);
        return mapToResponse(saved);
    }

    @Transactional
    public void deleteGroup(UUID id) {
        long count = studentRepository.countByGroupId(id);
        if (count > 0) {
            throw new IllegalStateException("No se puede eliminar el grupo porque tiene " + count + " alumnos asignados.");
        }
        groupRepository.deleteById(id);
    }

    private GroupResponse mapToResponse(SchoolGroup group) {
        long studentCount = studentRepository.countByGroupId(group.getId());
        return new GroupResponse(
                group.getId().toString(),
                group.getLevel().name(),
                group.getName(),
                group.getActive() != null ? group.getActive() : true,
                studentCount
        );
    }
}
