# Implementation Plan: Modern Date Picker & Recipe Interaction Overhaul

## Scope & References
- Aligns with spec: `specs/2025-09-22-modern-date-and-recipe-overhaul.md`
- Focus areas: shared date picker component, recipe list/detail UX, recipe composer & store CRUD enhancements, feedback patterns.

## Assumptions & Out of Scope
- `v-calendar` will be installed by the user (`pnpm add v-calendar`) before `/do` stage begins.
- Image assets continue to rely on local object URLs/mock paths; no backend upload integration.
- Other modules (tasks, memories) only need date-picker swap—no further UX polish in this iteration.
- Existing notification/toast utility is available; if absent, we will add lightweight inline feedback.

## Plan
1. **Integrate `v-calendar` & wrap in `UiDatePicker`**
   - Add provider registration (likely in `main.ts`) and encapsulate theming/responsive behavior inside the component.
   - Preserve `v-model`, `min`, `max`, and placeholder API expected by callers.
2. **Adopt new picker across modules**
   - Replace residual `<input type="date">`/`datetime-local` usages in memories, tasks, recipes, ensuring validation & formatting continue to work.
   - Adjust styles for mobile responsiveness where needed.
3. **Recipe card interaction refresh**
   - Introduce icon-based bookmark toggle and quick-action region.
   - Make entire card (or primary surface) open detail sheet, ensuring keyboard accessibility.
   - Replace textual “查看详情/收藏” controls accordingly.
4. **Recipe detail sheet/modal**
   - Build reusable detail view component (sheet on mobile, modal on desktop) with hero image, metadata, ingredients, steps, nutrition, pairings, and action menu (edit/delete/bookmark).
   - Wire to store data and ensure state sync after edits/deletes.
5. **Enhanced recipe composer & CRUD flows**
   - Expand composer to capture hero image, tags, ingredients, steps, nutrition macros, difficulty, pairings.
   - Support edit mode (prefill, update) and delete confirmation dialog; emit structured payloads.
6. **Pinia store & persistence updates**
   - Extend recipe types/drafts, implement `updateRecipe`, `removeRecipe`, and persistence for new fields.
   - Handle image data persistence strategy (object URL vs base64) per spec guidance.
7. **Feedback & loading states**
   - Add optimistic updates + toasts for bookmark/create/update/delete.
   - Provide skeletons/spinners during fetch & mutation flows; polish empty states.
8. **Validation & polish**
   - Run lint/build/tests (as available) and perform manual UX smoke test across viewport sizes.

## Impacted Areas
- Components: `UiDatePicker`, recipe list/detail/composer, shared modals, icon buttons.
- Stores: `recipes` Pinia store, possibly shared notification utilities.
- Styles: Tailwind utility additions, theme tokens for sheet/modal backgrounds.

## Dependencies & Risks
- `v-calendar` theming complexity; may require SCSS/Tailwind overrides.
- LocalStorage persistence for images may not handle large files; document limitation.
- Expanded forms increase complexity—need clear validation to avoid user frustration.

## Validation Strategy
- Automated: `pnpm lint`, `pnpm test`, `pnpm build` (after dependency install).
- Manual: Verify date picker on mobile/desktop, full recipe CRUD flows, bookmark toggles, accessibility checks (keyboard navigation, focus states).

## Approval Status
- Awaiting user confirmation to proceed to `/do` stage once plan is approved and dependencies installed.
