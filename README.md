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
└── docs/       # Project report (submission)
```

## Authorized local setup

Only for the project owner / authorized evaluators:

1. Copy `.env.example` → `.env` and set `DATABASE_URL`, `JWT_SECRET`, and `SEED_*` credentials.
2. `npm install`
3. `npm run db:push` then `npm run seed`
4. `npm run dev`

Do **not** commit `.env`. Demo passwords are not published in this repository.

## Documentation

- [Detailed Project Report](docs/DETAILED_PROJECT_REPORT.md)
- [PDF report](docs/DETAILED_PROJECT_REPORT.pdf)
- [Deployment guide](docs/DEPLOYMENT.md) — Vercel (frontend) + Render (API + Postgres)
