package com.stitchpickup.modules.admin.service;

import com.stitchpickup.modules.admin.dto.CsvImportResultResponse;
import com.stitchpickup.modules.student.entity.SchoolGroup;
import com.stitchpickup.modules.student.entity.Student;
import com.stitchpickup.modules.student.repository.SchoolGroupRepository;
import com.stitchpickup.modules.student.repository.StudentRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.multipart.MultipartFile;

import java.io.BufferedReader;
import java.io.InputStreamReader;
import java.nio.charset.StandardCharsets;
import java.util.ArrayList;
import java.util.List;

@Service
@RequiredArgsConstructor
@Slf4j
public class CsvImportService {

    private final StudentRepository studentRepository;
    private final SchoolGroupRepository schoolGroupRepository;

    @Transactional
    public CsvImportResultResponse importStudentsFromCsv(MultipartFile file) {
        int processed = 0;
        int success = 0;
        int errors = 0;
        List<String> errorMessages = new ArrayList<>();

        try (BufferedReader reader = new BufferedReader(
                new InputStreamReader(file.getInputStream(), StandardCharsets.UTF_8))) {

            String line;
            boolean isHeader = true;
            while ((line = reader.readLine()) != null) {
                if (line.isBlank()) continue;
                if (isHeader) { isHeader = false; continue; } // Skip header row

                processed++;
                try {
                    // Expected CSV format: Name,Level,Grade,GroupName
                    String[] tokens = line.split(",");
                    if (tokens.length < 4) {
                        throw new IllegalArgumentException("Formato de fila incompleto: " + line);
                    }

                    String name = tokens[0].trim();
                    String levelStr = tokens[1].trim().toUpperCase();
                    String grade = tokens[2].trim();
                    String groupName = tokens[3].trim();

                    Student.SchoolLevel level = Student.SchoolLevel.valueOf(levelStr);
                    var group = schoolGroupRepository.findByLevelAndName(level, groupName)
                            .orElseGet(() -> schoolGroupRepository.save(
                                    SchoolGroup.builder().level(level).name(groupName).build()
                            ));

                    Student student = Student.builder()
                            .name(name)
                            .level(level)
                            .grade(grade)
                            .group(group)
                            .active(true)
                            .build();

                    studentRepository.save(student);
                    success++;
                } catch (Exception e) {
                    errors++;
                    errorMessages.add("Línea " + processed + ": " + e.getMessage());
                }
            }
        } catch (Exception e) {
            log.error("Error al leer archivo CSV: {}", e.getMessage());
            return new CsvImportResultResponse(0, 0, 1, List.of("Error general al leer archivo: " + e.getMessage()));
        }

        return new CsvImportResultResponse(processed, success, errors, errorMessages);
    }
}
