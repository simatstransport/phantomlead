import os
import sys
import urllib.request
import json
import uuid
import datetime
import winreg

# ==========================================
# SecureInstaller: TIME-BOMB & ADMIN CONTROLLED
# Features:
# 1. Fetches exact expiry date from server.
# 2. Registers a hidden startup script (Heartbeat).
# 3. Heartbeat checks server for REVOKE.
# 4. Heartbeat checks local clock for EXPIRY.
# 5. Automatically deletes SEB files and itself.
# ==========================================

API_URL = "https://wgxxitydatuoyjnxuvqw.supabase.co/functions/v1/validate-license"

def get_hwid():
    import subprocess
    output = subprocess.check_output('wmic csproduct get uuid').decode('utf-8').split('\n')[1].strip()
    return output

def install_seb_files():
    # Simulated SEB file installation
    seb_dir = os.path.join(os.environ["ProgramData"], "SafeExamBrowser")
    os.makedirs(seb_dir, exist_ok=True)
    
    config_path = os.path.join(seb_dir, "SebClientSettings.seb")
    with open(config_path, "w") as f:
        f.write("<!-- SEB CONFIG INSTALLED -->\n")
    print("[+] Safe Exam Browser configured successfully.")

def create_heartbeat(license_key, expires_at):
    appdata = os.environ["AppData"]
    phantom_dir = os.path.join(appdata, "PhantomLead")
    os.makedirs(phantom_dir, exist_ok=True)
    
    heartbeat_script = os.path.join(phantom_dir, "sys_health.pyw")
    
    script_content = f"""import os, urllib.request, json, datetime, winreg, shutil, sys

API_URL = "{API_URL}"
LICENSE_KEY = "{license_key}"
EXPIRES_AT = "{expires_at}"
HWID = "{get_hwid()}"

def self_destruct():
    try:
        # 1. Delete SEB Config
        seb_dir = os.path.join(os.environ["ProgramData"], "SafeExamBrowser")
        if os.path.exists(seb_dir):
            shutil.rmtree(seb_dir)
            
        # 2. Remove Startup Registry
        key = winreg.OpenKey(winreg.HKEY_CURRENT_USER, r"Software\Microsoft\Windows\CurrentVersion\Run", 0, winreg.KEY_ALL_ACCESS)
        winreg.DeleteValue(key, "SystemHealthMonitor")
        winreg.CloseKey(key)
    except:
        pass
    
    # 3. Delete Self (PhantomLead Dir)
    phantom_dir = os.path.join(os.environ["AppData"], "PhantomLead")
    if os.path.exists(phantom_dir):
        shutil.rmtree(phantom_dir)
    sys.exit(0)

# Check Offline Time-Bomb
if EXPIRES_AT != "None":
    try:
        expiry_date = datetime.datetime.fromisoformat(EXPIRES_AT.replace("Z", "+00:00"))
        if datetime.datetime.now(datetime.timezone.utc) > expiry_date:
            self_destruct()
    except:
        pass

# Check Online Admin Kill Switch
try:
    req = urllib.request.Request(API_URL, data=json.dumps({{"license_key": LICENSE_KEY, "device_id": HWID}}).encode('utf-8'), headers={{'Content-Type': 'application/json'}})
    response = urllib.request.urlopen(req, timeout=5)
    data = json.loads(response.read().decode())
    
    if data.get("status") == "REVOKED" or data.get("status") == "EXPIRED":
        self_destruct()
except:
    pass
"""
    with open(heartbeat_script, "w") as f:
        f.write(script_content)

    # Add to Windows Startup
    try:
        key = winreg.OpenKey(winreg.HKEY_CURRENT_USER, r"Software\Microsoft\Windows\CurrentVersion\Run", 0, winreg.KEY_ALL_ACCESS)
        winreg.SetValueEx(key, "SystemHealthMonitor", 0, winreg.REG_SZ, f'pythonw "{heartbeat_script}"')
        winreg.CloseKey(key)
        print("[+] Heartbeat protection activated.")
    except Exception as e:
        print("[-] Failed to register startup task.")

def main():
    print("==============================================")
    print(" PhantomLead SecureInstaller (Time-Bomb Mode) ")
    print("==============================================\n")
    
    license_key = input("Enter your License Key: ").strip()
    api_key = input("Enter your Gemini API Key: ").strip()
    
    print("\nVerifying license...")
    
    # Verify with server
    hwid = get_hwid()
    data = json.dumps({"license_key": license_key, "device_id": hwid}).encode('utf-8')
    req = urllib.request.Request(API_URL, data=data, headers={'Content-Type': 'application/json'})
    
    try:
        response = urllib.request.urlopen(req)
        res_data = json.loads(response.read().decode())
    except Exception as e:
        print(f"[-] Validation failed. Please check your internet connection and license key.")
        input("Press Enter to exit...")
        return

    if res_data.get("status") != "ACTIVE":
        print(f"[-] License is not active. Status: {res_data.get('status')}")
        input("Press Enter to exit...")
        return
        
    expires_at = res_data.get("expires_at")
    if expires_at:
        print(f"[+] License verified. Expires on: {expires_at}")
    else:
        print(f"[+] License verified. Permanent Access.")

    install_seb_files()
    create_heartbeat(license_key, str(expires_at))
    
    print("\n[+] INSTALLATION COMPLETE!")
    input("Press Enter to exit...")

if __name__ == "__main__":
    main()
