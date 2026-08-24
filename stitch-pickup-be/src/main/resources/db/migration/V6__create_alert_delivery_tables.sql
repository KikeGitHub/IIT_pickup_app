-- ════════════════════════════════════════════════════════════════════════════
-- V6 — Sprint 3-5: family_members, alerts, delivery_logs, admin indexes
-- ════════════════════════════════════════════════════════════════════════════

-- ── Table: family_members ────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS family_members (
    id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    student_id    UUID        NOT NULL REFERENCES students(id) ON DELETE CASCADE,
    name          VARCHAR(150) NOT NULL,
    relationship  VARCHAR(50),
    phone         VARCHAR(20),
    photo_url     TEXT,
    authorized    BOOLEAN NOT NULL DEFAULT TRUE
);

-- ── Types (crear de forma segura si no existen) ──────────────────────────────
DO $$ BEGIN
    CREATE TYPE alert_status AS ENUM ('TEN_MIN', 'FIVE_MIN', 'EN_FILA', 'URGENTE');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
    CREATE TYPE pickup_method AS ENUM ('CAR', 'WALK');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

CREATE TABLE IF NOT EXISTS alerts (
    id              UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
    parent_id       UUID        NOT NULL REFERENCES parent_users(id) ON DELETE CASCADE,
    student_id      UUID        NOT NULL REFERENCES students(id) ON DELETE CASCADE,
    status          VARCHAR(20) NOT NULL CHECK (status IN ('TEN_MIN','FIVE_MIN','EN_FILA','URGENTE')),
    pickup_method   VARCHAR(10) NOT NULL DEFAULT 'CAR' CHECK (pickup_method IN ('CAR','WALK')),
    client_id       UUID        UNIQUE,         -- For offline deduplication (ADR-002)
    sent_at         TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    received_at     TIMESTAMPTZ
);

CREATE INDEX IF NOT EXISTS idx_alerts_parent_id   ON alerts(parent_id);
CREATE INDEX IF NOT EXISTS idx_alerts_student_id  ON alerts(student_id);
CREATE INDEX IF NOT EXISTS idx_alerts_sent_at     ON alerts(sent_at);
CREATE INDEX IF NOT EXISTS idx_alerts_status      ON alerts(status);
CREATE INDEX IF NOT EXISTS idx_alerts_client_id   ON alerts(client_id);

-- ── Table: delivery_logs ──────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS delivery_logs (
    id                   UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
    student_id           UUID        NOT NULL REFERENCES students(id) ON DELETE CASCADE,
    alert_id             UUID        REFERENCES alerts(id) ON DELETE SET NULL,
    teacher_name         VARCHAR(150),
    pickup_method        VARCHAR(10) CHECK (pickup_method IN ('CAR','WALK')),
    status               VARCHAR(30) NOT NULL CHECK (status IN ('ENTREGADO_ESCUELA','RECIBIDO_PADRE')),
    teacher_confirmed_at TIMESTAMPTZ,
    parent_confirmed_at  TIMESTAMPTZ,
    log_date             DATE        NOT NULL DEFAULT CURRENT_DATE,
    UNIQUE (student_id, log_date)   -- One delivery record per student per day
);

CREATE INDEX IF NOT EXISTS idx_delivery_logs_student_id  ON delivery_logs(student_id);
CREATE INDEX IF NOT EXISTS idx_delivery_logs_log_date    ON delivery_logs(log_date);

-- ── Demo family_members for existing demo students ────────────────────────────
DO $$
DECLARE
  v_student_id UUID;
BEGIN
  SELECT id INTO v_student_id FROM students WHERE name = 'Sofía Ramírez López' LIMIT 1;
  IF v_student_id IS NOT NULL THEN
    INSERT INTO family_members (student_id, name, relationship, phone, authorized)
    VALUES
      (v_student_id, 'Carlos Ramírez Soto',    'Padre',  '+52 722 123 4567', TRUE),
      (v_student_id, 'Patricia López Mendoza',  'Madre',  '+52 722 234 5678', TRUE)
    ON CONFLICT DO NOTHING;
  END IF;

  SELECT id INTO v_student_id FROM students WHERE name = 'Mateo González Ruiz' LIMIT 1;
  IF v_student_id IS NOT NULL THEN
    INSERT INTO family_members (student_id, name, relationship, phone, authorized)
    VALUES
      (v_student_id, 'Roberto González Vidal',  'Padre',  '+52 722 345 6789', TRUE)
    ON CONFLICT DO NOTHING;
  END IF;
END $$;
