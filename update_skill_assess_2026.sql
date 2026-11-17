-- Update SHA-256 for all packages with the newly built archives
UPDATE packages 
SET sha256 = 'f856d38a25461808e4492b733c6d0092cb9a398c69bb2b7f4cb99310406642b5',
    updated_at = NOW()
WHERE package_code = 'FULL_ACCESS';

UPDATE packages 
SET sha256 = 'f2b355e323106e74f8cb9ddb9a6429ede2b558b5786077e66e6363be61474b39',
    updated_at = NOW()
WHERE package_code = 'JAVA_QA';

UPDATE packages 
SET sha256 = '54fae4a3d80cce80fa8d8ab6b2a6ba08a29411b12cab6dcfb73f377fb0aec945',
    updated_at = NOW()
WHERE package_code = 'PYTHON_C';

UPDATE packages 
SET sha256 = '686bf09a946f4b45f879cb4dd4d958c1c0f7290f92799053b8068905fcb0d69a',
    updated_at = NOW()
WHERE package_code = 'JAVA_VIVA';

UPDATE packages 
SET sha256 = '54221e93f10495a5568ed63104a5a6d1d2fdbd168678296d9f6c7fa3b67038e8',
    updated_at = NOW()
WHERE package_code = 'QA_PLACEMENT';

-- Link skill_assess to FULL_ACCESS
INSERT INTO package_extensions (package_id, extension_name, relative_path, active)
SELECT id, 'skill_assess', 'Application/Extensions/skill_assess', true
FROM packages WHERE package_code = 'FULL_ACCESS'
AND NOT EXISTS (
  SELECT 1 FROM package_extensions pe
  WHERE pe.package_id = packages.id AND pe.extension_name = 'skill_assess'
);

-- Link skill_assess to JAVA_QA
INSERT INTO package_extensions (package_id, extension_name, relative_path, active)
SELECT id, 'skill_assess', 'Application/Extensions/skill_assess', true
FROM packages WHERE package_code = 'JAVA_QA'
AND NOT EXISTS (
  SELECT 1 FROM package_extensions pe
  WHERE pe.package_id = packages.id AND pe.extension_name = 'skill_assess'
);
