-- ═══════════════════════════════════════════════════════════════════
--  IIT PICKUP — Datos de Seed Consolidados (DML)
--  Versión: Final  |  Fecha: 2026-08-25
--
--  INSTRUCCIONES:
--    Ejecutar DESPUÉS del archivo V_FINAL__schema_ddl.sql
--    Contiene:
--      1. Grupos escolares (Kinder, Primaria, Secundaria)
--      2. Alumnos demo (con gender y CURP del V9)
--      3. Familiares / Tutores autorizados
--      4. Usuarios Padres demo
--      5. Usuarios Maestros / Admin demo
--      6. Relaciones Maestro ↔ Grupos
--      7. Relaciones Padre ↔ Alumnos
--
--  CONTRASEÑAS:
--      "demo1234"  → $2a$12$frMiCP8exLbhapvI3AGlB.NMSYEBvG.cbRli1sXzUx4pe31hoAvVC
--      "admin2026" → $2a$12$3flB4Pu/EGOXaOF2sn7FYuclYMiXRbpOCO8w3nB.GDS8Y.Ne7ip7S
-- ═══════════════════════════════════════════════════════════════════

-- ═══════════════════════════════════════════════════════════════════════════════
--  1. GRUPOS ESCOLARES
--  Preescolar  → level = 'KINDER'    (e01...)   IDs: 01-11
--  Primaria    → level = 'PRIMARIA'  (e02...)   IDs: 01-30
--  Secundaria  → level = 'SECUNDARIA'(e03...)   IDs: 01-15
-- ═══════════════════════════════════════════════════════════════════════════════

-- ─── PREESCOLAR ──────────────────────────────────────────────────────────────
--  Maternal + 1o Kinder (A-C) + 2o Kinder (A-C) + 3o Kinder (A-D)
INSERT INTO school_groups (id, level, name) VALUES
    ('e0100000-0000-0000-0000-000000000001', 'KINDER', '2o Maternal'),
    ('e0100000-0000-0000-0000-000000000002', 'KINDER', '1o de Kinder-C'),
    ('e0100000-0000-0000-0000-000000000003', 'KINDER', '1o de Kinder-B'),
    ('e0100000-0000-0000-0000-000000000004', 'KINDER', '1o de Kinder-A'),
    ('e0100000-0000-0000-0000-000000000005', 'KINDER', '2o de Kinder-A'),
    ('e0100000-0000-0000-0000-000000000006', 'KINDER', '2o de Kinder-B'),
    ('e0100000-0000-0000-0000-000000000007', 'KINDER', '2o de Kinder-C'),
    ('e0100000-0000-0000-0000-000000000008', 'KINDER', '3o de Kinder-A'),
    ('e0100000-0000-0000-0000-000000000009', 'KINDER', '3o de Kinder-B'),
    ('e0100000-0000-0000-0000-000000000010', 'KINDER', '3o de Kinder-C'),
    ('e0100000-0000-0000-0000-000000000011', 'KINDER', '3o de Kinder-D');

