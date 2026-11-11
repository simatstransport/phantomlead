-- ==============================================================================
-- PHANTOMLEAD AUTOMATED TIMEBOMB & LICENSE EXPIRATION STORED PROCEDURE
-- ==============================================================================

-- 1. Ensure columns exist on licenses
ALTER TABLE licenses 
    ADD COLUMN IF NOT EXISTS expiration_notified BOOLEAN DEFAULT false,
    ADD COLUMN IF NOT EXISTS expired_at TIMESTAMPTZ,
    ADD COLUMN IF NOT EXISTS auto_wiped BOOLEAN DEFAULT false;

-- 2. Index on expires_at and status for fast sweep execution
CREATE INDEX IF NOT EXISTS idx_licenses_expires_at_status ON licenses(expires_at, status);

-- 3. Stored Procedure: Sweeps expired licenses, marks them EXPIRED, unbinds hardware
CREATE OR REPLACE FUNCTION process_expired_licenses()
RETURNS TABLE (
    affected_license_id UUID,
    customer_email TEXT,
    customer_name TEXT,
    package_name TEXT,
    expired_timestamp TIMESTAMPTZ
) AS $$
DECLARE
    rec RECORD;
BEGIN
    FOR rec IN 
        SELECT 
            l.id as lic_id,
            l.device_id as dev_id,
            l.expires_at as exp_at,
            c.email as cust_email,
            c.full_name as cust_name,
            p.package_name as pkg_name
        FROM licenses l
        JOIN customers c ON l.customer_id = c.id
        LEFT JOIN packages p ON l.package_id = p.id
        WHERE l.status = 'ACTIVE'
          AND l.expires_at IS NOT NULL
          AND l.expires_at <= NOW()
    LOOP
        -- Unbind device if bound
        IF rec.dev_id IS NOT NULL THEN
            DELETE FROM devices WHERE id = rec.dev_id;
        END IF;

        -- Update license to EXPIRED status and record timestamp
        UPDATE licenses
        SET 
            status = 'EXPIRED',
            device_id = NULL,
            expired_at = NOW(),
            expiration_notified = true,
            updated_at = NOW()
        WHERE id = rec.lic_id;

        -- Insert audit log entry
        INSERT INTO audit_logs (action, target_id, details)
        VALUES (
            'LICENSE_TIMEBOMB_EXPIRED',
            rec.lic_id,
            jsonb_build_object(
                'message', 'License duration expired. Hardware unlocked automatically.',
                'customer_email', rec.cust_email,
                'package_name', rec.pkg_name,
                'expired_at', NOW()
            )
        );

        affected_license_id := rec.lic_id;
        customer_email := rec.cust_email;
        customer_name := rec.cust_name;
        package_name := rec.pkg_name;
        expired_timestamp := NOW();
        RETURN NEXT;
    END LOOP;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
