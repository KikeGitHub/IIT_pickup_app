package com.stitchpickup.modules.student.dto;

import java.util.List;

public record StudentResponse(
    String id,
    String name,
    String level,
    String grade,
    String groupName,
    String avatarUrl,
    List<FamilyMemberResponse> familyMembers
) {}
