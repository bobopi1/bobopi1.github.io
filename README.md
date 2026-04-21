# BudgetFlow Web

`BudgetFlow Web` is a browser-based budgeting app that runs on Windows and can be opened on your iPhone through Safari.

## Features

- add spending and earnings quickly
- see your current balance
- track totals for this week and this month
- view weekly or monthly spending trends
- search and filter your history
- save everything locally in the browser with no account required

## Files

- `index.html`: app shell
- `styles.css`: UI styling
- `app.js`: app logic and storage
- `manifest.webmanifest`: PWA metadata
- `sw.js`: offline cache
- `start-server.ps1`: local server for Windows

## Run on Windows

1. Open PowerShell in this folder.
2. Start the local server:

```powershell
powershell -ExecutionPolicy Bypass -File .\start-server.ps1
```

3. On this PC, open:

```text
http://localhost:8080
```

## Open it on your iPhone

1. Make sure your iPhone and Windows PC are on the same Wi-Fi network.
2. Find your PC's local IP address:

```powershell
ipconfig
```

Look for the IPv4 address, such as `192.168.1.25`.

3. On your iPhone, open Safari and go to:

```text
http://YOUR-PC-IP:8080
```

Example:

```text
http://192.168.1.25:8080
```

4. In Safari, tap Share, then tap `Add to Home Screen`.

## Notes

- The app stores data in the browser on each device.
- Entries saved on your PC stay on your PC's browser storage.
- Entries saved on your iPhone stay on your iPhone's browser storage.
- If Windows asks about firewall access when the server starts, allow it for your local network.

## Good next steps

- add category budgets
- sync data across devices
- export to CSV
- add recurring transactions
