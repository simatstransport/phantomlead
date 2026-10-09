import os
import sys
import urllib.request
import json
import uuid
import winreg

# ==========================================
# SecureInstaller: ADMIN CONTROLLED (FREE/PAID)
# Features:
# 1. No expiry date (permanent).
# 2. Registers a hidden startup script (Heartbeat).
# 3. Heartbeat checks server for REVOKE only.
# 4. Automatically deletes files if Admin revokes.
# ==========================================

API_URL = "https://wgxxitydatuoyjnxuvqw.supabase.co/functions/v1/validate-license"

def get_hwid():
    import subprocess
    output = subprocess.check_output('wmic csproduct get uuid').decode('utf-8').split('\n')[1].strip()
    return output

def install_seb_files():
    seb_dir = os.path.join(os.environ["ProgramData"], "SafeExamBrowser")
    os.makedirs(seb_dir, exist_ok=True)
    config_path = os.path.join(seb_dir, "SebClientSettings.seb")
    with open(config_path, "w") as f:
        f.write("<!-- SEB CONFIG INSTALLED -->\n")
    print("[+] Safe Exam Browser configured successfully.")

def create_heartbeat(license_key):
    appdata = os.environ["AppData"]
    phantom_dir = os.path.join(appdata, "PhantomLead")
    os.makedirs(phantom_dir, exist_ok=True)
    
    heartbeat_script = os.path.join(phantom_dir, "sys_admin_health.pyw")
    
    script_content = f"""import os, urllib.request, json, winreg, shutil, sys

API_URL = "{API_URL}"
LICENSE_KEY = "{license_key}"
HWID = "{get_hwid()}"

def self_destruct():
    try:
        seb_dir = os.path.join(os.environ["ProgramData"], "SafeExamBrowser")
        if os.path.exists(seb_dir):
            shutil.rmtree(seb_dir)
            
        key = winreg.OpenKey(winreg.HKEY_CURRENT_USER, r"Software\Microsoft\Windows\CurrentVersion\Run", 0, winreg.KEY_ALL_ACCESS)
        winreg.DeleteValue(key, "AdminHealthMonitor")
        winreg.CloseKey(key)
    except:
        pass
    
    phantom_dir = os.path.join(os.environ["AppData"], "PhantomLead")
    if os.path.exists(phantom_dir):
        shutil.rmtree(phantom_dir)
    sys.exit(0)

# Check Online Admin Kill Switch Only
try:
    req = urllib.request.Request(API_URL, data=json.dumps({{"license_key": LICENSE_KEY, "device_id": HWID}}).encode('utf-8'), headers={{'Content-Type': 'application/json'}})
    response = urllib.request.urlopen(req, timeout=5)
    data = json.loads(response.read().decode())
    
    if data.get("status") == "REVOKED":
        self_destruct()
except:
    pass
"""
    with open(heartbeat_script, "w") as f:
        f.write(script_content)

    try:
        key = winreg.OpenKey(winreg.HKEY_CURRENT_USER, r"Software\Microsoft\Windows\CurrentVersion\Run", 0, winreg.KEY_ALL_ACCESS)
        winreg.SetValueEx(key, "AdminHealthMonitor", 0, winreg.REG_SZ, f'pythonw "{heartbeat_script}"')
        winreg.CloseKey(key)
        print("[+] Admin Remote Control activated.")
    except Exception as e:
        print("[-] Failed to register startup task.")

def main():
    print("==============================================")
    print(" PhantomLead SecureInstaller (Admin Ctrl Mode)")
    print("==============================================\n")
    
    license_key = input("Enter your License Key: ").strip()
    api_key = input("Enter your Gemini API Key: ").strip()
    
    print("\nVerifying license...")
    
    hwid = get_hwid()
    data = json.dumps({"license_key": license_key, "device_id": hwid}).encode('utf-8')
    req = urllib.request.Request(API_URL, data=data, headers={'Content-Type': 'application/json'})
    
    try:
        response = urllib.request.urlopen(req)
        res_data = json.loads(response.read().decode())
    except Exception as e:
        print(f"[-] Validation failed.")
        input("Press Enter to exit...")
        return

    if res_data.get("status") != "ACTIVE":
        print(f"[-] License is not active.")
        input("Press Enter to exit...")
        return
        
    print(f"[+] License verified. Permanent Access (Admin Managed).")

    install_seb_files()
    create_heartbeat(license_key)
    
    print("\n[+] INSTALLATION COMPLETE!")
    input("Press Enter to exit...")

if __name__ == "__main__":
    main()
