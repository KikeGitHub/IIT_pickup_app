package com.stitchpickup.modules.admin.dto;

public record FamilyMemberResponse(
    String id,
    String name,
    String relationship,
    String phone,
    String photoUrl,
    boolean authorized
) {}
