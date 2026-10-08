import os
import sys
import ctypes
import builtins
import threading
import tkinter as tk
from tkinter import messagebox, scrolledtext

from device import get_device_fingerprint, get_device_info
from license_client import validate_license, activate_license, get_package_manifest, request_signed_download_url
from downloader import download_package
from integrity import verify_sha256
from installer_engine import run_installation

def is_admin():
    try:
        return ctypes.windll.shell32.IsUserAnAdmin()
    except:
        return False

class InstallerApp(tk.Tk):
    def __init__(self):
        super().__init__()
        self.title("Secure License Platform")
        self.geometry("650x500")
        self.configure(padx=20, pady=20)
        
        # Monkey-patch print to our log window
        self._original_print = builtins.print
        builtins.print = self.custom_print

        if not is_admin():
            messagebox.showerror("Permission Error", "Please right-click and run this installer as Administrator.")
            self.destroy()
            sys.exit(1)

        # --- UI Elements ---
        tk.Label(self, text="Secure Software Installer", font=("Segoe UI", 18, "bold")).pack(pady=10)

        frame_inputs = tk.Frame(self)
        frame_inputs.pack(fill=tk.X, pady=10)

        tk.Label(frame_inputs, text="License Key:", font=("Segoe UI", 10)).grid(row=0, column=0, sticky="w", pady=5)
        self.license_entry = tk.Entry(frame_inputs, width=50, font=("Consolas", 10))
        self.license_entry.grid(row=0, column=1, padx=10, pady=5)

        tk.Label(frame_inputs, text="Gemini API Key:", font=("Segoe UI", 10)).grid(row=1, column=0, sticky="w", pady=5)
        self.api_entry = tk.Entry(frame_inputs, width=50, show="*", font=("Consolas", 10))
        self.api_entry.grid(row=1, column=1, padx=10, pady=5)

        self.install_btn = tk.Button(self, text="START INSTALLATION", bg="#2563eb", fg="white", font=("Segoe UI", 12, "bold"), command=self.start_installation)
        self.install_btn.pack(pady=10)

        self.log_area = scrolledtext.ScrolledText(self, width=80, height=15, state='disabled', bg="#1e1e1e", fg="#00ff00", font=("Consolas", 9))
        self.log_area.pack(pady=10, fill=tk.BOTH, expand=True)

        self.custom_print("Welcome! Please enter your License Key and API Key, then click Start.")

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
            messagebox.showwarning("Missing Information", "Please enter both License Key and Gemini API Key.")
            return

        self.install_btn.config(state=tk.DISABLED)
        self.log_area.configure(state='normal')
        self.log_area.delete(1.0, tk.END)
        self.log_area.configure(state='disabled')

        threading.Thread(target=self.run_install_process, args=(license_key, api_key), daemon=True).start()

    def run_install_process(self, license_key, api_key):
        try:
            print(">>> Generating Device Fingerprint...")
            fingerprint = get_device_fingerprint()

            print(">>> Validating License Key with Server...")
            validation_res = validate_license(license_key, fingerprint)
            if not validation_res.get("valid"):
                raise Exception(validation_res.get("error", "License validation failed or is invalid."))

            print(">>> Activating Device...")
            device_info = get_device_info()
            activate_res = activate_license(license_key, fingerprint, device_info)
            if not activate_res.get("activated"):
                raise Exception(activate_res.get("error", "Device activation failed."))

            print(">>> Fetching Authorized Package Manifest...")
            manifest = get_package_manifest(license_key)
            print(f"    Authorized Package: {manifest['package_code']}")
            print(f"    Authorized Extensions: {', '.join(manifest['extensions'])}")

            print(">>> Requesting Secure Download URL...")
            download_url = request_signed_download_url(license_key)
            
            temp_zip = os.path.join(os.environ.get("TEMP", "C:\\Temp"), f"{manifest['package_code']}.zip")
            
            print(">>> Downloading Package (this may take a few minutes)...")
            download_package(download_url, temp_zip)
            
            print(">>> Verifying SHA-256 Integrity...")
            if not verify_sha256(temp_zip, manifest["sha256"]):
                raise Exception("Package integrity check failed! SHA-256 mismatch. Download may be corrupted.")
            
            print(">>> Extracting and Deploying...")
            success = run_installation(temp_zip, manifest, api_key)
            
            if success:
                print("\n==========================================")
                print("✅ INSTALLATION COMPLETED SUCCESSFULLY!")
                print("==========================================")
                messagebox.showinfo("Success", "Installation completed successfully!")
            else:
                raise Exception("Internal deployment failed. Safe rollback was applied.")
                
        except Exception as e:
            print(f"\n❌ ERROR: {str(e)}")
            messagebox.showerror("Installation Error", f"An error occurred during installation:\n\n{str(e)}")
        finally:
            self.install_btn.config(state=tk.NORMAL)

if __name__ == "__main__":
    app = InstallerApp()
    app.mainloop()
