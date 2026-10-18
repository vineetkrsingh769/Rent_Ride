# RentRide

**Private / proprietary project.** Unauthorized cloning, copying, or redistribution is prohibited. See [LICENSE](LICENSE).

Vehicle rental management system for two-wheelers and four-wheelers (daily / weekly / monthly), with customer booking, agency fleet tools, and admin analytics.

## Stack

| Layer | Technology |
|-------|------------|
| Frontend | React 19, Vite, React Router, Tailwind CSS v4 |
| Backend | Node.js, Express.js |
| Database | PostgreSQL + Drizzle ORM |
| Auth | JWT (HTTP-only cookies) |

## Structure

```text
RentRide/
├── frontend/   # React UI (port 3000)
├── api/        # Express API (port 3001)
└── scripts/    # Local Postgres setup helper
```

## Authorized local setup

Only for the project owner / authorized evaluators:

1. Copy `.env.example` → `.env` and set `DATABASE_URL`, `JWT_SECRET`, and `SEED_*` credentials.
2. `npm install`
3. `npm run db:push` then `npm run seed`
4. `npm run dev`

Do **not** commit `.env`. Demo passwords are not published in this repository.

On Windows, `npm run db:setup` runs steps 3–4's database half for you (verifies the
Postgres service, pushes the schema, seeds).

## Deployment

Frontend on Vercel, API + Postgres on Render. Both read their config from the repo:
[`vercel.json`](vercel.json) and [`render.yaml`](render.yaml).

**Render (API + database)** — create a Blueprint from `render.yaml`, then set these
dashboard values before the first deploy, because the build seeds the database:

| Variable | Value |
|----------|-------|
| `FRONTEND_URL` | Exact Vercel origin, no trailing slash (e.g. `https://rentride.vercel.app`) |
| `SEED_ADMIN_EMAIL` / `SEED_ADMIN_PASSWORD` | Your admin login |
| `SEED_AGENCY_EMAIL` / `SEED_AGENCY_PASSWORD` | Demo agency login |
| `SEED_CUSTOMER_EMAIL` / `SEED_CUSTOMER_PASSWORD` | Demo customer login |

`DATABASE_URL` and `JWT_SECRET` are provisioned automatically. The build runs
`db:migrate` and then `seed:if-empty`, so the schema is created on every deploy and
the demo data is inserted only when the database is still empty.

**Vercel (frontend)** — import the repo and set one environment variable:

| Variable | Value |
|----------|-------|
| `VITE_API_URL` | Render API origin, no trailing slash (e.g. `https://rentride-api.onrender.com`) |

Without `VITE_API_URL` the built app calls its own origin and every request returns
the SPA's HTML instead of JSON.

**Verify a deploy** — `GET /api/health` is liveness; `GET /api/health/db` returns
`{ status: "ok", users: N }` once migrations have run, or 503 if the database is
unreachable.
