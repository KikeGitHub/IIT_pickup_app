package com.stitchpickup.modules.student.dto;

import com.stitchpickup.modules.admin.dto.FamilyMemberRequest;
import io.swagger.v3.oas.annotations.media.Schema;
import jakarta.validation.constraints.NotBlank;
import java.util.List;

@Schema(description = "Payload para que el maestro registre un nuevo alumno en su grupo")
public record TeacherStudentCreateRequest(
    @NotBlank(message = "El nombre del alumno es obligatorio")
    String name,

    @NotBlank(message = "El ID del grupo es obligatorio")
    String groupId,

    String grade,
    String birthday,
    String gender,
    String curp,
    String avatarUrl,

    @Schema(description = "Cuentas de usuario padre para acceso al portal web")
    List<TeacherParentAccountInputDto> parentAccounts,

    @Schema(description = "Tutores autorizados para recoger al alumno en pickup")
    List<FamilyMemberRequest> familyMembers
) {}
