# AGENT.md — ClinicFlow Web (interface tier)

Architecture and code-structure guide for `clinicflow-web`, the interface for ClinicFlow. It is the **single source of truth** for how screens are built here. Humans and AI agents both follow it.

**How to use this file**

- Every rule is prescriptive. Match it.
- Where existing code contradicts this document, **this document wins**. The old code is technical debt: record it in [Known technical debt](#known-technical-debt) and do not copy it.
- **The contract outranks this file.** `openapi.yaml` in `clinicflow-api` is the only agreement between this app and the service. If this file and the contract disagree about a field, a path or a status code, the contract is right and this file needs fixing.
- Every rule carries its reason when the reason isn't obvious. People break rules they don't understand, so keep the reasons when you edit this file.
- Sources, in order of authority: the **TeSA capstone brief** (requirements and marking), the **contract**, then the API repo's `docs/intent.md` (scope and why), `docs/design.md` (§13 is written for this tier) and `docs/team-split.md` (who owns what).
- **Scope of this file:** ClinicFlow's interface. The side project, up-next, is also Ehimare's. It reuses the same shared component set and the same conventions, but it gets its own repo, contract and AGENTS file.

---

## Table of contents

1. [Product & current phase](#product--current-phase)
2. [Decisions this file assumes](#decisions-this-file-assumes)
3. [Tech stack](#tech-stack)
4. [The contract](#the-contract)
5. [Architecture at a glance](#architecture-at-a-glance)
6. [Directory layout](#directory-layout)
7. [Naming conventions](#naming-conventions)
8. [Routing](#routing)
9. [Layouts & route protection](#layouts--route-protection)
10. [Data & API layer (RTK Query)](#data--api-layer-rtk-query)
11. [Errors: Problem responses](#errors-problem-responses)
12. [Safe-to-repeat writes (Idempotency-Key)](#safe-to-repeat-writes-idempotency-key)
13. [Live position (SSE + polling fallback)](#live-position-sse--polling-fallback)
14. [Staff status changes & the optimistic check-in](#staff-status-changes--the-optimistic-check-in)
15. [Auth & session](#auth--session)
16. [Time & dates](#time--dates)
17. [The five screen states](#the-five-screen-states)
18. [Slow and dropped connections](#slow-and-dropped-connections)
19. [Forms & validation](#forms--validation)
20. [Accessibility (WCAG 2.2 AA)](#accessibility-wcag-22-aa)
21. [Honesty labels: demo, estimates, fictional data](#honesty-labels-demo-estimates-fictional-data)
22. [Design system & styling](#design-system--styling)
23. [Performance](#performance)
24. [Adding a screen: end-to-end](#adding-a-screen-end-to-end)
25. [Commands & pipeline](#commands--pipeline)
26. [Working agreements (team + AI)](#working-agreements-team--ai)
27. [Known technical debt](#known-technical-debt)
28. [Hard rules — never do these](#hard-rules--never-do-these)

---

## Product & current phase

**ClinicFlow** is an appointment-and-queue tool for **one fictional demonstration clinic** ("Demo Community Clinic"). It organises information only. It holds no clinical information and makes no clinical decision.

| User | What they do here | Access |
|---|---|---|
| Patient or carer | Book a slot, get a reference, watch their queue position, cancel or reschedule before arriving | Anonymous, by reference (+ manage token for changes) |
| Receptionist | See the day's appointments, check in, move patients through the queue, admit walk-ins, cancel or reschedule | Staff login, `RECEPTIONIST` |
| Admin (demo role) | Everything reception does, plus the dashboard view and "Reset demo day" | Staff login, `ADMIN` |

The **team** is Henry Emefo (API, auth, pipeline), Ayodeji Oni (data and rules) and Ehimare J. Okosun (this repo). The supervisor is Laja.

### Current phase: MVP for Monday 26 Oct 2026

Monday needs **one journey end to end on the deployed service, not the mock**:

1. A patient books a slot and receives a reference.
2. Reception logs in and checks that patient in.
3. Two browsers booking the same slot get one booking and one clear refusal, with alternatives offered.

Every screen in that journey needs its five states (see [The five screen states](#the-five-screen-states)). The demo banner and the README credentials must also be in place.

**Not needed Monday, but not skipped:** live position, dashboard, walk-ins, cancel/reschedule, the screen-reader report and performance figures. These come in days 6–12. Final submission is around Tue 3 Nov.

**Out of scope, whoever asks:** health records or diagnosis, payments, SMS/WhatsApp, multiple clinics, real patient data, and any claim of healthcare-privacy compliance. If a feature request touches these, the answer is no.

---

## Decisions this file assumes

Ehimare chose these. The backend docs only fix "React + TS + Tailwind + React Router on a free static host". To change a decision, change it here first, in the same PR.

| Decision | Choice | Why |
|---|---|---|
| Build tool | **Vite** (SPA) | Deploys as static files to a free host. There's no server-side rendering to pay for or explain. |
| Server state | **Redux Toolkit 2 + RTK Query** | The team already knows it. Its cache-patching APIs fit the optimistic check-in and the SSE updates. |
| Contract types | **`openapi-typescript`**, generated from the contract | The generated types track the YAML exactly, so a hand-written type can't drift from it. |
| Forms | **Formik 2 + Yup 1** | The team already knows it. |
| UI primitives | **The cohort's shared component set**, assumed to be shadcn/ui (Radix underneath) until confirmed | The brief requires the four interface engineers to agree one shared set on day two, and all eight products use it. **If the agreed set differs, it replaces shadcn here**; update this row and the [Design system](#design-system--styling) section. Each team may still choose its own visual style. |
| Toasts | **sonner** | Used for transient feedback only. Errors that block a task render inline instead. |
| Package manager | **pnpm** | One lockfile. |
| Static host | *Not decided yet.* Record the choice, its free-tier terms and the date you read them in the README. | The brief requires this. |

---

## Tech stack

| Area | What this project uses |
|------|------------------------|
| Framework | **React 19** + **Vite** |
| Language | **TypeScript strict**. No `any`. |
| Routing | **React Router** (data router: `createBrowserRouter`) |
| Styling | **Tailwind CSS v4**, `cn()` from `@/lib/utils` |
| Design system | **shadcn/ui** in `src/components/ui` |
| Icons | **Lucide React** |
| Server state | **Redux Toolkit 2 + RTK Query**. One `baseApi`. |
| Client persistence | **redux-persist**, `auth` slice only |
| Forms | **Formik 2 + Yup 1** (`src/utils/schema`) |
| Feedback | **sonner** (`toast`) |
| Tests | **Vitest** + **Testing Library**, plus `eslint-plugin-jsx-a11y` |
| Mock API | **Prism** (`@stoplight/prism-cli`) serving the contract on port 4010 |

**One library per job.** Don't add zod, TanStack Query, axios, react-hook-form or a date library unless this file is changed first. Two libraries for the same job means two places to look for the same rule.

### Import alias

`@/*` maps to **`./src/*`**. It is the only import alias.

```ts
import { Button } from "@/components/ui/button"   // → src/components/ui/button
import { routes } from "@/utils/routes"           // → src/utils/routes
```

---

## The contract

`clinicflow-api/openapi/openapi.yaml` is the agreement between the tiers. Three consequences:

1. **No path that isn't in the YAML is called.** No field that isn't in the YAML is read or sent. If a screen needs something the contract lacks, follow the change protocol below. Never improvise.
2. **Types come from the YAML, not from your head.** `pnpm gen:api` writes `src/api/schema.d.ts`. That file is generated: never edit it, and do commit it. `src/models/index.ts` gives the generated types friendly names:

   ```ts
   // src/models/index.ts — aliases only, zero runtime
   import type { components } from "@/api/schema"
   type S = components["schemas"]

   export type Problem            = S["Problem"]
   export type Slot               = S["Slot"]
   export type PatientAppointment = S["PatientAppointment"]
   export type StaffAppointment   = S["StaffAppointment"]
   export type BookingRequest     = S["BookingRequest"]
   export type Status             = S["Status"]
   // …one line per schema the app uses
   ```

   Types the app needs on top of those, like mutation args or view models, also live in `src/models/`, built *from* these aliases.
3. **Responses are not wrapped in an envelope.** `GET /queue` returns a `QueueView` at the top level, not `{ data: QueueView }`. Don't add a `transformResponse` that unwraps an envelope, because there isn't one.

### Contract change protocol

1. Whoever needs the change edits `openapi.yaml` in a PR on `clinicflow-api`.
2. Henry and Ehimare approve. Deji joins if a business rule is involved.
3. Add one dated line to `docs/contract-decisions.md` there: what changed, why, who agreed.
4. Henry changes the controller. Here, run `pnpm gen:api`, fix the type errors it surfaces, and commit the regenerated schema in the same PR as the screen change.

**An AI agent never changes the contract on its own.** If a task needs a contract change, stop and say exactly what field or path is missing.

---

## Architecture at a glance

Dependencies point one way only:

```
 routes/ (pages)          ← composition + data wiring
   │
   ├──→ modules/<feature>/*      ← feature blocks (slot picker, queue row, position card)
   │        │
   ├────────┴──→ components/shared/*   ← product pieces (StateView, EstimateText, Formik adapters)
   │                  │
   │                  └──→ components/ui/*      ← shadcn primitives, presentation only
   │
   ├──→ services/endpoints/*     ← RTK Query hooks
   │        └──→ services/httpClient/*  →  store/ (token only, via getState)
   │
   └──→ models/                  ← types only (aliases of the generated schema)
        api/schema.d.ts          ← generated, never edited
        utils/*, hooks/*, lib/*  ← leaves
```

| Layer | May import | Must never import |
|---|---|---|
| `components/ui` | `lib/utils`, other `ui`, Radix | `shared`, `modules`, `services`, `store`, Formik, Yup |
| `components/shared` | `ui`, `lib`, `utils`, `hooks`, `models`, Formik | `modules`, `routes` |
| `components/layout` | `ui`, `shared`, `services` (session check, meta) | `modules`, `routes` |
| `modules/<feature>` | `ui`, `shared`, `services`, `models`, `utils`, `hooks` | another feature's folder |
| `services/*` | `models`, `utils`, `lib`, `store` | any component |
| `models/*`, `api/*` | each other | everything else (types only) |
| `utils`, `hooks`, `lib` | each other, `models`, `services` (hooks only) | components |

If two features need the same piece, move it **down** into `components/shared` or `utils`. Never import it sideways from another feature's folder.

---

## Directory layout

```
src/
├── main.tsx                     # createRoot + <Providers> + <RouterProvider>
├── router.tsx                   # createBrowserRouter: every route, lazy staff routes
├── index.css                    # Tailwind v4 + design tokens
├── api/
│   └── schema.d.ts              # GENERATED by `pnpm gen:api`. Do not edit.
├── routes/
│   ├── patient/                 # book, track, manage
│   └── staff/                   # login, appointments, appointment detail, queue, dashboard, activity
├── components/
│   ├── ui/                      # shadcn primitives
│   ├── shared/                  # StateView, EstimateText, StatusBadge, PageHeader, DemoBanner,
│   │                            #   LiveRegion, formik-* adapters
│   └── layout/                  # PatientLayout, StaffLayout, StaffGate
├── modules/
│   ├── booking/                 # slot picker, booking form, confirmation, slot-taken panel
│   ├── tracking/                # position card, connection indicator
│   ├── manage/                  # cancel + reschedule (manage token)
│   ├── queue/                   # queue board, status actions, walk-in form
│   ├── appointments/            # list filters, table, detail, activity timeline
│   └── dashboard/               # counts, recent activity, demo reset
├── services/
│   ├── httpClient/              # baseApi.ts, baseQuery.ts, apiError.ts
│   └── endpoints/               # meta, slots, patient, auth, appointments, queue,
│                                #   walkIns, dashboard, activity, demo — + index.ts
├── store/                       # index.ts (store + persist), authSlice.ts
├── models/                      # index.ts (schema aliases) + args/view types
├── utils/
│   ├── schema/                  # index.ts (validators) + bookingSchema, staffSchema
│   ├── routes.ts  apiTags.ts  env.ts
│   ├── clinicTime.ts            # Africa/Lagos dates and formatting
│   ├── status.ts                # labels + allowed transitions (for showing buttons)
│   └── problemMessages.ts       # fallback copy per Problem code
├── hooks/                       # useIdempotencyKey, useLiveAppointment, useClinicToday
└── lib/utils.ts                 # cn()
docs/
└── ai-log.md                    # your section of the team AI log
```

All application code lives under `src/`. There is no second tree.

---

## Naming conventions

| Kind | Convention | Examples |
|------|------------|----------|
| Components | PascalCase export in a kebab-case file | `SlotPicker` in `slot-picker.tsx` |
| Route components | `<Name>Page` | `BookPage`, `QueuePage` |
| Endpoint modules | `<domain>.ts` exporting `<domain>Api` | `queue.ts` → `queueApi` |
| RTK endpoint names | the contract's `operationId` | `createAppointment`, `setAppointmentStatus` |
| RTK hooks | generated from the name | `useCreateAppointmentMutation`, `useGetQueueQuery` |
| Mutation args | `<OperationId>Args` in `models/` | `CreateAppointmentArgs` |
| Yup schemas | `*Schema` in `*Schema.ts` | `bookingSchema` |
| RTK tags | `ApiTags.*` | `ApiTags.Queue` |
| Hooks | `use*` in `use-*.ts` | `useLiveAppointment` in `use-live-appointment.ts` |

**Endpoint names equal `operationId`s.** That makes searching from the contract to the code (and back) a plain text search.

---

## Routing

### Route map

| Area | Path | Screen |
|---|---|---|
| Patient | `/` | Landing: "Book a visit" and "Check my booking" |
| Patient | `/book` | Date → slot → details → confirmation (all on one route) |
| Patient | `/track` | Enter a reference |
| Patient | `/track/:reference` | Status, live position, estimate |
| Patient | `/manage/:reference` | Cancel or reschedule (asks for the manage token) |
| Staff | `/staff/login` | Login |
| Staff | `/staff/appointments` | Day list with date, status and name filters |
| Staff | `/staff/appointments/:id` | Detail + activity history |
| Staff | `/staff/queue` | Live queue, status actions, walk-in |
| Staff | `/staff/dashboard` | Counts, recent activity, demo reset (admin) |

Filters on `/staff/appointments` live in the **query string** (`?date=…&status=WAITING,BOOKED&q=…&page=0`). That way a refresh or a shared link keeps the view.

### Path constants

Every path lives in `src/utils/routes.ts`. Never write a path literal in a component, `navigate()` call or `<Link to>`.

```ts
export const routes = {
  home: "/",
  book: "/book",
  track: "/track",
  trackRef: (reference: string) => `/track/${encodeURIComponent(reference)}`,
  manageRef: (reference: string) => `/manage/${encodeURIComponent(reference)}`,
  staff: {
    login: "/staff/login",
    appointments: "/staff/appointments",
    appointment: (id: string) => `/staff/appointments/${id}`,
    queue: "/staff/queue",
    dashboard: "/staff/dashboard",
  },
} as const
```

Adding a route means adding its constant in the same commit.

### SPA fallback

The host must serve `index.html` for unknown paths. Otherwise a refresh on `/track/CF-…` returns a 404. Configure this in the host's config file, and test it on the deployed address by refreshing a deep link.

### Code splitting

Staff routes are `lazy()`-loaded. Patients make up most visitors, and they should not download the staff queue board.

---

## Layouts & route protection

| Shell | Used by | Contains |
|---|---|---|
| `PatientLayout` | all patient routes | `DemoBanner`, clinic name from `GET /meta`, skip link, `<main>` |
| `StaffLayout` | all staff routes except login | `DemoBanner`, nav, signed-in user + role, sign out, skip link |
| `StaffGate` | wraps `StaffLayout` | session confirmation (below) |

Need different chrome for one route? Add a prop with a safe default. Never fork a shell.

### `StaffGate` is the contract for every staff screen

- **Confirm the session before any staff chrome renders.** A persisted token proves nothing: it may have expired an hour ago. The gate calls `getMe`, shows a splash meanwhile, and renders children only on 200.
- **Check `expiresAt` first.** If the stored expiry has passed, sign out without spending a request.
- **Only 401 means "signed out."** Clear auth and redirect to `routes.staff.login` with `?next=<current path>`. A 403 means a signed-in user was refused one thing, so render "Not allowed" in place. Signing them out on a 403 would bounce them between login and the app forever.
- **Role-gate controls, not just routes.** `POST /demo/reset` is ADMIN-only, so a receptionist never sees the reset button.

---

## Data & API layer (RTK Query)

### One API slice, many injected modules

- `services/httpClient/baseApi.ts` is the only `createApi`: `reducerPath: "api"`, `tagTypes: Object.values(ApiTags)`, `endpoints: () => ({})`.
- Each `services/endpoints/<domain>.ts` calls `baseApi.injectEndpoints`. **Never** add a second `createApi`, and **never** use `overrideExisting: true`. A name collision is a naming bug, so fix the name.
- `services/endpoints/index.ts` side-effect-imports every endpoint module, and `store/index.ts` imports it. **A module missing from `index.ts` has no hooks at runtime.**
- **Every URL starts with `/api/v1/`**, relative to `env.apiBaseUrl`. The base URL is `VITE_API_BASE_URL`: `http://localhost:4010` for Prism, `http://localhost:8080` for the local service, or the Render URL in production.

### `baseQuery`: request ids, staff auth, error normalisation

```ts
// services/httpClient/baseQuery.ts
type ExtraOptions = { auth?: "staff" }

const raw = fetchBaseQuery({ baseUrl: env.apiBaseUrl })

export const baseQuery: BaseQueryFn<FetchArgs, unknown, ApiError, ExtraOptions> =
  async (args, api, extraOptions) => {
    const headers = new Headers(args.headers as HeadersInit | undefined)
    headers.set("X-Request-Id", crypto.randomUUID())          // every call, for log tracing
    const token = (api.getState() as RootState).auth.token
    if (extraOptions?.auth === "staff" && token) {
      headers.set("Authorization", `Bearer ${token}`)
    }

    const result = await raw({ ...args, headers }, api, {})
    if (!result.error) return { data: result.data, meta: result.meta }

    const error = toApiError(result.error, result.meta?.response)
    // Only a staff call's 401 signs staff out. A patient's 401 means a wrong manage token.
    if (extraOptions?.auth === "staff" && error.status === 401) api.dispatch(signedOut())
    return { error }
  }
```

Why `auth: "staff"` and not "send the token whenever there is one": a receptionist testing the patient booking page in the same browser would otherwise send a bearer token to anonymous endpoints. Worse, a wrong manage token (also a 401) would sign them out.

### The canonical endpoint module

```ts
// services/endpoints/patient.ts
import { baseApi } from "@/services/httpClient/baseApi"
import type { BookingCreated, PatientAppointment, CreateAppointmentArgs } from "@/models"
import { ApiTags } from "@/utils/apiTags"

export const patientApi = baseApi.injectEndpoints({
  endpoints: (builder) => ({
    getPatientAppointment: builder.query<PatientAppointment, string>({
      query: (reference) => ({
        url: `/api/v1/patient/appointments/${encodeURIComponent(reference)}`,
      }),
      providesTags: (_r, _e, reference) => [{ type: ApiTags.PatientAppointment, id: reference }],
    }),

    createAppointment: builder.mutation<BookingCreated, CreateAppointmentArgs>({
      query: ({ idempotencyKey, body }) => ({
        url: "/api/v1/patient/appointments",
        method: "POST",
        body,
        headers: { "Idempotency-Key": idempotencyKey },
      }),
      // A booking (or a refusal) changes slot availability for that day.
      invalidatesTags: (_r, _e, { date }) => [{ type: ApiTags.Slots, id: date }],
    }),
  }),
})

export const { useGetPatientAppointmentQuery, useCreateAppointmentMutation } = patientApi
```

Staff endpoints add `extraOptions: { auth: "staff" }` to the endpoint definition.

### Tag strategy

| Tag | Provided by | Invalidated by |
|---|---|---|
| `Slots` (id = date) | `listSlots` | create, reschedule (both slots' dates), cancel |
| `Appointment` (`LIST` + id) | `listAppointments`, `getAppointment` | every staff write |
| `Queue` (id = date) | `getQueue` | status change, walk-in, staff cancel |
| `Dashboard` (id = date) | `getDashboard` | every staff write |
| `Activity` | `listRecentActivity`, `listAppointmentActivity` | every staff write |
| `PatientAppointment` (id = reference) | `getPatientAppointment` | patient cancel/reschedule |

A check-in changes the list, the queue, the dashboard counts and the activity feed, so it invalidates all four.

### Freshness

- The staff queue polls `getQueue` every **10 s** and shows "Updated 10:42:08" from `generatedAt`. The contract has no staff stream, and reception must never act on a silently stale board.
- `refetchOnFocus` and `refetchOnReconnect` are on (`setupListeners`).

---

## Errors: Problem responses

Every service error is `application/problem+json` shaped as `Problem`. **Branch on `problem.code`, never on `detail` or `title` text.** The text can change without notice, but the codes are part of the contract.

`services/httpClient/apiError.ts` turns whatever `fetchBaseQuery` returns into one union:

```ts
export type ApiError =
  | { kind: "problem"; status: number; problem: Problem; retryAfterSeconds?: number }
  | { kind: "network"; status: "FETCH_ERROR" | "TIMEOUT_ERROR" | "PARSING_ERROR" }

export function isProblem(e: unknown, code?: Problem["code"]): e is Extract<ApiError, { kind: "problem" }>
```

User-facing copy: show `problem.detail` when present (the contract says it is safe to show). Otherwise use the fallback for that code in `utils/problemMessages.ts`. Never hand-roll `error?.data?.detail` in a component.

| `code` | What the screen does |
|---|---|
| `VALIDATION_FAILED` | Put each `fieldErrors[i]` on its field with `formik.setErrors`. Only an error with no matching field becomes form-level. |
| `SLOT_TAKEN` | Apologise and offer `suggestedSlots` as buttons, then refetch slots. **Never leave the patient on a spinner or a dead end.** |
| `SLOT_IN_PAST` | Explain, then refetch slots (the list is stale). |
| `STALE_STATE` | Replace the row with `problem.current` and say what happened. See [optimistic check-in](#staff-status-changes--the-optimistic-check-in). |
| `INVALID_TRANSITION` | Same as above, using `current` when present. Message: "That change isn't allowed from <status>." |
| `CLINIC_CLOSED` | Say so plainly. The walk-in form can't proceed today. |
| `UNAUTHENTICATED` | Staff call: handled globally (sign out). Patient manage call: "That manage token doesn't match this booking." |
| `FORBIDDEN` | "Not allowed" in place. Never sign out. |
| `NOT_FOUND` | Patient lookup: "We couldn't find that reference. Check it and try again." |
| `RATE_LIMITED` | Disable the action and count down `Retry-After` seconds. |
| `IDEMPOTENCY_IN_PROGRESS` | "Still confirming…". Retry the **same** request with the **same** key after a short wait. |
| `IDEMPOTENCY_KEY_MISMATCH` | This is a client bug: a key was reused with a different body. Renew the key, ask the user to submit again, and log it. |
| `INTERNAL_ERROR` / network | Reads: offer "Try again". Writes: see [Idempotency](#safe-to-repeat-writes-idempotency-key). |

**Show the request id on unexpected errors** (`problem.requestId`), in small text like "Reference for support: 0f9c…". That is how a bug report reaches the matching backend log line.

Toasts (`sonner`) are for transient confirmations ("Checked in"). An error that blocks the user's task renders **inline, next to the thing that failed**, so a screen reader announces it in context and it doesn't vanish after four seconds.

---

## Safe-to-repeat writes (Idempotency-Key)

`POST /patient/appointments` and `POST /walk-ins` **require** an `Idempotency-Key`. The same key with the same body returns the original result. A new key means a new booking.

```ts
// hooks/use-idempotency-key.ts
export function useIdempotencyKey() {
  const [key, setKey] = useState(() => crypto.randomUUID())
  const renew = useCallback(() => setKey(crypto.randomUUID()), [])
  return { key, renew }
}
```

The rules, and why:

- **Create the key when the form mounts.** Reuse it on every retry of that submission: double-clicks, network drops, 500s, `IDEMPOTENCY_IN_PROGRESS`. This is the whole point: a patient on bad mobile data who taps twice gets one booking.
- **Renew it only after a final answer**: a 201 (the next booking is a new one), or a 409/422 after which the user changes the body (new slot, fixed name). Reusing the old key with a changed body would get `IDEMPOTENCY_KEY_MISMATCH`.
- **On a network drop mid-write**, say: "We couldn't confirm your booking. Check with your reference or try again." The retry button resends the **same** key and body.
- Disable the submit button while a request is in flight. That is for clarity only: idempotency is the real protection, not the disabled button.

---

## Live position (SSE + polling fallback)

The patient's `/track/:reference` screen shows the position changing without a reload.

```ts
// hooks/use-live-appointment.ts
export function useLiveAppointment(reference: string) {
  const dispatch = useAppDispatch()
  const [streamOpen, setStreamOpen] = useState(false)

  // Poll every 10 s while the stream is down. Stop polling once it's open.
  const query = useGetPatientAppointmentQuery(reference, {
    pollingInterval: streamOpen ? 0 : 10_000,
  })
  const found = query.isSuccess

  useEffect(() => {
    if (!found) return                      // don't open a stream for a reference that 404s
    const url = `${env.apiBaseUrl}/api/v1/patient/appointments/${encodeURIComponent(reference)}/events`
    const es = new EventSource(url)
    es.onopen = () => setStreamOpen(true)
    es.onerror = () => setStreamOpen(false) // the browser retries by itself; we poll meanwhile
    es.addEventListener("appointment", (e) => {
      const next = JSON.parse((e as MessageEvent<string>).data) as PatientAppointment
      dispatch(patientApi.util.upsertQueryData("getPatientAppointment", reference, next))
    })
    return () => es.close()
  }, [reference, found, dispatch])

  return { ...query, reconnecting: found && !streamOpen }
}
```

- Each `appointment` event carries a **full** `PatientAppointment`, so replace the cached value. Don't merge.
- While `reconnecting`, show a visible **"Reconnecting…"** indicator. The screen must never be silently stale. The service is a single instance on a free host, and a restart drops every stream.
- Close the stream once the status is `COMPLETED` or `CANCELLED`, since nothing more will change.
- `EventSource` can't send custom headers, so the stream carries no `X-Request-Id`. That is a declared limitation; don't work around it with a query parameter.

---

## Staff status changes & the optimistic check-in

`PUT /appointments/{id}/status` takes `{ status, expectedStatus, reason? }`. `expectedStatus` is **what this screen believed**. If another receptionist got there first, the service answers `409 STALE_STATE` with the true appointment in `current`.

### Which buttons to show

`utils/status.ts` mirrors the allowed transitions from the contract, **only to decide which buttons to render**. The service stays the authority.

| From | Actions shown |
|---|---|
| `BOOKED` | Check in · Cancel · Reschedule |
| `WAITING` | Start consultation · Cancel |
| `IN_CONSULTATION` | Complete |
| `COMPLETED`, `CANCELLED` | none |

Hide actions that don't apply. Don't show disabled dead buttons. Every cancel asks for confirmation and accepts an optional reason (≤200 characters).

### The optimistic check-in (state this in the README)

The brief asks for one optimistic action and requires the README to **say which action was chosen and why**. Ours is **reception's check-in**: the row moves to `WAITING` immediately, and the server then confirms or corrects it.

**Why check-in:** it is the click reception repeats all day with a patient standing at the desk, so waiting on the server feels slowest there. It nearly always succeeds, so a correction is rare. And when it does fail, the service returns the true state in `problem.current`, so the screen can put itself back with a message the receptionist can act on. Booking is deliberately *not* optimistic: telling a patient "Booked" and then retracting it is worse than a short wait.

```ts
setAppointmentStatus: builder.mutation<StaffAppointment, SetAppointmentStatusArgs>({
  query: ({ id, body }) => ({ url: `/api/v1/appointments/${id}/status`, method: "PUT", body }),
  extraOptions: { auth: "staff" },
  async onQueryStarted({ id, body, listArgs }, { dispatch, queryFulfilled }) {
    const optimistic = body.status === "WAITING" && body.expectedStatus === "BOOKED"
    const patch = optimistic
      ? dispatch(appointmentsApi.util.updateQueryData("listAppointments", listArgs, (draft) => {
          const row = draft.items.find((a) => a.id === id)
          if (row) row.status = "WAITING"
        }))
      : undefined
    try {
      await queryFulfilled
    } catch (err) {
      const error = (err as { error: ApiError }).error
      if (isProblem(error) && error.problem.current) {
        const current = error.problem.current
        dispatch(appointmentsApi.util.updateQueryData("listAppointments", listArgs, (draft) => {
          const i = draft.items.findIndex((a) => a.id === id)
          if (i >= 0) draft.items[i] = current
        }))
      } else {
        patch?.undo()
      }
    }
  },
  invalidatesTags: (_r, _e, { id, date }) => [
    { type: ApiTags.Appointment, id }, { type: ApiTags.Appointment, id: "LIST" },
    { type: ApiTags.Queue, id: date }, { type: ApiTags.Dashboard, id: date }, ApiTags.Activity,
  ],
}),
```

When the server corrects the screen, **say what happened** in words, for example: "Maria Okafor was already checked in by someone else." Announce it through the live region (see [Accessibility](#accessibility-wcag-22-aa)).

### Walk-ins

`POST /walk-ins` with `aheadOfQueue`. An urgent walk-in goes ahead of every waiting patient but behind anyone in consultation. Label the checkbox with exactly that meaning. It needs an Idempotency-Key, like booking.

---

## Auth & session

- **Single source of truth:** `state.auth` = `{ token, user, expiresAt }`. Components never read the token. `baseQuery` reads it via `getState`.
- `expiresAt` is computed at login: `Date.now() + expiresInSeconds * 1000`. The API returns a duration, not a timestamp.
- **There is no refresh token.** The JWT lasts about 60 minutes. On expiry or any staff 401, sign out and send the user to login with `?next=` so they land back where they were.
- `redux-persist` with `whitelist: ["auth"]`. Nothing else is persisted. RTK Query's cache must not survive a reload, or reception would see an old queue.
- Demo credentials are in the API repo's README, labelled demonstration-only. Never hard-code them in this repo, not even in a login placeholder.

### The manage token (patient)

- It is returned **once**, in `BookingCreated.manageToken`. The service stores only a hash, so if the patient loses it, it can't be recovered.
- The confirmation screen shows the reference and the token large, copyable and labelled: "Keep this. You'll need it to cancel or change your booking."
- The confirmation renders **in place** on `/book` after the 201. Don't navigate to a URL that carries the token.
- **Never put the token in a URL, Redux, localStorage or a log.** `/manage/:reference` asks the patient to type or paste it, and sends it only as the `X-Manage-Token` header.

---

## Time & dates

The clinic runs on **Africa/Lagos** time. A patient's phone, or a reviewer's laptop abroad, may not.

```ts
// utils/clinicTime.ts
export const CLINIC_TZ = "Africa/Lagos"

/** The clinic's calendar date as YYYY-MM-DD. Use for every `date` query param. */
export function clinicToday(now: Date = new Date()): string {
  return new Intl.DateTimeFormat("en-CA", {
    timeZone: CLINIC_TZ, year: "numeric", month: "2-digit", day: "2-digit",
  }).format(now)
}

/** "09:20" in clinic time, whatever the viewer's timezone. */
export function formatClinicTime(iso: string): string {
  return new Intl.DateTimeFormat("en-GB", {
    timeZone: CLINIC_TZ, hour: "2-digit", minute: "2-digit",
  }).format(new Date(iso))
}
```

- **Never use `new Date().toISOString().slice(0, 10)` for "today".** That is the UTC date, which is wrong between 00:00 and 01:00 in Lagos.
- Every date and time shown goes through `utils/clinicTime.ts`. Never format inline.
- The booking date picker offers today through **today + 14 days** (the booking horizon), in clinic time. Sunday is closed: an empty `listSlots` response is the closed/empty state, not an error.

---

## The five screen states

Every screen that loads or changes data handles all five. The brief marks this, and `design.md` §13 requires it.

| State | Meaning | How |
|---|---|---|
| **Loading** | Waiting on the first response | A skeleton shaped like the content. Avoid spinners: they cause layout shift and say nothing. |
| **Empty** | A successful response with nothing in it | Say why and what to do next ("No slots on Sunday. The clinic is closed. Try Monday."). |
| **Error** | The request failed | Message from the Problem rules, a **retry** action, and the request id when unexpected. |
| **Success** | Data shown | The content itself. |
| **Confirmation** | A write succeeded, or a destructive write is about to happen | "Booked. Your reference is CF-7K3Q-9XMD." / "Cancel this booking?" |

`components/shared/state-view.tsx` renders loading, empty and error from a query result, so pages don't each reinvent them. A list with active filters that returns nothing gets a different message ("Nothing matches these filters" plus "Clear filters") from a day with no appointments at all.

The brief calls **empty "the state most often missed and the first one a new user sees."** It means first use with no data at all: a day before anyone has booked, or a queue before anyone has checked in. Reproduce it with Prism or with a date that has no bookings. Don't wait for seed data to show it.

The mentor review asks three questions directly, so every form and list must have an answer to each:

- **What happens when a form is submitted empty?** Field-level messages appear on every required field, and focus moves to the first invalid field.
- **What happens when a filter returns nothing?** The "Nothing matches" state, with a working "Clear filters" action.
- **What happens when an operation fails halfway?** See [Slow and dropped connections](#slow-and-dropped-connections).

---

## Slow and dropped connections

The brief requires **every screen to be usable on a throttled slow connection**, tested in browser dev tools. It also requires a written answer to "what happens when a write is in flight and the connection drops", and **the user must never be left looking at something that is no longer true.** Write that answer in the README using the table below.

| Situation | What the screen does |
|---|---|
| Slow first load | Skeleton immediately. After about 3 s add "Waking up the demo server…" (the free host sleeps). |
| Read fails (offline, timeout) | Keep any data already shown, mark it "Couldn't refresh, last updated hh:mm:ss", and offer "Try again". Never show stale data as if it were current. |
| Booking or walk-in in flight, connection drops | Don't claim success or failure. Show "We couldn't confirm your booking. Check with your reference or try again." The retry resends the **same** Idempotency-Key and body, so a booking that did land is returned, not duplicated. |
| Status change in flight, connection drops | Undo the optimistic patch, refetch the row, and say "We couldn't confirm that change. Here is the current status." The board then shows the server's truth, whatever happened. |
| Cancel or reschedule in flight, connection drops | Refetch the appointment and show its real status. These operations are idempotent, so "Try again" is safe. |
| Patient tracking, stream drops | "Reconnecting…" plus 10 s polling (see [Live position](#live-position-sse--polling-fallback)). |
| Browser goes offline (`navigator.onLine` false) | A small "You're offline" bar. Writes are disabled with that reason until the browser is back online. |

**How to test:** Chrome DevTools → Network → "Slow 4G" (and "Offline" mid-request), on each journey. Record what you saw in the README.

---

## Forms & validation

- Schemas live in `src/utils/schema/<domain>Schema.ts`. Reusable validators live in `src/utils/schema/index.ts`.
- **Client limits mirror the contract:** `patientName` 2–120 characters, `contact` 3–60 characters, cancel `reason` ≤ 200 characters, `q` ≤ 120 characters. When the contract changes, the schema changes in the same PR. The service is still the authority, so server `fieldErrors` always land on the field.
- Inputs are wrapped by Formik adapters in `components/shared` (`FormikInput`, `FormikSelect`, …), generic over the value type, so a typo in a field name is a compile error.
- **Always `.unwrap()`** a mutation inside `onSubmit`. A mutation that isn't unwrapped resolves with an error object, so the `catch` never runs.

```ts
onSubmit: async (values) => {
  try {
    const res = await createAppointment({ idempotencyKey: key, date, body: values }).unwrap()
    setConfirmed(res)                       // renders the confirmation in place
    renew()
  } catch (err) {
    const error = (err as ApiError)
    if (isProblem(error, "VALIDATION_FAILED")) formik.setErrors(toFormikErrors(error.problem))
    else if (isProblem(error, "SLOT_TAKEN")) setSuggested(error.problem.suggestedSlots ?? [])
    else setFormError(error)                // inline, with retry
  }
}
```

---

## Accessibility (WCAG 2.2 AA)

Interface and accessibility is worth **15 marks**. Ehimare owns the screen-reader report in the README.

- **Semantic headings:** one `<h1>` per page, then `h2`/`h3` in order with no skipped levels. Use landmarks (`<header>`, `<nav>`, `<main>`) and a skip link.
- **Keyboard:** every action works with a keyboard alone, in a logical tab order. The slot grid is a group of buttons (or a radiogroup), not clickable `div`s.
- **Visible focus**, never hidden behind a sticky header (2.4.11, Focus Not Obscured).
- **Labels:** every input has a visible `<label>`. Placeholders are not labels.
- **Status changes are announced** through one polite `aria-live` region (`LiveRegion` in shared): position changes ("You are now 2nd in the queue"), optimistic corrections and confirmations. Announce **changes only**, not every poll or keep-alive.
- **Errors:** an inline error is tied to its field with `aria-describedby`, and the field gets `aria-invalid`. A form-level error gets `role="alert"`.
- **Focus moves on purpose:** after a successful booking, focus the confirmation heading. After a route change, focus the page `<h1>`.
- **Status is never colour alone.** `StatusBadge` always carries the text ("Waiting"), with the colour as a bonus.
- **Targets** are at least 24×24 CSS px (2.5.8). Aim for 44 px on patient screens, which are mostly used on phones.
- **Contrast** meets AA: 4.5:1 for body text, 3:1 for large text and UI boundaries.
- Test with **NVDA** (Windows) or **VoiceOver** (iOS/macOS) on the deployed site, and record findings and fixes in the README. `eslint-plugin-jsx-a11y` catches the mechanical issues, not the real ones.

---

## Honesty labels: demo, estimates, fictional data

The brief says an undeclared stub costs the whole requirement. These labels are mandatory:

| Where | Label |
|---|---|
| Every screen | A `DemoBanner` from `GET /meta` (`demoMode` is always true): "Demonstration data: fictional clinic and patients" |
| Booking form | `contact` field hint: "Fictional placeholder. Don't enter a real phone or email." The name field hint says the same. |
| Anywhere `estimate` appears | Rendered by `EstimateText`: "About 30 min (estimate)" **plus `estimate.basis` beside it**. Never a bare number. |
| Queue position | Shown as exact: "2nd in the queue", "1 person ahead of you" |
| Dashboard | A "Reset demo day" button, ADMIN only, labelled as demonstration mode, with a confirm step |
| Patient position | Alongside the live/"Reconnecting…" indicator, "Updated hh:mm:ss" from `updatedAt`. The brief says a queue position that may be out of date must say so. |
| Staff queue, dashboard | "Updated hh:mm:ss" from `generatedAt`. Dashboard counts are "computed from today's records", never stored or hard-coded. |

**Position is exact; wait time is an estimate.** Never round a position into a time, and never show a time without its basis. Anything that may be stale, whether position, queue or counts, says how fresh it is. The brief notes that "the wording is marked."

Never use clinical words such as diagnosis, symptoms or triage, and never imply a relationship with a real clinic.

---

## Design system & styling

- Tokens live in `src/index.css` as CSS variables. Use semantic classes (`bg-background`, `text-muted-foreground`, `border-border`). If a design calls for a colour that isn't tokenised, **add the variable first**, then use it.
- **The status palette is tokenised once**: `--status-booked`, `--status-waiting`, `--status-in-consultation`, `--status-completed`, `--status-cancelled`. Each is checked for AA contrast against its background.
- Compose classes with `cn()`. Variants use `class-variance-authority`.
- **Responsive for phone, tablet and desktop** (the brief names all three). Patient screens are designed at 360 px first. Staff screens are designed for desktop and tablet, and must still be operable on a phone, because the mentor review checks "a narrow phone viewport". No horizontal page scroll at 320 px. Wide tables become stacked cards on narrow screens.
- **Long text must not break the layout.** The brief requires seed data with "a name long enough to break the layout", so expect it. Patient names wrap (`break-words`) in detail views and truncate with a full-text `title`/tooltip in dense rows. Never let a name push buttons off-screen.
- **Consistent spacing and typography** (a marked item under the visual system). Use the token scale only, with no one-off margins.
- **Adding a primitive:** `pnpm dlx shadcn@latest add <component>`, then align it to the tokens and fix imports to `@/*`. A primitive is finished when it takes controlled props, shows a focus ring, sets `aria-invalid`, and imports nothing from `shared`, `services` or Formik.
- Light and dark: support `prefers-color-scheme`, or ship light-only. Decide once, record it here, and test contrast for whichever modes you ship.

---

## Performance

- **Targets** (set them in the README and measure on the **deployed** address, not localhost): LCP ≤ 2.5 s and INP ≤ 200 ms on a mid-range phone over a throttled 4G connection.
- Measure with Lighthouse (mobile) and the `web-vitals` package in dev. Record the numbers and the date.
- **Report honestly.** The brief says "missing your own target and saying so costs less than not setting one." If you miss a target, publish the real figure and what you would change.
- Staff routes are lazy-loaded, so the patient bundle stays small.
- The free API host sleeps when idle. The first request can take tens of seconds, so the loading state must say "Waking up the demo server…" after about 3 s rather than looking frozen.

---

## Adding a screen: end-to-end

Work in this order. Each step should compile before you start the next.

1. **Check the contract.** Find the `operationId`s you need in `openapi.yaml`. If anything is missing, follow the [change protocol](#contract-change-protocol) and stop here.
2. **Types.** Run `pnpm gen:api` if the contract changed. Add aliases or arg types in `src/models/`.
3. **Tags.** Add to `ApiTags` if the domain is new.
4. **Endpoints.** Add or extend `services/endpoints/<domain>.ts`, named by `operationId`, with `auth: "staff"` where needed, and **register it in `endpoints/index.ts`**.
5. **Validation.** Write a schema mirroring the contract's limits.
6. **UI pieces.** Primitives go in `ui`, reusable product pieces in `shared`, feature blocks in `modules/<feature>/`.
7. **Route.** Add the page under `routes/`, add its path constant in `routes.ts`, and register it in `router.tsx` (lazy if staff).
8. **States.** Loading, empty, error, success, confirmation. Run through each one against Prism, using `Prefer: code=409` or `Prefer: example=slotTaken`.
9. **Verify.** Run `pnpm typecheck && pnpm lint && pnpm test`, then click through the screen with the keyboard only. Every control you rendered must do something.

### Review checklist

- No `any`, no hand-written contract types, no hard-coded paths.
- Every endpoint matches an `operationId` and the module is registered in `endpoints/index.ts`.
- Staff endpoints use `auth: "staff"`. Patient endpoints never send a bearer token.
- Creating writes send an Idempotency-Key, reused on retry and renewed only after a final answer.
- Every error branches on `problem.code`. `SLOT_TAKEN` offers alternatives. `STALE_STATE` shows `current`.
- Every `date` param comes from `clinicTime.ts`.
- All five states exist. Blocking errors are inline, with a retry.
- Estimates show `basis`. The demo banner is present. Fictional fields are labelled.
- Status changes are announced. Focus is managed. Status is never conveyed by colour alone.
- Mutations invalidate every dependent tag (list, queue, dashboard, activity).
- Search and filters actually change what's displayed, combine (AND), and can be cleared.
- **Mentor-review pass** (run it before calling a screen done): submit the form empty; set a filter that matches nothing; drop the connection mid-write; view it at 320 px; use it with the keyboard only; load the deployed address in a clean browser profile (no extensions, no stored data).

---

## Commands & pipeline

```bash
pnpm dev         # vite dev server (port 5173)
pnpm build       # tsc -b && vite build
pnpm preview     # serve the production build locally
pnpm typecheck   # tsc --noEmit
pnpm lint        # eslint . (includes jsx-a11y)
pnpm test        # vitest run
pnpm format      # prettier --write .
pnpm mock        # prism mock <contract> -p 4010
pnpm gen:api     # openapi-typescript <contract> -o src/api/schema.d.ts
```

`gen:api` and `mock` read the contract from `CONTRACT_PATH`, which defaults to the raw `main` copy on GitHub:
`https://raw.githubusercontent.com/codefather99/clinicflow-api/main/openapi/openapi.yaml`.
Point it at `../clinicflow-api/openapi/openapi.yaml` to work against an unmerged contract branch.

**Environment** (`.env.local`, never committed. Only `.env.example` is committed):

| Variable | Values |
|---|---|
| `VITE_API_BASE_URL` | `http://localhost:4010` (Prism) · `http://localhost:8080` (local service) · the Render URL |

Anything prefixed `VITE_` ends up in the public bundle. **Never put a secret in one.**

### GitHub Actions (blocking gates)

The brief says a deploy that only works when somebody runs a command by hand does not count, and that tests, type checking and linting must block it.

**Free tier:** before committing to a static host, read *its own* pricing page (not a blog post or AI output) and record in the README what you checked and the date. Also check whether it limits the number of free projects per account, because you deploy two interfaces (ClinicFlow and up-next).

On every push and PR: `pnpm install --frozen-lockfile` → `typecheck` → `lint` → `test` → **contract drift check** (run `gen:api` and fail if `src/api/schema.d.ts` changed) → `build`. On `main`, deploy only if every step passed. The drift check catches a contract that moved while this repo didn't.

Not yet tested: whether Prism honours `Prefer` for every example in the contract. Note any example that doesn't work.

---

## Working agreements (team + AI)

- **Repos:** this one is `clinicflow-web`. The service, contract and backend docs are in `clinicflow-api`.
- **Branches:** use `ehimare/<thing>`, keep them short, open a PR for everything and squash merge. `main` is always deployable.
- **Daily sync** at 09:00 and 20:00 during the crunch: what I merged, what I'm blocked on, what I'm touching next.
- **Shared component set:** agreed with the other three interface engineers (Muizz, Victor, Ufoma). Changes to a shared component go back to that group, not just into this repo.
- **Time split:** ClinicFlow first, against the mock; up-next second. If you fall behind, a service engineer who has finished takes up-next's most basic screens and records it. Tell Laja on **Friday**, not Monday.
- **Handshakes involving this repo:** H3 (Fri evening) runs book → check in against the **deployed** service and writes down divergences. H6 (Sun evening) is a full rehearsal from a clean browser with no extensions. On Sun, confirm with Deji that every seed state renders correctly.
- **Borrowing work:** if Henry or Deji builds a screen here (likely on the side project), add a line to `docs/work-log.md`.

### For AI agents working in this repo

- Read `openapi.yaml` before writing any call. **Never invent a field, path, status code or `Problem` code.** If it isn't in the contract, it doesn't exist.
- If a task needs a contract change, stop and describe the change. Don't edit around it.
- Never edit `src/api/schema.d.ts` by hand. Regenerate it.
- Prefer the patterns in this file over patterns from training data, which may come from older React Router, RTK or Tailwind versions. Check the installed version's docs when unsure.
- **When AI output turns out to be wrong**, tell the human, and add an entry to `docs/ai-log.md`: what it claimed, how it was checked, what was true, what was done. The brief requires at least one verified-wrong case, and it is far easier to record them as they happen.
- Every engineer must be able to explain every line, including AI-written ones. Keep the code plain enough for that.

---

## Known technical debt

Real, current inconsistencies. **Don't copy them.** Fix them when you touch the file.

| Where | Problem | Correct form |
|---|---|---|
| — | *None yet. The repo is new. Add rows as you find them.* | — |

**Open items to confirm with Henry, which may become debt:**

| Item | Why it matters |
|---|---|
| CORS `Access-Control-Expose-Headers` must include `X-Request-Id` and `Retry-After` | This app is on a different origin from the API. Without exposure, the browser hides those headers from JavaScript, and the rate-limit countdown can't read `Retry-After`. |
| CORS must allow the deployed web origin plus `Idempotency-Key`, `X-Request-Id`, `X-Manage-Token` and `Authorization` request headers | Otherwise the preflight fails and every write fails on the deployed site while working against Prism. |
| How a stored Idempotency-Key behaves after a 409 | This decides whether the key must be renewed after `SLOT_TAKEN` (this file assumes yes). |
| SSE through the Render free tier | Some proxies buffer or cut long-lived connections. The polling fallback covers it, but confirm on the deployed address. |

---

## Hard rules — never do these

1. **No `any`.** Use `unknown` and narrow, or use the generated type.
2. **No path, field or `Problem` code that isn't in `openapi.yaml`.** Change the contract first, with two approvers.
3. **No hand-written request or response types.** Alias the generated schema. Never edit `src/api/schema.d.ts`.
4. **No hard-coded route strings.** Use `routes.*` from `@/utils/routes`.
5. **No API URL that doesn't start with `/api/v1/`.**
6. **No branching on `detail` or `title` text.** Switch on `problem.code`.
7. **No creating write without an `Idempotency-Key`**, and no new key on a retry of the same submission.
8. **No dead end on `SLOT_TAKEN`.** Offer `suggestedSlots`, every time.
9. **No staff status change without `expectedStatus`.** On `STALE_STATE`, show `current` and say what happened.
10. **No bearer token on patient endpoints, and no sign-out on a 403** or on a patient's 401.
11. **No manage token in a URL, Redux, storage or a log.**
12. **No wait time without "estimate" and its `basis`.** Position is exact; time is not.
13. **No "today" from the browser's UTC date.** Use `clinicToday()`.
14. **No silent staleness.** Live screens show "Reconnecting…" or "Updated hh:mm:ss". After a dropped write, show the server's truth, never the hoped-for result.
15. **No screen missing a state:** loading, empty, error, success, confirmation.
16. **No status by colour alone, no unlabelled input, no mouse-only control.**
17. **No second `createApi`, no `overrideExisting: true`, no endpoint module missing from `endpoints/index.ts`.**
18. **No Formik, Yup, RTK or Redux imports in `components/ui/`.**
19. **No sideways imports between feature folders.** Shared code moves down.
20. **No secrets in `VITE_*` variables or the repo.** No demo credentials hard-coded in the UI.
21. **No dead controls.** A rendered button does something, or it is hidden.
22. **No clinical content, no real patient data, no claim of a real clinic.** Everything simulated is labelled where the user sees it.
