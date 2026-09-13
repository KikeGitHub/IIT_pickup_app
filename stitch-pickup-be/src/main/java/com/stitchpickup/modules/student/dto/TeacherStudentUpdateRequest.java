package com.stitchpickup.modules.student.dto;

import com.stitchpickup.modules.admin.dto.FamilyMemberRequest;
import jakarta.validation.constraints.NotBlank;
import java.util.List;

public record TeacherStudentUpdateRequest(
    @NotBlank String name,
    String grade,
    String birthday,
    String gender,
    String curp,
    String avatarUrl,
    List<FamilyMemberRequest> familyMembers
) {}
