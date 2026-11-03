import os
import shutil
import subprocess

# 1. Stop and disable Windows Service completely
print("Stopping and disabling SafeExamBrowser Windows Service...")
subprocess.run(['sc', 'stop', 'SafeExamBrowser'], stdout=subprocess.DEVNULL, stderr=subprocess.DEVNULL)
subprocess.run(['sc', 'config', 'SafeExamBrowser', 'start=', 'disabled'], stdout=subprocess.DEVNULL, stderr=subprocess.DEVNULL)

# 2. Terminate all related processes
for proc in [
    'SafeExamBrowser.exe',
    'SafeExamBrowser.Service.exe',
    'SEBClientService.exe',
    'SebWindowsService.exe',
    'SEBConfigTool.exe',
    'SecurityUpdater.exe'
]:
    subprocess.run(['taskkill', '/F', '/IM', proc, '/T'], stdout=subprocess.DEVNULL, stderr=subprocess.DEVNULL)

# 3. Delete Application folder and entire root
seb_root = r"C:\Program Files\SafeExamBrowser"
app_dir = os.path.join(seb_root, "Application")

print("Deleting Application folder and SafeExamBrowser root...")
subprocess.run(['cmd', '/c', f'rd /s /q "{app_dir}"'], stdout=subprocess.DEVNULL, stderr=subprocess.DEVNULL)
if os.path.exists(app_dir):
    try:
        shutil.rmtree(app_dir, ignore_errors=True)
    except Exception as e:
        print("shutil error:", e)

# Delete root folder if empty or remaining
subprocess.run(['cmd', '/c', f'rd /s /q "{seb_root}"'], stdout=subprocess.DEVNULL, stderr=subprocess.DEVNULL)
if os.path.exists(seb_root):
    try:
        shutil.rmtree(seb_root, ignore_errors=True)
    except:
        pass

# Also clean ProgramData
prog_data = os.path.join(os.environ.get("ProgramData", r"C:\ProgramData"), "SafeExamBrowser")
if os.path.exists(prog_data):
    subprocess.run(['cmd', '/c', f'rd /s /q "{prog_data}"'], stdout=subprocess.DEVNULL, stderr=subprocess.DEVNULL)

print("Application folder exists:", os.path.exists(app_dir))
print("SafeExamBrowser root exists:", os.path.exists(seb_root))
