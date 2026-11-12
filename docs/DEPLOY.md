# Deploying GarageHub

How the public demo is hosted for free: static frontend, Node API, a
MySQL-compatible database, and a daily demo-data reset. The demo was
deployed with option A below on **2026-11-12**, following these steps.

Provider limits and prices were read from each provider's own
documentation (dates and links at the end). They change; re-check before
relying on them.

## What the app needs

| Part | What it is | Measured (local `docker stats`, idle after the 29 Playwright tests, 2026-10-29) |
|---|---|---|
| Frontend | Static Vite build (`codeBase/abeGarage/frontend`) | nginx container: 12 MiB RAM; image 110 MB |
| API | Node 20 Express app, Dockerfile included (`codeBase/abeGarage/backend`) | 30 MiB RAM, ~0% CPU; image 249 MB |
| Database | MySQL 8 or MySQL-compatible, TLS supported (`DB_SSL`, `DB_SSL_CA`) | 383 MiB RAM, ~0.8% of one CPU (MySQL 8) |
| Demo reset | `npm run demo:reset`, once a day | `.github/workflows/demo-reset.yml` |

These are local measurements under no real traffic; production numbers
will differ.

## Options

### A. Vercel (frontend) + Render Free (API) + TiDB Cloud Starter (database): $0/month

