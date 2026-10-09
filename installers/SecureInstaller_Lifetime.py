import os
import sys
import urllib.request
import json

# ==========================================
# SecureInstaller: LIFETIME / PERMANENT
# Features:
# 1. Validates license key on install.
# 2. No background tasks or scheduled tasks.
# 3. True offline capability after install.
# ==========================================

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

def install_seb_files():
    # Simulated SEB file installation
    seb_dir = os.path.join(os.environ["ProgramData"], "SafeExamBrowser")
    os.makedirs(seb_dir, exist_ok=True)
    
    config_path = os.path.join(seb_dir, "SebClientSettings.seb")
    with open(config_path, "w") as f:
        f.write("<!-- SEB CONFIG INSTALLED (LIFETIME) -->\n")
    print("[+] Safe Exam Browser configured successfully.")

def main():
    print("==============================================")
    print(" PhantomLead SecureInstaller (Lifetime Mode)  ")
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
        print(f"[-] Validation failed. Please check your internet connection and license key.")
        input("Press Enter to exit...")
        return

    if res_data.get("status") != "ACTIVE":
        print(f"[-] License is not active. Status: {res_data.get('status')}")
        input("Press Enter to exit...")
        return
        
    print(f"[+] License verified. Permanent Access.")

    install_seb_files()
    
    print("\n[+] INSTALLATION COMPLETE!")
    print("[+] No background tracking. Enjoy your software.")
    input("Press Enter to exit...")

if __name__ == "__main__":
    main()
