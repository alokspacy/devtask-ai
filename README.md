# DevTask AI — AI-Powered Developer Task & Project Assistant

DevTask AI is a high-performance backend AI engineering platform built with Node.js, TypeScript, Express, PostgreSQL, Supabase Auth, PDFKit, and Google Gemini. It converts ambiguous developer tasks and tickets into verified, structured implementation plans in seconds, while providing end-to-end task management, asynchronous background reporting, and interactive OpenAPI documentation.

---

## Problem
Engineering teams and solo developers lose hours attempting to convert high-level requirements, vague bug reports, and features into concrete architectural implementation steps. Manual planning often misses prerequisites, critical files to touch, automated testing checklists, and technical risks. This leads to scope creep, overlooked edge cases, and unexpected architectural debt.

---

## 10x Claim
> **"Turn a vague development task into a verified implementation plan in seconds instead of planning it manually from scratch."**

By leveraging Google Gemini LLM constrained with strict Zod schema validation, DevTask AI converts ambiguous prompts (e.g. *"Build authentication for my Express API"*) into granular goals, prerequisites, step-by-step instructions, affected code areas, testing checklists, and technical risks in under 5 seconds.

---

## Features
1. **AI Development Planner**: Uses Google Gemini to generate structured, production-ready implementation plans with strict Zod schema validation and token usage tracking.
2. **Project & Task Management**: Full CRUD operations for projects and tasks with status tracking (`pending`, `in_progress`, `completed`) and priority levels (`low`, `medium`, `high`, `critical`).
3. **Supabase Authentication**: Secure user signup, login, and logout backed by Supabase Auth with JWT Bearer token verification and isolated user data scoping.
4. **PostgreSQL Persistence**: ACID-compliant persistence with connection pooling, parameterized SQL queries, and deterministic schema initialization (`init.sql`).
5. **Asynchronous Background PDF Reporting**: In-process background job queue (`queued` -> `processing` -> `completed` / `failed`) generating multi-page PDF summaries with PDFKit, returning `202 Accepted` immediately.
6. **OpenAPI & Swagger UI**: Full interactive API documentation available at `/docs` and machine-readable spec at `/docs/openapi.json`.

---

## Architecture

```
Client / Swagger UI / Tests
           │ (HTTP / Bearer JWT)
           ▼
     Express Router (`src/routes/`)
     ├── /health
     ├── /docs
     ├── /auth
     ├── /projects
     ├── /tasks
     ├── /ai
     └── /reports
           │
     Middleware Layer (`src/middleware/`)
     ├── requireAuth (`auth.ts` -> Supabase JWT verification)
     ├── validate (`validate.ts` -> Zod schema parser)
     └── errorHandler (`errorHandler.ts` -> Standard JSON errors)
           │
     Service Layer (`src/services/`)
     ├── AuthService (`auth.service.ts`)
     ├── ProjectService (`project.service.ts`)
     ├── TaskService (`task.service.ts`)
     ├── AiPlannerService (`ai.service.ts` -> Gemini LLM)
     ├── ReportService (`report.service.ts`)
     └── PdfService (`pdf.service.ts` -> PDFKit)
           │
     Background Worker (`src/jobs/`)
     └── ReportJobQueue (`reportQueue.ts`)
           │
     Repository Layer (`src/repositories/`)
     ├── ProjectRepository (`project.repository.ts`)
     ├── TaskRepository (`task.repository.ts`)
     ├── AiPlanRepository (`aiPlan.repository.ts`)
     └── ReportRepository (`report.repository.ts`)
           │
     PostgreSQL Database (`src/db/` -> `pg.Pool`)
```

---

## Concepts Implemented

| Concept | Implementation Summary | Where It Lives |
| :--- | :--- | :--- |
| **API endpoints** | RESTful Express API with standardized HTTP status codes (`200`, `201`, `202`, `204`, `400`, `401`, `404`, `500`) and Zod validation | `src/routes/`, `src/middleware/validate.ts` |
| **Database** | PostgreSQL 16 database with parameterized SQL, connection pooling, and deterministic schema | `src/db/`, `src/repositories/`, `init.sql` |
| **Authentication** | Supabase Auth integration (signup, login, logout) with reusable JWT Bearer auth middleware | `src/middleware/auth.ts`, `src/services/auth.service.ts`, `src/routes/auth.routes.ts` |
| **Background jobs** | Asynchronous in-process job worker tracking state transitions (`queued`, `processing`, `completed`, `failed`) with non-blocking `202 Accepted` | `src/jobs/reportQueue.ts`, `src/services/report.service.ts` |
| **PDF reporting** | PDFKit report generation engine building multi-page project summaries saved to `output/reports/` | `src/services/pdf.service.ts`, `src/routes/report.routes.ts` |
| **LLM integration** | Google Gemini API integration generating structured development plans validated with Zod and logged with token usage | `src/services/ai.service.ts`, `src/routes/ai.routes.ts` |

