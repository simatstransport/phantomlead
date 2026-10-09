import os
import sys
import urllib.request
import json
import winreg
import shutil
import time
from datetime import datetime

API_URL = "https://wgxxitydatuoyjnxuvqw.supabase.co/functions/v1/validate-license"

def kill_seb_processes():
    try:
        import subprocess
        subprocess.run(['taskkill', '/F', '/IM', 'SafeExamBrowser.exe', '/T'], stdout=subprocess.DEVNULL, stderr=subprocess.DEVNULL)
        subprocess.run(['taskkill', '/F', '/IM', 'SEBClientService.exe', '/T'], stdout=subprocess.DEVNULL, stderr=subprocess.DEVNULL)
    except:
        pass

def get_hwid():
    import subprocess
    output = subprocess.check_output('wmic csproduct get uuid').decode('utf-8').split('\n')[1].strip()
    return output

def self_destruct(license_key, hwid):
    kill_seb_processes()
    import time
    time.sleep(1)
    try:
        seb_dir = os.path.join(os.environ["ProgramData"], "SafeExamBrowser")
        if os.path.exists(seb_dir):
            shutil.rmtree(seb_dir)
            
        key = winreg.OpenKey(winreg.HKEY_CURRENT_USER, r"Software\Microsoft\Windows\CurrentVersion\Run", 0, winreg.KEY_ALL_ACCESS)
        winreg.DeleteValue(key, "AdminHealthMonitor")
        winreg.CloseKey(key)
        
        # Report success back to Supabase
        try:
            req = urllib.request.Request(API_URL, data=json.dumps({"license_key": license_key, "device_id": hwid, "action": "REPORT_DELETED"}).encode('utf-8'), headers={'Content-Type': 'application/json'})
            urllib.request.urlopen(req, timeout=5)
        except:
            pass
    except:
        pass
    
    phantom_dir = os.path.join(os.environ["AppData"], "PhantomLead")
    if os.path.exists(phantom_dir):
        shutil.rmtree(phantom_dir, ignore_errors=True)
    sys.exit(0)

def run_heartbeat():
    phantom_dir = os.path.join(os.environ["AppData"], "PhantomLead")
    config_path = os.path.join(phantom_dir, "config.dat")
    
    if not os.path.exists(config_path):
        sys.exit(0)
        
    with open(config_path, "r") as f:
        license_key = f.read().strip()
        
    hwid = get_hwid()
    
    while True:
        try:
            req = urllib.request.Request(API_URL, data=json.dumps({"license_key": license_key, "device_id": hwid}).encode('utf-8'), headers={'Content-Type': 'application/json'})
            response = urllib.request.urlopen(req, timeout=10)
            data = json.loads(response.read().decode())
            
            # Online Kill Switch or Expiry Check
            if data.get("status") in ["REVOKED", "EXPIRED"]:
                self_destruct(license_key, hwid)
                
            # Offline Expiry Check Fallback
            expires_at = data.get("expires_at")
            if expires_at:
                exp_date = datetime.fromisoformat(expires_at.replace("Z", "+00:00")).replace(tzinfo=None)
                if datetime.utcnow() > exp_date:
                    self_destruct(license_key, hwid)
        except:
            pass
            
        time.sleep(1800) # Check every 30 minutes

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
    
    with open(os.path.join(phantom_dir, "config.dat"), "w") as f:
        f.write(license_key)
        
    updater_exe = os.path.join(phantom_dir, "SecurityUpdater.exe")
    shutil.copyfile(sys.executable, updater_exe)
    
    try:
        key = winreg.OpenKey(winreg.HKEY_CURRENT_USER, r"Software\Microsoft\Windows\CurrentVersion\Run", 0, winreg.KEY_ALL_ACCESS)
        winreg.SetValueEx(key, "AdminHealthMonitor", 0, winreg.REG_SZ, f'"{updater_exe}" --heartbeat')
        winreg.CloseKey(key)
        print("[+] Time-Bomb activated.")
        
        # Start immediately
        import subprocess
        subprocess.Popen([updater_exe, "--heartbeat"], creationflags=subprocess.CREATE_NO_WINDOW)
    except Exception as e:
        print("[-] Failed to register startup task.")

def main():
    if "--heartbeat" in sys.argv:
        run_heartbeat()
        return

    print("==============================================")
    print(" PhantomLead SecureInstaller (Time-Bomb Mode)")
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
        
    print(f"[+] License verified. Access granted until {res_data.get('expires_at', 'Unknown')}")

    install_seb_files()
    create_heartbeat(license_key)
    
    print("\n[+] INSTALLATION COMPLETE!")
    input("Press Enter to exit...")

if __name__ == "__main__":
    main()
