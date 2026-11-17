UPDATE packages 
SET version = '2.3.0',
    sha256 = '32edd31e763bb0eaabd08198272cf9e45489e9fb00cf7b5c1bc7482683b6635b',
    updated_at = NOW()
WHERE package_code = 'FULL_ACCESS';

UPDATE packages 
SET version = '1.1.0',
    sha256 = 'f2b355e323106e74f8cb9ddb9a6429ede2b558b5786077e66e6363be61474b39',
    updated_at = NOW()
WHERE package_code = 'JAVA_QA';

UPDATE packages 
SET version = '2.0.0',
    sha256 = '686bf09a946f4b45f879cb4dd4d958c1c0f7290f92799053b8068905fcb0d69a',
    updated_at = NOW()
WHERE package_code = 'JAVA_VIVA';

UPDATE packages 
SET version = '2.0.0',
    sha256 = '1bc2204924c3d05bb3b52d9a971e8bef9a8a22a923ed54a53b36454ba8d8877b',
    updated_at = NOW()
WHERE package_code = 'PYTHON_C';

UPDATE packages 
SET version = '2.2.0',
    sha256 = '54221e93f10495a5568ed63104a5a6d1d2fdbd168678296d9f6c7fa3b67038e8',
    updated_at = NOW()
WHERE package_code = 'QA_PLACEMENT';

SELECT package_code, version, sha256 FROM packages ORDER BY package_code;
