-- ═══════════════════════════════════════════════════════════════════
--  STITCH PICKUP — Migración V8: Compatibilidad Enum JPA / Hibernate
--  Convierte columnas con tipo PostgreSQL ENUM a VARCHAR(30)
--  para permitir mapeo nativo y transparente con @Enumerated(EnumType.STRING)
-- ═══════════════════════════════════════════════════════════════════

ALTER TABLE school_groups ALTER COLUMN level TYPE VARCHAR(30) USING level::text;
ALTER TABLE students ALTER COLUMN level TYPE VARCHAR(30) USING level::text;
ALTER TABLE teacher_users ALTER COLUMN level TYPE VARCHAR(30) USING level::text;
ALTER TABLE alerts ALTER COLUMN status TYPE VARCHAR(30) USING status::text;
ALTER TABLE alerts ALTER COLUMN pickup_method TYPE VARCHAR(30) USING pickup_method::text;
ALTER TABLE delivery_logs ALTER COLUMN status TYPE VARCHAR(30) USING status::text;
ALTER TABLE delivery_logs ALTER COLUMN pickup_method TYPE VARCHAR(30) USING pickup_method::text;
