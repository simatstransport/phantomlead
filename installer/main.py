import os
import sys
import ctypes
from device import get_device_fingerprint, get_device_info
from license_client import validate_license, activate_license, get_package_manifest, request_signed_download_url
from downloader import download_package
from integrity import verify_sha256
from installer_engine import run_installation
import colorama
from colorama import Fore, Style

colorama.init()

def is_admin():
    try:
        return ctypes.windll.shell32.IsUserAnAdmin()
    except:
        return False

def print_header(title):
    print("\n" + "="*50)
    print(f"{title.center(50)}")
    print("="*50 + "\n")

def main():
    if not is_admin():
        print(Fore.RED + "Error: Administrator privileges required." + Style.RESET_ALL)
        print("Please run this installer as Administrator.")
        # Re-run as admin could be implemented here, but for now exit
        sys.exit(1)
        
    print_header("SECURE PACKAGE INSTALLER")
    print("Welcome\nThis installer will install your authorized software package.\n")
    input("Press ENTER to CONTINUE...")
    
    # 1. License
    print_header("LICENSE ACTIVATION")
    license_key = input("License Key: ").strip()
    
    if not license_key:
        print("Invalid license key.")
        return

    print("Validating license...")
    fingerprint = get_device_fingerprint()
    
    validation_res = validate_license(license_key, fingerprint)
    if not validation_res.get("valid"):
        print(Fore.RED + "License validation failed." + Style.RESET_ALL)
        return
        
    print("Checking device...")
    device_info = get_device_info()
    activate_res = activate_license(license_key, fingerprint, device_info)
    
    if not activate_res.get("activated"):
        print(Fore.RED + "Device activation failed." + Style.RESET_ALL)
        return

    # 2. Package Info
    print("Checking package...")
    manifest = get_package_manifest(license_key)
    
    package_names = {
        "FULL_ACCESS": "FULL ACCESS",
        "JAVA_VIVA": "JAVA CODE + VIVA",
        "QA_PLACEMENT": "QA + PLACEMENT"
    }
    
    ext_names = {
        "lms_mcq": "LMS MCQ",
        "viva_paragraph": "Viva Paragraph",
        "java_coding": "Java Coding"
    }
    
    print_header(package_names.get(manifest['package_code'], manifest['package_code']))
    print("Included:\n")
    for ext in manifest["extensions"]:
        print(f"✓ {ext_names.get(ext, ext)}")
    print()
    input("Press ENTER to CONTINUE...")
    
    # 3. Gemini API Key
    print_header("GEMINI API CONFIGURATION")
    print("Your package requires a Gemini API key.")
    print("Extensions requiring configuration:")
    for ext in manifest["extensions"]:
        print(f"✓ {ext}")
    print("\nWarning: The API key will be written to client-side JS files.")
    
    api_key = input("\nGemini API Key: ").strip()
    
    if not api_key:
        print("API key is required.")
        return

    print("\nStarting deployment...")
    
    # 4. Download
    print("Requesting authorized download URL...")
    download_url = request_signed_download_url(license_key)
    
    # Use a temp directory for the zip
    temp_zip = os.path.join(os.environ.get("TEMP", "C:\\Temp"), f"{manifest['package_code']}.zip")
    
    if download_url == "mock-url":
        # Mocking for local tests
        print("Running in mock mode. Looking for local dist_packages.")
        local_zip = os.path.abspath(os.path.join("..", "dist_packages", f"{manifest['package_code']}_version-{manifest['version']}.zip"))
        if os.path.exists(local_zip):
            temp_zip = local_zip
        else:
            print("Local zip not found for mock mode.")
            return
    else:
        print("Downloading package...")
        download_package(download_url, temp_zip)
    
    print("Verifying package integrity...")
    if not verify_sha256(temp_zip, manifest["sha256"]):
        print(Fore.RED + "Package integrity check failed. SHA-256 mismatch!" + Style.RESET_ALL)
        return
        
    print("Integrity verified.\n")
    
    # 5. Install
    success = run_installation(temp_zip, manifest, api_key)
    
    if success:
        print_header("INSTALLATION COMPLETE")
        print(f"Package: {package_names.get(manifest['package_code'])}")
        print(f"Version: {manifest['version']}")
        print("\nExtensions:")
        for ext in manifest["extensions"]:
            print(f"✓ {ext_names.get(ext, ext)}")
        print("\nInstallation completed successfully.")
        print("Press ENTER to FINISH...")
        input()
    else:
        print_header("INSTALLATION FAILED")
        print("The previous installation has been restored.")
        input("Press ENTER to EXIT...")

if __name__ == "__main__":
    main()
