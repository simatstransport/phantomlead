import re

def fix(path):
    with open(path, 'r', encoding='utf-8') as f:
        content = f.read()

    # Fix the literal \n
    content = content.replace('def self_destruct():\\n    kill_seb_processes()\\n    import time\\n    time.sleep(1)', 'def self_destruct():\n    kill_seb_processes()\n    import time\n    time.sleep(1)')

    with open(path, 'w', encoding='utf-8') as f:
        f.write(content)

fix('installers/SecureInstaller_TimeBomb.py')
fix('installers/SecureInstaller_AdminControlled.py')
print("Fixed!")
