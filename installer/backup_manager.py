import os
import shutil
import datetime
from config import APPLICATION_ROOT, BACKUP_DIR, CORE_FOLDERS

def create_backup():
    """Creates a backup of the existing SafeExamBrowser installation."""
    timestamp = datetime.datetime.now().strftime("%Y%m%d_%H%M%S")
    current_backup_dir = os.path.join(BACKUP_DIR, timestamp)
    
    os.makedirs(current_backup_dir, exist_ok=True)
    
    for folder in CORE_FOLDERS:
        src = os.path.join(APPLICATION_ROOT, folder)
        dst = os.path.join(current_backup_dir, folder)
        if os.path.exists(src):
            shutil.copytree(src, dst)
            
    return current_backup_dir

def restore_backup(backup_dir):
    """Restores the backup to the original location."""
    for folder in CORE_FOLDERS:
        src = os.path.join(backup_dir, folder)
        dst = os.path.join(APPLICATION_ROOT, folder)
        
        if os.path.exists(dst):
            shutil.rmtree(dst)
            
        if os.path.exists(src):
            shutil.copytree(src, dst)
