import os
import requests

def download_package(url, dest_path):
    """Downloads the package from the signed URL with progress reporting."""
    if url == "mock-url":
        print("Mock URL detected, skipping actual download.")
        return dest_path
        
    os.makedirs(os.path.dirname(dest_path), exist_ok=True)
    with requests.get(url, stream=True, timeout=60) as r:
        r.raise_for_status()
        total_length = r.headers.get('content-length')
        total_bytes = int(total_length) if total_length else 0
        total_mb = total_bytes / (1024 * 1024) if total_bytes else 0
        downloaded = 0
        last_logged_mb = 0
        
        with open(dest_path, 'wb') as f:
            for chunk in r.iter_content(chunk_size=131072):
                if chunk:
                    f.write(chunk)
                    downloaded += len(chunk)
                    curr_mb = downloaded / (1024 * 1024)
                    if curr_mb - last_logged_mb >= 25:
                        last_logged_mb = curr_mb
                        if total_mb > 0:
                            pct = int((downloaded / total_bytes) * 100)
                            print(f"    Downloading package: {curr_mb:.1f} MB / {total_mb:.1f} MB ({pct}%)...")
                        else:
                            print(f"    Downloading package: {curr_mb:.1f} MB...")
                            
    print(f"    Download complete ({downloaded / (1024 * 1024):.1f} MB).")
    return dest_path
