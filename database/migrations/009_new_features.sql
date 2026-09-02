-- database/migrations/002_new_features.sql
-- New features migration

-- Biometric credentials table
CREATE TABLE IF NOT EXISTS biometric_credentials (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    device_name TEXT NOT NULL,
    credential_id TEXT NOT NULL UNIQUE,
    public_key TEXT NOT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    last_used_at TIMESTAMPTZ
);

CREATE INDEX idx_biometric_user ON biometric_credentials(user_id);
CREATE INDEX idx_biometric_credential ON biometric_credentials(credential_id);

-- Split payments table
CREATE TABLE IF NOT EXISTS split_payments (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    split_id TEXT NOT NULL UNIQUE,
    created_by UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    total_amount NUMERIC(12,2) NOT NULL,
    participants JSONB NOT NULL,
    note TEXT,
    split_type TEXT DEFAULT 'equal',
    status TEXT DEFAULT 'active',
    created_at TIMESTAMPTZ DEFAULT NOW(),
    expires_at TIMESTAMPTZ,
    updated_at TIMESTAMPTZ
);

CREATE INDEX idx_split_created_by ON split_payments(created_by);
CREATE INDEX idx_split_status ON split_payments(status);

-- Virtual cards table
CREATE TABLE IF NOT EXISTS virtual_cards (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    card_id TEXT NOT NULL UNIQUE,
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    card_name TEXT NOT NULL,
    limit_amount NUMERIC(12,2) NOT NULL,
    used_amount NUMERIC(12,2) DEFAULT 0,
    expiry_date DATE NOT NULL,
    status TEXT DEFAULT 'active',
    upi_id TEXT NOT NULL UNIQUE,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ
);

CREATE INDEX idx_virtual_cards_user ON virtual_cards(user_id);
CREATE INDEX idx_virtual_cards_status ON virtual_cards(status);

-- Reminders table
CREATE TABLE IF NOT EXISTS reminders (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    title TEXT NOT NULL,
    description TEXT,
    due_date TIMESTAMPTZ NOT NULL,
    amount NUMERIC(12,2),
    contact_id UUID REFERENCES users(id) ON DELETE SET NULL,
    status TEXT DEFAULT 'active',
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ
);

CREATE INDEX idx_reminders_user ON reminders(user_id);
CREATE INDEX idx_reminders_status ON reminders(status);
CREATE INDEX idx_reminders_due_date ON reminders(due_date);

-- Add favorite column to contacts
ALTER TABLE contacts ADD COLUMN IF NOT EXISTS favorite BOOLEAN DEFAULT FALSE;

-- Notifications table for real-time alerts
CREATE TABLE IF NOT EXISTS notifications (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    type TEXT NOT NULL,
    title TEXT NOT NULL,
    message TEXT NOT NULL,
    data JSONB,
    is_read BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_notifications_user ON notifications(user_id);
CREATE INDEX idx_notifications_read ON notifications(is_read);
CREATE INDEX idx_notifications_created ON notifications(created_at);