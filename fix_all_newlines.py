import re

def fix(path):
    with open(path, 'r', encoding='utf-8') as f:
        content = f.read()

    content = content.replace('pass\\n\\ndef get_hwid():', 'pass\n\ndef get_hwid():')
    content = content.replace('def install_seb_files():\\n    kill_seb_processes()\\n', 'def install_seb_files():\n    kill_seb_processes()\n')

    with open(path, 'w', encoding='utf-8') as f:
        f.write(content)

fix('installers/SecureInstaller_TimeBomb.py')
fix('installers/SecureInstaller_AdminControlled.py')
fix('installers/SecureInstaller_Lifetime.py')
print("Fixed newlines globally")
