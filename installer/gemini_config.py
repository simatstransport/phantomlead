import os
import re
import tempfile
import shutil

def configure_gemini_keys(target_dir, extensions, api_key):
    """Configures the Gemini API key in authorized background.js files."""
    for ext in extensions:
        bg_js_path = os.path.join(target_dir, "Application", "Extensions", ext, "background.js")
        if os.path.exists(bg_js_path):
            success = _replace_api_key(bg_js_path, api_key)
            if not success:
                raise Exception(f"Failed to safely configure API key in {ext}/background.js")

def _replace_api_key(file_path, new_key):
    """Safely replaces DEFAULT_API_KEY using atomic replacement."""
    # 1. Read file
    with open(file_path, "r", encoding="utf-8") as f:
        content = f.read()

    # 2. Find and replace declaration safely
    pattern = r'(const\s+DEFAULT_API_KEY\s*=\s*["\']).*?(["\']\s*;)'
    
    if not re.search(pattern, content):
        return False # Pattern not found

    new_content = re.sub(pattern, rf'\g<1>{new_key}\g<2>', content)

    # 3. Write to temp file
    fd, temp_path = tempfile.mkstemp(text=True)
    with os.fdopen(fd, 'w', encoding='utf-8') as f:
        f.write(new_content)

    # 4. Atomic replace
    shutil.copy2(file_path, file_path + ".bak") # create local backup just in case
    os.replace(temp_path, file_path)
    os.remove(file_path + ".bak")
    
    return True
