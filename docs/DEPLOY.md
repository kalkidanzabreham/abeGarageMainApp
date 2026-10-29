# Deploying GarageHub

Plan for a public demo on free or cheap hosting: static frontend, Node API,
MySQL, and a daily demo-data reset. Nothing here has been deployed yet;
these are instructions to follow.

Provider limits and prices below were read from each provider's own
documentation on **2026-10-29** (links at the end). They change; re-check
before relying on them.

## What the app needs

| Part | What it is | Measured (local `docker stats`, idle after the 29 Playwright tests) |
|---|---|---|
| Frontend | Static Vite build (`codeBase/abeGarage/frontend`) | nginx container: 12 MiB RAM; image 110 MB |
| API | Node 20 Express app, Dockerfile included (`codeBase/abeGarage/backend`) | 30 MiB RAM, ~0% CPU; image 249 MB |
| Database | MySQL 8, TLS supported (`DB_SSL`, `DB_SSL_CA`) | 383 MiB RAM, ~0.8% of one CPU |
| Demo reset | `npm run demo:reset`, once a day | `.github/workflows/demo-reset.yml` |

These are local measurements under no real traffic; production numbers
will differ.

## Options

### A. Vercel (frontend) + Render Free (API) + Aiven Free MySQL: $0/month

| | Free-tier limits that matter here |
|---|---|
| Vercel Hobby | 100 GB Fast Data Transfer and 1,000,000 CDN requests per month; 100 deployments per day; 45 min build limit. **Non-commercial, personal use only** (Vercel fair-use guidelines). |
| Render Free web service | Spins down after **15 minutes** without traffic; spinning back up takes **about one minute**. 750 free instance hours per workspace per month (spun-down time doesn't count; if they run out, free services are suspended until next month). No shell, no one-off jobs, no persistent disk, may restart at any time. Hobby workspace includes 5 GB outbound bandwidth and 500 build minutes per month. |
| Aiven Free MySQL | 1 CPU, 1 GB RAM, **1 GB disk**, `max_connections` 76, backups included, no time limit, no credit card. One free service per service type per organization. Aiven may power off a free service that shows no activity (after notifying you) and may change its cloud or region. |
| Demo reset | GitHub Actions schedule: standard runners are free on public repositories. Schedules run only on the default branch and are disabled in public repos after 60 days without repository activity. |

Downsides: the first request after 15 idle minutes waits about a minute
(the API wakes up); the database is small (fine for demo data); Vercel
Hobby is for personal projects, so a client's production app should not
run on it.

### B. Railway Hobby (API + MySQL in one project, frontend on Vercel or Railway): about $5/month

Railway's Hobby plan is **$5/month and includes $5 of resource usage**.
Usage is billed at RAM $10 per GB-month, CPU $20 per vCPU-month, volume
storage $0.15 per GB-month and egress $0.05 per GB. Per service on Hobby:
up to 5 GB volume. New accounts get a one-time $5 trial credit for up to
30 days; after that, without a plan, $1 of free credit per month.

Estimate from the measurements above (not a quote): API 30 MiB + MySQL
383 MiB ≈ 0.40 GB of RAM ≈ $4.03/month, plus about 0.008 vCPU ≈ $0.16 and
a small volume. That stays within the included $5, so the bill would be
the $5 subscription. No sleeping, no cold starts.

### C. Same as A, but TiDB Cloud Starter instead of Aiven: $0/month (untested)

TiDB Cloud Starter free quota per instance: 5 GiB row storage, 5 GiB
columnar storage and 50 million Request Units per month; up to five free
instances per organization. When the quota runs out, new connections are
refused until the next month. TiDB is **MySQL-compatible, not MySQL**;
this app (migrations with foreign keys and `ON DUPLICATE KEY UPDATE`,
`JSON_ARRAYAGG`, `SELECT ... FOR UPDATE`) has **not** been tested on it.

## Recommendation: option A

It costs nothing, runs real MySQL 8 (the same engine the tests run
against), and the app's measured footprint fits the free limits. The
one-minute wake-up is the main cost; mention it next to the demo link
("first load may take a minute"). If that matters for a client demo,
option B removes it for about $5/month.

## Step-by-step (option A)

You'll create three free accounts: Aiven, Render and Vercel. Merge the
branch into `main` first: the scheduled reset only runs from the default
branch.

### 1. Generate secrets (on your machine)

```bash
# JWT secret for the API
node -e "console.log(require('crypto').randomBytes(48).toString('hex'))"
# one password per staff account (admin, manager, mechanic): run 3 times
node -e "console.log(require('crypto').randomBytes(18).toString('base64url'))"
```

Pick a Demo password; it is the **only** one you will publish. Store all
of them in a password manager.

### 2. Database: Aiven Free MySQL

1. Sign up at aiven.io and create a service: **MySQL**, plan **Free**.
2. When it's running, open the service's **Overview** and copy host,
   port, user, password and database name, and download the **CA
   certificate** (`ca.pem`).
3. Turn the CA into one line (env vars are single-line):
   ```bash
   awk '{printf "%s\\n", $0}' ca.pem
   ```

### 3. Create the tables and the demo data (from your machine)

Render's free plan has no shell, so run this once locally:

```bash
cd codeBase/abeGarage/backend
npm ci
NODE_ENV=production SEED_ALLOW_PRODUCTION=true \
DB_HOST=<host> DB_PORT=<port> DB_USER=<user> DB_PASS=<password> DB_NAME=<database> \
DB_SSL=true DB_SSL_CA='<one-line CA from step 2>' \
SEED_DEMO_PASSWORD=<demo> SEED_ADMIN_PASSWORD=<admin> \
SEED_MANAGER_PASSWORD=<manager> SEED_MECHANIC_PASSWORD=<mechanic> \
npm run db:setup
```

Expected output: `Batch 1 run: 5 migrations` and `Seeded 4 accounts ...`.
The seed refuses to run if a staff password is missing, shorter than 12
characters or equal to the Demo password.

### 4. API: Render Free web service

1. render.com → **New** → **Web Service** → connect the GitHub repo.
2. **Root Directory**: `codeBase/abeGarage/backend`. **Language**: Docker
   (uses the repo's Dockerfile). **Instance type**: Free.
3. **Advanced** → **Health Check Path**: `/api/health`.
4. Environment variables:

   | Name | Value |
   |---|---|
   | `NODE_ENV` | `production` |
   | `DB_HOST`, `DB_PORT`, `DB_USER`, `DB_PASS`, `DB_NAME` | from Aiven |
   | `DB_SSL` | `true` |
   | `DB_SSL_CA` | one-line CA from step 2 |
   | `JWT_SECRET` | from step 1 |
   | `TRUST_PROXY` | `1` (Render's proxy; rate limiting needs the client IP) |
   | `CORS_ORIGINS` | your Vercel URL (set it in step 6) |

   Don't set `PORT` (Render provides it; default 10000) and don't put the
   seed passwords here; the API doesn't need them.
5. Deploy, then open `https://<service>.onrender.com/api/health`.
   Expected: `{"status":"ok","db":"ok",...}`.

### 5. Frontend: Vercel

1. vercel.com → **Add New** → **Project** → import the repo.
2. **Root Directory**: `codeBase/abeGarage/frontend`. Framework preset:
   **Vite** (build `npm run build`, output `dist`).
3. Environment variable `VITE_API_URL` = `https://<service>.onrender.com/api`.
   It is baked in at build time; changing it needs a redeploy.
4. Deploy. `vercel.json` sends client routes such as `/admin/orders` to
   `index.html`, so reloads and shared links work.

### 6. Connect them

In Render, set `CORS_ORIGINS` to the exact Vercel origin, e.g.
`https://garagehub.vercel.app` (scheme + host, no trailing slash;
comma-separate several). Save; Render redeploys.

### 7. Daily demo reset (GitHub Actions)

1. GitHub repo → **Settings** → **Secrets and variables** → **Actions**.
2. **Secrets**: `DB_HOST`, `DB_PORT`, `DB_USER`, `DB_PASS`, `DB_NAME`,
   `DB_SSL_CA`, `SEED_DEMO_PASSWORD`, `SEED_ADMIN_PASSWORD`,
   `SEED_MANAGER_PASSWORD`, `SEED_MECHANIC_PASSWORD`.
3. **Variables**: `DEMO_RESET_ENABLED` = `true`.
4. **Actions** → **Reset public demo data** → **Run workflow** once to
   check it; the log ends with `"event":"demo_reset","ok":true`.
   After that it runs daily at 03:17 UTC. The activity also keeps the
   free Aiven service from being treated as unused.

### 8. Check the live demo

- Open the Vercel URL, log in as `demo@garagehub.test` with the Demo
  password: lists load, every write shows "The demo account cannot ...".
- Open an order's tracking link while logged out.
- Open `https://<service>.onrender.com/api/docs`.
- Publish **only** the Demo login.

### Keeping it running

- If nobody pushes to the public repo for 60 days, GitHub disables the
  scheduled reset; re-enable it in the Actions tab.
- Render's 750 free hours per workspace cover one service running all
  month (a 31-day month has 744 hours); a second free service would share
  them.
- Upgrading later: Render paid instances start at $7/month (512 MB RAM,
  0.5 CPU), which removes the spin-down.

## Sources (read 2026-10-29)

- Vercel Hobby plan: https://vercel.com/docs/plans/hobby
- Vercel limits: https://vercel.com/docs/limits
- Render free tier: https://render.com/docs/free
- Render pricing: https://render.com/pricing.md
- Render web services (PORT, health checks): https://render.com/docs/web-services
- Railway plans and prices: https://docs.railway.com/reference/pricing/plans
- Railway free trial: https://docs.railway.com/reference/pricing/free-trial
- Aiven free plan: https://aiven.io/docs/platform/concepts/free-plan
- Aiven for MySQL free tier: https://aiven.io/docs/products/mysql/concepts/mysql-free-tier
- TiDB Cloud Starter: https://docs.pingcap.com/tidbcloud/select-cluster-tier/
- GitHub Actions schedule event: https://docs.github.com/en/actions/reference/workflows-and-actions/events-that-trigger-workflows
- GitHub Actions billing: https://docs.github.com/en/billing/concepts/product-billing/github-actions
