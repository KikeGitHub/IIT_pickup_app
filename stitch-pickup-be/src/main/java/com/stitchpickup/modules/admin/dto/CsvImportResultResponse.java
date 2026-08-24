package com.stitchpickup.modules.admin.dto;

import java.util.List;

public record CsvImportResultResponse(
    int totalProcessed,
    int totalSuccess,
    int totalErrors,
    List<String> errorMessages
) {}