-- ─── PRIMARIA ────────────────────────────────────────────────────────────────
--  1o – 6o  con grupos A, B, C, D, E  (6 grados × 5 grupos = 30)
INSERT INTO school_groups (id, level, name) VALUES
    ('e0200000-0000-0000-0000-000000000001', 'PRIMARIA', '1o. de Primaria-A'),
    ('e0200000-0000-0000-0000-000000000002', 'PRIMARIA', '1o. de Primaria-B'),
    ('e0200000-0000-0000-0000-000000000003', 'PRIMARIA', '1o. de Primaria-C'),
    ('e0200000-0000-0000-0000-000000000004', 'PRIMARIA', '1o. de Primaria-D'),
    ('e0200000-0000-0000-0000-000000000005', 'PRIMARIA', '1o. de Primaria-E'),
    ('e0200000-0000-0000-0000-000000000006', 'PRIMARIA', '2o. de Primaria-A'),
    ('e0200000-0000-0000-0000-000000000007', 'PRIMARIA', '2o. de Primaria-B'),
    ('e0200000-0000-0000-0000-000000000008', 'PRIMARIA', '2o. de Primaria-C'),
    ('e0200000-0000-0000-0000-000000000009', 'PRIMARIA', '2o. de Primaria-D'),
    ('e0200000-0000-0000-0000-000000000010', 'PRIMARIA', '2o. de Primaria-E'),
    ('e0200000-0000-0000-0000-000000000011', 'PRIMARIA', '3o. de Primaria-A'),
    ('e0200000-0000-0000-0000-000000000012', 'PRIMARIA', '3o. de Primaria-B'),
    ('e0200000-0000-0000-0000-000000000013', 'PRIMARIA', '3o. de Primaria-C'),
    ('e0200000-0000-0000-0000-000000000014', 'PRIMARIA', '3o. de Primaria-D'),
    ('e0200000-0000-0000-0000-000000000015', 'PRIMARIA', '3o. de Primaria-E'),
    ('e0200000-0000-0000-0000-000000000016', 'PRIMARIA', '4o. de Primaria-A'),
    ('e0200000-0000-0000-0000-000000000017', 'PRIMARIA', '4o. de Primaria-B'),
    ('e0200000-0000-0000-0000-000000000018', 'PRIMARIA', '4o. de Primaria-C'),
    ('e0200000-0000-0000-0000-000000000019', 'PRIMARIA', '4o. de Primaria-D'),
    ('e0200000-0000-0000-0000-000000000020', 'PRIMARIA', '4o. de Primaria-E'),
    ('e0200000-0000-0000-0000-000000000021', 'PRIMARIA', '5o. de Primaria-A'),
    ('e0200000-0000-0000-0000-000000000022', 'PRIMARIA', '5o. de Primaria-B'),
    ('e0200000-0000-0000-0000-000000000023', 'PRIMARIA', '5o. de Primaria-C'),
    ('e0200000-0000-0000-0000-000000000024', 'PRIMARIA', '5o. de Primaria-D'),
    ('e0200000-0000-0000-0000-000000000025', 'PRIMARIA', '5o. de Primaria-E'),
    ('e0200000-0000-0000-0000-000000000026', 'PRIMARIA', '6o. de Primaria-A'),
    ('e0200000-0000-0000-0000-000000000027', 'PRIMARIA', '6o. de Primaria-B'),
    ('e0200000-0000-0000-0000-000000000028', 'PRIMARIA', '6o. de Primaria-C'),
    ('e0200000-0000-0000-0000-000000000029', 'PRIMARIA', '6o. de Primaria-D'),
    ('e0200000-0000-0000-0000-000000000030', 'PRIMARIA', '6o. de Primaria-E');

-- ─── SECUNDARIA ──────────────────────────────────────────────────────────────
--  1o – 3o  con grupos A, B, C, D, E  (3 grados × 5 grupos = 15)
INSERT INTO school_groups (id, level, name) VALUES
    ('e0300000-0000-0000-0000-000000000001', 'SECUNDARIA', '1o. de Secundaria-A'),
    ('e0300000-0000-0000-0000-000000000002', 'SECUNDARIA', '1o. de Secundaria-B'),
    ('e0300000-0000-0000-0000-000000000003', 'SECUNDARIA', '1o. de Secundaria-C'),
    ('e0300000-0000-0000-0000-000000000004', 'SECUNDARIA', '1o. de Secundaria-D'),
    ('e0300000-0000-0000-0000-000000000005', 'SECUNDARIA', '1o. de Secundaria-E'),
    ('e0300000-0000-0000-0000-000000000006', 'SECUNDARIA', '2o. de Secundaria-A'),
    ('e0300000-0000-0000-0000-000000000007', 'SECUNDARIA', '2o. de Secundaria-B'),
    ('e0300000-0000-0000-0000-000000000008', 'SECUNDARIA', '2o. de Secundaria-C'),
    ('e0300000-0000-0000-0000-000000000009', 'SECUNDARIA', '2o. de Secundaria-D'),
    ('e0300000-0000-0000-0000-000000000010', 'SECUNDARIA', '2o. de Secundaria-E'),
    ('e0300000-0000-0000-0000-000000000011', 'SECUNDARIA', '3o. de Secundaria-A'),
    ('e0300000-0000-0000-0000-000000000012', 'SECUNDARIA', '3o. de Secundaria-B'),
    ('e0300000-0000-0000-0000-000000000013', 'SECUNDARIA', '3o. de Secundaria-C'),
    ('e0300000-0000-0000-0000-000000000014', 'SECUNDARIA', '3o. de Secundaria-D'),
    ('e0300000-0000-0000-0000-000000000015', 'SECUNDARIA', '3o. de Secundaria-E');

