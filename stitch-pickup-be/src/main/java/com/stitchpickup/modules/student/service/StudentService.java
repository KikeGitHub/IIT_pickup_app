package com.stitchpickup.modules.student.service;

import com.stitchpickup.modules.student.dto.FamilyMemberResponse;
import com.stitchpickup.modules.student.dto.StudentResponse;
import com.stitchpickup.modules.student.entity.Student;
import com.stitchpickup.modules.student.repository.FamilyMemberRepository;
import com.stitchpickup.modules.student.repository.StudentRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.UUID;

@Service
@RequiredArgsConstructor
public class StudentService {

    private final StudentRepository studentRepository;
    private final FamilyMemberRepository familyMemberRepository;

    @Transactional(readOnly = true)
    public List<StudentResponse> getStudentsByParentId(UUID parentId) {
        List<Student> students = studentRepository.findActiveStudentsByParentId(parentId);

        return students.stream().map(s -> {
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
        }).toList();
    }
}
