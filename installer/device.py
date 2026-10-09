import hashlib
import platform
import subprocess

def get_device_fingerprint():
    """Generates a hardware-based fingerprint for the current Windows device."""
    try:
        import pythoncom
        pythoncom.CoInitialize()
        import wmi
        c = wmi.WMI()
        system_info = c.Win32_ComputerSystemProduct()[0]
        cpu_info = c.Win32_Processor()[0]
        disk_info = c.Win32_DiskDrive()[0]

        hw_string = f"{system_info.UUID}-{cpu_info.ProcessorId}-{disk_info.SerialNumber}"
        return hashlib.sha256(hw_string.encode()).hexdigest()
    except Exception as e:
        # Fallback if WMI fails
        fallback_str = f"{platform.node()}-{platform.machine()}-{platform.processor()}"
        return hashlib.sha256(fallback_str.encode()).hexdigest()

def get_device_info():
    """Gets human-readable device info."""
    return {
        "hostname": platform.node(),
        "os_info": f"{platform.system()} {platform.release()} {platform.version()}"
    }
