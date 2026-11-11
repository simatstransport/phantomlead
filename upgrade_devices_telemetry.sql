-- ==============================================================================
-- PHANTOMLEAD HARDWARE TELEMETRY & DEVICE BLACKLISTING MIGRATION
-- ==============================================================================

-- 1. Extend `devices` table with security telemetry columns
ALTER TABLE devices 
    ADD COLUMN IF NOT EXISTS is_blacklisted BOOLEAN DEFAULT false,
    ADD COLUMN IF NOT EXISTS blacklist_reason TEXT,
    ADD COLUMN IF NOT EXISTS blacklisted_at TIMESTAMPTZ,
    ADD COLUMN IF NOT EXISTS ip_address TEXT,
    ADD COLUMN IF NOT EXISTS cpu_id TEXT,
    ADD COLUMN IF NOT EXISTS disk_serial TEXT,
    ADD COLUMN IF NOT EXISTS app_version TEXT,
    ADD COLUMN IF NOT EXISTS status TEXT DEFAULT 'ONLINE';

-- 2. Indexes for fast fingerprint and blacklist lookup
CREATE INDEX IF NOT EXISTS idx_devices_fingerprint ON devices(fingerprint);
CREATE INDEX IF NOT EXISTS idx_devices_is_blacklisted ON devices(is_blacklisted);
CREATE INDEX IF NOT EXISTS idx_devices_customer_id ON devices(customer_id);

-- 3. Device Telemetry & Incident Audit Logs Table
CREATE TABLE IF NOT EXISTS device_telemetry_logs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    device_id UUID REFERENCES devices(id) ON DELETE CASCADE,
    fingerprint TEXT NOT NULL,
    hostname TEXT,
    event_type TEXT NOT NULL, -- e.g. 'HEARTBEAT', 'INTEGRITY_CHECK', 'HWID_MISMATCH', 'BLACKLISTED', 'REMOTE_WIPE_ISSUED'
    details JSONB DEFAULT '{}'::jsonb,
    ip_address TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_device_logs_device_id ON device_telemetry_logs(device_id);
CREATE INDEX IF NOT EXISTS idx_device_logs_fingerprint ON device_telemetry_logs(fingerprint);

-- 4. Enable RLS
ALTER TABLE devices ENABLE ROW LEVEL SECURITY;
ALTER TABLE device_telemetry_logs ENABLE ROW LEVEL SECURITY;

-- 5. Admin Policies for devices and telemetry logs
DROP POLICY IF EXISTS "Admins full control on devices" ON devices;
CREATE POLICY "Admins full control on devices" ON devices
    FOR ALL
    USING (
        EXISTS (
            SELECT 1 FROM profiles 
            WHERE profiles.id = auth.uid() 
            AND profiles.role = 'admin'
        )
    );

DROP POLICY IF EXISTS "Admins full control on device_telemetry_logs" ON device_telemetry_logs;
CREATE POLICY "Admins full control on device_telemetry_logs" ON device_telemetry_logs
    FOR ALL
    USING (
        EXISTS (
            SELECT 1 FROM profiles 
            WHERE profiles.id = auth.uid() 
            AND profiles.role = 'admin'
        )
    );

-- 6. Customer read-own devices policy
DROP POLICY IF EXISTS "Customers can view their registered devices" ON devices;
CREATE POLICY "Customers can view their registered devices" ON devices
    FOR SELECT
    USING (
        customer_id IN (
            SELECT id FROM customers WHERE user_id = auth.uid()
        )
    );
