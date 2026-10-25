# ClinicFlow Web

The interface tier for **ClinicFlow** — an appointment and queue management system for a fictional demonstration clinic ("Demo Community Clinic").

> **Disclaimer:** ClinicFlow is for demonstration purposes only. All patient data, appointments, and metrics are simulated. It holds no clinical information and makes no clinical or triage decisions.

---

## Table of Contents

1. [Tech Stack](#tech-stack)
2. [Getting Started](#getting-started)
3. [Available Commands](#available-commands)
4. [Architecture Overview](#architecture-overview)
5. [Demo Credentials](#demo-credentials)
6. [The Optimistic Check-In](#the-optimistic-check-in)
7. [Slow & Dropped Connections](#slow--dropped-connections)
8. [Performance Targets](#performance-targets)
9. [Accessibility (WCAG 2.2 AA)](#accessibility-wcag-22-aa)
10. [Static Hosting & Free-Tier Terms](#static-hosting--free-tier-terms)

---

## Tech Stack

- **Framework:** React 19 + Vite (SPA)
- **Language:** TypeScript (strict mode, zero `any`)
- **Styling:** Tailwind CSS v4, `cn()` utility from `@/lib/utils`
- **UI Primitives:** Radix UI primitives (`@radix-ui/react-*`), Lucide React icons
- **State & Data Layer:** Redux Toolkit 2 + RTK Query (`createApi` with modular injection)
- **Session Persistence:** `redux-persist` (auth state only)
- **Routing:** React Router v7 (`createBrowserRouter` with lazy-loaded staff routes)
- **Forms & Validation:** Formik 2 + Yup 1
- **Toasts:** Sonner (`toast`)
- **Mock Service:** Stoplight Prism (`@stoplight/prism-cli`)
- **Contract Type Generation:** `openapi-typescript`

---

## Getting Started

### Prerequisites

- Node.js >= 20
- `pnpm` >= 9

### Installation

```bash
pnpm install
```

### Environment Setup

Copy `.env.example` to `.env.local`:

```bash
cp .env.example .env.local
```

Default configuration:
```env
VITE_API_BASE_URL=http://localhost:4010
```

### Running Locally with Mock API

In terminal 1, start the Prism mock server running the OpenAPI contract:
```bash
pnpm mock
```

In terminal 2, start the Vite development server:
```bash
pnpm dev
```

The application will be live at `http://localhost:5173`.

---

## Available Commands

| Command | Purpose |
|---|---|
| `pnpm dev` | Starts Vite dev server (port 5173) |
| `pnpm build` | Production build (`tsc -b && vite build`) with code-splitting |
| `pnpm preview` | Serves the production build locally |
| `pnpm typecheck` | Strict TypeScript verification (`tsc --noEmit`) |
| `pnpm lint` | Runs ESLint including `jsx-a11y` rules |
| `pnpm test` | Runs unit tests via Vitest |
| `pnpm format` | Formats codebase with Prettier |
| `pnpm mock` | Launches Prism mock server on port 4010 |
| `pnpm gen:api` | Regenerates schema types from OpenAPI specification |

---

## Architecture Overview

ClinicFlow enforces strict one-way architectural boundaries:

```
src/
├── api/                  # Generated contract types (schema.d.ts) — never edited manually
├── models/               # Domain type aliases and argument types derived from schema
├── services/             # Base RTK Query API, custom base query with problem handling
│   ├── endpoints/        # Modular injected endpoints (patient, slots, appointments, queue, etc.)
│   └── httpClient/       # Custom fetchBaseQuery and ApiError problem discriminators
├── store/                # Redux store, typed hooks, persisted authSlice
├── components/
│   ├── ui/               # Pure presentation primitives (Radix-backed, no store/formik dependencies)
│   ├── shared/           # Cross-feature components (StateView, EstimateText, StatusBadge, Formik adapters)
│   └── layout/           # PatientLayout, StaffLayout, StaffGate, DemoBanner, OfflineBar
├── modules/              # Domain-specific feature blocks (booking, tracking, appointments, queue, dashboard)
├── routes/               # Top-level page components (patient and staff routes)
└── utils/                # Pure utilities: clinicTime (Africa/Lagos), problemMessages, status, routes
```

### Dependency Rules:
1. `components/ui` never imports store, services, Formik, or Yup.
2. `components/shared` never imports from `modules` or `routes`.
3. Feature modules never import sideways from each other; shared logic lives in `components/shared` or `utils`.
4. All types derive from generated schema aliases in `src/models/`.

---

## Demo Credentials

These accounts are **demonstration only**. They are seeded by the [ClinicFlow API](https://github.com/codefather99/clinicflow-api) and give access to fictional data alone.

| Role | Email | Password |
| --- | --- | --- |
| Receptionist | `reception@clinicflow.demo` | `Reception-Demo-1` |
| Admin | `admin@clinicflow.demo` | `Admin-Demo-1` |

Sign in at `/staff/login`. The login screen does not pre-fill these, and they are not stored in the app bundle.

---

## The Optimistic Check-In

Checking in a patient is the single **optimistic mutation** in ClinicFlow:

1. **Immediate Feedback:** When staff clicks "Check In", the appointment card/row updates instantly in the UI state without waiting for network round-trip.
2. **Server Verification:** The mutation dispatches with an `expectedStatus: "BOOKED"` precondition.
3. **Rollback on Conflict (`STALE_STATE`):** If another receptionist checked in or cancelled the patient concurrently, the server rejects the write with a 409 `STALE_STATE` problem response containing `problem.current`.
4. **Resolution:** The RTK Query pessimistic rollback handler catches the rejection, reverts the optimistic patch, refetches the appointment record, and surfaces a banner: *"This appointment is already [status]. Board refreshed."* The receptionist is never left looking at an incorrect state.

---

## Slow & Dropped Connections

ClinicFlow is built to operate predictably under adverse network conditions:

| Scenario | Application Behavior |
|---|---|
| **Slow initial load** | Content skeletons render instantly. If loading exceeds 3 seconds, a notification displays: *"Waking up the demo server… (free-tier servers sleep when idle)"*. |
| **Read failure (offline / timeout)** | Cached data remains visible, annotated with *"Couldn't refresh — last updated hh:mm:ss"*, alongside an actionable *"Try again"* button. Stale data is never represented as current. |
| **Booking in-flight connection drop** | Does not assume failure. Surfaces: *"We couldn't confirm your booking. Check with your reference or try again."* Retrying resends the identical `Idempotency-Key`, guaranteeing no duplicate slot reservations. |
| **Check-in / Status drop** | Undoes the optimistic patch, queries the server for ground truth, and informs staff: *"We couldn't confirm that change. Here is the current status."* |
| **Reschedule / Cancel drop** | Safely retried; operations are idempotent. |
| **Live queue tracking stream drops** | Automatically triggers polling fallback every 10 seconds while SSE attempts reconnection, displaying a *"Reconnecting…"* badge. |
| **Browser offline (`navigator.onLine === false`)** | Global `OfflineBar` activates, disabling mutating write actions with clear explanatory tooltips. |

---

## Performance Targets

- **Target LCP (Largest Contentful Paint):** <= 2.5s on mid-range mobile over 4G.
- **Target INP (Interaction to Next Paint):** <= 200ms.
- **Target CLS (Cumulative Layout Shift):** <= 0.1.

### Bundle Strategy
- **Vendor Splitting:** Code-split into modular Rollup chunks (`vendor-react`, `vendor-redux`, `vendor-ui`, `vendor-forms`). Main bundle size is reduced to **~353 KB** (107 KB gzipped).
- **Lazy Routing:** All staff routes (`/staff/*`) are dynamically imported via `React.lazy`, ensuring patient-facing visitors download zero staff administration JavaScript.

*Actual production measurements will be recorded post-deployment using web-vitals reporting.*

---

## Accessibility (WCAG 2.2 AA)

- **Strict Form Controls:** Fully paired `label` and form controls via `htmlFor`/`id` combinations.
- **Live Regions:** Status changes and queue shifts are vocalized using `aria-live="polite"` regions (`<LiveRegion />`).
- **Color Independence:** Status badges combine distinctive geometric icons, semantic background tints, and explicit text labels. Status is never conveyed through color alone.
- **Keyboard Trapping & Escape:** Modals and dialogs trap keyboard focus and dismiss cleanly on `Escape`.
- **Target Sizes:** Touch targets meet the minimum 44x44px physical or interactive boundary.

---

## Static Hosting & Free-Tier Terms

- **Hosting Platform:** *To be selected during final release phase (e.g., Cloudflare Pages / Vercel / Netlify).*
- **Verification Requirement:** Platform terms and free-tier allowance (bandwidth, build limits, project allocations) will be documented here with the verification date prior to production launch.
