from backup_manager import restore_backup
import os

def rollback_installation(backup_dir):
    """Rolls back the installation if it fails."""
    print("Initiating rollback...")
    if backup_dir and os.path.exists(backup_dir):
        restore_backup(backup_dir)
        print("Rollback completed successfully.")
    else:
        print("No valid backup found to rollback.")
