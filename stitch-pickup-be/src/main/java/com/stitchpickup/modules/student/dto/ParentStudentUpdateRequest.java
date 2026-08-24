package com.stitchpickup.modules.student.dto;

import com.stitchpickup.modules.admin.dto.FamilyMemberRequest;
import java.util.List;

public record ParentStudentUpdateRequest(
    String birthday,
    String avatarUrl,
    List<FamilyMemberRequest> familyMembers
) {}
