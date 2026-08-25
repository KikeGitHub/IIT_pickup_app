-- ═══════════════════════════════════════════════════════════════════
--  IIT PICKUP — Grupos Escolares y Super Admin
--  Migración: V2  |  56 Grupos Escolares (Preescolar, Primaria, Secundaria)
-- ═══════════════════════════════════════════════════════════════════

-- ═══════════════════════════════════════════════════════════════════
--  1. GRUPOS ESCOLARES
--  Preescolar  → level = 'KINDER'    (e01...)   IDs: 01-11
--  Primaria    → level = 'PRIMARIA'  (e02...)   IDs: 01-30
--  Secundaria  → level = 'SECUNDARIA'(e03...)   IDs: 01-15
-- ═══════════════════════════════════════════════════════════════════

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

-- ─── SUPER ADMIN INICIAL ─────────────────────────────────────────────────────
--  Contraseña: "admin2026"
INSERT INTO teacher_users (id, nombre, email, password_hash, role, level, temp_password) VALUES
    (
        'c3000000-0000-0000-0000-000000000003',
        'Director General IIT',
        'admin@iit.edu.mx',
        '$2a$12$3flB4Pu/EGOXaOF2sn7FYuclYMiXRbpOCO8w3nB.GDS8Y.Ne7ip7S',   -- admin2026
        'ADMIN', NULL, FALSE
    );
