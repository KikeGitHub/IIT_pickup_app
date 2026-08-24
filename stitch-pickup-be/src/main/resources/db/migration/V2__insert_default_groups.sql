-- ═══════════════════════════════════════════════════════════════════
--  STITCH PICKUP — Grupos Escolares por Defecto
--  Migración: V2  |  Grupos del Instituto Inglés de Toluca
-- ═══════════════════════════════════════════════════════════════════

-- ─── KINDER ──────────────────────────────────────────────────────────────────
INSERT INTO school_groups (id, level, name) VALUES
    (gen_random_uuid(), 'KINDER', 'KA'),
    (gen_random_uuid(), 'KINDER', 'KB'),
    (gen_random_uuid(), 'KINDER', 'KC');

-- ─── PRIMARIA ─────────────────────────────────────────────────────────────────
INSERT INTO school_groups (id, level, name) VALUES
    (gen_random_uuid(), 'PRIMARIA', '1A'),
    (gen_random_uuid(), 'PRIMARIA', '1B'),
    (gen_random_uuid(), 'PRIMARIA', '2A'),
    (gen_random_uuid(), 'PRIMARIA', '2B'),
    (gen_random_uuid(), 'PRIMARIA', '3A'),
    (gen_random_uuid(), 'PRIMARIA', '3B'),
    (gen_random_uuid(), 'PRIMARIA', '4A'),
    (gen_random_uuid(), 'PRIMARIA', '4B'),
    (gen_random_uuid(), 'PRIMARIA', '5A'),
    (gen_random_uuid(), 'PRIMARIA', '5B'),
    (gen_random_uuid(), 'PRIMARIA', '6A'),
    (gen_random_uuid(), 'PRIMARIA', '6B');

-- ─── SECUNDARIA ───────────────────────────────────────────────────────────────
INSERT INTO school_groups (id, level, name) VALUES
    (gen_random_uuid(), 'SECUNDARIA', '1A'),
    (gen_random_uuid(), 'SECUNDARIA', '1B'),
    (gen_random_uuid(), 'SECUNDARIA', '2A'),
    (gen_random_uuid(), 'SECUNDARIA', '2B'),
    (gen_random_uuid(), 'SECUNDARIA', '3A'),
    (gen_random_uuid(), 'SECUNDARIA', '3B');
