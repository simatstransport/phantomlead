import os
import shutil
import zipfile
import json
import hashlib

SOURCE_BASE = r"C:\Users\Admin\Desktop\See"
OUTPUT_DIR = "dist_packages"

PACKAGES = {
    "FULL_ACCESS": {
        "extensions": ["lms_mcq", "viva_paragraph", "java_coding"],
        "version": "1.0.0"
    },
    "JAVA_VIVA": {
        "extensions": ["viva_paragraph", "java_coding"],
        "version": "1.0.0"
    },
    "QA_PLACEMENT": {
        "extensions": ["lms_mcq"],
        "version": "1.0.0"
    }
}

CORE_FOLDERS = ["Configuration", "Reset", "Service"]
APP_FOLDER = "Application"
EXTENSIONS_DIR = os.path.join(APP_FOLDER, "Extensions")

def build_package(package_code, config):
    print(f"Building {package_code}...")
    staging_dir = os.path.join("staging", package_code)
    
    if os.path.exists(staging_dir):
        shutil.rmtree(staging_dir)
    os.makedirs(staging_dir)

    # 1. Copy core folders
    for folder in CORE_FOLDERS:
        src = os.path.join(SOURCE_BASE, folder)
        dst = os.path.join(staging_dir, folder)
        if os.path.exists(src):
            shutil.copytree(src, dst)
        else:
            print(f"  Warning: Source folder not found: {src}")
            os.makedirs(dst)

    # 2. Copy Application folder (excluding extensions initially or manually handling)
    app_src = os.path.join(SOURCE_BASE, APP_FOLDER)
    app_dst = os.path.join(staging_dir, APP_FOLDER)
    
    if os.path.exists(app_src):
        # We need to copy Application but only the requested extensions
        shutil.copytree(app_src, app_dst, ignore=shutil.ignore_patterns('Extensions'))
    else:
        print(f"  Warning: Source folder not found: {app_src}")
        os.makedirs(app_dst)

    # 3. Handle Extensions
    ext_src_base = os.path.join(SOURCE_BASE, EXTENSIONS_DIR)
    ext_dst_base = os.path.join(staging_dir, EXTENSIONS_DIR)
    os.makedirs(ext_dst_base, exist_ok=True)

    for ext in config["extensions"]:
        ext_src = os.path.join(ext_src_base, ext)
        ext_dst = os.path.join(ext_dst_base, ext)
        if os.path.exists(ext_src):
            shutil.copytree(ext_src, ext_dst)
        else:
            print(f"  Warning: Extension source not found: {ext_src}")
            # Mock it for building purposes if not exists
            os.makedirs(ext_dst)
            with open(os.path.join(ext_dst, "background.js"), "w") as f:
                f.write('const DEFAULT_API_KEY = "OLD_KEY";\nconsole.log("Mock");\n')

    # 4. Zip it
    os.makedirs(OUTPUT_DIR, exist_ok=True)
    zip_name = f"{package_code}_version-{config['version']}.zip"
    zip_path = os.path.join(OUTPUT_DIR, zip_name)
    
    with zipfile.ZipFile(zip_path, 'w', zipfile.ZIP_DEFLATED) as zipf:
        for root, dirs, files in os.walk(staging_dir):
            for file in files:
                file_path = os.path.join(root, file)
                arcname = os.path.relpath(file_path, staging_dir)
                # Ensure zip paths use forward slashes for cross-platform compatibility
                arcname = arcname.replace('\\', '/')
                zipf.write(file_path, arcname)
                
    # 5. Calculate SHA-256
    sha256 = calculate_sha256(zip_path)
    print(f"  Built: {zip_path}")
    print(f"  SHA-256: {sha256}")
    
    # Clean staging
    shutil.rmtree(staging_dir)

    return {
        "package_code": package_code,
        "zip_path": zip_path,
        "sha256": sha256
    }

def calculate_sha256(file_path):
    sha256_hash = hashlib.sha256()
    with open(file_path, "rb") as f:
        for byte_block in iter(lambda: f.read(4096), b""):
            sha256_hash.update(byte_block)
    return sha256_hash.hexdigest()

def main():
    print("Starting package builder...")
    results = []
    for package_code, config in PACKAGES.items():
        res = build_package(package_code, config)
        results.append(res)
    
    with open("package_info.json", "w") as f:
        json.dump(results, f, indent=2)
    print("Done. See package_info.json for hashes.")

if __name__ == "__main__":
    main()
