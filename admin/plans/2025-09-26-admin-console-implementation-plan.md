# 2025-09-26 Admin Console Implementation Plan

## Scope
- Implements spec in `specs/2025-09-25-admin-operations-console.md` for the Next.js admin app.
- Covers Memories, Tasks, Patient, Caregiver, Insights, Users, Admins modules plus supporting infrastructure.

## Assumptions
- Backend API routes are stable and already connected to Supabase via Drizzle.
- Auth middleware will be integrated later; we simulate role context client-side for now.
- Seed script (`pnpm tsx scripts/import-mock.ts`) is available for demo data.

## Out of Scope
- New server endpoints, media storage upgrades, analytics dashboards, realtime sockets, audit logging.

## Phases & Tasks

### Phase 0 – Foundations
1. Add role/permission utilities (constants, guards, hooks).
2. Build layout shell: sidebar navigation, header, breadcrumb region, role indicator.
3. Centralize API client + TanStack Query provider with error boundary & toast integration.
4. Provide shared UI primitives (table, toolbar, filter form, modal/slide-over, confirm dialog).

### Phase 1 – Core CRUD (Memories, Tasks, Users, Admins)
1. Memories page: list + filters, detail drawer, create/edit modal, delete flow.
2. Tasks page: list + filters, history/reminders view, create/edit, status updates, delete.
3. Users page: list + filters, metadata detail/editor, create/edit modal, delete.
4. Admin users page: list + filters, create (with password), edit, delete, self-delete guard copy.
5. Wire role-based UI gating for these modules (nav visibility + action permissions).

### Phase 2 – Health Modules (Patient, Caregiver)
1. Patient profile page: editable profile card, assessments table CRUD, chart placeholder.
2. Caregiver page: profile card, preferences form with toggles/selects/chips, validation.
3. Integrate role restrictions (manager+, editor read-only, viewer blocked) as defined.

### Phase 3 – Insights & Utilities
1. Insights page: list + filters, bookmark toggle, create/edit/delete.
2. Upload tester panel calling `/api/uploads` stub.
3. Refine shared empty/loading states; add quick-action shortcuts in header.

### Phase 4 – Validation & Polish
1. QA checklist: run lint/build, execute seed, verify permission matrix for each role.
2. Accessibility pass (focus trap, labels), responsiveness check (tablet breakpoint).
3. Update docs/README with admin usage notes, seeding instructions, role matrix.

## Dependencies / Risks
- Pending auth integration (Lucia) may require reorganizing layout hierarchy later.
- TanStack Query usage assumes consistent API responses (error shape, pagination fields).
- Complex forms (memories media, metadata JSON) need careful validation to avoid data loss.

## Validation Strategy
- `pnpm lint`, `pnpm build`.
- Smoke test each module’s CRUD manually using seeded data.
- Role-based walkthroughs (simulate viewer/editor/manager/superadmin contexts).

## Rollout / Backout
- Deploy feature flags per route if needed; navigation entries can be hidden until module ready.
- Backout by toggling nav visibility and reverting per-module routes if regression detected.

## Next Stage
- Await approval to enter `/do` implementation stage.
