# AriQ Digital ERP - Admin and Database Setup

## Authentication model
- There are **no demo usernames or demo passwords** in the application.
- The initial ERP administrator is an existing user in **Supabase Authentication > Users**.
- Every later user is created by that Admin account through **User Management**. Their Auth account and ERP profile are created together.
- Passwords are managed by Supabase Auth; the ERP database does not store password hashes.
- Do not expose `SUPABASE_SERVICE_ROLE_KEY` in browser code or client-visible settings.

## Vercel database settings
Set these environment variables in the Vercel project:

- `SUPABASE_URL`
- `SUPABASE_ANON_KEY`
- `SUPABASE_SERVICE_ROLE_KEY`
- `RESEND_API_KEY` (optional until email is configured)
- `FROM_EMAIL` (optional until email is configured)
- `ENABLE_2FA=false` while email 2FA is unavailable

The browser receives only the public Supabase URL and anon key through `/api/config`. The service-role key stays server-side.

## Initial Admin account
1. Open Supabase → Authentication → Users.
2. Create or use the administrator's existing Auth account.
3. Open `database_migration_v11_admin_auth_only.sql`.
4. Replace `YOUR_ADMIN_EMAIL` with the exact admin email.
5. Run the SQL in Supabase SQL Editor.
6. Log into AriQ Digital ERP using that Supabase account.
7. Create all other ERP users from **User Management**.

## Prevent public account creation
In Supabase Authentication settings, disable public user sign-up / anonymous account creation. Users should be provisioned by the ERP Admin only.

## Important
Never place the actual Supabase service-role key, admin password, or other production secrets in this ZIP, source code, screenshots, or browser-visible settings.
