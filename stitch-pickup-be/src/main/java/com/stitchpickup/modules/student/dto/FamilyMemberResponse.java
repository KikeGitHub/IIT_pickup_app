package com.stitchpickup.modules.student.dto;

public record FamilyMemberResponse(
    String id,
    String name,
    String relationship,
    String phone,
    String photoUrl,
    boolean authorized
) {}