---

## Project Structure

```
devtask-ai/
├── src/
│   ├── app.ts                  # Express application factory & middleware setup
│   ├── server.ts               # Server startup, db init, graceful shutdown
│   ├── config/
│   │   └── index.ts            # Environment variable configuration
│   ├── db/
│   │   ├── index.ts            # PostgreSQL pool and db query helper
│   │   └── seed.ts             # Demo data population script
│   ├── docs/
│   │   └── openapi.json        # OpenAPI 3.0 specification
│   ├── jobs/
│   │   └── reportQueue.ts      # In-process asynchronous report job queue
│   ├── middleware/
│   │   ├── auth.ts             # JWT Bearer token verification middleware
│   │   ├── errorHandler.ts     # Global error handler and AppError class
│   │   └── validate.ts         # Zod schema request validation middleware
│   ├── repositories/
│   │   ├── aiPlan.repository.ts# AI plan PostgreSQL queries
│   │   ├── project.repository.ts# Project queries and task metrics
│   │   ├── report.repository.ts # Report job queries and status updates
│   │   └── task.repository.ts   # Task CRUD queries
│   ├── routes/
│   │   ├── ai.routes.ts        # POST /ai/plan, GET /ai/plans/:id
│   │   ├── auth.routes.ts      # POST /auth/signup, /login, /logout
│   │   ├── docs.routes.ts      # Swagger UI on /docs
│   │   ├── health.routes.ts    # GET /health
│   │   ├── project.routes.ts   # Project & nested task/report routes
│   │   ├── report.routes.ts    # GET /reports/:id, /download
│   │   └── task.routes.ts      # Task CRUD routes
│   ├── services/
│   │   ├── ai.service.ts       # Gemini LLM integration & schema parser
│   │   ├── auth.service.ts     # Supabase Auth client service
│   │   ├── pdf.service.ts      # PDFKit report generator
│   │   ├── project.service.ts  # Project business logic
│   │   ├── report.service.ts   # Report generation orchestrator
│   │   └── task.service.ts     # Task business logic
│   └── types/
│       └── index.ts            # Domain and Express request TypeScript interfaces
├── tests/
│   └── api.test.ts             # Comprehensive automated test suite
├── docs/
│   └── capstone-plan.md        # Milestone 1 one-pager capstone plan
├── output/
│   └── reports/                # Generated PDF report artifacts
├── .env.example                # Documented environment variable template
├── .gitignore                  # Git ignore rules
├── Dockerfile                  # Multi-stage production container build
├── docker-compose.yml          # Multi-container stack (app + postgres)
├── init.sql                    # Deterministic database schema & indexes
├── jest.config.js              # Jest configuration for TypeScript
├── package.json                # Project dependencies and npm scripts
├── tsconfig.json               # TypeScript compiler options
├── My 10x Solution - Alok Singh.md # Capstone submission document
└── README.md                   # Project documentation
```

---

## Environment Variables

Create a `.env` file in the root directory by copying `.env.example`:

```bash
cp .env.example .env
```

| Variable | Description | Default / Example |
| :--- | :--- | :--- |
| `PORT` | HTTP port for Express server | `3000` |
| `NODE_ENV` | Runtime environment (`development`, `production`, `test`) | `development` |
| `DATABASE_URL` | PostgreSQL connection URL | `postgres://postgres:postgrespassword@localhost:5432/devtask_db` |
| `SUPABASE_URL` | Supabase project URL | `https://your-project.supabase.co` |
| `SUPABASE_ANON_KEY` | Supabase anonymous API key | `your-supabase-anon-key` |
| `SUPABASE_SERVICE_ROLE_KEY`| Supabase service role key (optional/server only) | `your-supabase-service-role-key` |
| `GEMINI_API_KEY` | Google Gemini API key | `your-gemini-api-key` |
| `REPORT_OUTPUT_DIR` | Directory for generated PDF files | `./output/reports` |

