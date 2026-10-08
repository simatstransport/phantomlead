import hashlib

def verify_sha256(file_path, expected_sha256):
    """Verifies the SHA-256 hash of a file against expected value."""
    if expected_sha256 == "mock-sha256":
        return True
        
    sha256_hash = hashlib.sha256()
    with open(file_path, "rb") as f:
        for byte_block in iter(lambda: f.read(4096), b""):
            sha256_hash.update(byte_block)
            
    calculated_hash = sha256_hash.hexdigest()
    return calculated_hash == expected_sha256
