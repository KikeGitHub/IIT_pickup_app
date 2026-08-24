-- ═══════════════════════════════════════════════════════════════════
--  STITCH PICKUP — Actualización de Hashes BCrypt válidos (Coste 12)
--  Migración: V7  |  Garantiza contraseñas funcionales para cuentas demo
-- ═══════════════════════════════════════════════════════════════════
--
--  demo1234  → $2a$12$frMiCP8exLbhapvI3AGlB.NMSYEBvG.cbRli1sXzUx4pe31hoAvVC
--  admin2026 → $2a$12$3flB4Pu/EGOXaOF2sn7FYuclYMiXRbpOCO8w3nB.GDS8Y.Ne7ip7S

-- Actualizar todos los padres demo a "demo1234"
UPDATE parent_users
SET password_hash = '$2a$12$frMiCP8exLbhapvI3AGlB.NMSYEBvG.cbRli1sXzUx4pe31hoAvVC'
WHERE email IN ('padre1@iit.edu.mx', 'padre2@iit.edu.mx', 'padre3@iit.edu.mx');

-- Actualizar maestros demo a "demo1234"
UPDATE teacher_users
SET password_hash = '$2a$12$frMiCP8exLbhapvI3AGlB.NMSYEBvG.cbRli1sXzUx4pe31hoAvVC'
WHERE email IN ('maestro1@iit.edu.mx', 'maestro2@iit.edu.mx');

-- Actualizar admin demo a "admin2026"
UPDATE teacher_users
SET password_hash = '$2a$12$3flB4Pu/EGOXaOF2sn7FYuclYMiXRbpOCO8w3nB.GDS8Y.Ne7ip7S'
WHERE email = 'admin@iit.edu.mx';