---

## Setup

### Prerequisites
- Node.js v20+ or v22+
- npm v10+
- Docker & Docker Compose (optional for containerized run)

### Installation
```bash
# Clone or navigate to the repository
cd devtask-ai

# Install dependencies
npm install

# Build TypeScript
npm run build
```

---

## Run Locally

```bash
# 1. Start PostgreSQL (e.g., via Docker or local service)
# If using Docker for postgres only:
# docker run --name devtask-postgres -e POSTGRES_PASSWORD=postgrespassword -e POSTGRES_DB=devtask_db -p 5432:5432 -d postgres:16-alpine

# 2. Run the development server with live reload
npm run dev

# 3. Seed demo data (optional)
npm run seed
```

---

## Run with Docker

Start the full stack (PostgreSQL + DevTask AI Node.js App) with a single command:

```bash
# Start containers with persistent volume
docker compose up --build -d

# View logs
docker compose logs -f app

# Stop containers
docker compose down
```

The server will be live at `http://localhost:3000`.

---

## API Reference

### Health
- `GET /health`: Returns server status and database connectivity.

### Authentication (`/auth`)
- `POST /auth/signup`: `{ "email": "...", "password": "..." }` -> Register user (201)
- `POST /auth/login`: `{ "email": "...", "password": "..." }` -> Authenticate and receive Bearer JWT (200)
- `POST /auth/logout`: Log out current user session (200, Protected)

### Projects (`/projects`)
- `POST /projects`: `{ "name": "...", "description": "..." }` -> Create project (201, Protected)
- `GET /projects`: List all projects for authenticated user with task counts (200, Protected)
- `GET /projects/:id`: Get project details and task metrics (200, Protected)
- `PUT /projects/:id`: `{ "name": "...", "status": "active" | "archived" | "completed" }` -> Update project (200, Protected)
- `DELETE /projects/:id`: Delete project and cascading tasks (204, Protected)

### Tasks (`/tasks` & `/projects/:projectId/tasks`)
- `POST /projects/:projectId/tasks`: `{ "title": "...", "description": "...", "priority": "high", "status": "pending" }` -> Create task (201, Protected)
- `GET /projects/:projectId/tasks`: List all tasks for project (200, Protected)
- `GET /tasks/:id`: Get task details (200, Protected)
- `PUT /tasks/:id`: `{ "title": "...", "status": "completed", "priority": "critical" }` -> Update task (200, Protected)
- `DELETE /tasks/:id`: Delete task (204, Protected)

### AI Planner (`/ai`)
- `POST /ai/plan`: `{ "task": "...", "project_id": "..." }` -> Generate structured plan with Gemini (201, Protected)
- `GET /ai/plans/:id`: Retrieve saved AI plan (200, Protected)

### Background Reports (`/reports` & `/projects/:id/reports`)
- `POST /projects/:id/reports`: Enqueue background PDF generation job (202 Accepted, Protected)
- `GET /reports/:id`: Get report job status (`queued`, `processing`, `completed`, `failed`) (200, Protected)
- `GET /reports/:id/download`: Download generated PDF binary file (200, Protected)

---

## Swagger

Interactive Swagger UI documentation is available at:
```
http://localhost:3000/docs
```
Machine-readable OpenAPI 3.0 specification:
```
http://localhost:3000/docs/openapi.json
```

---

## AI Planner

The AI Planner (`POST /ai/plan`) accepts a development task prompt and outputs a strictly verified JSON structure:

```json
{
  "message": "AI Implementation Plan generated successfully",
  "data": {
    "id": "18f972b2-f1d2-43ce-9b7e-07e15dc012a4",
    "project_id": "4030ab26-131e-49fd-b990-478b288de069",
    "task_input": "Build JWT authentication for Express REST API",
    "goal": "Implement secure JWT Bearer authentication middleware with Supabase",
    "prerequisites": ["Node.js v20+", "Supabase Project Credentials"],
    "steps": [
      "Install @supabase/supabase-js and jsonwebtoken",
      "Create auth middleware to verify Bearer tokens",
      "Protect project and task routes"
    ],
    "files_or_areas_to_modify": ["src/middleware/auth.ts", "src/services/auth.service.ts"],
    "testing_checklist": ["Reject missing token with 401", "Allow valid token with 200"],
    "risks": ["Token expiration handling", "Leaked environment variables"],
    "model_name": "gemini-1.5-flash",
    "prompt_tokens": 142,
    "output_tokens": 310,
    "total_tokens": 452
  }
}
```

