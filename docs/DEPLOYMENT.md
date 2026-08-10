# Deployment — Vercel + Render

Target stack for this project:

| Piece | Host |
|-------|------|
| Frontend | [Vercel](https://vercel.com) |
| API | [Render](https://render.com) Web Service |
| Database | [Render](https://render.com) PostgreSQL |

```text
Browser → Vercel (React) → Render API (Express) → Render PostgreSQL
```

Keep the GitHub repo **private**. Grant Vercel and Render access to it.

---

## A. Render — Database + API

### A1. Create PostgreSQL

1. Open https://dashboard.render.com  
2. **New +** → **PostgreSQL**  
3. Settings:

   | Field | Value |
   |-------|-------|
   | Name | `rentride-db` |
   | Database | `rentride` |
   | User | `rentride` |
   | Region | pick closest (e.g. Singapore / Oregon) |
   | Plan | Free |

4. Create → wait until status is **Available**  
5. Open the DB → copy **Internal Database URL** (for the API on Render)  
   - Also copy **External Database URL** (for running `db:push` / `seed` from your PC)

### A2. Create Web Service (API)

1. **New +** → **Web Service** → connect GitHub → select `Rentride`  
2. Configure:

   | Field | Value |
   |-------|-------|
   | Name | `rentride-api` |
   | Region | **same as the database** |
   | Root Directory | leave empty (repo root) |
   | Runtime | Node |
   | Build Command | `npm install` |
   | Start Command | `npm run start -w rentride-api` |
   | Instance type | Free |

3. **Environment** variables:

   | Key | Value |
   |-----|-------|
   | `NODE_ENV` | `production` |
   | `DATABASE_URL` | paste **Internal Database URL** from `rentride-db` |
   | `JWT_SECRET` | long random string (Generate in Render or use your own) |
   | `FRONTEND_URL` | leave blank for now — set after Vercel deploy |

4. Deploy. When live, open:

   `https://rentride-api.onrender.com/api/health`

   (your subdomain may differ — copy it from Render)

   Expected: `{ "success": true, "data": { "status": "ok" } }`

### A3. Push schema + seed from your PC

On your machine, temporarily point `.env` at Render’s **External** DB URL:

```env
DATABASE_URL=postgresql://...@dpg-xxxx.oregon-postgres.render.com/rentride
JWT_SECRET=same-as-render
SEED_ADMIN_EMAIL=...
SEED_ADMIN_PASSWORD=...
SEED_AGENCY_EMAIL=...
SEED_AGENCY_PASSWORD=...
SEED_CUSTOMER_EMAIL=...
SEED_CUSTOMER_PASSWORD=...
```

Then:

```bash
npm run db:push
npm run seed
```

Restore your local `DATABASE_URL` afterward if you still develop locally.

> Free Render Postgres may sleep; first connection can be slow.

### Optional: Blueprint

Repo includes `render.yaml` (DB + API). In Render: **New +** → **Blueprint** → select the repo. Still set `FRONTEND_URL` manually after Vercel.

---

## B. Vercel — Frontend

1. https://vercel.com → **Add New** → **Project** → import `Rentride`  
2. Configure:

   | Setting | Value |
   |---------|-------|
   | Framework Preset | Vite |
   | Root Directory | `frontend` |
   | Build Command | `npm run build` |
   | Output Directory | `dist` |
   | Install Command | `npm install` |

3. **Environment Variables**:

   | Name | Value |
   |------|-------|
   | `VITE_API_URL` | `https://rentride-api.onrender.com` (your Render API URL, **no** trailing slash) |

4. Deploy → copy the URL, e.g. `https://rentride.vercel.app`

5. Back on Render API → Environment → set:

   | Key | Value |
   |-----|-------|
   | `FRONTEND_URL` | `https://rentride.vercel.app` |

6. **Manual Deploy** the API again so CORS/cookies update.

---

## C. Cookie / CORS (required for login)

Frontend (Vercel) and API (Render) are different domains, so production uses:

- Cookies: `SameSite=None; Secure`  
- Frontend: `credentials: "include"` + `VITE_API_URL`  
- API: `FRONTEND_URL` must **exactly** match the Vercel URL (`https://...`)

---

## D. Smoke test

1. Open Vercel URL → browse vehicles  
2. Log in with seeded accounts  
3. Customer booking → agency approve → admin analytics  

---

## E. Common issues

| Problem | Fix |
|---------|-----|
| API deploy fails on `npm run start -w rentride-api` | Root Directory must be repo root (not `api/`) so workspaces resolve |
| `SSL` / DB connection error | App enables SSL for Render URLs; confirm `DATABASE_URL` is Internal URL on the web service |
| CORS / login cookie missing | Set `FRONTEND_URL` to exact Vercel URL; redeploy API |
| Empty vehicles | Run `db:push` + `seed` against External DB URL |
| Free tier sleep | First request after idle can take ~30–60s |
| Vercel 404 on page refresh | `frontend/vercel.json` SPA rewrite handles this |

---

## F. Env cheat sheet

**Render API**

```env
NODE_ENV=production
DATABASE_URL=<Internal Database URL>
JWT_SECRET=<random>
FRONTEND_URL=https://your-app.vercel.app
```

**Vercel frontend**

```env
VITE_API_URL=https://your-api.onrender.com
```
