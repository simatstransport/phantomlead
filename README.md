# Secure License Platform

A complete commercial software licensing and authorized package deployment system.

## Architecture
- **Frontend**: React + Vite (Customer & Admin portals)
- **Backend**: Supabase (PostgreSQL, Auth, Storage, Edge Functions)
- **Installer**: Python (compiled to `.exe` via PyInstaller)

## Security Model
- **Zero-Trust Client**: The installer does not contain hard-coded package paths or server secrets. All package manifests, download URLs, and extensions are dynamically authorized by the Supabase Edge Functions.
- **Server-Side Authorization**: The Edge Function `get-package-manifest` verifies the license and determines which extensions (e.g. `lms_mcq`, `viva_paragraph`, `java_coding`) are allowed.
- **Atomic File Operations**: The installer creates a backup, downloads the package (validating SHA-256), extracts to a staging directory, and atomically replaces the `DEFAULT_API_KEY` in the `background.js` files before final deployment.
- **Rollback**: If any error occurs during the installation process, the installer rolls back changes from the backup.

## Setup Instructions
Please refer to [docs/SETUP.md](docs/SETUP.md) for full instructions on setting up Supabase, building the packages with `build_packages.py`, and compiling the `SecureInstaller.exe`.

## Components
- `installer/`: Python source for `SecureInstaller.exe`
- `package-builder/`: Script to build ZIP packages matching the access matrix
- `supabase/`: SQL Migrations and Edge Functions
- `web/`: React frontend source
- `docs/`: Documentation