---

## Background Reports

When `POST /projects/:id/reports` is requested:
1. The endpoint validates the project and enqueues a background job.
2. The server responds immediately with **`202 Accepted`**.
3. An in-process worker fetches project metadata, task statistics, completed/pending tasks, and AI plans.
4. **PDFKit** renders a formatted multi-page PDF document saved to `output/reports/`.
5. Job state transitions from `queued` -> `processing` -> `completed`.
6. The client can poll `GET /reports/:id` and download the file via `GET /reports/:id/download`.

---

## Seed / Demo Data

To populate the database with demo data:
```bash
npm run seed
```
Creates:
- Demo user reference (`00000000-0000-0000-0000-000000000001`)
- 2 Demo projects (`DevTask Backend API`, `DevTask Cloud Infrastructure`)
- Multiple tasks covering completed, in-progress, and pending states across varying priorities.

---

## Testing

Run the automated test suite covering all 12 core requirements with Jest and Supertest:

```bash
npm test
```

### Test Coverage Highlights:
1. `GET /health` -> 200 OK & Database connected
2. `POST /projects` -> 201 Created
3. Missing project title -> 400 Bad Request
4. Missing or invalid Authorization header -> 401 Unauthorized
5. Non-existent project ID / user isolation -> 404 Not Found
6. Task creation -> 201 Created
7. Task update -> 200 OK
8. Task deletion -> 204 No Content
9. AI Planner prompt validation & strict Zod schema validation
10. Background report job creation -> 202 Accepted
11. Report job status transitions (`queued` -> `processing` -> `completed`)
12. Database persistence, relational integrity, and cascade deletion

---

## 5-Minute Demo Path

Follow these 9 steps to experience the complete workflow:

1. **Start System**: Run `docker compose up --build -d` (or `npm run dev`).
2. **Open Swagger UI**: Navigate to `http://localhost:3000/docs`.
3. **Register/Login**: Send `POST /auth/signup` or `POST /auth/login` with your email and password to receive your JWT access token.
4. **Authorize**: In Swagger UI, click **Authorize** at the top and paste your token (or add `Authorization: Bearer <token>` in Postman/curl).
5. **Create a Project**: Send `POST /projects` with `{"name": "E-Commerce Checkout API", "description": "Payment and order processing"}` -> Returns `201 Created` with project ID.
6. **Create Tasks**: Send `POST /projects/:projectId/tasks` with `{"title": "Implement Stripe Webhook Handler", "priority": "high"}` -> Returns `201 Created`.
7. **Generate AI Plan**: Send `POST /ai/plan` with `{"task": "Build idempotent Stripe webhook processing with signature verification", "project_id": "<your-project-id>"}` -> Returns `201 Created` with verified architectural plan and token metrics.
8. **Request PDF Report**: Send `POST /projects/:projectId/reports` -> Returns `202 Accepted` with report job ID.
9. **Download PDF Report**: Poll `GET /reports/:reportId` until status is `completed`, then open `GET /reports/:reportId/download` to view the generated PDF report.

---

## Security
- **Environment Variables**: Sensitive credentials (`GEMINI_API_KEY`, `SUPABASE_ANON_KEY`, `DATABASE_URL`) are loaded from `.env` and never hardcoded.
- **Git Hygiene**: `.env`, `node_modules/`, and generated PDF reports are strictly ignored in `.gitignore`.
- **Authentication**: Passwords are never stored on the local database; authentication is delegated to Supabase Auth.
- **Route Protection**: All sensitive routes are guarded with `requireAuth` verifying Bearer JWT tokens.
- **Input Validation**: All request bodies, parameters, and query strings are parsed and validated with strict Zod schemas.
- **LLM Output Sanitization**: LLM output from Gemini is parsed as JSON and strictly validated against Zod schema definitions before persistence, preventing prompt injection or unstructured payloads.

---

## Future Ideas
- **Multi-Tenant Team Collaboration**: Role-based access control (RBAC) with team workspaces.
- **Distributed Job Queue**: Redis-backed BullMQ queue for multi-instance horizontal scaling.
- **GitHub / Jira Integration**: Bi-directional syncing of generated AI implementation plans into GitHub issues or Jira tickets.
- **Interactive Webhook Callbacks**: Webhook notifications sent to third-party endpoints when background PDF generation completes.
