# DevTask AI — Capstone One-Pager & Plan

## 1. Problem Statement
Software developers, engineering leads, and technical founders spend hours deciphering ambiguous requirements, feature requests, or bug tickets into concrete, actionable execution plans. Manual planning often overlooks critical prerequisites, affected files, edge cases, and automated testing checklists. This leads to scope creep, architectural rework, and wasted engineering hours.

## 2. Target Users
- **Backend & Full-Stack Engineers**: Developers seeking instant, structured architectural breakdown of implementation tasks.
- **Engineering Leads & Technical Product Managers**: Teams needing standardized technical planning, task tracking, and downloadable PDF progress reports.
- **Solo Developers & Startup Founders**: Builders who need a 10x multiplier to turn user stories directly into structured execution checklists.

## 3. 10x Claim
> **"Turn a vague development task into a verified implementation plan in seconds instead of planning it manually from scratch."**

By leveraging Google Gemini LLM with strict Zod schema validation, DevTask AI converts ambiguous prompts (e.g., *"Build authentication for my Express API"*) into granular goals, prerequisites, step-by-step instructions, affected code areas, testing checklists, and technical risks in under 5 seconds.

## 4. Six Program Concepts Implemented

| # | Concept | Implementation | Location in Codebase |
|---|---|---|---|
| 1 | **API Endpoints** | RESTful Express.js API following standard HTTP semantics (`200 OK`, `201 Created`, `202 Accepted`, `204 No Content`, `400 Bad Request`, `401 Unauthorized`, `404 Not Found`, `500 Internal Error`) with Zod request/response validation. | `src/routes/`, `src/middleware/validate.ts` |
| 2 | **Database** | PostgreSQL 16 persistence using parameterized queries, deterministic `init.sql` schema, and isolated repository pattern. | `src/db/`, `src/repositories/`, `init.sql` |
| 3 | **Authentication** | Supabase Auth integration (signup, login, logout) with reusable JWT Bearer token verification middleware for user-scoped access. | `src/middleware/auth.ts`, `src/services/auth.service.ts`, `src/routes/auth.routes.ts` |
| 4 | **Background Jobs** | In-process asynchronous job queue/worker system tracking state transitions (`queued` -> `processing` -> `completed` / `failed`) returning `202 Accepted` immediately. | `src/jobs/`, `src/services/report.service.ts` |
| 5 | **Reporting as PDF** | PDFKit engine generating multi-page PDF project summaries (metadata, task statistics, pending vs completed tasks, AI plans) stored in `output/reports/`. | `src/services/pdf.service.ts`, `src/routes/report.routes.ts` |
| 6 | **LLM Integration** | Google Gemini API integration producing structured implementation plans strictly validated by Zod schemas and recording model token usage. | `src/services/ai.service.ts`, `src/routes/ai.routes.ts` |

## 5. Explicit Non-Goals
To maintain architectural purity and deliver a high-quality MVP:
- **No Mobile App**: API-first with Swagger UI documentation.
- **No Payments / Billing**: Focus exclusively on planning and task lifecycle.
- **No Real-Time Chat / WebSockets**: Clean REST request-response cycle and polled job status.
- **No Team Collaboration / Multi-Tenancy Sharing**: Data is isolated per authenticated user.
- **No Unnecessary Microservices**: Modular monolith architecture with clean layer separation.
- **No Kubernetes / Heavy Cloud Infra**: Lightweight, single-command Docker Compose deployment.
- **No Complex Frontend Dashboard**: API-first interface documented via interactive OpenAPI/Swagger UI.

## 6. System Architecture

```
                               ┌────────────────────────────────┐
                               │  Client / Swagger UI / Tests   │
                               └───────────────┬────────────────┘
                                               │ HTTP / Bearer JWT
                                               ▼
                               ┌────────────────────────────────┐
                               │     Express Router Layer       │
                               │        (`src/routes/`)         │
                               └───────────────┬────────────────┘
                                               │
                                               ▼
                               ┌────────────────────────────────┐
                               │       Middleware Layer         │
                               │  - Auth (Supabase Bearer JWT)  │
                               │  - Validate (Zod Schemas)      │
                               │  - Error Handling & Logging    │
                               └───────────────┬────────────────┘
                                               │
                                               ▼
                               ┌────────────────────────────────┐
                               │         Service Layer          │
                               │  - AuthService                 │
                               │  - ProjectService & TaskService│
                               │  - AiPlannerService (Gemini)   │
                               │  - ReportService & Queue       │
                               └───────────────┬────────────────┘
                                               │
                       ┌───────────────────────┴───────────────────────┐
                       ▼                                               ▼
        ┌──────────────────────────────┐                ┌──────────────────────────────┐
        │       Repository Layer       │                │     Background Worker /      │
        │ - ProjectRepository          │                │         PDF Engine           │
        │ - TaskRepository             │                │ - ReportJobQueue             │
        │ - AiPlanRepository           │                │ - PDFKit Generator           │
        │ - ReportRepository           │                └──────────────────────────────┘
        └──────────────┬───────────────┘
                       │ Parameterized SQL
                       ▼
        ┌──────────────────────────────┐
        │     PostgreSQL Database      │
        └──────────────────────────────┘
```

## 7. Core Features
1. **User Authentication**: Secure signup, login, and logout via Supabase Auth with JWT bearer token verification.
2. **Project & Task Management**: Full CRUD operations for projects and tasks with status and priority tracking.
3. **AI Development Planner**: Turn vague task descriptions into verified, structured technical implementation plans with Gemini.
4. **Asynchronous PDF Reporting**: Non-blocking background job queue generating formatted PDF project summary documents.
5. **Interactive API Documentation**: OpenAPI 3.0 specification served via Swagger UI at `/docs`.
