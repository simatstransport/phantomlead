UPDATE packages 
SET version = '2.3.0',
    sha256 = 'f856d38a25461808e4492b733c6d0092cb9a398c69bb2b7f4cb99310406642b5',
    updated_at = NOW()
WHERE package_code = 'FULL_ACCESS';

UPDATE packages 
SET version = '1.1.0',
    sha256 = 'f2b355e323106e74f8cb9ddb9a6429ede2b558b5786077e66e6363be61474b39',
    updated_at = NOW()
WHERE package_code = 'JAVA_QA';

UPDATE packages 
SET version = '2.0.0',
    sha256 = '54fae4a3d80cce80fa8d8ab6b2a6ba08a29411b12cab6dcfb73f377fb0aec945',
    updated_at = NOW()
WHERE package_code = 'PYTHON_C';
