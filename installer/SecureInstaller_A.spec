# -*- mode: python ; coding: utf-8 -*-


a = Analysis(
    ['C:/Users/Admin/Documents/phantomlead/secure-license-platform/installer/entry_admin_ctrl.py'],
    pathex=[],
    binaries=[],
    datas=[],
    hiddenimports=['wmi', 'requests', 'colorama', 'hashlib', 'winreg', 'tkinter', 'win32file', 'win32con', 'win32clipboard', 'win32gui', 'win32process'],
    hookspath=[],
    hooksconfig={},
    runtime_hooks=[],
    excludes=[],
    noarchive=False,
    optimize=0,
)
pyz = PYZ(a.pure)

exe = EXE(
    pyz,
    a.scripts,
    a.binaries,
    a.datas,
    [],
    name='SecureInstaller_A',
    debug=False,
    bootloader_ignore_signals=False,
    strip=False,
    upx=True,
    upx_exclude=[],
    runtime_tmpdir=None,
    console=False,
    disable_windowed_traceback=False,
    argv_emulation=False,
    target_arch=None,
    codesign_identity=None,
    entitlements_file=None,
)
