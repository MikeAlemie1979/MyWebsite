# Deploying Mike Alemie Website — Internet Host Provider

Everything needed to deploy this site lives under `Deployment/`. The
application itself is `Deployment/app/` — copy that whole folder to the host
as-is. `Deployment/render.yaml` (Render-specific, see §2a) and this README
are the only other files in `Deployment/`.

## 1. Requirements on the host

- **Node.js**: `>=18.17.0` (Next.js 14 requirement — see `package.json` → `engines`)
- **Process manager**: whatever the host provides (cPanel "Setup Node.js App" /
  Passenger, Plesk Node.js extension, or a plain VPS running `pm2`/`systemd`)
- **Reverse proxy / TLS**: this app does not terminate HTTPS itself — the host
  or a reverse proxy (nginx, the host's own SSL panel) must do that. Once TLS
  is live, set `ENABLE_HSTS=true` (see below) to turn on HSTS + baseline
  security headers.

## 2. Files & folders

```
app/
├── src/                  Application source (routes, components, API)
├── public/               Static assets committed to the repo (logo, hero
│                          images, etc.) — NOT where uploads go, see below
├── uploads/               Created at runtime by the admin upload APIs when
│                          Google Drive isn't configured — does not exist
│                          until first used, do not delete it on redeploy
│                          (see §5). Deliberately outside public/: Next's
│                          production server snapshots public/'s file listing
│                          once at boot, so an upload written there while the
│                          server is already running would 404 for every
│                          visitor until the process restarts. Served instead
│                          through /api/media/local/[...path], which reads
│                          from disk on every request.
├── package.json           Scripts + engines requirement
├── package-lock.json       Exact dependency versions — commit/deploy this
├── next.config.js          Build config + optional HSTS headers
├── tailwind.config.js, postcss.config.js, tsconfig.json
├── .gitignore
└── .env.*.json             Runtime content stores — NOT committed, created
                             automatically on first run (see §4)
```

`node_modules/` and `.next/` are build artifacts — do not copy them from a
dev machine. Generate them fresh on the host with the commands in §3.

## 2a. Deploying on Render specifically

A `render.yaml` blueprint lives at `Deployment/render.yaml` and pins the
correct settings: **Root Directory** `Deployment/app`, **Build Command**
`npm ci && npm run build`, **Start Command** `npm run start`. When connecting
this repo as a Render Blueprint, set the Blueprint's YAML path to
`Deployment/render.yaml` in the dashboard.

If you see `Error: Cannot find module '.../Deployment/app/server.js'`, the
Render service's **Start Command** is set to something like `node server.js`
— this project has no custom server file, it's a standard Next.js app that
runs via `next start`. Fix it in the Render dashboard under the service's
Settings (Root Directory / Build Command / Start Command, matching
`render.yaml`), or delete and recreate the service from the blueprint so
Render applies these settings itself.

Also set the three Google environment variables described in §4a. Render's
filesystem is wiped on every deploy, so without them all admin content, the
admin password, and the visitor counter reset on every single deploy.

## 3. Build & run

```bash
cd app
npm install --omit=dev      # or: npm ci --omit=dev
npm run build
npm run start                # serves on port 3000 by default
```

To use a different port: `PORT=8080 npm run start`.

Most shared hosts with a "Node.js App" panel (cPanel/Plesk) want the same
three commands wired into their UI: an install step, `npm run build`, and
`npm run start` as the persistent process command.

## 4. Environment variables

| Variable | Required | Purpose |
|---|---|---|
| `NEXT_PUBLIC_SITE_URL` | Recommended | Production domain (e.g. `https://mikealemie.com`), used for SEO metadata, Open Graph tags, `robots.txt`/`sitemap.xml`. Falls back to `https://mikealemie.com` if unset — **set this to the real domain before going live** or search-engine metadata will point at the wrong host. |
| `ENABLE_HSTS` | Optional | Set to `true` **only after** TLS is confirmed working on the domain. Enables `Strict-Transport-Security` + baseline security headers. Leaving it unset is safe (headers simply aren't sent). |
| `NODE_ENV` | Set automatically | `npm run build`/`npm run start` set this to `production` themselves — do not set it manually. It also controls the admin session cookie's `secure` flag (only sent over HTTPS in production). |
| `PORT` | Optional | Port `next start` listens on. Defaults to `3000`. |

No API keys are required to boot the app. SMTP credentials and social-media
tokens are configured **after deploy**, through the Admin dashboard, and are
stored via the document store (see §4a) — not via environment variables.

**The public contact form (`/`) sends real email through `nodemailer`** using
whatever is saved in Admin → Email (SMTP). Until that's configured, the form
fails honestly with a 503 rather than pretending to succeed — visit `/admin`
and save working SMTP credentials before announcing the site is live, or
visitor messages will bounce. Submissions are sent **to the configured
`fromEmail` address** (it doubles as both the sender identity and the inbox
that receives them) with the visitor's own address set as Reply-To, so
replying goes straight back to them.

### 4a. Runtime content storage — read before your first deploy

Admin-editable content (home-page sentences, cards, projects, about-page copy,
SMTP settings, social config) and the visitor count are held in a **Google
Spreadsheet** — one tab per document, with a real header row and typed columns
(e.g. the Cards tab has `ID | Title | Description | Image URL` columns, not a
JSON blob), defined in `src/lib/sheet-schema.ts`. Uploaded images go to a
**Google Drive folder** and are served back through `/api/media/<fileId>`, so
the folder itself stays private.

Configure Sheets access with three environment variables:

| Variable | Purpose |
|---|---|
| `GOOGLE_SERVICE_ACCOUNT_JSON` | The entire downloaded service-account key file, pasted as one value. **Secret** — never commit it or paste it into a ticket or chat. |
| `GOOGLE_SHEET_ID` | The spreadsheet id: the long segment of its URL between `/d/` and `/edit`. |
| `GOOGLE_DRIVE_FOLDER_ID` | The upload folder's id: the last segment of the folder's URL. |

One-time setup:

1. Google Cloud console → new project → enable the **Google Sheets API** and
   the **Google Drive API**.
2. Create a **Service Account**, then create a **JSON key** for it.
3. Create the spreadsheet and the Drive folder.
4. **Share the spreadsheet** with the service account's
   `...@....iam.gserviceaccount.com` address, as **Editor**. Skipping this is
   the most common failure: Google reports an unshared resource as *not
   found*, which is indistinguishable from a mistyped id. Do **not** share
   the Drive folder with it — see below for why that wouldn't help anyway.
5. Set the three variables in the Render dashboard (they are declared
   `sync: false` in `render.yaml`, so Render prompts for them and never
   stores them in the repo).
6. Verify at **/admin → System → Storage**, which reports the active backend,
   shows the service-account address to share with, and runs a live
   connection test.

### 4a-i. Google Drive uploads need a second, different credential

Uploaded images do **not** use the service account above. Google gives
service accounts **zero storage quota** on a personal (non-Workspace) Drive —
`files.create` fails with a 403 no matter how the destination folder is
shared. The fix Google documents for personal accounts is to upload as the
real account owner instead, via OAuth — the service account stays
Sheets-only.

Two more environment variables, from an **OAuth 2.0 Client ID** (not a
service account) in the same Cloud Console project:

| Variable | Purpose |
|---|---|
| `GOOGLE_OAUTH_CLIENT_ID` | From an OAuth 2.0 Client ID, type **Web application**. |
| `GOOGLE_OAUTH_CLIENT_SECRET` | The matching secret. **Secret** — same handling as the service-account key. |

Setup:

1. **Google Auth Platform** (in the same Cloud Console project) → configure
   the OAuth consent screen: External user type, add the site owner's own
   Google account under **Audience → Test users** (no Google verification is
   needed while the app stays in Testing mode with a narrow `drive.file`
   scope).
2. **Clients → Create client → Web application.** Add an **Authorized
   redirect URI** of `<your site URL>/api/admin/google-oauth/callback` —
   e.g. `https://mikealemie.com/api/admin/google-oauth/callback` in
   production, `http://localhost:3000/api/admin/google-oauth/callback` for
   local dev. This must match `NEXT_PUBLIC_SITE_URL` exactly (protocol,
   host, no trailing slash) or Google rejects the redirect.
3. Set `GOOGLE_OAUTH_CLIENT_ID` and `GOOGLE_OAUTH_CLIENT_SECRET` in Render.
4. Log into **/admin → System → Storage** and click **Connect Google
   Drive**. This is a one-time step a human has to click through — Google's
   consent screen cannot be automated. Sign in as the account whose Drive
   quota should hold the uploads, and Allow.
5. The refresh token this produces is stored via the same document store as
   everything else (a "Google Drive Connection" sheet tab) and renews itself
   indefinitely — no need to repeat this after a redeploy, only if access is
   revoked from the Google account's own permissions page.

The app creates each spreadsheet tab **and its header row** on first save —
no manual sheet setup.

The spreadsheet and folder IDs can also be set or overridden live from
**/admin → System → Storage** (paste the full URL or the bare id) without a
redeploy. That override is saved to `.env.google-links.json`, a gitignored
local file — it takes priority over `GOOGLE_SHEET_ID`/`GOOGLE_DRIVE_FOLDER_ID`
while present, but is lost on the next deploy same as the other `.env.*.json`
files, at which point the environment variables take over again. Treat the
panel as a way to test a different sheet/folder without touching Render's
settings, not as the permanent configuration path — set the env vars for
anything meant to last.

**If the variables are unset**, the app falls back to local JSON files
(`.env.*.json`) and a local `uploads/` directory, served through
`/api/media/local/[...path]`. That is the intended behavior for local
development, and it means `npm run dev` needs no Google setup at all. It is
**not** viable on Render, whose filesystem is wiped on every deploy. The
Storage panel shows a warning whenever the app is running on this fallback.

Admin **sessions** are held in process memory rather than in Sheets, since
they are read on every protected page render. The only effect is that a
restart or redeploy requires logging in again.

`Development/Implementation/MAWebsiteDB.sql` is historical: it targets
Microsoft SQL Server, which Render does not offer. It has been superseded by
the Google Sheets backend and nothing reads it.

### 4b. Default admin credentials — change immediately

Login is 3-factor: username, password, and a numeric code. If no credentials
exist yet (checked via the document store — see §4a), the app seeds these
defaults on first login attempt:

```
username: Admin
password: App@dmin0123
code:     2085
```

**Log in and change these through the Admin dashboard immediately after the
first deploy.** Leaving the defaults in place on a public host is a real
credential — anyone who knows this project uses this scaffolding can guess
them. Because credentials now live in the document store (Google Sheets in
production, once configured — see §4a), a changed password survives a
redeploy; under the local-file fallback it does not.

## 5. What NOT to deploy from a dev machine

`.gitignore` already excludes these — if you're copying files manually
(rather than deploying via git), leave these out too:

- `node_modules/`, `.next/`, `tsconfig.tsbuildinfo`
- Every `.env.*.json` file, including `.env.google-links.json` (these are
  environment-specific runtime state — see §4a; deploying a developer's copy
  would leak dev credentials and could point the live site at a test
  spreadsheet/folder)
- `uploads/` (environment-specific uploaded media, local-backend only)
- `.claude/`, `.impeccable/` (editor/tooling metadata)

## 6. Verified before this package was prepared

- `npm run build` — clean production build, 28 routes, no errors, all API
  routes correctly dynamic (`ƒ`)
- `npm run start` — smoke-tested against the built output: `/`, `/about`,
  `/projects`, and `/admin/login` all return `200`
- Every admin content GET (cards, projects, home-text, about-content) returns
  `200` with no session — required, since the public pages read through these
- Every admin POST and upload route returns `401 Unauthorized` with no
  session cookie — confirms the `requireAdmin()` gate holds under a
  production build, not just in dev
- `/api/media/local/[...path]` and `/api/media/[fileId]` (the local-fallback
  and Drive-backed image routes) are public with no session required, as
  intended, and correctly 400/404 on a garbage id rather than serving
  anything
- **Uploaded-image reachability was specifically regression-tested**: a file
  uploaded through the running production server, with no restart, was
  fetched back and confirmed `200` with byte-identical content. This matters
  because Next's production server snapshots `public/`'s file listing once at
  boot and never rescans it — a naive implementation serving uploads as
  static files from `public/` would 404 for every visitor until the process
  restarted, which on a long-running Render deploy could mean indefinitely.
  Uploads are deliberately served through a dynamic route instead (see the
  `uploads/` entry in §2) specifically to avoid this.
- This pass ran on the **local-file fallback** (no `GOOGLE_SERVICE_ACCOUNT_JSON`
  set yet) — the Google Sheets/Drive path is implemented and its column
  schema/auth flow verified separately, but a live write against the actual
  target spreadsheet has not been exercised with production credentials.
  Confirm via **/admin → System → Storage** on the live host after the three
  Google env vars are set.

---

**File & Folders Are Ready!**
