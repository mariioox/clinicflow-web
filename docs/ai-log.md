# AI Output Log

This log records cases where AI-generated output was verified and found to be incorrect, as required by the TeSA capstone brief. Each entry documents what the AI claimed, how it was checked, what was actually true, and what was done about it.

## Entries

### 1. `react-router` vs `react-router-dom` in Vite manualChunks — 2026-10-24

**What the AI claimed:** That `react-router` was a valid entry module for Vite's `manualChunks` configuration.

**How it was checked:** `pnpm build` failed with `Could not resolve entry module "react-router"`.

**What was true:** The installed package is `react-router-dom` (v7.1.5), not `react-router`. In React Router v7, `react-router-dom` is still the correct import for browser entry bundles.

**What was done:** Changed the manualChunks entry from `react-router` to `react-router-dom`. Build succeeded and chunk split as expected.

---

### 2. `ApiError` union — direct property access fails — 2026-10-24

**What the AI claimed:** That `error.problem` could be accessed directly on the `ApiError` union type in multiple components.

**How it was checked:** `pnpm typecheck` reported TS errors: TypeScript cannot access `.problem` on a union where one branch (`kind: "network"`) lacks that property.

**What was true:** The `ApiError` type is a discriminated union (`kind: "problem" | "network"`). `.problem` only exists on the `kind: "problem"` branch. You must narrow with `error.kind === "problem"` before accessing `.problem`.

**What was done:** Created `getErrorMessage(error: unknown)` helper in `src/utils/problemMessages.ts` that safely handles both union branches, and refactored components to use this helper.

---

### 3. `as const` in `.map()` callback — 2026-10-24

**What the AI claimed:** Used `ApiTags.Appointment as const` inside a `.map()` callback for tag invalidation.

**How it was checked:** `pnpm typecheck` reported that `as const` assertions are not valid in expression positions like this.

**What was true:** `as const` can only be applied to literal expressions, not enum member references. The enum value was already typed.

**What was done:** Removed the `as const` assertion.

---

### 4. `<label>` without form controls trigger jsx-a11y errors — 2026-10-24

**What the AI claimed:** Used `<label>` elements for static text headings or without matching control `id`/`htmlFor` associations.

**How it was checked:** `eslint` with `jsx-a11y` flagged 10 errors for `jsx-a11y/label-has-associated-control`.

**What was true:** Under strict accessibility linting, `<label>` elements must explicitly reference a form control via `htmlFor` or contain the control as a child. Pure static headings/labels must use semantic `<span>` or headings instead.

**What was done:** Replaced static `<label>` elements with `<span>` and linked input controls with proper `htmlFor` and `id` pairing. All 10 lint errors were eliminated.
