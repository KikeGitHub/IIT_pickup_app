package com.stitchpickup.modules.student.dto;

import java.util.List;

public record TeacherGroupDetailResponse(
    String id,
    String level,
    String name,
    List<TeacherStudentResponse> students
) {}
