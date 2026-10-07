# PrepTrack

**Turn scattered prep into structured mastery.**

[![License: MIT](https://img.shields.io/badge/License-MIT-blue.svg)](./LICENSE)
![Go](https://img.shields.io/badge/Backend-Go-00ADD8?logo=go&logoColor=white)
![React](https://img.shields.io/badge/Frontend-React-61DAFB?logo=react&logoColor=black)
![PostgreSQL](https://img.shields.io/badge/Database-PostgreSQL-4169E1?logo=postgresql&logoColor=white)

PrepTrack is a preparation control center for any syllabus and any goal: SDE interviews, DSA,
GATE, certifications, and beyond. Create your own categories, topics, and subtopics. Attach
curated resources. Log study time. Stay consistent with streaks and heatmaps, weekly targets, and
automated spaced revision (D+1, D+3, D+7, D+21) with confidence scoring. Free to join.

For example, preparing for SDE 1 backend interviews? Create categories like DBMS, Operating
Systems, or Go. Add topics under each, attach your best resources, and log daily study time. The
same flow works for frontend prep, DSA, GATE, or any other syllabus.

PrepTrack is an orchestration and tracking layer. It does not host videos or reproduce external
documentation. It links and organizes them.

## Contents

- [Features](#features)
- [Tech stack](#tech-stack)
- [Repo structure](#repo-structure)
- [Prerequisites](#prerequisites)
- [Backend setup](#backend-setup-local)
- [Frontend setup](#frontend-setup-local)
- [API overview](#api-overview)
- [Discipline rules](#discipline-rules)
- [License](#license)

## Features

| Area | What it does |
|------|--------------|
| Auth | Signup plus login and logout over HttpOnly cookies (JWT), with rate-limited auth endpoints |
| Study-plan CRUD | Categories, topics, and subtopics for any syllabus, strictly scoped per user (`user_id` comes from the verified JWT, never from request input) |
| Resources | Up to 3 curated links per topic (video, playlist, blog, docs) with status and duration |
| Study logs | Log minutes per topic with optional comment and date |
| Dashboard | Goal-aware welcome, streak tracking (30 min per day, 1 grace day), weekly hours vs target, revisions-due count, focus topic, per-category progress, 84-day heatmap |
| Spaced revisions | Marking a topic `LEARNED` schedules day 1; completing a revision with confidence 1 to 5 schedules the next interval (1, 3, 7, or 21 days); two consecutive 5s promote to mastery |
| Stats | Totals, 8-week hours chart, top topics, heatmap |
| Preparation goal | Pick from 11 goals (SDE, competitive exams, cloud certifications, languages, or custom). Personalizes dashboard and curriculum copy and suggests a weekly target |
| Reference sheet | Toggleable shortcut (navbar pill plus command palette) to an editable external sheet URL, with smart defaults per goal |
| Settings | Weekly target hours, preparation goal, reference sheet toggle and URL |
| Guide | Built-in docs with section navigation and keyboard-shortcut reference |

## Tech stack

| Layer    | Technology                                                                                                        |
|----------|-------------------------------------------------------------------------------------------------------------------|
| Frontend | React 19, Vite, TypeScript, React Router, TanStack Query, Zustand, Axios, Recharts, Tailwind CSS v4              |
| Backend  | Go, Echo, `pgx` pool, `bcrypt`, JWT (`golang-jwt`), raw-SQL migrations                                            |
| Database | PostgreSQL (NeonDB serverless)                                                                                    |
| Hosting  | Vercel (frontend), Render (backend), NeonDB (database)                                                            |

## Repo structure

```text
PrepTrack/
├── backend/
│   ├── cmd/
│   │   ├── api/        # API server entrypoint (go run ./cmd/api)
│   │   ├── migrate/    # One-shot schema migration (go run ./cmd/migrate)
│   │   └── seed/       # Curriculum seed CLI (go run ./cmd/seed --email …)
│   ├── internal/
│   │   ├── config/     # Env-based config
│   │   ├── db/         # pgx pool
│   │   ├── handler/    # Auth, categories, topics, resources, logs, dashboard, revisions, stats, settings
│   │   ├── middleware/ # JWT, CORS, rate limiting
│   │   └── model/      # Request and response shapes
│   ├── migrations/     # 001_init.sql, 002_user_settings_extensions.sql (UP/DOWN)
│   └── .env.example
├── frontend/
│   ├── public/         # icon.svg favicon
│   ├── src/            # api/, pages/, components/, hooks/, stores/, providers/, lib/
│   ├── vercel.json     # SPA fallback rewrite (deep links serve index.html)
│   └── .env.example
└── LICENSE (MIT)
```

## Prerequisites

- **Go** 1.26 or later (`go version`)
- **Node.js** 20 or later with npm (`node -v`)
- A **PostgreSQL** database (local Postgres or a free NeonDB project) and its connection string

## Backend setup (local)

```powershell
cd backend

# 1. Configure env
Copy-Item .env.example .env
# Edit .env and set DATABASE_URL and JWT_SECRET (generate with: openssl rand -hex 32).
# PORT defaults to 8080. ALLOWED_ORIGIN defaults to http://localhost:5173.

# 2. Install dependencies and verify the build
go mod download
go build ./...

# 3. Create the schema (run from backend/, requires DATABASE_URL)
go run ./cmd/migrate

# 4. Start the API: http://localhost:8080 (health check: GET /health)
go run ./cmd/api
```

### Useful commands (from `backend/`)

| Command            | Purpose                  |
|--------------------|--------------------------|
| `go run ./cmd/api` | Run the API server       |
| `go build ./...`   | Verify everything compiles |
| `go test ./...`    | Run backend tests        |

### Backend env vars

| Var                | Required | Default                  | Notes                                                        |
|--------------------|----------|--------------------------|--------------------------------------------------------------|
| `DATABASE_URL`     | Yes      | None                     | Postgres connection string (a Neon pooled URL works)         |
| `JWT_SECRET`       | Yes      | None                     | Random secret of 32 bytes or more for cookie signing         |
| `PORT`             | No       | `8080`                   | Render injects this in production                            |
| `ALLOWED_ORIGIN`   | No       | `http://localhost:5173`  | Comma-separated list is supported for multiple frontends     |
| `APP_ENV`          | No       | `development`            | Set `production` on Render for `Secure` and `SameSite=None` cookies |
| `JWT_EXPIRY_HOURS` | No       | `168`                    | Cookie and JWT lifetime in hours                              |

## Frontend setup (local)

```powershell
cd frontend

# 1. Configure env (optional, defaults already point at the local backend)
Copy-Item .env.example .env
# VITE_API_BASE_URL=http://localhost:8080

# 2. Install dependencies and start the dev server: http://localhost:5173
npm install
npm run dev
# Vite proxies /api/* to http://localhost:8080 during development.
```

### Useful commands (from `frontend/`)

| Command           | Purpose                              |
|-------------------|--------------------------------------|
| `npm run dev`     | Dev server with HMR                  |
| `npm run build`   | Type-check plus production build into `dist/` |
| `npm run preview` | Preview the production build locally |
| `npm run lint`    | Lint with `oxlint`                   |

> Note: `VITE_` variables are baked in at build time. Changing `VITE_API_BASE_URL` requires a rebuild and redeploy.

## API overview

Base URL for local development: `http://localhost:8080`. Auth is cookie-based (Axios uses
`withCredentials`). For Postman, copy `token` from the signup or login JSON response and send it
as an `Authorization: Bearer <token>` header (supported as a fallback). All `/api/*` routes except
signup, login, logout, and health require authentication.

| Method and path                                                                                                  | Purpose                                              |
|------------------------------------------------------------------------------------------------------------------|------------------------------------------------------|
| `POST /api/auth/signup`                                                                                          | Body `{display_name, email, password}`, returns `201 {token, user}` |
| `POST /api/auth/login`                                                                                           | Body `{email, password}`, returns `200 {token, user}` |
| `GET /api/auth/me`, `POST /api/auth/logout`                                                                      | Current user, clear the auth cookie                  |
| `GET /health`, `GET /`                                                                                           | Public liveness probes                               |
| `GET /api/settings`, `PATCH /api/settings`                                                                       | Weekly target, goal (`goal_type`, `goal_custom_text`), reference sheet URL and visibility |
| `GET /api/dashboard`, `GET /api/stats`                                                                           | Aggregated metrics and extended analytics            |
| `GET /api/categories`, `POST /api/categories`, `PATCH /api/categories/:id`, `DELETE /api/categories/:id`        | Category CRUD                                        |
| `GET /api/categories/:id/topics`, `GET /api/topics/:id`, `POST /api/topics`, `PATCH /api/topics/:id`, `DELETE /api/topics/:id` | Topic CRUD (`LEARNED` status triggers a revision) |
| `GET /api/topics/:id/resources`, `POST /api/topics/:id/resources`, `PATCH /api/resources/:id`, `DELETE /api/resources/:id` | Resources (maximum 3 per topic)               |
| `GET /api/topics/:id/logs`, `POST /api/study-logs`                                                               | Study logs (`{topic_id, minutes, comment?, logged_on?}`) |
| `GET /api/revisions/due`, `POST /api/revisions/:id/complete`                                                     | Due queue, complete with `{confidence: 1-5}`         |

## Discipline rules

- Log at least 30 minutes per day to keep the streak. Maximum 3 resources per topic. Complete pending revisions before starting new topics.
- A topic counts as mastered only after a written summary note plus confidence 5 on 2 consecutive revisions.

## License

MIT. See [LICENSE](./LICENSE). Copyright (c) 2026 Yash Agrahari.
