-- ═══════════════════════════════════════════════════════════════════
--  STITCH PICKUP — Usuarios Maestros y Admin de Demo
--  Migración: V5  |  Contraseñas BCrypt (coste 12)
-- ═══════════════════════════════════════════════════════════════════
--
--  CREDENCIALES DE PRUEBA:
--  maestro1@iit.edu.mx  → password: "demo1234"  → rol: TEACHER
--  maestro2@iit.edu.mx  → password: "demo1234"  → rol: TEACHER
--  admin@iit.edu.mx     → password: "admin2026"  → rol: ADMIN
--
--  Hashes BCrypt coste 12:
--  "demo1234"  → $2a$12$N7/p4xzDL3gFnYvPPH6EiuRb3yXkuNOcnkVyvKxeJv8mBhMvBV1Wy
--  "admin2026" → $2a$12$RQh6b9L4YAcgJzWqgJmFW.MZTqHJYPLiOQFNJQn0L1PG1qMPh4Hhi

INSERT INTO teacher_users (id, nombre, email, password_hash, role, level, temp_password) VALUES
    (
        'c3000000-0000-0000-0000-000000000001',
        'María Fernanda Solis',
        'maestro1@iit.edu.mx',
        '$2a$12$frMiCP8exLbhapvI3AGlB.NMSYEBvG.cbRli1sXzUx4pe31hoAvVC',
        'TEACHER',
        'PRIMARIA',
        false
    ),
    (
        'c3000000-0000-0000-0000-000000000002',
        'Luis Alberto Campos',
        'maestro2@iit.edu.mx',
        '$2a$12$frMiCP8exLbhapvI3AGlB.NMSYEBvG.cbRli1sXzUx4pe31hoAvVC',
        'TEACHER',
        'SECUNDARIA',
        false
    ),
    (
        'c3000000-0000-0000-0000-000000000003',
        'Director General IIT',
        'admin@iit.edu.mx',
        '$2a$12$3flB4Pu/EGOXaOF2sn7FYuclYMiXRbpOCO8w3nB.GDS8Y.Ne7ip7S',
        'ADMIN',
        NULL,
        false
    );

-- Asignar grupos a maestros
INSERT INTO teacher_groups (teacher_id, group_id) VALUES
    -- María Fernanda → Grupos 3A y 3B de Primaria
    ('c3000000-0000-0000-0000-000000000001',
     (SELECT id FROM school_groups WHERE level = 'PRIMARIA' AND name = '3A')),
    ('c3000000-0000-0000-0000-000000000001',
     (SELECT id FROM school_groups WHERE level = 'PRIMARIA' AND name = '5B')),
    -- Luis Alberto → Grupos de Secundaria
    ('c3000000-0000-0000-0000-000000000002',
     (SELECT id FROM school_groups WHERE level = 'SECUNDARIA' AND name = '1A'));
