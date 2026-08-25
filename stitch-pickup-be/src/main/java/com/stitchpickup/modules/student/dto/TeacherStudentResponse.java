package com.stitchpickup.modules.student.dto;

import com.stitchpickup.modules.admin.dto.FamilyMemberResponse;
import java.util.List;

public record TeacherStudentResponse(
    String id,
    String name,
    String level,
    String grade,
    String groupId,
    String groupName,
    String birthday,
    String gender,
    String curp,
    String avatarUrl,
    boolean active,
    List<FamilyMemberResponse> familyMembers
) {}
