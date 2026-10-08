import os
import requests
from config import STAGING_DIR

def download_package(url, dest_path):
    """Downloads the package from the signed URL."""
    # For testing, if mock-url, we can simulate or fail
    if url == "mock-url":
        print("Mock URL detected, skipping actual download.")
        return
        
    os.makedirs(os.path.dirname(dest_path), exist_ok=True)
    with requests.get(url, stream=True) as r:
        r.raise_for_status()
        with open(dest_path, 'wb') as f:
            for chunk in r.iter_content(chunk_size=8192):
                f.write(chunk)
    return dest_path
