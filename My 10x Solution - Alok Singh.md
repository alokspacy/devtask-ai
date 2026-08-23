# My 10x Solution: DevTask AI — AI-Powered Developer Task & Project Assistant

**Author**: Alok Singh  
**Track**: FlyRank Backend AI Engineering  
**Capstone**: "Your 10x Solution"  
**Repository**: `devtask-ai`

---

## 1. What Problem Am I Solving?

### The Problem
Engineering teams, solo software developers, and technical project leads spend hours converting vague feature requests, high-level bug tickets, and product specifications into concrete, actionable technical plans. Manual architectural planning is slow, prone to omitting necessary dependencies and prerequisites, misses critical files that need modification, forgets automated test coverage, and overlooks technical and security risks. This results in scope creep, unexpected runtime errors, and wasted engineering cycles.

### Who Has It?
- **Backend & Full-Stack Developers**: Engineers tasked with implementing ambiguous tickets who need immediate architectural clarity.
- **Engineering Leads & Technical PMs**: Leads who need structured task verification, consistency across projects, and exportable PDF progress documentation.
- **Startup Founders & Solo Builders**: Developers who need a 10x productivity multiplier to scaffold and plan complex technical features without manual overhead.

### The 10x Claim
> **"Turn a vague development task into a verified implementation plan in seconds instead of planning it manually from scratch."**

DevTask AI takes an ambiguous task description (e.g., *"Build authentication for my Express API"*) and instantly transforms it into a verified, structured plan consisting of precise goals, prerequisites, step-by-step instructions, specific files to modify, testing checklists, and technical risks in under 5 seconds.

---

## 2. How Did I Implement My Solution?

### System Architecture
DevTask AI is implemented as a clean, modular monolith backend service using the **Route -> Middleware -> Service -> Repository -> PostgreSQL** architecture pattern.

```
Client (HTTP / Bearer JWT)
           │
           ▼
     Express Router (`src/routes/`)
           │
     Middleware (`src/middleware/`: Auth, Zod Validation, Error Handler)
           │
     Service Layer (`src/services/`: Auth, Project, Task, AI Planner, Report, PDF)
           │
     ┌─────┴───────────────────────┬─────────────────────────┐
     ▼                             ▼                         ▼
Repository Layer          Background Job Queue         Google Gemini LLM
(`src/repositories/`)     (`src/jobs/reportQueue.ts`)  (Structured JSON + Zod)
     │                             │
     ▼                             ▼
PostgreSQL Database       PDFKit PDF Generator
(Connection Pool / SQL)   (`output/reports/`)
```

### Six Implemented Program Concepts

DevTask AI implements all 6 core program concepts without any swaps:

1. **API Endpoints**: RESTful Express.js API enforcing clean HTTP semantics (`200`, `201`, `202`, `204`, `400`, `401`, `404`, `500`) with strict Zod request schema validation.  
   *Where it lives*: `src/routes/` and `src/middleware/validate.ts`

2. **Database**: PostgreSQL 16 relational database persistence using parameterized SQL queries, connection pooling (`pg.Pool`), and a deterministic schema with indexes.  
   *Where it lives*: `src/db/`, `src/repositories/`, and `init.sql`

3. **Authentication**: Supabase Auth integration supporting signup, login, and logout with reusable JWT Bearer token verification middleware for isolated user data scoping.  
   *Where it lives*: `src/middleware/auth.ts`, `src/services/auth.service.ts`, and `src/routes/auth.routes.ts`

4. **Background Jobs**: In-process asynchronous job queue and worker tracking state transitions (`queued` -> `processing` -> `completed` / `failed`) returning `202 Accepted` immediately.  
   *Where it lives*: `src/jobs/reportQueue.ts` and `src/services/report.service.ts`

5. **Reporting as PDF**: PDFKit document generation engine building formatted multi-page project summaries (metrics, task lists, and AI plans) saved under `output/reports/`.  
   *Where it lives*: `src/services/pdf.service.ts` and `src/routes/report.routes.ts`

6. **LLM Integration**: Google Gemini API integration generating structured implementation plans strictly validated by Zod schemas with token usage tracking and fallback test modes.  
   *Where it lives*: `src/services/ai.service.ts` and `src/routes/ai.routes.ts`

### Explicit Non-Goals
To ensure exceptional software craftsmanship and MVP reliability:
- No mobile applications
- No payment processing or subscriptions
- No real-time chat or WebSockets
- No multi-tenant team collaboration sharing
- No unnecessary microservices
- No Kubernetes or complex cloud infrastructure
- No complex frontend dashboard (documented via interactive OpenAPI/Swagger UI)

---

## 3. Run Instructions

### A. Run with Docker Compose (Recommended)
```bash
# Build and start PostgreSQL + DevTask AI App
docker compose up --build -d

# Open interactive Swagger UI documentation
# Browser: http://localhost:3000/docs
```

### B. Run Locally
```bash
# 1. Install dependencies
npm install

# 2. Build TypeScript
npm run build

# 3. Start development server
npm run dev

# 4. Seed demo data (optional)
npm run seed

# 5. Run test suite
npm test
```

---

## 4. Main User Flow

1. **User Authentication**: User signs up via `POST /auth/signup` and logs in via `POST /auth/login` to obtain a Supabase JWT Bearer token.
2. **Project Creation**: User creates a workspace via `POST /projects` (e.g., *"E-Commerce API"*).
3. **Task Definition**: User adds development tasks via `POST /projects/:id/tasks` with priorities and initial `pending` statuses.
4. **AI Technical Planning**: User submits a vague development task via `POST /ai/plan`. DevTask AI queries Google Gemini with schema-constrained prompting, validates the JSON output with Zod, records token metrics, and stores the verified execution plan in PostgreSQL.
5. **Asynchronous PDF Reporting**: User triggers `POST /projects/:id/reports`. The API returns `202 Accepted` immediately. The background worker aggregates project metrics, tasks, and AI plans, generates a PDF with PDFKit into `output/reports/`, and marks the job as `completed`.
6. **Report Download**: User polls `GET /reports/:id` and downloads the generated PDF via `GET /reports/:id/download`.
