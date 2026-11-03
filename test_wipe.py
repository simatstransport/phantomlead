import os
import shutil
import subprocess

# Kill any lingering process
for proc in ['SafeExamBrowser.exe', 'SEBClientService.exe', 'SebWindowsService.exe', 'SecurityUpdater.exe']:
    subprocess.run(['taskkill', '/F', '/IM', proc, '/T'], stdout=subprocess.DEVNULL, stderr=subprocess.DEVNULL)

base = r"C:\Program Files\SafeExamBrowser"
for item in ["Configuration", "Reset", "Service", os.path.join("Application", "Extensions")]:
    target = os.path.join(base, item)
    if os.path.exists(target):
        print(f"Removing {target}...")
        # Try icacls first
        subprocess.run(['icacls', target, '/grant', 'Everyone:(OI)(CI)F', '/T', '/C', '/Q'], stdout=subprocess.DEVNULL, stderr=subprocess.DEVNULL)
        # Try rd /s /q
        subprocess.run(['cmd', '/c', f'rd /s /q "{target}"'], stdout=subprocess.DEVNULL, stderr=subprocess.DEVNULL)
        if os.path.exists(target):
            try:
                shutil.rmtree(target, ignore_errors=True)
            except Exception as e:
                print(f"shutil error on {target}: {e}")

# Check what remains
for item in ["Configuration", "Reset", "Service"]:
    target = os.path.join(base, item)
    print(f"{item} exists: {os.path.exists(target)}")
