-- ═══════════════════════════════════════════════════════════════════
--  STITCH PICKUP — Agregar campos Sexo y CURP a tabla Students
--  Migración: V9
-- ═══════════════════════════════════════════════════════════════════

ALTER TABLE students
ADD COLUMN gender VARCHAR(1) CHECK (gender IN ('M', 'F')),
ADD COLUMN curp VARCHAR(18);

-- Actualizar alumnos demo existentes con datos representativos
UPDATE students
SET gender = 'F', curp = 'RALS160512MMNPRFA1'
WHERE id = 'a1000000-0000-0000-0000-000000000001';

UPDATE students
SET gender = 'M', curp = 'GOVM180320HHNPRMA2'
WHERE id = 'a1000000-0000-0000-0000-000000000002';

UPDATE students
SET gender = 'F', curp = 'TOVI200910MMNPRFA3'
WHERE id = 'a1000000-0000-0000-0000-000000000003';

UPDATE students
SET gender = 'M', curp = 'RAMD140722HHNPRMA5'
WHERE id = 'a1000000-0000-0000-0000-000000000005';
