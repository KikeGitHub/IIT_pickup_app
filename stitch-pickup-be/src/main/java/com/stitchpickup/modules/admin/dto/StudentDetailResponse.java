package com.stitchpickup.modules.admin.dto;

import java.util.List;

public record StudentDetailResponse(
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
    List<String> teacherNames,
    List<FamilyMemberResponse> familyMembers
) {}
