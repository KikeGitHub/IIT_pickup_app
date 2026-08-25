-- ═══════════════════════════════════════════════════════════════════
--  IIT PICKUP — Profesores y Personal de Primaria
--  Total profesores: 50  |  Asignaciones a grupos: 31
--  Contraseña por defecto: 'ITT2026'
-- ═══════════════════════════════════════════════════════════════════

-- ─── USUARIOS PROFESORES / ADMINISTRATIVOS (teacher_users) ────────

INSERT INTO teacher_users (id, nombre, email, password_hash, role, level, temp_password) VALUES
    ('9947c273-ea2b-4718-a898-f65c90662e7b', 'Alva  Flores  Eliovet', 'alva.flores@iit.edu.mx', '$2a$12$rqRtciCRuwYqLYXO7K0PKeLbmMefT8W0WTTM2aOpWFDGBQbEy2Opy', 'ADMIN', 'PRIMARIA', TRUE),  -- Cargo: PLATAFORMA
    ('e106a2ef-c82f-4b89-93a6-32df4396d4de', 'ALVA ORTIZ ZELTZIN OYUKY', 'alva.ortiz@iit.edu.mx', '$2a$12$rqRtciCRuwYqLYXO7K0PKeLbmMefT8W0WTTM2aOpWFDGBQbEy2Opy', 'TEACHER', 'PRIMARIA', TRUE),  -- Cargo: 6A
    ('cf547400-27f3-4e17-9617-1d625a185719', 'ÁNGELES HIDALGO OSCAR', 'angeles.hidalgo@iit.edu.mx', '$2a$12$rqRtciCRuwYqLYXO7K0PKeLbmMefT8W0WTTM2aOpWFDGBQbEy2Opy', 'TEACHER', 'PRIMARIA', TRUE),  -- Cargo: 4C
    ('5e6c9ab7-7479-4880-bf13-dc7f419e3a8c', 'AVILA ESTRADA SAYURI', 'avila.estrada@iit.edu.mx', '$2a$12$rqRtciCRuwYqLYXO7K0PKeLbmMefT8W0WTTM2aOpWFDGBQbEy2Opy', 'TEACHER', 'PRIMARIA', TRUE),  -- Cargo: CORRICULAR
    ('a018e5b8-a427-4794-8053-3a5aa5148fd3', 'AYALA NAVA NOEMI', 'ayala.nava@iit.edu.mx', '$2a$12$rqRtciCRuwYqLYXO7K0PKeLbmMefT8W0WTTM2aOpWFDGBQbEy2Opy', 'TEACHER', 'PRIMARIA', TRUE),  -- Cargo: 3A
    ('64502f4d-c5a7-4b00-a176-f9414f2dfc68', 'CAMPIRAN MARTINEZ ARMANDO', 'campiran.martinez@iit.edu.mx', '$2a$12$rqRtciCRuwYqLYXO7K0PKeLbmMefT8W0WTTM2aOpWFDGBQbEy2Opy', 'TEACHER', 'PRIMARIA', TRUE),  -- Cargo: CORRICULAR
    ('9e5226a6-4997-410b-ae50-df5a4c5688b4', 'CARDENAS  MARTÍNEZ NADIA PAOLA', 'cardenas.martinez@iit.edu.mx', '$2a$12$rqRtciCRuwYqLYXO7K0PKeLbmMefT8W0WTTM2aOpWFDGBQbEy2Opy', 'TEACHER', 'PRIMARIA', TRUE),  -- Cargo: 1B
    ('00a7d00f-245a-4de1-8b2c-5180e7d8f257', 'De Jesús Juan  Ana María', 'de.jesus@iit.edu.mx', '$2a$12$rqRtciCRuwYqLYXO7K0PKeLbmMefT8W0WTTM2aOpWFDGBQbEy2Opy', 'TEACHER', 'PRIMARIA', TRUE),  -- Cargo: CORRICULAR
    ('c656dce5-f231-45bc-8455-5246c3ffc96b', 'De la Cruz  Telles Raquel', 'de.la@iit.edu.mx', '$2a$12$rqRtciCRuwYqLYXO7K0PKeLbmMefT8W0WTTM2aOpWFDGBQbEy2Opy', 'TEACHER', 'PRIMARIA', TRUE),  -- Cargo: 2A
    ('3a4461f9-919d-4987-b89d-fd8147089ceb', 'De la Cruz González Indira Yuritzin', 'de.la2@iit.edu.mx', '$2a$12$rqRtciCRuwYqLYXO7K0PKeLbmMefT8W0WTTM2aOpWFDGBQbEy2Opy', 'TEACHER', 'PRIMARIA', TRUE),  -- Cargo: 6B
    ('e703699b-ae4e-45ec-87f7-0cc62f882546', 'Diaz  Grajales  Veronica Alejandra', 'diaz.grajales@iit.edu.mx', '$2a$12$rqRtciCRuwYqLYXO7K0PKeLbmMefT8W0WTTM2aOpWFDGBQbEy2Opy', 'TEACHER', 'PRIMARIA', TRUE),  -- Cargo: 5C / 6C
    ('f5fda054-d8e2-489c-adfa-2510a221b726', 'Diaz  Miranda  Maria Fernanda', 'diaz.miranda@iit.edu.mx', '$2a$12$rqRtciCRuwYqLYXO7K0PKeLbmMefT8W0WTTM2aOpWFDGBQbEy2Opy', 'TEACHER', 'PRIMARIA', TRUE),  -- Cargo: 5A
    ('42b4c9dd-c17c-46fa-b347-c26b2a8c5031', 'EDUARDO CASTAÑO  MAXIMINO', 'eduardo.castano@iit.edu.mx', '$2a$12$rqRtciCRuwYqLYXO7K0PKeLbmMefT8W0WTTM2aOpWFDGBQbEy2Opy', 'TEACHER', 'PRIMARIA', TRUE),  -- Cargo: CORRICULAR
    ('a8eba3dc-274b-4f30-90b3-4f3bff8c5b5d', 'Estrada Vargas Silviano', 'estrada.vargas@iit.edu.mx', '$2a$12$rqRtciCRuwYqLYXO7K0PKeLbmMefT8W0WTTM2aOpWFDGBQbEy2Opy', 'TEACHER', 'PRIMARIA', TRUE),  -- Cargo: CORRICULAR
    ('4649fcb8-95aa-4344-8bda-01a283933075', 'FLORES  COAHUILA  CARLOS DAVID', 'flores.coahuila@iit.edu.mx', '$2a$12$rqRtciCRuwYqLYXO7K0PKeLbmMefT8W0WTTM2aOpWFDGBQbEy2Opy', 'TEACHER', 'PRIMARIA', TRUE),  -- Cargo: CORRICULAR
    ('d30ccda8-350e-4675-830c-314748f112a8', 'Flores  Garduño Luz Daniela', 'flores.garduno@iit.edu.mx', '$2a$12$rqRtciCRuwYqLYXO7K0PKeLbmMefT8W0WTTM2aOpWFDGBQbEy2Opy', 'TEACHER', 'PRIMARIA', TRUE),  -- Cargo: 5C / 6C
    ('8aabdd2b-2d2e-4d8e-a5f0-e691add5b16d', 'FLORES  MORALES ANGELICA DENISSE', 'flores.morales@iit.edu.mx', '$2a$12$rqRtciCRuwYqLYXO7K0PKeLbmMefT8W0WTTM2aOpWFDGBQbEy2Opy', 'TEACHER', 'PRIMARIA', TRUE),  -- Cargo: 1C / 2C
    ('0896ef16-a73b-425d-90df-011e99a3efb6', 'GARDUÑO MUÑOZ Karla Berenice', 'garduno.munoz@iit.edu.mx', '$2a$12$rqRtciCRuwYqLYXO7K0PKeLbmMefT8W0WTTM2aOpWFDGBQbEy2Opy', 'TEACHER', 'PRIMARIA', TRUE),  -- Cargo: 3C
    ('a0948d1e-fb05-45ff-9c6d-51474895cefa', 'GARDUÑO VIVERO JOSE EDUARDO', 'garduno.vivero@iit.edu.mx', '$2a$12$rqRtciCRuwYqLYXO7K0PKeLbmMefT8W0WTTM2aOpWFDGBQbEy2Opy', 'TEACHER', 'PRIMARIA', TRUE),  -- Cargo: CORRICULAR
    ('223cf61c-99ce-4eac-b14b-cc34687b8bec', 'GOMEZ  ROSALES  ESVEIDY MELANY', 'gomez.rosales@iit.edu.mx', '$2a$12$rqRtciCRuwYqLYXO7K0PKeLbmMefT8W0WTTM2aOpWFDGBQbEy2Opy', 'TEACHER', 'PRIMARIA', TRUE),  -- Cargo: CORRICULAR
    ('d948015d-720b-4950-97bd-0af77a46ea13', 'Guadarrama  Guerrero Rocio', 'guadarrama.guerrero@iit.edu.mx', '$2a$12$rqRtciCRuwYqLYXO7K0PKeLbmMefT8W0WTTM2aOpWFDGBQbEy2Opy', 'TEACHER', 'PRIMARIA', TRUE),  -- Cargo: 5D
    ('18e49304-b231-4721-8070-3b024e473426', 'Gutierrez  Meza Marisol', 'gutierrez.meza@iit.edu.mx', '$2a$12$rqRtciCRuwYqLYXO7K0PKeLbmMefT8W0WTTM2aOpWFDGBQbEy2Opy', 'TEACHER', 'PRIMARIA', TRUE),  -- Cargo: 6E
    ('51b999da-ef65-4dcd-87ff-6add7aefe9e7', 'HERNANDEZ FUENTES  CYNTHIA PAMELA', 'hernandez.fuentes@iit.edu.mx', '$2a$12$rqRtciCRuwYqLYXO7K0PKeLbmMefT8W0WTTM2aOpWFDGBQbEy2Opy', 'TEACHER', 'PRIMARIA', TRUE),  -- Cargo: 2D
    ('92d94dcc-feec-4504-a43d-5c157bc663f3', 'HERNANDEZ GONZALEZ BRISELDA', 'hernandez.gonzalez@iit.edu.mx', '$2a$12$rqRtciCRuwYqLYXO7K0PKeLbmMefT8W0WTTM2aOpWFDGBQbEy2Opy', 'TEACHER', 'PRIMARIA', TRUE),  -- Cargo: 1C / 2C
    ('75344747-fd96-4041-b4ee-aadfa8453b4f', 'Iniesta Dávila Areli', 'iniesta.davila@iit.edu.mx', '$2a$12$rqRtciCRuwYqLYXO7K0PKeLbmMefT8W0WTTM2aOpWFDGBQbEy2Opy', 'TEACHER', 'PRIMARIA', TRUE),  -- Cargo: 5B
    ('5e960e13-8a26-4e80-8107-fe2809c4459b', 'JIMENEZ ADRIANA', 'jimenez.adriana@iit.edu.mx', '$2a$12$rqRtciCRuwYqLYXO7K0PKeLbmMefT8W0WTTM2aOpWFDGBQbEy2Opy', 'TEACHER', 'PRIMARIA', TRUE),  -- Cargo: CORRICULAR
    ('13008937-e746-4903-b202-5d27e6cd4df7', 'Martínez Arias Madison', 'martinez.arias@iit.edu.mx', '$2a$12$rqRtciCRuwYqLYXO7K0PKeLbmMefT8W0WTTM2aOpWFDGBQbEy2Opy', 'TEACHER', 'PRIMARIA', TRUE),  -- Cargo: CORRICULAR
    ('53e289ee-05d7-4ce3-9e35-ec9078656ad7', 'Mejía  Pichardo Gabriela', 'mejia.pichardo@iit.edu.mx', '$2a$12$rqRtciCRuwYqLYXO7K0PKeLbmMefT8W0WTTM2aOpWFDGBQbEy2Opy', 'TEACHER', 'PRIMARIA', TRUE),  -- Cargo: CORRICULAR
    ('b2765e2f-fea2-4dee-85cf-08263b370b2f', 'Menchaca Flores Yannick', 'menchaca.flores@iit.edu.mx', '$2a$12$rqRtciCRuwYqLYXO7K0PKeLbmMefT8W0WTTM2aOpWFDGBQbEy2Opy', 'TEACHER', 'PRIMARIA', TRUE),  -- Cargo: CORRICULAR
    ('25af1bb0-39ae-481f-99dd-abe2760e8149', 'Mendoza  Aguirre  Adrian', 'mendoza.aguirre@iit.edu.mx', '$2a$12$rqRtciCRuwYqLYXO7K0PKeLbmMefT8W0WTTM2aOpWFDGBQbEy2Opy', 'TEACHER', 'PRIMARIA', TRUE),  -- Cargo: CORRICULAR
    ('ed077b56-fee0-4a65-9f66-7ca1ccce1003', 'Mercado  Benhumea Jessika Edith', 'mercado.benhumea@iit.edu.mx', '$2a$12$rqRtciCRuwYqLYXO7K0PKeLbmMefT8W0WTTM2aOpWFDGBQbEy2Opy', 'TEACHER', 'PRIMARIA', TRUE),  -- Cargo: 3B
    ('ce941671-22a4-4d89-a282-e25777445a6c', 'MIRANDA  RODRIGUEZ  JUAN MANUEL', 'miranda.rodriguez@iit.edu.mx', '$2a$12$rqRtciCRuwYqLYXO7K0PKeLbmMefT8W0WTTM2aOpWFDGBQbEy2Opy', 'TEACHER', 'PRIMARIA', TRUE),  -- Cargo: CORRICULAR
    ('4fb3137c-a8ef-40cf-b3c2-a5b97f79581d', 'Orozco Martínez Brenda Janelly', 'orozco.martinez@iit.edu.mx', '$2a$12$rqRtciCRuwYqLYXO7K0PKeLbmMefT8W0WTTM2aOpWFDGBQbEy2Opy', 'TEACHER', 'PRIMARIA', TRUE),  -- Cargo: 4E
    ('e10c50af-c49f-4f0b-8ae1-873ecf1b0f70', 'Pastor Ambriz Gloria', 'pastor.ambriz@iit.edu.mx', '$2a$12$rqRtciCRuwYqLYXO7K0PKeLbmMefT8W0WTTM2aOpWFDGBQbEy2Opy', 'TEACHER', 'PRIMARIA', TRUE),  -- Cargo: CORRICULAR
    ('556ae326-0e5a-4334-bf41-988ff38e739e', 'Pérez Rojas Julio Cesar', 'perez.rojas@iit.edu.mx', '$2a$12$rqRtciCRuwYqLYXO7K0PKeLbmMefT8W0WTTM2aOpWFDGBQbEy2Opy', 'ADMIN', 'PRIMARIA', TRUE),  -- Cargo: ADMINISTRATIVO
    ('5871b1d4-a081-4fb4-b4d9-d2185af9cdc6', 'Pichardo  Hernandez  Harumi Itzel', 'pichardo.hernandez@iit.edu.mx', '$2a$12$rqRtciCRuwYqLYXO7K0PKeLbmMefT8W0WTTM2aOpWFDGBQbEy2Opy', 'TEACHER', 'PRIMARIA', TRUE),  -- Cargo: CORRICULAR
    ('bfb0da49-c084-47d5-8cde-07bb700fdd5d', 'Reyes Ortiz Andrea Jazmin', 'reyes.ortiz@iit.edu.mx', '$2a$12$rqRtciCRuwYqLYXO7K0PKeLbmMefT8W0WTTM2aOpWFDGBQbEy2Opy', 'TEACHER', 'PRIMARIA', TRUE),  -- Cargo: 3E
    ('c9a64b54-3f98-42b6-8d3c-0b291205f642', 'RODRIGUEZ HERNANDEZ AXEL SAUL', 'rodriguez.hernandez@iit.edu.mx', '$2a$12$rqRtciCRuwYqLYXO7K0PKeLbmMefT8W0WTTM2aOpWFDGBQbEy2Opy', 'TEACHER', 'PRIMARIA', TRUE),  -- Cargo: ADMINISTRATIVO
    ('aab2f9a4-25f3-4c45-a739-e346329e0736', 'RODRÍGUEZ VALLE JULIET', 'rodriguez.valle@iit.edu.mx', '$2a$12$rqRtciCRuwYqLYXO7K0PKeLbmMefT8W0WTTM2aOpWFDGBQbEy2Opy', 'TEACHER', 'PRIMARIA', TRUE),  -- Cargo: 1D
    ('7e4e6fb6-26bd-478c-b6d1-b0d49273726c', 'ROMERO MATIAS JANETH', 'romero.matias@iit.edu.mx', '$2a$12$rqRtciCRuwYqLYXO7K0PKeLbmMefT8W0WTTM2aOpWFDGBQbEy2Opy', 'TEACHER', 'PRIMARIA', TRUE),  -- Cargo: 6D
    ('546c5b38-3b68-43fa-8cd4-5487a04b84a1', 'RUIZ MARIN MARTHA GABRIELA', 'ruiz.marin@iit.edu.mx', '$2a$12$rqRtciCRuwYqLYXO7K0PKeLbmMefT8W0WTTM2aOpWFDGBQbEy2Opy', 'TEACHER', 'PRIMARIA', TRUE),  -- Cargo: CORRICULAR
    ('e13f9c7f-182b-4bce-a453-c087e8a911f2', 'Sánchez  Nava Violeta', 'sanchez.nava@iit.edu.mx', '$2a$12$rqRtciCRuwYqLYXO7K0PKeLbmMefT8W0WTTM2aOpWFDGBQbEy2Opy', 'TEACHER', 'PRIMARIA', TRUE),  -- Cargo: CORRICULAR
    ('2fd1c114-d694-4c76-9eae-e9b20919a86d', 'Santillán González Jaqueline', 'santillan.gonzalez@iit.edu.mx', '$2a$12$rqRtciCRuwYqLYXO7K0PKeLbmMefT8W0WTTM2aOpWFDGBQbEy2Opy', 'TEACHER', 'PRIMARIA', TRUE),  -- Cargo: 1E
    ('e3eb3442-8ca5-413d-aca1-38b7fb604e81', 'SILVA  SANDOVAL AKATZIN AKETZALLI AMEYALLI', 'silva.sandoval@iit.edu.mx', '$2a$12$rqRtciCRuwYqLYXO7K0PKeLbmMefT8W0WTTM2aOpWFDGBQbEy2Opy', 'TEACHER', 'PRIMARIA', TRUE),  -- Cargo: CORRICULAR
    ('7646d94a-efbf-44e0-bb71-698f4ca28dce', 'TLACUILO GARCÍA SUSANA JAZMÍN', 'tlacuilo.garcia@iit.edu.mx', '$2a$12$rqRtciCRuwYqLYXO7K0PKeLbmMefT8W0WTTM2aOpWFDGBQbEy2Opy', 'TEACHER', 'PRIMARIA', TRUE),  -- Cargo: CORRICULAR
    ('9d8c7ecf-53be-44b0-8276-6f5783506c47', 'Zamora  Escalante  Amanda', 'zamora.escalante@iit.edu.mx', '$2a$12$rqRtciCRuwYqLYXO7K0PKeLbmMefT8W0WTTM2aOpWFDGBQbEy2Opy', 'TEACHER', 'PRIMARIA', TRUE),  -- Cargo: 2B
    ('4b27dae4-380b-4adf-bae3-f391b935c869', 'luisa fernanda gonzales palma', 'luisa.fernanda@iit.edu.mx', '$2a$12$rqRtciCRuwYqLYXO7K0PKeLbmMefT8W0WTTM2aOpWFDGBQbEy2Opy', 'TEACHER', 'PRIMARIA', TRUE),  -- Cargo: 1A
    ('8cf3a435-e958-4478-bd88-de5239ac3fe1', 'YAZMIN RENIGIO', 'yazmin.renigio@iit.edu.mx', '$2a$12$rqRtciCRuwYqLYXO7K0PKeLbmMefT8W0WTTM2aOpWFDGBQbEy2Opy', 'TEACHER', 'PRIMARIA', TRUE),  -- Cargo: 2E
    ('28ac5ceb-2e7f-498e-b0f8-8928290a1e83', 'ALEJANDRA MORENO', 'alejandra.moreno@iit.edu.mx', '$2a$12$rqRtciCRuwYqLYXO7K0PKeLbmMefT8W0WTTM2aOpWFDGBQbEy2Opy', 'TEACHER', 'PRIMARIA', TRUE),  -- Cargo: 4D
    ('64f59557-a268-440f-82a0-6c91d8a00bf3', 'VANESA ALFARO ARZATE', 'vanesa.alfaro@iit.edu.mx', '$2a$12$rqRtciCRuwYqLYXO7K0PKeLbmMefT8W0WTTM2aOpWFDGBQbEy2Opy', 'TEACHER', 'PRIMARIA', TRUE);  -- Cargo: 5E

