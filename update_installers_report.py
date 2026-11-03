import os

def fix(path):
    with open(path, 'r', encoding='utf-8') as f:
        content = f.read()

    new_self_destruct = """def self_destruct(license_key, hwid):
    kill_seb_processes()
    import time
    time.sleep(1)
    try:
        seb_dir = os.path.join(os.environ["ProgramData"], "SafeExamBrowser")
        if os.path.exists(seb_dir):
            shutil.rmtree(seb_dir)
            
        key = winreg.OpenKey(winreg.HKEY_CURRENT_USER, r"Software\\Microsoft\\Windows\\CurrentVersion\\Run", 0, winreg.KEY_ALL_ACCESS)
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
    sys.exit(0)"""

    content = content.replace(
        content[content.find("def self_destruct():"):content.find("def run_heartbeat():")],
        new_self_destruct + "\n\n"
    )

    content = content.replace("self_destruct()", "self_destruct(license_key, hwid)")

    with open(path, 'w', encoding='utf-8') as f:
        f.write(content)

fix('installers/SecureInstaller_TimeBomb.py')
fix('installers/SecureInstaller_AdminControlled.py')
print("Updated installers with REPORT_DELETED")
