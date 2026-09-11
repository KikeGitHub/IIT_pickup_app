-- ═══════════════════════════════════════════════════════════════════
--  IIT PICKUP — Profesores y Personal de Secundaria
--  Total profesores: 15
--  Contraseña por defecto: 'ITT2026' ($2a$12$QhHsVgsFFljyjDk9trac2e.JTebR56XvsgYE12w4veajFYio62zNa)
--  Fuente: SECUNDARIA.xlsx
-- ═══════════════════════════════════════════════════════════════════

INSERT INTO teacher_users (
    id,
    nombre,
    email,
    password_hash,
    role,
    level,
    avatar_url,
    active,
    temp_password,
    created_at,
    last_login
) VALUES
    ('9053a3a3-be0c-5d35-9644-96432180fe83', 'ANA PAOLA CAMACHO FLORES', 'pao_fin98@hotmail.com', '$2a$12$QhHsVgsFFljyjDk9trac2e.JTebR56XvsgYE12w4veajFYio62zNa', 'TEACHER', 'SECUNDARIA', NULL, TRUE, TRUE, NOW(), NULL),
    ('9d8cdf00-bf66-5083-ae05-7313a4ac3894', 'Wendi Rubi Carmona Salazar', 'wendicarmona@gmail.com', '$2a$12$QhHsVgsFFljyjDk9trac2e.JTebR56XvsgYE12w4veajFYio62zNa', 'TEACHER', 'SECUNDARIA', NULL, TRUE, TRUE, NOW(), NULL),
    ('69b8e019-af56-5fde-aa1a-d5eea556fc4b', 'DULCE MARIA DEL RIO ROMERO', 'dulcedelrio05@gmial.com', '$2a$12$QhHsVgsFFljyjDk9trac2e.JTebR56XvsgYE12w4veajFYio62zNa', 'TEACHER', 'SECUNDARIA', NULL, TRUE, TRUE, NOW(), NULL),
    ('1e0d2a37-a2cf-5e7f-9281-1860f3780c04', 'Jonathan Díaz Reyes', 'JDIAZ', '$2a$12$QhHsVgsFFljyjDk9trac2e.JTebR56XvsgYE12w4veajFYio62zNa', 'TEACHER', 'SECUNDARIA', NULL, TRUE, TRUE, NOW(), NULL),
    ('32a4ad02-dd65-544b-86c0-086366161293', 'ARMANDO ESTRADA MARTINEZ', 'armandoemartinez@outlook.com', '$2a$12$QhHsVgsFFljyjDk9trac2e.JTebR56XvsgYE12w4veajFYio62zNa', 'TEACHER', 'SECUNDARIA', NULL, TRUE, TRUE, NOW(), NULL),
    ('89249e13-291e-5e7a-b180-6d142051832a', 'JOSE EDUARDO GARDUÑO VIVERO', 'eduardo.gar3011@outlook.com', '$2a$12$QhHsVgsFFljyjDk9trac2e.JTebR56XvsgYE12w4veajFYio62zNa', 'TEACHER', 'SECUNDARIA', NULL, TRUE, TRUE, NOW(), NULL),
    ('917538df-92d4-5a4f-ae88-35bdc43df83b', 'ADRIANA JIMENEZ SANCHEZ', 'adri2018maestria@gmail.com', '$2a$12$QhHsVgsFFljyjDk9trac2e.JTebR56XvsgYE12w4veajFYio62zNa', 'TEACHER', 'SECUNDARIA', NULL, TRUE, TRUE, NOW(), NULL),
    ('d7df77b0-b0a2-5463-810c-8aae5ac69c14', 'Daniel López Hernández', 'DanielLopez@institutoingleso365.educamos.com', '$2a$12$QhHsVgsFFljyjDk9trac2e.JTebR56XvsgYE12w4veajFYio62zNa', 'TEACHER', 'SECUNDARIA', NULL, TRUE, TRUE, NOW(), NULL),
    ('3cf55338-d460-51a5-a279-f81d7a674e10', 'Gabriela Mejía Pichardo', 'gama270902@gmail.com', '$2a$12$QhHsVgsFFljyjDk9trac2e.JTebR56XvsgYE12w4veajFYio62zNa', 'TEACHER', 'SECUNDARIA', NULL, TRUE, TRUE, NOW(), NULL),
    ('bb026238-d14b-5bcd-8e23-127c91935bc3', 'Cynthia Viridiana Mendoza Reyes', 'anagabi34.mendoza@gmail.com', '$2a$12$QhHsVgsFFljyjDk9trac2e.JTebR56XvsgYE12w4veajFYio62zNa', 'TEACHER', 'SECUNDARIA', NULL, TRUE, TRUE, NOW(), NULL),
    ('66b71459-ff57-5586-b167-7baaf084e7a3', 'FATIMA PEREZ DE PAZ', 'FPEREZ', '$2a$12$QhHsVgsFFljyjDk9trac2e.JTebR56XvsgYE12w4veajFYio62zNa', 'TEACHER', 'SECUNDARIA', NULL, TRUE, TRUE, NOW(), NULL),
    ('805e581b-ac9e-532c-b410-f8e9a0ea2a4b', 'DIANA SALINAS NUÑEZ', 'diansalinas636@gmail.com', '$2a$12$QhHsVgsFFljyjDk9trac2e.JTebR56XvsgYE12w4veajFYio62zNa', 'TEACHER', 'SECUNDARIA', NULL, TRUE, TRUE, NOW(), NULL),
    ('13a62dbd-94c9-5ae5-9ec2-875521023dda', 'Luz Lorena Tapia Sánchez', 'LTAPIA', '$2a$12$QhHsVgsFFljyjDk9trac2e.JTebR56XvsgYE12w4veajFYio62zNa', 'TEACHER', 'SECUNDARIA', NULL, TRUE, TRUE, NOW(), NULL),
    ('b7edfbb9-fa81-52fa-a6a2-023958b08a61', 'Yessenia Abigait Tomás Martínez', 'yesstom21@gmail.com', '$2a$12$QhHsVgsFFljyjDk9trac2e.JTebR56XvsgYE12w4veajFYio62zNa', 'TEACHER', 'SECUNDARIA', NULL, TRUE, TRUE, NOW(), NULL),
    ('c8e35523-c525-5b90-b4b3-75a31d8f1044', 'ANAHI VAZQUEZ MORENO', 'educacionan@gmail.com', '$2a$12$QhHsVgsFFljyjDk9trac2e.JTebR56XvsgYE12w4veajFYio62zNa', 'TEACHER', 'SECUNDARIA', NULL, TRUE, TRUE, NOW(), NULL)
ON CONFLICT (email) DO NOTHING;
