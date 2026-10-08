-- Phase 2: Schema
-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Admin settings
CREATE TABLE admin_settings (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    key VARCHAR(255) UNIQUE NOT NULL,
    value JSONB NOT NULL,
    description TEXT,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Profiles (extends Supabase Auth)
CREATE TABLE profiles (
    id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    role VARCHAR(50) DEFAULT 'customer' CHECK (role IN ('customer', 'admin')),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Customers
CREATE TABLE customers (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
    full_name VARCHAR(255) NOT NULL,
    email VARCHAR(255) UNIQUE NOT NULL,
    phone VARCHAR(50),
    status VARCHAR(50) DEFAULT 'ACTIVE' CHECK (status IN ('ACTIVE', 'INACTIVE', 'BLOCKED')),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Packages
CREATE TABLE packages (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    package_code VARCHAR(100) UNIQUE NOT NULL,
    package_name VARCHAR(255) NOT NULL,
    description TEXT,
    price DECIMAL(10, 2) NOT NULL,
    version VARCHAR(50) NOT NULL DEFAULT '1.0.0',
    storage_path VARCHAR(500),
    sha256 VARCHAR(255),
    active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Package Extensions
CREATE TABLE package_extensions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    package_id UUID REFERENCES packages(id) ON DELETE CASCADE,
    extension_name VARCHAR(100) NOT NULL,
    relative_path VARCHAR(500) NOT NULL,
    active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Payments
CREATE TABLE payments (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    customer_id UUID REFERENCES customers(id) ON DELETE CASCADE,
    package_id UUID REFERENCES packages(id),
    amount DECIMAL(10, 2) NOT NULL,
    upi_transaction_id VARCHAR(255) UNIQUE,
    screenshot_url VARCHAR(500),
    status VARCHAR(50) DEFAULT 'PENDING' CHECK (status IN ('PENDING', 'APPROVED', 'REJECTED')),
    submitted_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    reviewed_at TIMESTAMP WITH TIME ZONE,
    reviewed_by UUID REFERENCES auth.users(id)
);

-- Devices
CREATE TABLE devices (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    customer_id UUID REFERENCES customers(id) ON DELETE CASCADE,
    fingerprint VARCHAR(255) UNIQUE NOT NULL,
    hostname VARCHAR(255),
    os_info TEXT,
    registered_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    last_active_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Licenses
CREATE TABLE licenses (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    license_key_hash VARCHAR(255) UNIQUE NOT NULL, -- Storing hash of license key, not the plain key
    customer_id UUID REFERENCES customers(id) ON DELETE CASCADE,
    package_id UUID REFERENCES packages(id),
    device_id UUID REFERENCES devices(id),
    payment_id UUID REFERENCES payments(id),
    status VARCHAR(50) DEFAULT 'ACTIVE' CHECK (status IN ('ACTIVE', 'REVOKED', 'EXPIRED', 'SUSPENDED')),
    payment_type VARCHAR(50) DEFAULT 'PAID' CHECK (payment_type IN ('PAID', 'FREE')),
    issued_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    expires_at TIMESTAMP WITH TIME ZONE,
    max_devices INTEGER DEFAULT 1
);

-- Installation Logs
CREATE TABLE installation_logs (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    customer_id UUID REFERENCES customers(id),
    license_id UUID REFERENCES licenses(id),
    package_id UUID REFERENCES packages(id),
    device_id UUID REFERENCES devices(id),
    version VARCHAR(50),
    status VARCHAR(50) CHECK (status IN ('STARTED', 'DOWNLOADING', 'VERIFYING', 'BACKUP', 'INSTALLING', 'CONFIGURING', 'COMPLETED', 'FAILED', 'ROLLED_BACK')),
    error_code VARCHAR(255),
    started_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    completed_at TIMESTAMP WITH TIME ZONE
);

-- Audit Logs
CREATE TABLE audit_logs (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    action VARCHAR(100) NOT NULL,
    actor_id UUID, -- Can be user_id or system
    target_id UUID, -- Affected resource
    details JSONB,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Phase 4: RLS Policies
ALTER TABLE admin_settings ENABLE ROW LEVEL SECURITY;
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE customers ENABLE ROW LEVEL SECURITY;
ALTER TABLE packages ENABLE ROW LEVEL SECURITY;
ALTER TABLE package_extensions ENABLE ROW LEVEL SECURITY;
ALTER TABLE payments ENABLE ROW LEVEL SECURITY;
ALTER TABLE devices ENABLE ROW LEVEL SECURITY;
ALTER TABLE licenses ENABLE ROW LEVEL SECURITY;
ALTER TABLE installation_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE audit_logs ENABLE ROW LEVEL SECURITY;

-- Helper function to check if user is admin
CREATE OR REPLACE FUNCTION is_admin() RETURNS BOOLEAN AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin'
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Profiles: Users can read own profile, admins can read all
CREATE POLICY "Users can read own profile" ON profiles FOR SELECT USING (auth.uid() = id);
CREATE POLICY "Admins can manage profiles" ON profiles USING (is_admin());

-- Customers: Users can read own customer record, admins can manage all
CREATE POLICY "Users can read own customer record" ON customers FOR SELECT USING (user_id = auth.uid());
CREATE POLICY "Users can update own customer record" ON customers FOR UPDATE USING (user_id = auth.uid());
CREATE POLICY "Admins can manage customers" ON customers USING (is_admin());

-- Packages: Anyone can read active packages, admins can manage all
CREATE POLICY "Anyone can read active packages" ON packages FOR SELECT USING (active = true);
CREATE POLICY "Admins can manage packages" ON packages USING (is_admin());

-- Package Extensions: Anyone can read active extensions, admins can manage all
CREATE POLICY "Anyone can read active extensions" ON package_extensions FOR SELECT USING (active = true);
CREATE POLICY "Admins can manage package extensions" ON package_extensions USING (is_admin());

-- Payments: Users can read own payments, create payments. Admins can manage all
CREATE POLICY "Users can read own payments" ON payments FOR SELECT USING (customer_id IN (SELECT id FROM customers WHERE user_id = auth.uid()));
CREATE POLICY "Users can create payments" ON payments FOR INSERT WITH CHECK (customer_id IN (SELECT id FROM customers WHERE user_id = auth.uid()));
CREATE POLICY "Admins can manage payments" ON payments USING (is_admin());

-- Devices: Users can read own devices. Admins can manage all
CREATE POLICY "Users can read own devices" ON devices FOR SELECT USING (customer_id IN (SELECT id FROM customers WHERE user_id = auth.uid()));
CREATE POLICY "Admins can manage devices" ON devices USING (is_admin());

-- Licenses: Users can read own licenses. Admins can manage all
CREATE POLICY "Users can read own licenses" ON licenses FOR SELECT USING (customer_id IN (SELECT id FROM customers WHERE user_id = auth.uid()));
CREATE POLICY "Admins can manage licenses" ON licenses USING (is_admin());

-- Installation Logs: Users can read own logs. Admins can manage all
CREATE POLICY "Users can read own logs" ON installation_logs FOR SELECT USING (customer_id IN (SELECT id FROM customers WHERE user_id = auth.uid()));
CREATE POLICY "Admins can manage installation logs" ON installation_logs USING (is_admin());

-- Audit Logs: Only admins
CREATE POLICY "Admins can read audit logs" ON audit_logs FOR SELECT USING (is_admin());
CREATE POLICY "Admins can insert audit logs" ON audit_logs FOR INSERT WITH CHECK (is_admin());

-- Phase 3: Seed Data (Packages and Extensions)
INSERT INTO packages (package_code, package_name, description, price, version) VALUES
('FULL_ACCESS', 'Full Access', 'All extensions included', 1500.00, '1.0.0'),
('JAVA_VIVA', 'Java Code + Viva', 'Java and Viva extensions', 3000.00, '1.0.0'),
('QA_PLACEMENT', 'QA + Placement', 'LMS MCQ extension only', 2000.00, '1.0.0');

-- Package Extensions for FULL_ACCESS
INSERT INTO package_extensions (package_id, extension_name, relative_path)
SELECT id, 'lms_mcq', 'Application/Extensions/lms_mcq' FROM packages WHERE package_code = 'FULL_ACCESS';
INSERT INTO package_extensions (package_id, extension_name, relative_path)
SELECT id, 'viva_paragraph', 'Application/Extensions/viva_paragraph' FROM packages WHERE package_code = 'FULL_ACCESS';
INSERT INTO package_extensions (package_id, extension_name, relative_path)
SELECT id, 'java_coding', 'Application/Extensions/java_coding' FROM packages WHERE package_code = 'FULL_ACCESS';

-- Package Extensions for JAVA_VIVA
INSERT INTO package_extensions (package_id, extension_name, relative_path)
SELECT id, 'viva_paragraph', 'Application/Extensions/viva_paragraph' FROM packages WHERE package_code = 'JAVA_VIVA';
INSERT INTO package_extensions (package_id, extension_name, relative_path)
SELECT id, 'java_coding', 'Application/Extensions/java_coding' FROM packages WHERE package_code = 'JAVA_VIVA';

-- Package Extensions for QA_PLACEMENT
INSERT INTO package_extensions (package_id, extension_name, relative_path)
SELECT id, 'lms_mcq', 'Application/Extensions/lms_mcq' FROM packages WHERE package_code = 'QA_PLACEMENT';
