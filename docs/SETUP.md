# Setup Guide

## 1. Supabase Initialization
1. Create a new Supabase project.
2. Go to the SQL Editor and run the SQL files in `supabase/migrations/` in filename order. This creates the schema, tables, RLS policies, customer education fields, and Auth-to-customer sync.
3. For an existing project, run any migrations newer than the ones already applied. The latest migration syncs existing Auth users and creates customer rows automatically for future signups.
4. In the Supabase Dashboard, create a new Storage bucket named `packages`. Make sure it is private.

## 2. Edge Functions
Deploy the Edge Functions to Supabase:
```bash
cd supabase
supabase functions deploy validate-license
supabase functions deploy get-package-manifest
# (Deploy other functions similarly)
```

## 3. Authentication Email Delivery
1. In Supabase, open **Authentication → URL Configuration**. Set the Site URL to the deployed web app URL and add that URL and `http://localhost:5173` to the allowed redirect URLs.
2. Open **Authentication → Sign In / Providers → Email** and decide whether email confirmation is required. When enabled, customers must confirm before signing in.
3. Supabase's built-in email sender is restricted and rate-limited for testing. To deliver confirmation emails to customers, configure your email provider under **Authentication → SMTP Settings** and use its sender address, host, port, username, and password. Keep SMTP credentials in Supabase settings; do not commit them to the repository.
4. Existing unconfirmed accounts can be confirmed from **Authentication → Users** by opening the user and choosing **Confirm email**. The app also provides a resend-confirmation action after an unconfirmed sign-in attempt.

## 4. Web Frontend
1. Navigate to the `web/` directory.
2. Copy `.env.example` to `.env` in the `web/` directory and populate your Supabase URL and Anon Key.
3. Run `npm install` and `npm run dev`.

## 5. Package Builder
To create the packages that the customer will download:
1. Navigate to `package-builder/`.
2. Ensure your source files are at the path specified in `build_packages.py` (e.g. `C:\Users\Admin\Desktop\See`).
3. Run `python build_packages.py`.
4. Upload the resulting zip files from `dist_packages/` to your Supabase `packages` storage bucket.
5. Update the `sha256` column in the `packages` table with the hashes printed out by the script.

## 6. Building the Installer
To build the `.exe` for distribution to customers:
1. Navigate to `installer/`.
2. Run `pip install -r requirements.txt`.
3. Update `installer/config.py` with your Supabase URL and keys.
4. Run `pyinstaller build.spec`.
5. The `SecureInstaller.exe` will be found in the `dist/` folder.