-- ═══════════════════════════════════════════════════════════════════════════════
--  2. ALUMNOS DEMO  (incluye gender y curp — V9)
-- ═══════════════════════════════════════════════════════════════════════════════

INSERT INTO students (id, name, level, grade, group_id, birthday, gender, curp) VALUES
    (
        'a1000000-0000-0000-0000-000000000001',
        'Sofía Ramírez López',
        'PRIMARIA', '3er Grado',
        'e0200000-0000-0000-0000-000000000005',   -- PRIMARIA 3A
        '2017-03-15', 'F', 'RALS170315MMNPRFA1'
    ),
    (
        'a1000000-0000-0000-0000-000000000002',
        'Mateo González Pérez',
        'PRIMARIA', '3er Grado',
        'e0200000-0000-0000-0000-000000000005',   -- PRIMARIA 3A
        '2017-06-22', 'M', 'GOPM170622HHNPRMA2'
    ),
    (
        'a1000000-0000-0000-0000-000000000003',
        'Isabella Torres Vega',
        'KINDER', 'Kinder',
        'e0100000-0000-0000-0000-000000000002',   -- KINDER KB
        '2020-09-10', 'F', 'TOVI200910MMCPRFA3'
    ),
    (
        'a1000000-0000-0000-0000-000000000004',
        'Diego Hernández Cruz',
        'SECUNDARIA', '1er Año',
        'e0300000-0000-0000-0000-000000000001',   -- SECUNDARIA 1A
        '2013-11-30', 'M', NULL
    ),
    (
        'a1000000-0000-0000-0000-000000000005',
        'Valentina Morales Ruiz',
        'PRIMARIA', '5to Grado',
        'e0200000-0000-0000-0000-000000000010',   -- PRIMARIA 5B
        '2015-04-05', 'F', 'MORV150405MMNPRFA5'
    );

-- ═══════════════════════════════════════════════════════════════════════════════
--  3. FAMILIARES / TUTORES AUTORIZADOS
-- ═══════════════════════════════════════════════════════════════════════════════

INSERT INTO family_members (id, student_id, name, relationship, phone, authorized) VALUES
    -- Sofía (a1...001)
    (gen_random_uuid(), 'a1000000-0000-0000-0000-000000000001', 'Carlos Ramírez Soto',       'Padre',           '+52 722 123 4567', TRUE),
    (gen_random_uuid(), 'a1000000-0000-0000-0000-000000000001', 'Patricia López de Ramírez', 'Madre',           '+52 722 234 5678', TRUE),
    -- Mateo (a1...002)
    (gen_random_uuid(), 'a1000000-0000-0000-0000-000000000002', 'Roberto González Vidal',    'Padre',           '+52 722 345 6789', TRUE),
    (gen_random_uuid(), 'a1000000-0000-0000-0000-000000000002', 'Elena Pérez Sánchez',        'Madre',           '+52 722 456 0001', TRUE),
    -- Isabella (a1...003)
    (gen_random_uuid(), 'a1000000-0000-0000-0000-000000000003', 'Ana Torres Mendoza',         'Madre',           '+52 722 456 7890', TRUE),
    (gen_random_uuid(), 'a1000000-0000-0000-0000-000000000003', 'Pedro Torres Reyes',         'Padre',           '+52 722 456 0002', TRUE),
    -- Diego (a1...004)
    (gen_random_uuid(), 'a1000000-0000-0000-0000-000000000004', 'Jorge Hernández Reyes',      'Padre',           '+52 722 567 8901', TRUE),
    -- Valentina (a1...005)
    (gen_random_uuid(), 'a1000000-0000-0000-0000-000000000005', 'Laura Morales Jiménez',      'Madre',           '+52 722 678 9012', TRUE),
    (gen_random_uuid(), 'a1000000-0000-0000-0000-000000000005', 'Ernesto Ruiz Torres',        'Tío Autorizado',  '+52 722 678 0003', TRUE);

-- ═══════════════════════════════════════════════════════════════════════════════
--  4. USUARIOS PADRES DEMO
--  Contraseña: "demo1234" para todos excepto donde se indique
-- ═══════════════════════════════════════════════════════════════════════════════

