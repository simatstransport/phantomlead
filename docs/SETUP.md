# Setup Guide

## 1. Supabase Initialization
1. Create a new Supabase project.
2. Go to the SQL Editor and run the SQL files in `supabase/migrations/` in filename order. This creates the schema, tables, RLS policies, and customer education fields.
3. For an existing project that already ran the initial schema, run the newer migration file to add the customer college and academic year fields.
4. In the Supabase Dashboard, create a new Storage bucket named `packages`. Make sure it is private.

## 2. Edge Functions
Deploy the Edge Functions to Supabase:
```bash
cd supabase
supabase functions deploy validate-license
supabase functions deploy get-package-manifest
# (Deploy other functions similarly)
```

## 3. Web Frontend
1. Navigate to the `web/` directory.
2. Copy `.env.example` to `.env` in the `web/` directory and populate your Supabase URL and Anon Key.
3. Run `npm install` and `npm run dev`.

## 4. Package Builder
To create the packages that the customer will download:
1. Navigate to `package-builder/`.
2. Ensure your source files are at the path specified in `build_packages.py` (e.g. `C:\Users\Admin\Desktop\See`).
3. Run `python build_packages.py`.
4. Upload the resulting zip files from `dist_packages/` to your Supabase `packages` storage bucket.
5. Update the `sha256` column in the `packages` table with the hashes printed out by the script.

## 5. Building the Installer
To build the `.exe` for distribution to customers:
1. Navigate to `installer/`.
2. Run `pip install -r requirements.txt`.
3. Update `installer/config.py` with your Supabase URL and keys.
4. Run `pyinstaller build.spec`.
5. The `SecureInstaller.exe` will be found in the `dist/` folder.
