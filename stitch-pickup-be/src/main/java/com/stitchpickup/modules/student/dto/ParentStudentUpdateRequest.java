package com.stitchpickup.modules.student.dto;

public record ParentStudentUpdateRequest(
    String avatarUrl,
    Boolean removePhoto
) {
    public ParentStudentUpdateRequest(String avatarUrl) {
        this(avatarUrl, Boolean.FALSE);
    }
}
