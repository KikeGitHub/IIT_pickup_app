-- ═══════════════════════════════════════════════════════════════════
--  IIT PICKUP — Schema Consolidado (DDL)
--  Versión: Final  |  Fecha: 2026-08-25
--
--  INSTRUCCIONES:
--    1. Ejecutar en base de datos vacía (PostgreSQL 16+)
--    2. Reemplaza todas las migraciones V1 – V9
--    3. Configurar Flyway con baseline en la misma versión
--       spring.flyway.baseline-on-migrate=true
--       spring.flyway.baseline-version=10
-- ═══════════════════════════════════════════════════════════════════

-- ─── EXTENSIONES ─────────────────────────────────────────────────────────────

CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- ═══════════════════════════════════════════════════════════════════════════════
--  CATÁLOGOS Y ENTIDADES MAESTRAS
-- ═══════════════════════════════════════════════════════════════════════════════

-- ─── GRUPOS ESCOLARES ─────────────────────────────────────────────────────────
--  Representa cada salón/grupo dentro de un nivel educativo.
--  Restricción: combinación (level, name) única por institución.

CREATE TABLE school_groups (
    id         UUID         PRIMARY KEY DEFAULT gen_random_uuid(),
    level      VARCHAR(30)  NOT NULL CHECK (level IN ('KINDER','PRIMARIA','SECUNDARIA')),
    name       VARCHAR(20)  NOT NULL,
    active     BOOLEAN      NOT NULL DEFAULT TRUE,
    created_at TIMESTAMPTZ  NOT NULL DEFAULT NOW(),
    CONSTRAINT uq_school_groups_level_name UNIQUE (level, name)
);

-- ─── ALUMNOS ──────────────────────────────────────────────────────────────────
--  Alumno inscrito en la institución.
--  Opcionales: birthday, gender, curp, avatar_url.
--  La CURP es identificador oficial mexicano de 18 caracteres (nullable).

CREATE TABLE students (
    id          UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
    name        VARCHAR(150) NOT NULL,
    level       VARCHAR(30)  NOT NULL CHECK (level IN ('KINDER','PRIMARIA','SECUNDARIA')),
    grade       VARCHAR(50),
    group_id    UUID         REFERENCES school_groups(id) ON DELETE SET NULL,
    birthday    DATE,
    gender      VARCHAR(1)  CHECK (gender IN ('M','F')),
    curp        VARCHAR(18),
    avatar_url  TEXT,
    active      BOOLEAN      NOT NULL DEFAULT TRUE,
    created_at  TIMESTAMPTZ  NOT NULL DEFAULT NOW()
);

-- ─── FAMILIARES / TUTORES AUTORIZADOS ─────────────────────────────────────────
--  Personas autorizadas para recoger al alumno (hasta 3 por alumno).
--  Si se elimina el alumno, sus familiares se eliminan en cascada.

CREATE TABLE family_members (
    id           UUID         PRIMARY KEY DEFAULT gen_random_uuid(),
    student_id   UUID         NOT NULL REFERENCES students(id) ON DELETE CASCADE,
    name         VARCHAR(150) NOT NULL,
    relationship VARCHAR(50),
    phone        VARCHAR(20),
    photo_url    TEXT,
    authorized   BOOLEAN      NOT NULL DEFAULT TRUE
);

-- ─── USUARIOS PADRES ──────────────────────────────────────────────────────────
--  Cuenta de acceso para padres de familia.
--  temp_password=TRUE obliga cambio de contraseña en el primer login.

CREATE TABLE parent_users (
    id            UUID         PRIMARY KEY DEFAULT gen_random_uuid(),
    nombre        VARCHAR(150) NOT NULL,
    email         VARCHAR(200) NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    phone         VARCHAR(20),
    avatar_url    TEXT,
    active        BOOLEAN      NOT NULL DEFAULT TRUE,
    temp_password BOOLEAN      NOT NULL DEFAULT TRUE,
    created_at    TIMESTAMPTZ  NOT NULL DEFAULT NOW(),
    last_login    TIMESTAMPTZ,
    CONSTRAINT uq_parent_users_email UNIQUE (email)
);

-- ─── RELACIÓN PADRE ↔ ALUMNOS (N:M) ──────────────────────────────────────────
--  Un padre puede tener varios hijos; un alumno puede tener varios padres/tutores.

CREATE TABLE parent_students (
    parent_id  UUID NOT NULL REFERENCES parent_users(id) ON DELETE CASCADE,
    student_id UUID NOT NULL REFERENCES students(id)     ON DELETE CASCADE,
    PRIMARY KEY (parent_id, student_id)
);

-- ─── USUARIOS MAESTROS / ADMIN ────────────────────────────────────────────────
--  Roles posibles: TEACHER, ADMIN.
--  El Admin no tiene nivel asignado (level = NULL).

CREATE TABLE teacher_users (
    id            UUID         PRIMARY KEY DEFAULT gen_random_uuid(),
    nombre        VARCHAR(150) NOT NULL,
    email         VARCHAR(200) NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    role          VARCHAR(20)  NOT NULL DEFAULT 'TEACHER' CHECK (role IN ('TEACHER','ADMIN')),
    level         VARCHAR(30)  CHECK (level IN ('KINDER','PRIMARIA','SECUNDARIA')),
    avatar_url    TEXT,
    active        BOOLEAN      NOT NULL DEFAULT TRUE,
    temp_password BOOLEAN      NOT NULL DEFAULT TRUE,
    created_at    TIMESTAMPTZ  NOT NULL DEFAULT NOW(),
    last_login    TIMESTAMPTZ,
    CONSTRAINT uq_teacher_users_email UNIQUE (email)
);

