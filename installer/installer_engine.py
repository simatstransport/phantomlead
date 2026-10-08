import os
import zipfile
import shutil
from config import APPLICATION_ROOT, CORE_FOLDERS, STAGING_DIR
from backup_manager import create_backup
from rollback import rollback_installation
from gemini_config import configure_gemini_keys
from downloader import download_package
from integrity import verify_sha256

def stage_package(zip_path):
    """Extracts the package into a temporary staging directory."""
    if os.path.exists(STAGING_DIR):
        shutil.rmtree(STAGING_DIR)
    os.makedirs(STAGING_DIR, exist_ok=True)
    
    with zipfile.ZipFile(zip_path, 'r') as zip_ref:
        zip_ref.extractall(STAGING_DIR)

def deploy_authorized_extensions(staging_dir, authorized_extensions):
    """Deploys only the authorized extensions."""
    ext_src_dir = os.path.join(staging_dir, "Application", "Extensions")
    ext_dst_dir = os.path.join(APPLICATION_ROOT, "Application", "Extensions")
    
    # Create Extensions directory if it doesn't exist
    os.makedirs(ext_dst_dir, exist_ok=True)
    
    for ext in authorized_extensions:
        src = os.path.join(ext_src_dir, ext)
        dst = os.path.join(ext_dst_dir, ext)
        if os.path.exists(src):
            if os.path.exists(dst):
                shutil.rmtree(dst)
            shutil.copytree(src, dst)
        else:
            raise Exception(f"Authorized extension {ext} not found in package.")

def deploy_core_folders(staging_dir):
    """Deploys the core folders (Configuration, Reset, Service, Application/excluding Extensions)."""
    for folder in CORE_FOLDERS:
        src = os.path.join(staging_dir, folder)
        dst = os.path.join(APPLICATION_ROOT, folder)
        
        if folder == "Application":
            # Deploy Application folder contents but NOT extensions
            os.makedirs(dst, exist_ok=True)
            for item in os.listdir(src):
                if item == "Extensions":
                    continue
                s = os.path.join(src, item)
                d = os.path.join(dst, item)
                if os.path.isdir(s):
                    if os.path.exists(d): shutil.rmtree(d)
                    shutil.copytree(s, d)
                else:
                    shutil.copy2(s, d)
        else:
            # Direct replace
            if os.path.exists(src):
                if os.path.exists(dst):
                    shutil.rmtree(dst)
                shutil.copytree(src, dst)
            else:
                raise Exception(f"Core folder {folder} missing in package.")

def run_installation(zip_path, manifest, api_key):
    """Runs the complete installation process."""
    backup_dir = None
    try:
        print("Starting installation...")
        
        print("1. Creating backup...")
        backup_dir = create_backup()
        
        print("2. Staging package...")
        stage_package(zip_path)
        
        print("3. Deploying core folders...")
        deploy_core_folders(STAGING_DIR)
        
        print("4. Deploying authorized extensions...")
        deploy_authorized_extensions(STAGING_DIR, manifest["extensions"])
        
        print("5. Configuring Gemini API Key...")
        configure_gemini_keys(APPLICATION_ROOT, manifest["extensions"], api_key)
        
        print("Installation completed successfully.")
        return True
    except Exception as e:
        print(f"Installation failed: {e}")
        rollback_installation(backup_dir)
        return False
    finally:
        # Cleanup staging
        if os.path.exists(STAGING_DIR):
            shutil.rmtree(STAGING_DIR)
