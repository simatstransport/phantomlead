-- Update FULL_ACCESS and QA_PLACEMENT to v2.2.0 with their new SHA-256 hashes

UPDATE packages 
SET version = '2.2.0', 
    sha256 = '02f7be60642618e1428978dd73664e840ceacb861e37bf67f5a16dc19a2b0c63',
    updated_at = NOW()
WHERE package_code = 'FULL_ACCESS';

UPDATE packages 
SET version = '2.2.0', 
    sha256 = '72c24e7397ea44a4548743fbd808ab085e0b60d6c15ee8405748e7865ceeaf9c',
    updated_at = NOW()
WHERE package_code = 'QA_PLACEMENT';
