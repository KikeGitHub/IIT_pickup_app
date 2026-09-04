-- ==============================================================================
-- V5: Soporte para reversión y rechazo de entregas y rol MONITOR
-- ==============================================================================

-- 1. Nuevas columnas en bitácora de entrega para auditoría de rechazos y reversiones
ALTER TABLE delivery_logs
    ADD COLUMN IF NOT EXISTS parent_rejected_at TIMESTAMPTZ,
    ADD COLUMN IF NOT EXISTS reverted_at TIMESTAMPTZ,
    ADD COLUMN IF NOT EXISTS reverted_by VARCHAR(150);

-- 2. Actualizar restricción de status para soportar RECHAZADO_PADRE y REVERTIDO_DOCENTE
ALTER TABLE delivery_logs DROP CONSTRAINT IF EXISTS delivery_logs_status_check;
ALTER TABLE delivery_logs ADD CONSTRAINT delivery_logs_status_check
    CHECK (status IN ('ENTREGADO_ESCUELA', 'RECIBIDO_PADRE', 'RECHAZADO_PADRE', 'REVERTIDO_DOCENTE'));

-- 3. Actualizar restricción de rol en usuarios docentes para permitir MONITOR
ALTER TABLE teacher_users DROP CONSTRAINT IF EXISTS teacher_users_role_check;
ALTER TABLE teacher_users ADD CONSTRAINT teacher_users_role_check
    CHECK (role IN ('TEACHER', 'ADMIN', 'MONITOR'));
