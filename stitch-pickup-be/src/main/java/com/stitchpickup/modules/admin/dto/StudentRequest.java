package com.stitchpickup.modules.admin.dto;

import jakarta.validation.constraints.NotBlank;
import java.util.List;

public record StudentRequest(
    @NotBlank String name,
    @NotBlank String level,
    String grade,
    String groupId,
    String birthday,
    String avatarUrl,
    Boolean active,
    List<FamilyMemberRequest> familyMembers
) {}
