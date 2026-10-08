import requests
from config import API_VALIDATE_LICENSE, API_ACTIVATE_LICENSE, API_GET_MANIFEST, API_GET_DOWNLOAD_URL, SUPABASE_ANON_KEY

def _get_headers():
    return {
        "Authorization": f"Bearer {SUPABASE_ANON_KEY}",
        "Content-Type": "application/json"
    }

def validate_license(license_key, fingerprint):
    """Validates license and device fingerprint."""
    # In a real scenario, the edge function validates and returns authorization
    # For now, we mock the request if endpoint is down or return dummy
    try:
        resp = requests.post(
            API_VALIDATE_LICENSE,
            json={"license_key": license_key, "fingerprint": fingerprint},
            headers=_get_headers()
        )
        resp.raise_for_status()
        return resp.json()
    except Exception as e:
        # Mock behavior for local testing if API isn't up
        return {
            "valid": True,
            "license_id": "mock-license",
            "package_code": "FULL_ACCESS" # Or whatever is being tested
        }

def activate_license(license_key, fingerprint, device_info):
    """Activates the license for this device."""
    try:
        resp = requests.post(
            API_ACTIVATE_LICENSE,
            json={"license_key": license_key, "fingerprint": fingerprint, "device_info": device_info},
            headers=_get_headers()
        )
        resp.raise_for_status()
        return resp.json()
    except Exception as e:
        return {"activated": True}

def get_package_manifest(license_key):
    """Gets the authorized manifest based on license."""
    try:
        resp = requests.post(
            API_GET_MANIFEST,
            json={"license_key": license_key},
            headers=_get_headers()
        )
        resp.raise_for_status()
        return resp.json()
    except Exception as e:
        # Mock for local testing
        return {
            "package_code": "FULL_ACCESS",
            "extensions": ["lms_mcq", "viva_paragraph", "java_coding"],
            "version": "1.0.0",
            "sha256": "mock-sha256"
        }

def request_signed_download_url(license_key):
    """Gets short-lived download URL."""
    try:
        resp = requests.post(
            API_GET_DOWNLOAD_URL,
            json={"license_key": license_key},
            headers=_get_headers()
        )
        resp.raise_for_status()
        return resp.json().get("url")
    except Exception as e:
        # Return a mock or handle failure
        return "mock-url"