-- ─── RELACIÓN MAESTRO ↔ GRUPOS (N:M) ─────────────────────────────────────────
--  Un maestro puede estar a cargo de uno o más grupos.

CREATE TABLE teacher_groups (
    teacher_id UUID NOT NULL REFERENCES teacher_users(id) ON DELETE CASCADE,
    group_id   UUID NOT NULL REFERENCES school_groups(id) ON DELETE CASCADE,
    PRIMARY KEY (teacher_id, group_id)
);

-- ═══════════════════════════════════════════════════════════════════════════════
--  OPERACIONES: ALERTAS Y BITÁCORA DE ENTREGAS
-- ═══════════════════════════════════════════════════════════════════════════════

-- ─── ALERTAS DE PROXIMIDAD ────────────────────────────────────────────────────
--  Emitida por el padre desde el portal móvil.
--  client_id: UUID generado en el FE para deduplicación offline (ADR-002).
--  status: progresa TEN_MIN → FIVE_MIN → EN_FILA → URGENTE.

CREATE TABLE alerts (
    id            UUID         PRIMARY KEY DEFAULT gen_random_uuid(),
    parent_id     UUID         NOT NULL REFERENCES parent_users(id)  ON DELETE CASCADE,
    student_id    UUID         NOT NULL REFERENCES students(id)       ON DELETE CASCADE,
    status        VARCHAR(30)  NOT NULL CHECK (status IN ('TEN_MIN','FIVE_MIN','EN_FILA','URGENTE')),
    pickup_method VARCHAR(30)  NOT NULL DEFAULT 'CAR' CHECK (pickup_method IN ('CAR','WALK')),
    client_id     UUID,                            -- Idempotencia: un UUID por intento
    sent_at       TIMESTAMPTZ  NOT NULL DEFAULT NOW(),
    received_at   TIMESTAMPTZ,
    CONSTRAINT uq_alerts_client_id UNIQUE (client_id)
);

-- ─── BITÁCORA DE ENTREGAS ─────────────────────────────────────────────────────
--  Registro del ciclo completo de entrega para cada alumno por día.
--  UNIQUE(student_id, log_date): solo un registro de entrega por alumno por día.
--  Flujo de status: ENTREGADO_ESCUELA → RECIBIDO_PADRE.

CREATE TABLE delivery_logs (
    id                   UUID         PRIMARY KEY DEFAULT gen_random_uuid(),
    student_id           UUID         NOT NULL REFERENCES students(id)  ON DELETE CASCADE,
    alert_id             UUID         REFERENCES alerts(id)             ON DELETE SET NULL,
    teacher_name         VARCHAR(150),
    pickup_method        VARCHAR(30)  CHECK (pickup_method IN ('CAR','WALK')),
    status               VARCHAR(30)  NOT NULL CHECK (status IN ('ENTREGADO_ESCUELA','RECIBIDO_PADRE')),
    teacher_confirmed_at TIMESTAMPTZ,
    parent_confirmed_at  TIMESTAMPTZ,
    log_date             DATE         NOT NULL DEFAULT CURRENT_DATE,
    CONSTRAINT uq_delivery_logs_student_day UNIQUE (student_id, log_date)
);

-- ═══════════════════════════════════════════════════════════════════════════════
--  ÍNDICES
--  Estrategia: cubrir todos los filtros frecuentes y JOINs del ORM.
-- ═══════════════════════════════════════════════════════════════════════════════

-- school_groups
CREATE INDEX idx_groups_level         ON school_groups (level);
CREATE INDEX idx_groups_active        ON school_groups (active);

-- students
CREATE INDEX idx_students_level       ON students (level);
CREATE INDEX idx_students_group_id    ON students (group_id);
CREATE INDEX idx_students_active      ON students (active);
CREATE INDEX idx_students_name        ON students (name);
-- Búsqueda por CURP (identificador único nacional)
CREATE INDEX idx_students_curp        ON students (curp) WHERE curp IS NOT NULL;

-- family_members
CREATE INDEX idx_family_student_id    ON family_members (student_id);
CREATE INDEX idx_family_authorized    ON family_members (student_id, authorized);

-- parent_users
CREATE INDEX idx_parent_active        ON parent_users (active);

-- parent_students
CREATE INDEX idx_parent_students_pid  ON parent_students (parent_id);
CREATE INDEX idx_parent_students_sid  ON parent_students (student_id);

-- teacher_users
CREATE INDEX idx_teacher_role         ON teacher_users (role);
CREATE INDEX idx_teacher_level        ON teacher_users (level) WHERE level IS NOT NULL;
CREATE INDEX idx_teacher_active       ON teacher_users (active);

-- teacher_groups
CREATE INDEX idx_teacher_groups_tid   ON teacher_groups (teacher_id);
CREATE INDEX idx_teacher_groups_gid   ON teacher_groups (group_id);

-- alerts
CREATE INDEX idx_alerts_parent_id     ON alerts (parent_id);
CREATE INDEX idx_alerts_student_id    ON alerts (student_id);
CREATE INDEX idx_alerts_status        ON alerts (status);
CREATE INDEX idx_alerts_sent_at       ON alerts (sent_at DESC);
-- Índice compuesto para dashboard del monitor (alumnos con alertas activas hoy)
CREATE INDEX idx_alerts_student_day   ON alerts (student_id, sent_at);

-- delivery_logs
CREATE INDEX idx_delivery_student_id  ON delivery_logs (student_id);
CREATE INDEX idx_delivery_log_date    ON delivery_logs (log_date DESC);
CREATE INDEX idx_delivery_status      ON delivery_logs (status);
-- Índice compuesto para consultas de KPIs por fecha y nivel
CREATE INDEX idx_delivery_date_status ON delivery_logs (log_date, status);
