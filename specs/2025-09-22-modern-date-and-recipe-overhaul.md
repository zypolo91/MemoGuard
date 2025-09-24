# Modern Date Picker & Recipe Interaction Overhaul

## Problem Statement
- The hand-rolled calendar control looks desktop-first and falls apart on small screens (tight hit targets, no full-screen view, lacks swipe/month navigation).
- Recipe listing relies on text links for bookmarking and expanding details; the visual hierarchy feels dated and interaction targets are inconsistent with the rest of the app.
- Users can only create recipes; there is no support for editing media/steps or deleting entries, which prevents maintaining an accurate cookbook.
- Recipe cards surface only metadata; ingredients and steps are hidden behind an underpowered expansion block with no imagery, limiting usefulness.

## Goals
- Deliver a mobile-optimized date-picker that works across dark/light themes and touch input while remaining accessible and keyboard friendly.
- Replace text-based bookmarking and detail triggers with icon-driven micro-interactions and make cards themselves the entry-point for detail view.
- Provide end-to-end CRUD flows for recipes, including editing images, ingredients, steps, and deleting entries with proper confirmation.
- Present rich recipe details (hero imagery, ingredient list, step-by-step instructions, nutrition) in an immersive sheet/modal that mirrors the design language used elsewhere.

## Non-Goals
- Building a backend upload pipeline; image handling remains client-side via object URLs or existing mock data.
- Overhauling nutrition analytics or recommendation logic beyond what is needed to display additional fields.
- Reworking unrelated modules (tasks, memories) beyond swapping in the shared date picker component where it is already used.

## Requirements
### Date Selection
- Adopt a maintained Vue date component with mobile support (proposed: [`v-calendar`](https://vcalendar.io/)) and theme it to match the MemoGuard palette.
  - Supports month/year navigation, range for `min`/`max`, and accessible keyboard navigation.
  - Provides responsive modes: popover on desktop, full-screen (or sheet) presentation on small screens.
- Wrap the library inside `UiDatePicker` to keep a consistent API (`v-model`, `placeholder`, optional `min`/`max`).
- Update consumers (`MemoryComposer`, `MemoryComposerSheet`, `RecipeComposerSheet`, and any other date inputs surfaced during implementation) to use the new wrapper. Ensure validation still works.

### Bookmark & Card Interactions
- Replace text buttons for bookmarking recipes with an icon-only toggle (filled vs outline Bookmark icon) with tooltip/aria labels.
- Recipe cards become clickable (while still providing keyboard focus styles) to open the detail view; remove redundant "查看详情" text button.
- Support a persistent “quick actions” tray on each card (bookmark icon, optional edit/delete overflow for owned recipes).

### Recipe CRUD & Detail View
- Introduce a recipe detail sheet/modal (mobile: full-height sheet, desktop: centered modal) showing:
  - Hero image (required field when composing/editing).
  - Meta row (time to cook, difficulty, tags, bookmark toggle).
  - Ingredient list (name, quantity, unit) displayed in an ordered list; empty state prompts user to add via edit button.
  - Step-by-step instructions with numbering and optional media thumbnails per step.
  - Nutrition facts using existing `NutritionFacts` component if data is present.
  - Pairing suggestions.
- Expand recipe composer into a multi-section form allowing:
  - Upload/select hero image (with preview and validation on file type/size).
  - Manage tags, ingredients (repeatable rows), steps (rich text or multi-line descriptions), and nutrition macro inputs.
  - Save as draft (new) or update existing recipe (edit mode populates fields).
- Add delete flow with confirmation modal (mentioning irreversibility).
- Update Pinia store:
  - Extend `RecipeDraft` to include new fields (heroImage, tags, ingredients, steps, nutrition, pairings, difficulty).
  - Implement `updateRecipe(id, payload)` and `removeRecipe(id)` actions with persistence via `saveState`.
  - Ensure bookmarking/editing/deleting keeps reactivity and derived getters (`bookmarked`, `quickMeals`, etc.) accurate.

### Interaction States & Feedback
- Provide loading skeletons or busy indicators when fetching recipes or performing mutations.
- Use toasts/banners for success/error feedback on create/update/delete (reuse app-level notification pattern if available).
- Handle empty states for each collection (no recipes, no bookmarked items, no ingredients/steps) with friendly guidance.

## UX & Interaction Flows
1. **Browse Recipes** → Tap card → Detail sheet slides in → Bookmark via icon, edit/delete via action menu (if permitted).
2. **Add Recipe** → Tap FAB → Composer with hero image picker, ingredient/step editors → Submit → Detail sheet shows newly created recipe.
3. **Edit Recipe** → From detail sheet tap Edit → Composer prefilled → Save → Sheet refreshes with updated content (stay in detail context).
4. **Delete Recipe** → From action menu tap Delete → Confirm modal → Remove from list, show toast, close detail if open.
5. **Bookmark Toggle** → Tap icon on card or detail header → Instant optimistic update with subtle animation.

## Data & State Considerations
- Store hero images using `URL.createObjectURL` for newly uploaded files; persist reference string in local storage (note: persisted object URLs need rehydration logic or convert to base64 in-store).
- Validate ingredient and step arrays to prevent empty rows; ensure the detail view gracefully handles optional fields.
- Use unique IDs for ingredients/steps to support editing and drag-reordering in future (out of scope but facilitated by structure).

## Dependency & Tooling Updates
- Add `v-calendar` (`pnpm add -D v-calendar`) and register globally within `main.ts` (lazy-load styles if necessary).
- Confirm Tailwind config handles any additional utility classes needed for the new layout (e.g., aspect ratios for images).

## Accessibility
- Ensure icon buttons expose `aria-pressed` for bookmark state and provide focus outlines.
- Modal/sheet traps focus, supports ESC/close buttons, and returns focus to originator when closed.
- Form inputs include labels and inline validation messaging.

## Acceptance Criteria
- Date selection in memories/tasks/recipes renders responsively and passes keyboard navigation checks.
- Recipe list shows hero images, icon-based bookmarking, and card click opens detail without requiring additional link text.
- Users can add, edit, and delete recipes with state persisted across reloads.
- Detail view displays ingredients, steps, and nutrition data for both seeded and newly added recipes.
- Bookmark toggles update both list and detail views instantly.
- All new UI meets app theming, spacing, and a11y expectations (WCAG AA contrast, focus states).

## Open Questions
- Should recipe detail also support sharing/export actions now or defer?
- Is offline persistence via LocalStorage sufficient for hero images, or do we need to revisit storage strategy?
- Should tasks or other modules adopt the new detail sheet pattern in this iteration?
