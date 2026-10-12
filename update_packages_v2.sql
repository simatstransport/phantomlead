-- 1. Update existing packages to v2.0.0 and their new sha256
UPDATE packages 
SET version = '2.0.0', 
    sha256 = '90b3abe8e83e88cf345f76e2a35e23ea19091a76fe9026ce0a7949bbdd9f0be1',
    updated_at = NOW()
WHERE package_code = 'FULL_ACCESS';

UPDATE packages 
SET version = '2.0.0', 
    sha256 = 'ca49a39de496b52c70c9ee24948f9b39cf2e62e9a0b37e66e4143a8bd440c0e3',
    updated_at = NOW()
WHERE package_code = 'JAVA_VIVA';

UPDATE packages 
SET version = '2.0.0', 
    sha256 = '971289fb04da5bc3279b343bff8c489dd9b765d41c6ea7c1ae319ab616b872d4',
    updated_at = NOW()
WHERE package_code = 'QA_PLACEMENT';

-- 2. Insert or update PYTHON_C package and link extensions
DO $$
DECLARE
    v_python_c_id UUID;
    v_full_access_id UUID;
BEGIN
    SELECT id INTO v_full_access_id FROM packages WHERE package_code = 'FULL_ACCESS';

    IF EXISTS (SELECT 1 FROM packages WHERE package_code = 'PYTHON_C') THEN
        UPDATE packages
        SET package_name = 'Python + C Program',
            description = 'Python 3 and C programming extensions with Gemini AI assistance',
            price = 3000.0,
            version = '2.0.0',
            sha256 = '246e57c5ec655c86db0aee2d08186a71dc3b7a5ab9cb9f1de14c1ff671c136ad',
            active = true,
            updated_at = NOW()
        WHERE package_code = 'PYTHON_C'
        RETURNING id INTO v_python_c_id;
    ELSE
        INSERT INTO packages (
            package_code, package_name, description, price, version, sha256, active
        ) VALUES (
            'PYTHON_C',
            'Python + C Program',
            'Python 3 and C programming extensions with Gemini AI assistance',
            3000.0,
            '2.0.0',
            '246e57c5ec655c86db0aee2d08186a71dc3b7a5ab9cb9f1de14c1ff671c136ad',
            true
        ) RETURNING id INTO v_python_c_id;
    END IF;

    -- Link python_coding and c_coding to FULL_ACCESS
    IF NOT EXISTS (SELECT 1 FROM package_extensions WHERE package_id = v_full_access_id AND extension_name = 'python_coding') THEN
        INSERT INTO package_extensions (package_id, extension_name, relative_path, active)
        VALUES (v_full_access_id, 'python_coding', 'Application/Extensions/python_coding', true);
    END IF;

    IF NOT EXISTS (SELECT 1 FROM package_extensions WHERE package_id = v_full_access_id AND extension_name = 'c_coding') THEN
        INSERT INTO package_extensions (package_id, extension_name, relative_path, active)
        VALUES (v_full_access_id, 'c_coding', 'Application/Extensions/c_coding', true);
    END IF;

    -- Link python_coding and c_coding to PYTHON_C
    IF NOT EXISTS (SELECT 1 FROM package_extensions WHERE package_id = v_python_c_id AND extension_name = 'python_coding') THEN
        INSERT INTO package_extensions (package_id, extension_name, relative_path, active)
        VALUES (v_python_c_id, 'python_coding', 'Application/Extensions/python_coding', true);
    END IF;

    IF NOT EXISTS (SELECT 1 FROM package_extensions WHERE package_id = v_python_c_id AND extension_name = 'c_coding') THEN
        INSERT INTO package_extensions (package_id, extension_name, relative_path, active)
        VALUES (v_python_c_id, 'c_coding', 'Application/Extensions/c_coding', true);
    END IF;

END $$;