-- ─── ASIGNACIÓN DE GRUPOS (teacher_groups) ─────────────────────────

INSERT INTO teacher_groups (teacher_id, group_id) VALUES
    ('e106a2ef-c82f-4b89-93a6-32df4396d4de', 'e0200000-0000-0000-0000-000000000026'),  -- ALVA ORTIZ ZELTZIN OYUKY -> 6o. de Primaria-A (6A)
    ('cf547400-27f3-4e17-9617-1d625a185719', 'e0200000-0000-0000-0000-000000000018'),  -- ÁNGELES HIDALGO OSCAR -> 4o. de Primaria-C (4C)
    ('a018e5b8-a427-4794-8053-3a5aa5148fd3', 'e0200000-0000-0000-0000-000000000011'),  -- AYALA NAVA NOEMI -> 3o. de Primaria-A (3A)
    ('9e5226a6-4997-410b-ae50-df5a4c5688b4', 'e0200000-0000-0000-0000-000000000002'),  -- CARDENAS  MARTÍNEZ NADIA PAOLA -> 1o. de Primaria-B (1B)
    ('c656dce5-f231-45bc-8455-5246c3ffc96b', 'e0200000-0000-0000-0000-000000000006'),  -- De la Cruz  Telles Raquel -> 2o. de Primaria-A (2A)
    ('3a4461f9-919d-4987-b89d-fd8147089ceb', 'e0200000-0000-0000-0000-000000000027'),  -- De la Cruz González Indira Yuritzin -> 6o. de Primaria-B (6B)
    ('e703699b-ae4e-45ec-87f7-0cc62f882546', 'e0200000-0000-0000-0000-000000000023'),  -- Diaz  Grajales  Veronica Alejandra -> 5o. de Primaria-C (5C)
    ('e703699b-ae4e-45ec-87f7-0cc62f882546', 'e0200000-0000-0000-0000-000000000028'),  -- Diaz  Grajales  Veronica Alejandra -> 6o. de Primaria-C (6C)
    ('f5fda054-d8e2-489c-adfa-2510a221b726', 'e0200000-0000-0000-0000-000000000021'),  -- Diaz  Miranda  Maria Fernanda -> 5o. de Primaria-A (5A)
    ('d30ccda8-350e-4675-830c-314748f112a8', 'e0200000-0000-0000-0000-000000000023'),  -- Flores  Garduño Luz Daniela -> 5o. de Primaria-C (5C)
    ('d30ccda8-350e-4675-830c-314748f112a8', 'e0200000-0000-0000-0000-000000000028'),  -- Flores  Garduño Luz Daniela -> 6o. de Primaria-C (6C)
    ('8aabdd2b-2d2e-4d8e-a5f0-e691add5b16d', 'e0200000-0000-0000-0000-000000000003'),  -- FLORES  MORALES ANGELICA DENISSE -> 1o. de Primaria-C (1C)
    ('8aabdd2b-2d2e-4d8e-a5f0-e691add5b16d', 'e0200000-0000-0000-0000-000000000008'),  -- FLORES  MORALES ANGELICA DENISSE -> 2o. de Primaria-C (2C)
    ('0896ef16-a73b-425d-90df-011e99a3efb6', 'e0200000-0000-0000-0000-000000000013'),  -- GARDUÑO MUÑOZ Karla Berenice -> 3o. de Primaria-C (3C)
    ('d948015d-720b-4950-97bd-0af77a46ea13', 'e0200000-0000-0000-0000-000000000024'),  -- Guadarrama  Guerrero Rocio -> 5o. de Primaria-D (5D)
    ('18e49304-b231-4721-8070-3b024e473426', 'e0200000-0000-0000-0000-000000000030'),  -- Gutierrez  Meza Marisol -> 6o. de Primaria-E (6E)
    ('51b999da-ef65-4dcd-87ff-6add7aefe9e7', 'e0200000-0000-0000-0000-000000000009'),  -- HERNANDEZ FUENTES  CYNTHIA PAMELA -> 2o. de Primaria-D (2D)
    ('92d94dcc-feec-4504-a43d-5c157bc663f3', 'e0200000-0000-0000-0000-000000000003'),  -- HERNANDEZ GONZALEZ BRISELDA -> 1o. de Primaria-C (1C)
    ('92d94dcc-feec-4504-a43d-5c157bc663f3', 'e0200000-0000-0000-0000-000000000008'),  -- HERNANDEZ GONZALEZ BRISELDA -> 2o. de Primaria-C (2C)
    ('75344747-fd96-4041-b4ee-aadfa8453b4f', 'e0200000-0000-0000-0000-000000000022'),  -- Iniesta Dávila Areli -> 5o. de Primaria-B (5B)
    ('ed077b56-fee0-4a65-9f66-7ca1ccce1003', 'e0200000-0000-0000-0000-000000000012'),  -- Mercado  Benhumea Jessika Edith -> 3o. de Primaria-B (3B)
    ('4fb3137c-a8ef-40cf-b3c2-a5b97f79581d', 'e0200000-0000-0000-0000-000000000020'),  -- Orozco Martínez Brenda Janelly -> 4o. de Primaria-E (4E)
    ('bfb0da49-c084-47d5-8cde-07bb700fdd5d', 'e0200000-0000-0000-0000-000000000015'),  -- Reyes Ortiz Andrea Jazmin -> 3o. de Primaria-E (3E)
    ('aab2f9a4-25f3-4c45-a739-e346329e0736', 'e0200000-0000-0000-0000-000000000004'),  -- RODRÍGUEZ VALLE JULIET -> 1o. de Primaria-D (1D)
    ('7e4e6fb6-26bd-478c-b6d1-b0d49273726c', 'e0200000-0000-0000-0000-000000000029'),  -- ROMERO MATIAS JANETH -> 6o. de Primaria-D (6D)
    ('2fd1c114-d694-4c76-9eae-e9b20919a86d', 'e0200000-0000-0000-0000-000000000005'),  -- Santillán González Jaqueline -> 1o. de Primaria-E (1E)
    ('9d8c7ecf-53be-44b0-8276-6f5783506c47', 'e0200000-0000-0000-0000-000000000007'),  -- Zamora  Escalante  Amanda -> 2o. de Primaria-B (2B)
    ('4b27dae4-380b-4adf-bae3-f391b935c869', 'e0200000-0000-0000-0000-000000000001'),  -- luisa fernanda gonzales palma -> 1o. de Primaria-A (1A)
    ('8cf3a435-e958-4478-bd88-de5239ac3fe1', 'e0200000-0000-0000-0000-000000000010'),  -- YAZMIN RENIGIO -> 2o. de Primaria-E (2E)
    ('28ac5ceb-2e7f-498e-b0f8-8928290a1e83', 'e0200000-0000-0000-0000-000000000019'),  -- ALEJANDRA MORENO -> 4o. de Primaria-D (4D)
    ('64f59557-a268-440f-82a0-6c91d8a00bf3', 'e0200000-0000-0000-0000-000000000025');  -- VANESA ALFARO ARZATE -> 5o. de Primaria-E (5E)
