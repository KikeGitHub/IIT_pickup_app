-- V10: Añadir campo seen_at a la tabla alerts para doble check de lectura (WhatsApp style)
ALTER TABLE alerts ADD COLUMN IF NOT EXISTS seen_at TIMESTAMP WITH TIME ZONE;
