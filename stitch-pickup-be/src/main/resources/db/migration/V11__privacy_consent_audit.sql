-- V11: Auditoría de consentimiento informado y aceptación de Aviso de Privacidad (LFPDPPP 2025)
-- Agrega control de versión aceptada en parent_users y tabla inmutable de evidencias.

ALTER TABLE parent_users
    ADD COLUMN IF NOT EXISTS privacy_policy_version VARCHAR(20),
    ADD COLUMN IF NOT EXISTS privacy_accepted_at    TIMESTAMPTZ;

CREATE TABLE IF NOT EXISTS privacy_consent_logs (
    id             UUID         PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id        UUID         NOT NULL,
    user_role      VARCHAR(20)  NOT NULL,
    user_email     VARCHAR(200) NOT NULL,
    policy_version VARCHAR(20)  NOT NULL,
    policy_hash    VARCHAR(64)  NOT NULL,
    consent_scope  VARCHAR(40)  NOT NULL,
    accepted       BOOLEAN      NOT NULL,
    accepted_at    TIMESTAMPTZ  NOT NULL DEFAULT NOW(),
    ip_address     VARCHAR(45),
    user_agent     TEXT
);

CREATE INDEX IF NOT EXISTS idx_privacy_consent_user ON privacy_consent_logs (user_id, policy_version);
CREATE INDEX IF NOT EXISTS idx_privacy_consent_date ON privacy_consent_logs (accepted_at DESC);