INSERT INTO parent_users (id, nombre, email, password_hash, phone, temp_password) VALUES
    (
        'b2000000-0000-0000-0000-000000000001',
        'Carlos Ramírez Soto',
        'padre1@iit.edu.mx',
        '$2a$12$frMiCP8exLbhapvI3AGlB.NMSYEBvG.cbRli1sXzUx4pe31hoAvVC',   -- demo1234
        '+52 722 123 4567',
        FALSE   -- Ya completó cambio de contraseña
    ),
    (
        'b2000000-0000-0000-0000-000000000002',
        'Roberto González Vidal',
        'padre2@iit.edu.mx',
        '$2a$12$frMiCP8exLbhapvI3AGlB.NMSYEBvG.cbRli1sXzUx4pe31hoAvVC',   -- demo1234
        '+52 722 345 6789',
        TRUE    -- Debe cambiar contraseña en primer login
    ),
    (
        'b2000000-0000-0000-0000-000000000003',
        'Ana Torres Mendoza',
        'padre3@iit.edu.mx',
        '$2a$12$frMiCP8exLbhapvI3AGlB.NMSYEBvG.cbRli1sXzUx4pe31hoAvVC',   -- demo1234
        '+52 722 456 7890',
        FALSE
    );

-- ═══════════════════════════════════════════════════════════════════════════════
--  5. USUARIOS MAESTROS / ADMIN DEMO
-- ═══════════════════════════════════════════════════════════════════════════════

INSERT INTO teacher_users (id, nombre, email, password_hash, role, level, temp_password) VALUES
    (
        'c3000000-0000-0000-0000-000000000001',
        'María Fernanda Solis',
        'maestro1@iit.edu.mx',
        '$2a$12$frMiCP8exLbhapvI3AGlB.NMSYEBvG.cbRli1sXzUx4pe31hoAvVC',   -- demo1234
        'TEACHER', 'PRIMARIA', FALSE
    ),
    (
        'c3000000-0000-0000-0000-000000000002',
        'Luis Alberto Campos',
        'maestro2@iit.edu.mx',
        '$2a$12$frMiCP8exLbhapvI3AGlB.NMSYEBvG.cbRli1sXzUx4pe31hoAvVC',   -- demo1234
        'TEACHER', 'SECUNDARIA', FALSE
    ),
    (
        'c3000000-0000-0000-0000-000000000003',
        'Director General IIT',
        'admin@iit.edu.mx',
        '$2a$12$3flB4Pu/EGOXaOF2sn7FYuclYMiXRbpOCO8w3nB.GDS8Y.Ne7ip7S',   -- admin2026
        'ADMIN', NULL, FALSE
    );

-- ═══════════════════════════════════════════════════════════════════════════════
--  6. ASIGNACIÓN MAESTROS ↔ GRUPOS
-- ═══════════════════════════════════════════════════════════════════════════════

INSERT INTO teacher_groups (teacher_id, group_id) VALUES
    -- María Fernanda → PRIMARIA 3A y 5B
    ('c3000000-0000-0000-0000-000000000001', 'e0200000-0000-0000-0000-000000000005'),  -- PRIMARIA 3A
    ('c3000000-0000-0000-0000-000000000001', 'e0200000-0000-0000-0000-000000000010'),  -- PRIMARIA 5B
    -- Luis Alberto → SECUNDARIA 1A
    ('c3000000-0000-0000-0000-000000000002', 'e0300000-0000-0000-0000-000000000001');  -- SECUNDARIA 1A

-- ═══════════════════════════════════════════════════════════════════════════════
--  7. VINCULACIÓN PADRES ↔ ALUMNOS
-- ═══════════════════════════════════════════════════════════════════════════════

INSERT INTO parent_students (parent_id, student_id) VALUES
    -- Carlos → Sofía y Valentina (padre con 2 hijos)
    ('b2000000-0000-0000-0000-000000000001', 'a1000000-0000-0000-0000-000000000001'),
    ('b2000000-0000-0000-0000-000000000001', 'a1000000-0000-0000-0000-000000000005'),
    -- Roberto → Mateo
    ('b2000000-0000-0000-0000-000000000002', 'a1000000-0000-0000-0000-000000000002'),
    -- Ana → Isabella
    ('b2000000-0000-0000-0000-000000000003', 'a1000000-0000-0000-0000-000000000003');
