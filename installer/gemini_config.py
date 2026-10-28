import os
import re
import tempfile
import shutil
import requests

def validate_gemini_api_key(api_key):
    """
    Validates a Google Gemini API key by testing it against the Generative Language API.
    Returns: (is_valid: bool, reason_message: str, clean_key: str)
    """
    if not api_key:
        return False, "Gemini API Key is empty. Please enter your Google Gemini API key.", ""

    clean_key = str(api_key).strip().strip('"').strip("'").strip()

    if not clean_key:
        return False, "Gemini API Key cannot be blank or only whitespace.", ""

    if clean_key.startswith("sk-"):
        return False, (
            "Detected an OpenAI API key (starts with 'sk-').\n"
            "This application specifically requires a Google Gemini API Key.\n\n"
            "How to get a free Google Gemini key:\n"
            "1. Visit: https://aistudio.google.com/app/apikey\n"
            "2. Sign in with your Google account.\n"
            "3. Click 'Create API key' -> 'Create API key in new project'.\n"
            "4. Copy and paste the key here."
        ), clean_key

    if len(clean_key) < 20:
        return False, (
            f"API Key appears too short ({len(clean_key)} characters).\n"
            "A standard Google Gemini API key is 39+ characters long.\n"
            "Please check that you copied the complete key without missing characters."
        ), clean_key

    test_url = f"https://generativelanguage.googleapis.com/v1beta/models?key={clean_key}"
    try:
        resp = requests.get(test_url, timeout=9, headers={"User-Agent": "SecureInstaller/2.1"})
        if resp.status_code == 200:
            return True, "API Key is valid and active on Google Gemini.", clean_key

        # If not 200, parse Google's exact error response
        try:
            err_json = resp.json()
            err_obj = err_json.get("error", {})
            google_msg = err_obj.get("message", f"HTTP {resp.status_code}")
            details = err_obj.get("details", [])
            reason_code = ""
            if details and isinstance(details, list) and len(details) > 0:
                reason_code = details[0].get("reason", "")
        except Exception:
            google_msg = resp.text[:200]
            reason_code = ""

        reasons = []
        if resp.status_code in (400, 401):
            reasons.append(f"Google Response: {google_msg}")
            if reason_code:
                reasons.append(f"Error Reason: {reason_code}")
            reasons.append("\nWhy this key was rejected by Google:")
            reasons.append("1. Created in Google Cloud Console without enabling 'Generative Language API'.")
            reasons.append("2. Key has restrictions enabled (IP, website/referrer, or app restrictions).")
            reasons.append("3. Key was deleted, revoked, or copied incorrectly.")
            reasons.append("\nHOW TO GET A WORKING KEY:")
            reasons.append("1. Go to: https://aistudio.google.com/app/apikey")
            reasons.append("2. Click 'Create API key' -> 'Create API key in new project'.")
            reasons.append("3. Do not set any restrictions (keep restrictions set to 'None').")
            reasons.append("4. Copy and paste the new key into the installer.")
        elif resp.status_code == 403:
            reasons.append(f"Google Permission/Quota Error (403): {google_msg}")
            reasons.append("Your Google account or project does not have permission to access Gemini or quota was exceeded.")
            reasons.append("Fix: Create a fresh key using a different Google account at https://aistudio.google.com/app/apikey")
        elif resp.status_code == 429:
            reasons.append(f"Google Rate Limit Exceeded (429): {google_msg}")
            reasons.append("Gemini free tier quota exceeded on this key. Please use a fresh key from https://aistudio.google.com/app/apikey")
        else:
            reasons.append(f"Google API returned HTTP {resp.status_code}: {google_msg}")

        return False, "\n".join(reasons), clean_key

    except requests.exceptions.Timeout:
        return False, "Connection to Google Gemini API timed out (9s). Please check your internet connection.", clean_key
    except requests.exceptions.ConnectionError:
        return False, "Failed to connect to generativelanguage.googleapis.com. Check your network, firewall, or DNS.", clean_key
    except Exception as e:
        return False, f"Unexpected error while validating Gemini API key: {str(e)}", clean_key

def configure_gemini_keys(target_dir, extensions, api_key):
    """Configures the Gemini API key in authorized background.js files."""
    clean_key = str(api_key).strip().strip('"').strip("'").strip()
    for ext in extensions:
        bg_js_path = os.path.join(target_dir, "Application", "Extensions", ext, "background.js")
        if os.path.exists(bg_js_path):
            success = _replace_api_key(bg_js_path, clean_key)
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
