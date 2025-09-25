# Backend Integration Migration Plan

## Summary
Establish a production-capable backend in `admin/` using Next.js (App Router), shadcn/ui, and Drizzle ORM, then migrate the Vue front end in `app/` to consume the real API from the new backend while retiring the mock services. The plan follows the capabilities and endpoints defined in `../docs/backend-integration.md`.

## Scope
- Build a new Next.js project under `admin/` that exposes REST APIs for memories, tasks, nutrition/patient data, news, and caregiver profile.
- Model the database tables with Drizzle ORM according to the specification and provide migrations/seed scripts for local development.
- Wire API routes to repositories with validation, error handling, and response contracts matching the spec.
- Introduce a shared HTTP client/service layer in the Vue app (`app/`) that replaces usage of `app/services/mockApi/*` and updates Pinia stores to call the live endpoints.
- Remove mock data paths once equivalent functionality is verified against the new backend.

## Linked Specs
- `../docs/backend-integration.md`

## Assumptions
- PostgreSQL (local or hosted) will be available, and connection details can be provided via environment variables. During development we can default to a Neon/Vercel connection string placeholder.
- Authentication is stubbed: the middleware will pin requests to a demo caregiver/patient identity until a real auth service is integrated.
- The existing Vue UI and component structure stay largely intact; only the data layer and API calls change.
- shadcn/ui components will be added only where the admin dashboard needs server-rendered views; the front-end app continues using its existing UI libraries.

## Out of Scope
- Implementing production-grade auth, rate limiting, or multi-tenant access control.
- Advanced observability/monitoring tooling beyond structured logging.
- Non-PostgreSQL database targets or deployment automation (Docker, CI/CD).
- Migrations of `app/` routes/pages beyond data-fetching adjustments.

## Phased Plan

### Phase 1 每 Backend Foundation
1. Scaffold Next.js 14 (App Router) project under `admin/` with TypeScript, ESLint, testing baseline (Vitest or Jest), and pnpm workspace linkage if needed.
2. Integrate shadcn/ui CLI setup for the dashboard shell; configure base layout and env loading via `dotenv`.
3. Add Drizzle configuration (`drizzle.config.ts`, `lib/db.ts`) pointing to PostgreSQL with Neon/Vercel adapters and generate initial migrations folder.

### Phase 2 每 Data Modeling & Repository Layer
1. Translate spec tables into Drizzle schema modules (memories, memory_media, annotations, insights, tasks, reminder logs, patient_profile, patient_assessments, templates, caregiver_profile, preferences).
2. Create seeds aligning with current mock data (`seed.ts`) for parity; expose a seeding script (e.g., `pnpm db:seed`).
3. Implement repository helpers per domain encapsulating CRUD queries and soft business logic (sorting, filtering by tag/date, template availability checks).

### Phase 3 每 API Routes & Validation
1. Implement REST handlers under `admin/app/api/*` mirroring the endpoints in the spec, using `NextResponse` and `Route Handler` conventions.
2. Define Zod DTOs/request schemas in `admin/lib/dto/*` to validate payloads and unify error formatting (`{ error: { code, message } }`).
3. Add middleware to inject demo user context and basic logging; ensure error handling maps database issues to HTTP responses (404, 422, 500).
4. Provide revalidation hooks (`revalidatePath`) or cache directives for GET endpoints as appropriate.

### Phase 4 每 Frontend Integration & Migration
1. Create a new `app/services/http.ts` (or similar) that wraps `fetch` with base URL, error parsing, and request typing.
2. For each Pinia store (`memories`, `tasks`, `patient`, `profile`, `insights`), replace `mockApi` imports with the new service functions, ensuring optimistic updates or fallbacks remain consistent.
3. Update components/modules that directly use mock utilities (e.g., upload helpers) to call the backend, introducing loading/error states where needed.
4. Remove `app/services/mockApi` once all consumers are swapped and compile-time references are gone.

### Phase 5 每 Hardening & Cleanup
1. Document required environment variables in `admin/.env.example` and update app README with setup instructions.
2. Add integration tests or API smoke tests (e.g., with Supertest) for critical endpoints and ensure unit tests cover schema validation.
3. Run end-to-end validation by pointing the Vue app to the local Next.js server, verifying flows for memories, tasks, assessments, insights, and caregiver profile.
4. Strip obsolete mock seed files and adjust build scripts (package.json) to reflect the new backend commands.

## Impacted Areas
- New directory `admin/` containing backend source, config, and assets.
- Existing Vue app directory (will reorganize services into `app/` and update Pinia stores/modules).
- Dev tooling: pnpm workspace configuration, environment management, and lint/test scripts.

## Dependencies & Setup Notes
- Backend: `next`, `react`, `react-dom`, `typescript`, `@types/node`, `drizzle-orm`, `@neondatabase/serverless` or `@vercel/postgres`, `drizzle-kit`, `zod`, `lucia`/auth stub (optional), `shadcn/ui` CLI dependencies (`tailwindcss`, `class-variance-authority`, `tailwind-merge`), logging helpers (e.g., `pino` optional).
- Testing: `vitest`, `@testing-library/react`, `supertest` (for API tests).
- Frontend adjustments may require adding `cross-fetch` or shared types package if we centralize DTOs.
- Manual steps for you after code lands:
  1. `cd admin && pnpm install` (install Next.js backend deps).
  2. Run shadcn generator (`pnpm dlx shadcn-ui@latest init`) if CLI integration demands prompts.
  3. Configure `.env.local` with `DATABASE_URL` and run `pnpm drizzle:push` / `pnpm db:seed`.
  4. Start backend with `pnpm dev` while Vue app consumes APIs via configured base URL.

## Risks & Mitigations
- **Scope creep:** Large surface area across modules; mitigate by tackling domain by domain and merging frequently.
- **Schema drift:** Front-end expectations may diverge from spec; validate DTOs against existing mock payload shapes before swaps.
- **Environment differences (Windows):** Ensure path handling and scripts favor cross-platform tooling (avoid bash-only commands).
- **Dependency weight:** Next.js + shadcn adds numerous deps; plan workspace boundaries to avoid conflicts with Vite app.
- **Data migrations:** Mistakes in Drizzle schemas could break production later; write migration tests and keep seed data concise.

## Validation Strategy
- Backend: `pnpm lint`, `pnpm test`, `pnpm drizzle:check`, and endpoint smoke tests via `pnpm test:api` (to be added).
- Frontend: `pnpm lint`, `pnpm test`, and targeted manual QA across memories/tasks/nutrition/profile flows.
- Integration: run both servers concurrently (`pnpm dev` in `admin/` and `app/`) and verify network traffic replaces mock usage.

## Approval & Next Steps
- Status: awaiting approval.
- Upon approval, proceed to `/do` stage to implement Phase 1 tasks, ensuring dependency installation is coordinated with you.
