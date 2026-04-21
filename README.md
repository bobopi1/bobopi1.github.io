# BudgetFlow Web

`BudgetFlow Web` is a browser-based budgeting app hosted as static files and now backed by Supabase for sign-in and synced storage.

## What changed

- users sign in with email and password
- entries are stored in Supabase, not only in browser storage
- recurring items are stored per user and sync across devices
- existing local data can be imported into Supabase the first time a user signs in on a device

## Files

- `index.html`: app shell and auth UI
- `styles.css`: UI styling
- `app.js`: auth, sync, app logic
- `supabase-config.js`: your project URL and public key
- `supabase-setup.sql`: tables and row-level security policies
- `manifest.webmanifest`: PWA metadata
- `sw.js`: offline cache
- `start-server.ps1`: local server for Windows

## Supabase setup

1. Create a Supabase project.
2. In the Supabase SQL editor, run the contents of `supabase-setup.sql`.
3. In `Authentication -> Sign In / Providers`, make sure Email is enabled.
4. In `Authentication -> URL Configuration`, set:
   - `Site URL` to your GitHub Pages URL
   - add the same GitHub Pages URL under redirect URLs
5. Edit `supabase-config.js` and set:

```js
window.BUDGETFLOW_SUPABASE_URL = "https://YOUR_PROJECT.supabase.co";
window.BUDGETFLOW_SUPABASE_KEY = "YOUR_PUBLIC_PUBLISHABLE_OR_ANON_KEY";
```

## Important note about the public key

The key used in `supabase-config.js` is intended to be public in a browser app. The protection comes from Row Level Security policies in `supabase-setup.sql`, which restrict each signed-in user to their own data.

Never put a Supabase `service_role` key in this app or in a public repository.

## Run on Windows

1. Open PowerShell in this folder.
2. Start the local server:

```powershell
powershell -ExecutionPolicy Bypass -File .\start-server.ps1
```

3. Open:

```text
http://localhost:8080
```

## Open on iPhone

1. Make sure your iPhone and Windows PC are on the same Wi-Fi network.
2. Find your PC's IPv4 address:

```powershell
ipconfig
```

3. In Safari on your iPhone, open:

```text
http://YOUR-PC-IP:8080
```

4. Use Share -> `Add to Home Screen`.

## Hosting on GitHub Pages

This app works well on GitHub Pages because the frontend is static. Supabase handles:

- authentication
- synced database storage
- per-user data isolation

## Official docs used

- GitHub Pages: https://docs.github.com/en/pages/getting-started-with-github-pages/about-github-pages
- Supabase Auth: https://supabase.com/docs/guides/auth/passwords
- Supabase JS client: https://supabase.com/docs/reference/javascript/auth-api
- Supabase Row Level Security: https://supabase.com/docs/guides/database/postgres/row-level-security
