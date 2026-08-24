package com.stitchpickup.modules.admin.dto;

public record FamilyMemberRequest(
    String id,
    String name,
    String relationship,
    String phone,
    String photoUrl,
    Boolean authorized
) {}
