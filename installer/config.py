import os

# Configuration defaults
APPLICATION_ROOT = r"C:\Program Files\SafeExamBrowser"
SUPABASE_URL = "https://wgxxitydatuoyjnxuvqw.supabase.co"
SUPABASE_ANON_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6IndneHhpdHlkYXR1b3lqbnh1dnF3Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3OTE0Mzc0NDEsImV4cCI6MjEwNzAxMzQ0MX0.fGbnNvfFNOpbVUb1KzaxUF_2PBarovyX3pU58HVEoA0"

# Expected structure
CORE_FOLDERS = ["Configuration", "Reset", "Service", "Application"]
EXTENSIONS_DIR = os.path.join("Application", "Extensions")

# API Endpoints
API_VALIDATE_LICENSE = f"{SUPABASE_URL}/functions/v1/validate-license"
API_ACTIVATE_LICENSE = f"{SUPABASE_URL}/functions/v1/activate-license"
API_GET_MANIFEST = f"{SUPABASE_URL}/functions/v1/get-package-manifest"
API_GET_DOWNLOAD_URL = f"{SUPABASE_URL}/functions/v1/create-download-url"
API_LOG_INSTALLATION = f"{SUPABASE_URL}/rest/v1/installation_logs"

# Paths
STAGING_DIR = os.path.join(os.environ.get("TEMP", "C:\\Temp"), "SecureInstaller_Staging")
BACKUP_DIR = os.path.join(os.environ.get("TEMP", "C:\\Temp"), "SecureInstaller_Backup")
