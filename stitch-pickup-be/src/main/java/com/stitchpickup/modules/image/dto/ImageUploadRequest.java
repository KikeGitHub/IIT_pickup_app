package com.stitchpickup.modules.image.dto;

import jakarta.validation.constraints.NotBlank;

/**
 * DTO de subida de imágenes para IIT Pickup.
 *
 * | Campo      | Propósito                                                    |
 * |------------|--------------------------------------------------------------|
 * | type       | Tipo de imagen: student / teacher / parent                   |
 * | identifier | ID único del recurso (studentId, teacherId, parentId, etc.)  |
 * | extraName  | Nombre descriptivo adicional (slug del alumno, etc.)         |
 * | base64File | Imagen codificada en Base64 puro (sin prefijo data:image/...)  |
 */
public record ImageUploadRequest(

    @NotBlank(message = "El tipo de imagen es obligatorio (student | teacher | parent)")
    String type,

    String identifier,

    String extraName,

    @NotBlank(message = "base64File no puede estar vacío")
    String base64File
) {}
