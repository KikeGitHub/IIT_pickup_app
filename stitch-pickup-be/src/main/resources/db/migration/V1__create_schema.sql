-- ═══════════════════════════════════════════════════════════════════
--  STITCH PICKUP — Schema Principal
--  Migración: V1  |  Autor: Stitch Pickup Team  |  Fecha: 2026-08-10
-- ═══════════════════════════════════════════════════════════════════

CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- ─── ENUMS ───────────────────────────────────────────────────────────────────

CREATE TYPE alert_status   AS ENUM ('TEN_MIN', 'FIVE_MIN', 'EN_FILA', 'URGENTE');
CREATE TYPE pickup_method  AS ENUM ('CAR', 'WALK');
CREATE TYPE delivery_status AS ENUM ('ENTREGADO_ESCUELA', 'RECIBIDO_PADRE');
CREATE TYPE school_level   AS ENUM ('KINDER', 'PRIMARIA', 'SECUNDARIA');

-- ─── GRUPOS ESCOLARES ────────────────────────────────────────────────────────

CREATE TABLE school_groups (
    id         UUID         PRIMARY KEY DEFAULT gen_random_uuid(),
    level      school_level NOT NULL,
    name       VARCHAR(20)  NOT NULL,
    active     BOOLEAN      NOT NULL DEFAULT true,
    created_at TIMESTAMPTZ  NOT NULL DEFAULT NOW(),
    UNIQUE (level, name)
);

-- ─── ALUMNOS ─────────────────────────────────────────────────────────────────

CREATE TABLE students (
    id          UUID         PRIMARY KEY DEFAULT gen_random_uuid(),
    name        VARCHAR(150) NOT NULL,
    level       school_level NOT NULL,
    grade       VARCHAR(50),
    group_id    UUID         REFERENCES school_groups(id),
    birthday    DATE,
    avatar_url  TEXT,
    active      BOOLEAN      NOT NULL DEFAULT true,
    created_at  TIMESTAMPTZ  NOT NULL DEFAULT NOW()
);

-- ─── FAMILIARES AUTORIZADOS ──────────────────────────────────────────────────

CREATE TABLE family_members (
    id           UUID         PRIMARY KEY DEFAULT gen_random_uuid(),
    student_id   UUID         NOT NULL REFERENCES students(id) ON DELETE CASCADE,
    name         VARCHAR(150) NOT NULL,
    relationship VARCHAR(50),
    phone        VARCHAR(20),
    photo_url    TEXT,
    authorized   BOOLEAN      NOT NULL DEFAULT true
);

-- ─── USUARIOS PADRES ─────────────────────────────────────────────────────────

CREATE TABLE parent_users (
    id            UUID         PRIMARY KEY DEFAULT gen_random_uuid(),
    nombre        VARCHAR(150) NOT NULL,
    email         VARCHAR(200) NOT NULL UNIQUE,
    password_hash VARCHAR(255) NOT NULL,    -- BCrypt hash
    phone         VARCHAR(20),
    avatar_url    TEXT,
    active        BOOLEAN      NOT NULL DEFAULT true,
    temp_password BOOLEAN      NOT NULL DEFAULT true,
    created_at    TIMESTAMPTZ  NOT NULL DEFAULT NOW(),
    last_login    TIMESTAMPTZ
);

-- ─── RELACIÓN PADRE ↔ ALUMNOS (N:M) ─────────────────────────────────────────

CREATE TABLE parent_students (
    parent_id  UUID NOT NULL REFERENCES parent_users(id) ON DELETE CASCADE,
    student_id UUID NOT NULL REFERENCES students(id)     ON DELETE CASCADE,
    PRIMARY KEY (parent_id, student_id)
);

-- ─── USUARIOS MAESTROS ───────────────────────────────────────────────────────

CREATE TABLE teacher_users (
    id            UUID         PRIMARY KEY DEFAULT gen_random_uuid(),
    nombre        VARCHAR(150) NOT NULL,
    email         VARCHAR(200) NOT NULL UNIQUE,
    password_hash VARCHAR(255) NOT NULL,
    role          VARCHAR(20)  NOT NULL DEFAULT 'TEACHER',   -- TEACHER | ADMIN
    level         school_level,
    avatar_url    TEXT,
    active        BOOLEAN      NOT NULL DEFAULT true,
    temp_password BOOLEAN      NOT NULL DEFAULT true,
    created_at    TIMESTAMPTZ  NOT NULL DEFAULT NOW(),
    last_login    TIMESTAMPTZ
);

-- ─── RELACIÓN MAESTRO ↔ GRUPOS ───────────────────────────────────────────────

CREATE TABLE teacher_groups (
    teacher_id UUID NOT NULL REFERENCES teacher_users(id) ON DELETE CASCADE,
    group_id   UUID NOT NULL REFERENCES school_groups(id) ON DELETE CASCADE,
    PRIMARY KEY (teacher_id, group_id)
);

-- ─── ALERTAS DE PROXIMIDAD ───────────────────────────────────────────────────

CREATE TABLE alerts (
    id            UUID          PRIMARY KEY DEFAULT gen_random_uuid(),
    parent_id     UUID          NOT NULL REFERENCES parent_users(id),
    student_id    UUID          NOT NULL REFERENCES students(id),
    status        alert_status  NOT NULL,
    pickup_method pickup_method NOT NULL DEFAULT 'CAR',
    client_id     UUID          UNIQUE,              -- Deduplicación offline (ADR-002)
    sent_at       TIMESTAMPTZ   NOT NULL DEFAULT NOW(),
    received_at   TIMESTAMPTZ
);

CREATE INDEX idx_alerts_student_date ON alerts(student_id, sent_at);
CREATE INDEX idx_alerts_status       ON alerts(status);
CREATE INDEX idx_alerts_parent       ON alerts(parent_id);

-- ─── BITÁCORA DE ENTREGAS ────────────────────────────────────────────────────

CREATE TABLE delivery_logs (
    id                   UUID            PRIMARY KEY DEFAULT gen_random_uuid(),
    student_id           UUID            NOT NULL REFERENCES students(id),
    alert_id             UUID            REFERENCES alerts(id),
    teacher_name         VARCHAR(150),
    pickup_method        pickup_method,
    status               delivery_status NOT NULL,
    teacher_confirmed_at TIMESTAMPTZ,
    parent_confirmed_at  TIMESTAMPTZ,
    log_date             DATE            NOT NULL DEFAULT CURRENT_DATE,
    UNIQUE (student_id, log_date)        -- Un registro de entrega por alumno por día
);

CREATE INDEX idx_delivery_logs_date ON delivery_logs(log_date);
