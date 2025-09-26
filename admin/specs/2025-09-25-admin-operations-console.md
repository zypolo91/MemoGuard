# Admin Operations Console

## Overview
- Extend the existing Next.js 14 + Tailwind CSS admin app to deliver a full CRUD management interface for Supabase-backed data.
- Modules in scope: Memories, Tasks, Patient profile & assessments, Caregiver profile & preferences, Insight articles, End users, Admin users.
- Provide production-ready navigation, role-aware access, and a phased approach that first ships core lists + CRUD before layering on advanced UX.

## Goals
- Ship an authenticated admin shell with persistent sidebar navigation, top-level header, and per-section breadcrumbs/actions.
- Implement list/detail/create/edit/delete workflows for every module using the existing `/api/*` routes and Drizzle models.
- Enforce UI role permissions so only authorized roles can view or mutate each module.
- Align client-side validation with the server Zod schemas to surface actionable error messages before hitting the API.
- Use TanStack Query to orchestrate fetching, optimistic updates, and cache invalidation so data stays fresh without reloads.

## Non-Goals
- Public/mobile layouts, analytics dashboards, bulk import/export, or real-time sockets.
- Building new storage for media uploads beyond the stubbed `/api/uploads` route.
- Implementing server-side auth/session wiring (out of scope for this spec; assumes middleware will be added separately).

## System Context
- **Frontend**: Next.js 14 app router (TypeScript), Tailwind CSS, shadcn/ui primitives, TanStack Query, react-hook-form + Zod.
- **Backend**: Next API routes proxying Supabase (Postgres) via Drizzle ORM.
- **Auth**: Lucia available but not wired yet; UI must integrate cleanly once auth middleware lands.

## High-Level Architecture
1. **Application Shell**
   - Server `layout.tsx` wraps sidebar navigation, header (environment badge, quick actions), and main content.
   - Routes: `/dashboard` (placeholder overview), `/memories`, `/tasks`, `/patient`, `/caregiver`, `/insights`, `/users`, `/admins`.
2. **Data Layer**
   - Client API wrapper (reuse or extend `app/services/api/*`) with typed helpers per module.
   - TanStack Query handles data fetching, pagination, and mutation-side cache invalidation.
3. **Forms**
   - `react-hook-form` + Zod resolver for all create/edit views; disable submit while pending; show inline and toast feedback via `sonner`.
4. **UI Patterns**
   - Tables/lists with filters, selection, and empty/loading states.
   - Slide-over or modal editors for create/edit, confirmation dialogs for destructive actions.
   - Detail panes/drawers providing richer context (media thumbnails, history timelines, etc.).

## Role-Based Access Model
- **Roles**: `superadmin`, `manager`, `editor`, `viewer` (matching `admin_role` enum).
- **Permissions Matrix**
  - *Superadmin*: Full access to every module, including admin CRUD.
  - *Manager*: Full access to Memories, Tasks, Patient, Caregiver, Insights, Users; read-only for Admin users.
  - *Editor*: Read/create/update Memories, Tasks, Insights; read-only Patient/Caregiver; no Users/Admins access.
  - *Viewer*: Read-only access to Memories, Tasks, Insights; no mutations.
- UI enforcement: hide nav links the role cannot access, disable/guard actions, show authorization errors returned by API.

## Module Requirements
### Memories
- Table columns: title, eventDate, mood, tags, createdAt; filters for tag, date range, search.
- Detail drawer with media gallery, annotations, insights summary.
- Create/edit supports text, tags/people chips, rich text content, media list reordering.
- Delete cascade via API with confirmation modal.

### Tasks
- Table columns: title, priority, frequency, dueAt, reminders/history counts.
- Filters: priority enum, status, due date range.
- Detail view: history timeline, reminders list with inline edit; allow status updates.
- Create/edit form: title, description, priority, frequency, dueAt, reminder metadata.

### Patient
- Profile section editable fields: fullName, avatarUrl, birthDate, diagnosis, notes.
- Assessments tab: table (template, metric, value, status, recordedAt), create/edit/delete modals using templates list; chart placeholder.

### Caregiver
- Profile card: name, avatar, streak, bio.
- Preferences form: notification toggles, language select, theme select, followedTopics chips.

### Insights
- Grid: title, topic, source, bookmark, publishedAt.
- Filters: topic search, bookmark toggle.
- Actions: toggle bookmark, edit metadata, delete article, create article.

### End Users
- Table: fullName, email, role, status, lastLoginAt, createdAt.
- Filters: role, status, search.
- Detail drawer: metadata JSON editor with validation.
- Create/edit dialogs; delete confirmation.

### Admin Users
- Table: username, displayName, role, status, lastLoginAt, email.
- Create flow collects username, password, displayName, email, role, status.
- Edit form updates display/email/role/status + optional password reset.
- Delete confirmation; warn when deleting self (placeholder until auth wired).

### Upload Tester
- Form hitting `/api/uploads` to preview stub response; QA-only.

## Navigation & Layout
- Sidebar groups: “运营数据” (Memories, Tasks, Insights), “健康资料” (Patient, Caregiver), “账户管理” (Users, Admins).
- Header: environment badge (e.g., Supabase), quick action menu (New memory/task/article), role indicator, sign-out placeholder.
- Responsive down to tablet (≥768px); mobile collapse not prioritized but keep layout stable.

## Error Handling & Feedback
- Toast notifications (sonner) for success/failure plus inline errors.
- Empty states with CTA, skeletons for initial load, retry controls for API failures.
- Handle 401/403 by redirecting to `/login` placeholder or showing “无权限” banner.

## Performance & Pagination
- Page size 20; server-driven pagination via `page` + `pageSize` params.
- Invalidate TanStack Query caches after mutations to refresh views.

## Accessibility & i18n
- Semantic HTML, labelled controls, focus trapping in dialogs.
- Copy stored in Simplified Chinese locale strings for future i18n.

## Phased Delivery
1. **Phase 1 — Core CRUD**: Navigation shell, memories/tasks/users/admins lists with CRUD + role enforcement.
2. **Phase 2 — Health Modules**: Patient & caregiver profile + assessments/preferences management.
3. **Phase 3 — Insights & Utilities**: Insights CRUD, uploads tester, polish empty states.

## Acceptance Criteria
1. `/memories`, `/tasks`, `/patient`, `/caregiver`, `/insights`, `/users`, `/admins` render paginated lists with role-aware controls.
2. Authorized users perform create/edit/delete successfully and see changes immediately via cache invalidation.
3. Validation errors are surfaced inline and API errors are shown without leaving stale UI state.
4. Password inputs never reveal stored hashes; resetting generates new server-side hashes only.
5. Running `pnpm tsx scripts/import-mock.ts` seeds data visible across all modules.

## Open Questions
- Lucia integration timeline and required guards/redirects.
- Need for audit logs or history exports?
- Should editor role manage insights beyond bookmark toggles?

## Future Enhancements
- Dashboard analytics, bulk operations, richer media uploads, realtime updates, audit trails.
