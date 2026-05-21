# แบบสำรวจทักษะการใช้โปรแกรม

แบบสำรวจทักษะการใช้โปรแกรมและเครื่องมือดิจิทัล (React + Tailwind CDN)

## Live site

https://wtatiya.github.io/stackq/

## Deploy

Push to `main` triggers [GitHub Actions](.github/workflows/pages.yml) to publish the site.

In the repo **Settings → Pages**, set **Build and deployment** source to **GitHub Actions** (if not already).

## Admin live dashboard

On the welcome screen, click the **profile icon** (top) to open the admin login. Password is configured in the app (`ADMIN_PASSWORD` in `index.html`).

The dashboard shows a **logo bubble cloud** (Mentimeter-style): higher total scores move logos **larger and closer to the center**. Scoring:

| Survey type | Levels |
|-------------|--------|
| Tools (most categories) | ไม่เคยใช้ +0 · เคยใช้ +2 · ใช้เป็นประจำ +3 |
| Programming languages | ไม่รู้จัก +0 … คล่องแคล่ว +5 (see survey labels) |

Submissions are grouped into **sessions by submission date** (tabs at the top). Data refreshes every 5 seconds.

### Google Apps Script (required for live data)

The site POSTs to a Google Apps Script web app. The admin dashboard loads data with **JSONP** (required because Apps Script does not send CORS headers to GitHub Pages).

1. Open the script **bound to your `stackq` spreadsheet**.
2. Replace all code with [`google-apps-script/Code.gs`](google-apps-script/Code.gs).
3. **Deploy → Manage deployments → Edit (pencil) → Version: New version → Deploy.**
4. Set **Execute as:** Me · **Who has access:** **Anyone** (not “Anyone with Google account”).
5. If the `/exec` URL changes, update `GOOGLE_SCRIPT_URL` in `index.html`.

**Sheet format:** row 1 headers `Timestamp | Name | Google Doc | Google Sheet | ...` (one column per app), matching your current sheet.

**CORS note:** Browsers block `fetch()` from `wtatiya.github.io` to `script.google.com`. After deploying `doGet` with the repo code, the site uses JSONP automatically — no CORS header needed.
