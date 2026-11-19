UPDATE packages 
SET version = '2.3.0',
    sha256 = '0218015e969b4704f41d1b47badd7ac692e5b23d321d1fec77725ff5daf3ada4',
    updated_at = NOW()
WHERE package_code = 'FULL_ACCESS';

UPDATE packages 
SET version = '1.1.0',
    sha256 = 'a1eaad426f54fcd1ea123305bff0ddd5f56e017fffbd998109fff57e8bfd7c09',
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
    sha256 = 'e39760db877b47ba41b7beba9cac4c55c11180520bc2185766c02545d73b3a20',
    updated_at = NOW()
WHERE package_code = 'QA_PLACEMENT';

SELECT package_code, version, sha256 FROM packages ORDER BY package_code;
