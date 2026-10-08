import requests
from config import API_VALIDATE_LICENSE, API_ACTIVATE_LICENSE, API_GET_MANIFEST, API_GET_DOWNLOAD_URL, SUPABASE_ANON_KEY

def _get_headers():
    return {
        "Authorization": f"Bearer {SUPABASE_ANON_KEY}",
        "Content-Type": "application/json"
    }

def validate_license(license_key, fingerprint):
    """Validates license and device fingerprint."""
    resp = requests.post(
        API_VALIDATE_LICENSE,
        json={"license_key": license_key, "fingerprint": fingerprint},
        headers=_get_headers()
    )
    if not resp.ok:
        raise Exception(f"Validation API Error: {resp.text}")
    return resp.json()

def activate_license(license_key, fingerprint, device_info):
    """Activates the license for this device."""
    resp = requests.post(
        API_ACTIVATE_LICENSE,
        json={"license_key": license_key, "fingerprint": fingerprint, "device_info": device_info},
        headers=_get_headers()
    )
    if not resp.ok:
        raise Exception(f"Activation API Error: {resp.text}")
    return resp.json()

def get_package_manifest(license_key):
    """Gets the authorized manifest based on license."""
    resp = requests.post(
        API_GET_MANIFEST,
        json={"license_key": license_key},
        headers=_get_headers()
    )
    if not resp.ok:
        raise Exception(f"Manifest API Error: {resp.text}")
    return resp.json()

def request_signed_download_url(license_key):
    """Gets short-lived download URL."""
    resp = requests.post(
        API_GET_DOWNLOAD_URL,
        json={"license_key": license_key},
        headers=_get_headers()
    )
    if not resp.ok:
        raise Exception(f"Download URL API Error: {resp.text}")
    return resp.json().get("url")
