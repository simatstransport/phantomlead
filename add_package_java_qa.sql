-- Insert or update JAVA_QA package and link extensions
DO $$
DECLARE
    v_pkg_id UUID;
BEGIN
    IF EXISTS (SELECT 1 FROM packages WHERE package_code = 'JAVA_QA') THEN
        UPDATE packages
        SET package_name = 'Java + QA MCQs',
            description = 'Java Coding, Viva Paragraph Explainer, and LMS MCQ helper',
            price = 2000.0,
            version = '1.0.0',
            sha256 = 'b4880ccd0dcace0d124fa1d8d199106a0cd8c82ae59f09aeaed61e5a212c642a',
            active = true,
            updated_at = NOW()
        WHERE package_code = 'JAVA_QA'
        RETURNING id INTO v_pkg_id;
    ELSE
        INSERT INTO packages (
            package_code, package_name, description, price, version, sha256, active
        ) VALUES (
            'JAVA_QA',
            'Java + QA MCQs',
            'Java Coding, Viva Paragraph Explainer, and LMS MCQ helper',
            2000.0,
            '1.0.0',
            'b4880ccd0dcace0d124fa1d8d199106a0cd8c82ae59f09aeaed61e5a212c642a',
            true
        ) RETURNING id INTO v_pkg_id;
    END IF;

    -- Link java_coding
    IF NOT EXISTS (SELECT 1 FROM package_extensions WHERE package_id = v_pkg_id AND extension_name = 'java_coding') THEN
        INSERT INTO package_extensions (package_id, extension_name, relative_path, active)
        VALUES (v_pkg_id, 'java_coding', 'Application/Extensions/java_coding', true);
    END IF;

    -- Link viva_paragraph
    IF NOT EXISTS (SELECT 1 FROM package_extensions WHERE package_id = v_pkg_id AND extension_name = 'viva_paragraph') THEN
        INSERT INTO package_extensions (package_id, extension_name, relative_path, active)
        VALUES (v_pkg_id, 'viva_paragraph', 'Application/Extensions/viva_paragraph', true);
    END IF;

    -- Link lms_mcq
    IF NOT EXISTS (SELECT 1 FROM package_extensions WHERE package_id = v_pkg_id AND extension_name = 'lms_mcq') THEN
        INSERT INTO package_extensions (package_id, extension_name, relative_path, active)
        VALUES (v_pkg_id, 'lms_mcq', 'Application/Extensions/lms_mcq', true);
    END IF;

END $$;
