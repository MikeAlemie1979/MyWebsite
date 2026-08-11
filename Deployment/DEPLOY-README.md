# Deploying Mike Alemie Website — Internet Host Provider

This folder (`Deployment/app/`) is the complete, deployable Next.js application.
Everything a generic shared/VPS web host needs is inside it — copy the whole
`app/` folder to the host as-is.

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
├── public/               Static assets served at /  (images, uploaded media)
│   └── uploads/          Created at runtime by the admin upload APIs —
│                          does not exist until first used, do not delete it
│                          on redeploy (see §5)
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
stored on disk (see §4a) — not via environment variables.

### 4a. Runtime content storage — read before your first deploy

This app does **not** use a database. Admin-editable content (home-page
sentences, cards, projects, about-page copy, SMTP settings, social config)
and system state (admin sessions, visitor count) are stored as flat JSON
files written to the app's working directory at runtime:

```
.env.admin-auth.json          (seeded automatically on first request)
.env.admin-sessions.json
.env.home-text.json
.env.cards.json
.env.projects.json
.env.about-content.json
.env.smtp.json
.env.social-config.json
.env.social-post-log.json
.env.visitor-count.json
```

**Consequences for hosting:**

- The process's working directory must be **writable** by the Node process,
  and the same directory every time the app restarts.
- **Never wipe or replace the app folder wholesale on redeploy.** A redeploy
  that overwrites `app/` from source control will delete these files (they
  are gitignored on purpose — see §5) and reset all admin content, the admin
  password, active sessions, and the visitor counter back to defaults.
  Redeploy by updating `src/`, `public/` (excluding `public/uploads/`),
  `package.json`, and running a fresh build — leave the `.env.*.json` files
  and `public/uploads/` in place.
- A production migration path to a real database already exists as DDL —
  see `Development/Implementation/MAWebsiteDB.sql` — but the running app does
  not use it yet; this is future work, not required to deploy today.

### 4b. Default admin credentials — change immediately

If `.env.admin-auth.json` does not exist, the app seeds it on first request
with:

```
username: admin
password: ChangeMe123!
```

**Log in and change this password through the Admin dashboard immediately
after the first deploy.** Leaving the default in place on a public host is a
real credential — anyone who knows this project uses this scaffolding can
guess it.

## 5. What NOT to deploy from a dev machine

`.gitignore` already excludes these — if you're copying files manually
(rather than deploying via git), leave these out too:

- `node_modules/`, `.next/`, `tsconfig.tsbuildinfo`
- Every `.env.*.json` file (these are environment-specific runtime state —
  see §4a; deploying a developer's copy would leak the dev admin session and
  overwrite live content)
- `public/uploads/` (environment-specific uploaded media)
- `.claude/`, `.impeccable/` (editor/tooling metadata)

## 6. Verified before this package was prepared

- `npm run build` — clean production build, 24 routes, no errors
- `npm run start` — smoke-tested: `/` returns `200`, `/admin` correctly
  `307`-redirects to `/admin/login` when unauthenticated (confirms the
  server-side auth guard survives a production build)

---

**File & Folders Are Ready!**
