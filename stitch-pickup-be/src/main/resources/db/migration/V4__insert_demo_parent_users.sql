-- ═══════════════════════════════════════════════════════════════════
--  STITCH PICKUP — Usuarios Padre de Demo
--  Migración: V4  |  Contraseñas BCrypt (coste 12)
-- ═══════════════════════════════════════════════════════════════════
--
--  CREDENCIALES DE PRUEBA:
--  padre1@iit.edu.mx  → password: "demo1234"
--  padre2@iit.edu.mx  → password: "demo1234"
--  padre3@iit.edu.mx  → password: "demo1234"
--
--  Hashes generados con BCrypt coste 12.
--  temp_password = true → el usuario debe cambiar su contraseña al primer login.

INSERT INTO parent_users (id, nombre, email, password_hash, phone, temp_password) VALUES
    (
        'b2000000-0000-0000-0000-000000000001',
        'Carlos Ramírez Soto',
        'padre1@iit.edu.mx',
        '$2a$12$N7/p4xzDL3gFnYvPPH6EiuRb3yXkuNOcnkVyvKxeJv8mBhMvBV1Wy',
        '+52 722 123 4567',
        false     -- ya completó cambio de contraseña
    ),
    (
        'b2000000-0000-0000-0000-000000000002',
        'Roberto González Vidal',
        'padre2@iit.edu.mx',
        '$2a$12$N7/p4xzDL3gFnYvPPH6EiuRb3yXkuNOcnkVyvKxeJv8mBhMvBV1Wy',
        '+52 722 345 6789',
        true      -- debe cambiar contraseña al ingresar
    ),
    (
        'b2000000-0000-0000-0000-000000000003',
        'Ana Torres Mendoza',
        'padre3@iit.edu.mx',
        '$2a$12$N7/p4xzDL3gFnYvPPH6EiuRb3yXkuNOcnkVyvKxeJv8mBhMvBV1Wy',
        '+52 722 456 7890',
        false
    );

-- Vincular padres con sus alumnos
INSERT INTO parent_students (parent_id, student_id) VALUES
    -- Carlos → Sofía
    ('b2000000-0000-0000-0000-000000000001', 'a1000000-0000-0000-0000-000000000001'),
    -- Roberto → Mateo
    ('b2000000-0000-0000-0000-000000000002', 'a1000000-0000-0000-0000-000000000002'),
    -- Ana → Isabella
    ('b2000000-0000-0000-0000-000000000003', 'a1000000-0000-0000-0000-000000000003'),
    -- Carlos también tiene otro hijo (demo de padre con múltiples hijos)
    ('b2000000-0000-0000-0000-000000000001', 'a1000000-0000-0000-0000-000000000005');
