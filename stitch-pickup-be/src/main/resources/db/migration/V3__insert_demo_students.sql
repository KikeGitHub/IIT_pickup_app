-- ═══════════════════════════════════════════════════════════════════
--  STITCH PICKUP — Alumnos de Demo
--  Migración: V3  |  Datos para pruebas del sistema
-- ═══════════════════════════════════════════════════════════════════

-- Insertar alumnos de demo vinculados a grupos existentes
-- Usamos subqueries para referenciar los grupos por nombre/nivel

INSERT INTO students (id, name, level, grade, group_id, birthday) VALUES
    (
        'a1000000-0000-0000-0000-000000000001',
        'Sofía Ramírez López',
        'PRIMARIA', '3er Grado',
        (SELECT id FROM school_groups WHERE level = 'PRIMARIA' AND name = '3A'),
        '2017-03-15'
    ),
    (
        'a1000000-0000-0000-0000-000000000002',
        'Mateo González Pérez',
        'PRIMARIA', '3er Grado',
        (SELECT id FROM school_groups WHERE level = 'PRIMARIA' AND name = '3A'),
        '2017-06-22'
    ),
    (
        'a1000000-0000-0000-0000-000000000003',
        'Isabella Torres Vega',
        'KINDER', 'Kinder',
        (SELECT id FROM school_groups WHERE level = 'KINDER' AND name = 'KB'),
        '2020-09-10'
    ),
    (
        'a1000000-0000-0000-0000-000000000004',
        'Diego Hernández Cruz',
        'SECUNDARIA', '1er Año',
        (SELECT id FROM school_groups WHERE level = 'SECUNDARIA' AND name = '1A'),
        '2013-11-30'
    ),
    (
        'a1000000-0000-0000-0000-000000000005',
        'Valentina Morales Ruiz',
        'PRIMARIA', '5to Grado',
        (SELECT id FROM school_groups WHERE level = 'PRIMARIA' AND name = '5B'),
        '2015-04-05'
    );

-- Familiares autorizados para los alumnos demo
INSERT INTO family_members (id, student_id, name, relationship, phone) VALUES
    (gen_random_uuid(), 'a1000000-0000-0000-0000-000000000001', 'Carlos Ramírez Soto', 'Padre', '+52 722 123 4567'),
    (gen_random_uuid(), 'a1000000-0000-0000-0000-000000000001', 'Patricia López de Ramírez', 'Madre', '+52 722 234 5678'),
    (gen_random_uuid(), 'a1000000-0000-0000-0000-000000000002', 'Roberto González Vidal', 'Padre', '+52 722 345 6789'),
    (gen_random_uuid(), 'a1000000-0000-0000-0000-000000000003', 'Ana Torres Mendoza', 'Madre', '+52 722 456 7890'),
    (gen_random_uuid(), 'a1000000-0000-0000-0000-000000000004', 'Jorge Hernández Reyes', 'Padre', '+52 722 567 8901'),
    (gen_random_uuid(), 'a1000000-0000-0000-0000-000000000005', 'Laura Morales Jiménez', 'Madre', '+52 722 678 9012');