| | Free-tier limits that matter here |
|---|---|
| Vercel Hobby | 100 GB Fast Data Transfer and 1,000,000 CDN requests per month; 100 deployments per day; 45 min build limit. **Non-commercial, personal use only** (Vercel fair-use guidelines). |
| Render Free web service | Spins down after **15 minutes** without traffic; spinning back up takes **about one minute**. 750 free instance hours per workspace per month (spun-down time doesn't count; if they run out, free services are suspended until next month). No shell, no one-off jobs, no persistent disk, may restart at any time. Hobby workspace includes 5 GB outbound bandwidth and 500 build minutes per month. |
| TiDB Cloud Starter | Per instance: 5 GiB row storage, 5 GiB columnar storage, 50 million Request Units per month; up to five free MySQL-compatible instances per organization; **no credit card**. When the quota runs out, new connections are refused until the next month (no charge unless you add a card and turn on billing). TLS is required. |
| Demo reset | GitHub Actions schedule: standard runners are free on public repositories. Schedules run only on the default branch and are disabled in public repos after 60 days without repository activity. |

**TiDB is MySQL-compatible, not MySQL.** Before deploying, the app was
tested against TiDB v8.5.1 (the `pingcap/tidb` Docker image) on
2026-11-11: all 6 migrations, the seed, the 294 backend tests and the 39
Playwright tests passed. The hosted service then ran the same migrations
and seed without errors.

Downsides: the first request after 15 idle minutes waits about a minute
(the API wakes up); Vercel Hobby is for personal projects, so a client's
production app should not run on it.

### B. Railway Hobby (API + MySQL in one project, frontend on Vercel or Railway): about $5/month

Railway's Hobby plan is **$5/month and includes $5 of resource usage**
(read 2026-10-29). Usage is billed at RAM $10 per GB-month, CPU $20 per
vCPU-month, volume storage $0.15 per GB-month and egress $0.05 per GB. Per
service on Hobby: up to 5 GB volume. New accounts get a one-time $5 trial
credit for up to 30 days; after that, without a plan, $1 of free credit per
month.

Estimate from the measurements above (not a quote): API 30 MiB + MySQL
383 MiB ≈ 0.40 GB of RAM ≈ $4.03/month, plus about 0.008 vCPU ≈ $0.16 and
a small volume. That stays within the included $5, so the bill would be
the $5 subscription. Real MySQL 8, no sleeping, no cold starts.

### Not an option any more: Aiven Free MySQL

This guide first recommended Aiven's free MySQL plan. Aiven's free-plan
page (updated 2026-11-06) now lists the Free tier only for Kafka,
OpenSearch, PostgreSQL and Valkey; MySQL is on the paid Developer tier,
which is billed after the trial credits run out.

## Recommendation: option A

It costs nothing, never bills without you opting in, and the app was
tested on TiDB before deploying. The one-minute wake-up is the main cost;
mention it next to the demo link ("first load may take a minute"). If that
matters for a client demo, option B removes it for about $5/month and runs
real MySQL 8.

## Step-by-step (option A)

You'll create three free accounts: TiDB Cloud, Render and Vercel. Merge
into `main` first: the scheduled reset only runs from the default branch.

**Never paste connection strings, passwords or keys into chats, issues or
screenshots.** If one leaks, reset it at the provider.

### 1. Generate secrets (on your machine)

```bash
# JWT secret for the API
node -e "console.log(require('crypto').randomBytes(48).toString('hex'))"
# one password per staff account (admin, manager, mechanic): run 3 times
node -e "console.log(require('crypto').randomBytes(18).toString('base64url'))"
```

Pick a Demo password (12+ characters, different from the staff
passwords); it is the **only** one you will publish. Create a separate
Gemini API key for production at https://aistudio.google.com/apikey, so
it can be revoked without touching your local key. Store everything in a
password manager.

### 2. Database: TiDB Cloud Starter

1. Sign up at https://tidbcloud.com and create an instance: plan
   **Starter**. Pick the region that matches your Render region (AWS
   Frankfurt with Render Frankfurt, Oregon with Oregon, and so on): every
   query crosses this link. If asked for a spending limit, leave it at $0.
2. **SQL Editor**: `CREATE DATABASE garagehub;`
3. **Connect** → **General**: generate a password and note host, port
   (4000), user (it has a prefix, like `xxxxxxxx.root`) and password.

No CA file is needed: TiDB Cloud's certificate is issued by Let's
Encrypt, which Node already trusts, so `DB_SSL=true` alone is enough.

### 3. Create the tables and the demo data (from your machine)

Render's free plan has no shell, so run this once locally. Keep the
values in a private file outside the repo, not on the command line (which
ends up in shell history):

```bash
mkdir -p ~/garagehub-deploy && touch ~/garagehub-deploy/prod.env && chmod 600 ~/garagehub-deploy/prod.env
```

```ini
# ~/garagehub-deploy/prod.env
NODE_ENV=production
SEED_ALLOW_PRODUCTION=true
DB_HOST=<host>
DB_PORT=4000
DB_USER=<prefix.root>
DB_PASS=<password>
DB_NAME=garagehub
DB_SSL=true
SEED_DEMO_PASSWORD=<demo>
SEED_ADMIN_PASSWORD=<admin>
SEED_MANAGER_PASSWORD=<manager>
SEED_MECHANIC_PASSWORD=<mechanic>
```

```bash
cd codeBase/abeGarage/backend
npm ci
( set -a; . ~/garagehub-deploy/prod.env; set +a; npm run db:setup )
```

Expected output: `Batch 1 run: 6 migrations` and
`Seeded 4 accounts (...), 18 services, 5 customers, 6 vehicles, 5 orders.`
The seed refuses to run if a staff password is missing, shorter than 12
characters or equal to the Demo password. "Missing user name prefix"
means `DB_USER` lacks the `xxxxxxxx.` part.

### 4. API: Render Free web service

1. render.com → **New** → **Web Service** → connect the GitHub repo.
2. **Branch**: `main`. **Root Directory**: `codeBase/abeGarage/backend`.
   **Language**: Docker (uses the repo's Dockerfile). **Region**: the one
   matching your database (it can't be changed later). **Instance type**:
   Free.
3. **Advanced** → **Health Check Path**: `/api/health`.
4. Environment variables:

   | Name | Value |
   |---|---|
   | `NODE_ENV` | `production` |
   | `DB_HOST`, `DB_PORT`, `DB_USER`, `DB_PASS`, `DB_NAME` | from step 2 |
   | `DB_SSL` | `true` (no `DB_SSL_CA` for TiDB Cloud) |
   | `JWT_SECRET` | from step 1 |
   | `TRUST_PROXY` | `1` (Render's proxy; rate limiting needs the client IP) |
   | `CORS_ORIGINS` | `https://placeholder.invalid` for now; the real Vercel URL in step 6 (the API refuses to start without a value in production) |
   | `AI_ENABLED` | `true` to turn on smart intake, `false` (default) to hide it |
   | `AI_PROVIDER` | `gemini` |
   | `GEMINI_API_KEY` | the production key from step 1 (free tier, no card). Default model: `gemini-3.1-flash-lite` |

   `GEMINI_API_KEY` is read only by the API: never put it in Vercel or in
   any `VITE_` variable, which are built into the public JavaScript. The
   default limits (`AI_DAILY_CAP=200`, `AI_GLOBAL_RPM=7`, `AI_USER_LIMIT=10`
   per 10 minutes) stay under Gemini's free-tier quota; check your key's
   actual limits in AI Studio and see `backend/.env.example`. On the free
   tier Google may use the prompts to improve its products; the intake box
   tells users not to enter personal details.

   Don't set `PORT` (Render provides it; default 10000), `AI_MODEL` (the
   default is the evaluated model) or the seed passwords (the API doesn't
   need them).
5. Deploy, then open `https://<service>.onrender.com/api/health`.
   Expected: `{"status":"ok","db":"ok",...}`. If the deploy log shows
   `Invalid environment configuration`, it lists every missing or invalid
   variable by name.

### 5. Frontend: Vercel

1. vercel.com → **Add New** → **Project** → import the repo.
2. **Root Directory**: `codeBase/abeGarage/frontend`. Framework preset:
   **Vite** (build `npm run build`, output `dist`).
3. Environment variable `VITE_API_URL` = `https://<service>.onrender.com/api`,
   for Production, **before the first deploy**. It is compiled into the
   bundle; changing it needs a redeploy. The build stops with
   "VITE_API_URL is not set" if it is missing.
4. Deploy. `vercel.json` sends client routes such as `/admin/orders` to
   `index.html`, so reloads and shared links work.

### 6. Connect them

In Render, set `CORS_ORIGINS` to the exact Vercel origin, e.g.
`https://garagehub.vercel.app` (scheme + host, no trailing slash;
comma-separate several). Save; Render redeploys. Vercel preview
deployments have other URLs and will not be able to log in, which is the
safe default for a public demo.

### 7. Daily demo reset (GitHub Actions)

1. GitHub repo → **Settings** → **Secrets and variables** → **Actions**.
2. **Secrets**: `DB_HOST`, `DB_PORT`, `DB_USER`, `DB_PASS`, `DB_NAME`,
   `SEED_DEMO_PASSWORD`, `SEED_ADMIN_PASSWORD`, `SEED_MANAGER_PASSWORD`,
   `SEED_MECHANIC_PASSWORD` (plus `DB_SSL_CA` only for a provider that
   needs its own CA).
3. **Variables**: `DEMO_RESET_ENABLED` = `true`.
4. **Actions** → **Reset public demo data** → **Run workflow** once to
   check it; the log ends with `"event":"demo_reset","ok":true`.
   After that it runs daily at 03:17 UTC. The reset restores accounts,
   services, customers, vehicles and orders; it does not clear the AI
   usage log, so the daily AI cap keeps counting.

### 8. Check the live demo

- `https://<service>.onrender.com/api/health` returns `"db":"ok"`.
- Open the Vercel URL, log in as `demo@garagehub.test` with the Demo
  password: lists load, every write shows "The demo account cannot ...".
- As Demo, open **Smart intake (AI)**, type "brakes grind" and click
  **Draft job card**; a draft appears (about 9-10 s on the first live
  requests from Render on 2026-11-12).
- Open an order's tracking link while logged out.
- Open `https://<service>.onrender.com/api/docs`.
- Publish **only** the Demo login.

### Keeping it running

- If nobody pushes to the public repo for 60 days, GitHub disables the
  scheduled reset; re-enable it in the Actions tab.
- Render's 750 free hours per workspace cover one service running all
  month (a 31-day month has 744 hours); a second free service would share
  them.
- TiDB Cloud Starter refuses new connections if the monthly quota runs
  out (the API's health check then shows `"db":"unreachable"`); demo
  traffic is far below it.
- Upgrading later: Render paid instances start at $7/month (512 MB RAM,
  0.5 CPU), which removes the spin-down.

## Sources

Read 2026-10-29 unless noted.

- Vercel Hobby plan: https://vercel.com/docs/plans/hobby
- Vercel limits: https://vercel.com/docs/limits
- Render free tier: https://render.com/docs/free
- Render pricing: https://render.com/pricing.md
- Render web services (PORT, health checks): https://render.com/docs/web-services
- Railway plans and prices: https://docs.railway.com/reference/pricing/plans
- Railway free trial: https://docs.railway.com/reference/pricing/free-trial
- Aiven free plan (read 2026-11-11; MySQL no longer on the Free tier): https://aiven.io/docs/platform/concepts/free-plan
- TiDB Cloud Starter (read 2026-11-11): https://docs.pingcap.com/tidbcloud/select-cluster-tier/
- GitHub Actions schedule event: https://docs.github.com/en/actions/reference/workflows-and-actions/events-that-trigger-workflows
- GitHub Actions billing: https://docs.github.com/en/billing/concepts/product-billing/github-actions
- Gemini rate limits (read 2026-11-04; live per-key numbers are only shown in AI Studio): https://ai.google.dev/gemini-api/docs/rate-limits
- Gemini pricing (read 2026-11-05; 2.5 Flash-Lite returned 404 for a new key that day): https://aistudio.google.com/docs/pricing
