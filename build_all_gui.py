import subprocess
import os
import shutil

TARGETS = [
    ("entry_timebomb.py", "SecureInstaller_T"),
    ("entry_admin_ctrl.py", "SecureInstaller_A"),
    ("entry_lifetime.py", "SecureInstaller_L"),
]

VENV_PYINSTALLER = os.path.abspath("installer/.venv/Scripts/pyinstaller.exe")
INSTALLER_DIR = os.path.abspath("installer")
ROOT_DIST = os.path.abspath("dist")

os.makedirs(ROOT_DIST, exist_ok=True)

for script, exe_name in TARGETS:
    print(f"\n==========================================")
    print(f"Building {exe_name}.exe from {script}...")
    print(f"==========================================")
    
    cmd = [
        VENV_PYINSTALLER,
        "--onefile",
        "--windowed",
        "--uac-admin",
        "--name", exe_name,
        "--hidden-import", "wmi",
        "--hidden-import", "requests",
        "--hidden-import", "colorama",
        "--hidden-import", "hashlib",
        "--hidden-import", "winreg",
        "--hidden-import", "tkinter",
        "--distpath", ROOT_DIST,
        "--workpath", os.path.join(INSTALLER_DIR, "build"),
        "--specpath", INSTALLER_DIR,
        os.path.join(INSTALLER_DIR, script),
        "-y"
    ]
    
    result = subprocess.run(cmd, cwd=INSTALLER_DIR)
    if result.returncode != 0:
        print(f"Failed to build {exe_name}!")
        exit(1)
    else:
        print(f"Successfully built {exe_name}.exe in {ROOT_DIST}")

print("\nAll 3 GUI installers built successfully!")
