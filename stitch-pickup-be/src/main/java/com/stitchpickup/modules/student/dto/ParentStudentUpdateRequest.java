package com.stitchpickup.modules.student.dto;

import java.util.List;

public record ParentStudentUpdateRequest(
    String birthday,
    String avatarUrl,
    List<FamilyMemberInput> familyMembers
) {
    public record FamilyMemberInput(
        String name,
        String relationship,
        String phone,
        Boolean authorized
    ) {}
}
