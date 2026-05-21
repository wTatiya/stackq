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

The site POSTs to a Google Apps Script web app. To enable the dashboard **GET** endpoint:

1. Open the script bound to your survey spreadsheet (or create one from `google-apps-script/Code.gs`).
2. Paste/update code from [`google-apps-script/Code.gs`](google-apps-script/Code.gs).
3. **Deploy → New deployment → Web app** — execute as **Me**, access **Anyone**.
4. Copy the `/exec` URL into `GOOGLE_SCRIPT_URL` in `index.html` if it changed.

The sheet should have columns: `Timestamp | Name | Responses (JSON) | SubmittedAt (optional ISO)`.
