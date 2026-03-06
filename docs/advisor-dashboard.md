# Advisor Dashboard — Implementation Guide (Teammate Notes)

This document is **only** for the Advisor dashboard experience.

## 1) What “Advisor dashboard” means in this repo

### URLs (what to test in the browser)

- **Home (dashboard landing):** `/dashboard/advisor`
- **Advisor sections:**
  - `/dashboard/advisor/my-projects`
  - `/dashboard/advisor/students`
  - `/dashboard/advisor/evaluations`
  - `/dashboard/advisor/schedule`
  - `/dashboard/advisor/messages`

### Routing entrypoints (the correct files)

- **Role landing route:** `src/app/dashboard/[role]/page.tsx`
  - Resolves the role slug (`advisor`) and renders the correct dashboard page.
- **Role landing component (role-aware):** `src/components/dashboard/page.tsx`
  - This is where we currently short-circuit Advisor to a minimal “Welcome” screen.
- **Role section route:** `src/app/dashboard/[role]/[section]/page.tsx`
  - Routes `/dashboard/advisor/<section>` to the Advisor section components.

### Advisor section components (already present)

- `src/components/dashboard/advisor/my-projects-page.tsx`
- `src/components/dashboard/advisor/students-page.tsx`
- `src/components/dashboard/advisor/evaluations-page.tsx`
- `src/components/dashboard/advisor/schedule-page.tsx`
- `src/components/dashboard/advisor/messages-page.tsx`

These are intentionally minimal placeholders today.

## 2) Current temporary state (so you don’t get confused)

I temporarily replaced the Advisor home dashboard UI with a simple screen that shows:

- Date + time
- `Welcome, <user name> to Academia`
- Time-based greeting (morning/afternoon/evening)

This lives in **`src/components/dashboard/page.tsx`** as `AdvisorDashboardWelcome`.

Inside that file there is also a **commented block** showing the previous return that rendered:

```tsx
<CustomizableDashboard ... />
```

When you start the real implementation, you will likely remove the temporary component and restore the real dashboard renderer.

## 3) How the “real” dashboard UI is built (widgets + layout)

The home dashboard for roles is implemented as a **widget grid**.

Key files:

- `src/components/dashboard/customizable-dashboard.tsx`
  - Renders:
    - dashboard header
    - optional edit mode (enable/disable widgets)
    - `react-grid-layout` responsive grid
- `src/lib/dashboard/widget-registry.ts`
  - Combines all role widgets into `WIDGET_REGISTRY`.
- `src/components/dashboard/widgets/advisor.tsx`
  - Advisor widgets are declared here in `AdvisorWidgets`.
- `src/lib/dashboard/default-layouts.ts`
  - Default layout for Advisor is under `case "advisor"`.

### If you add a new Advisor widget

1. Add a new widget entry under `AdvisorWidgets` in `src/components/dashboard/widgets/advisor.tsx`.
   - Give it a unique id like `ad.<something>`.
   - Set `rolesAllowed: ["advisor"]`.
2. Update `src/lib/dashboard/default-layouts.ts` (advisor case):
   - Add the widget id to `enabledWidgetIds`.
   - Add it to each breakpoint layout (`lg`, `md`, `sm`, `xs`).

## 4) Data strategy (mock first, then API)

We want fast UI iteration without blocking on backend.

### Phase A — Mock data (recommended for initial UI)

Create a new mock module:

- `src/lib/mock/advisor-dashboard.ts`

Pattern reference (already exists):

- `src/lib/mock/department-head.ts`

Recommended mock model (adjust as needed):

```ts
export type AdvisorProjectStatus = "in-progress" | "needs-review" | "completed";

export interface AdvisorProjectSummary {
  id: string;
  title: string;
  teamName: string;
  status: AdvisorProjectStatus;
  lastUpdateIso: string;
}

export interface AdvisorEvaluationTodo {
  id: string;
  teamName: string;
  title: string;
  dueIso: string;
  priority: "High" | "Medium" | "Low";
}

export interface AdvisorScheduleItem {
  id: string;
  title: string;
  startIso: string;
  location?: string;
  type: "meeting" | "defense" | "review";
}

export interface AdvisorDashboardMock {
  kpis: Array<{ title: string; value: string; note: string; icon: "FolderKanban" | "GraduationCap" | "ClipboardList" | "CheckCircle2" }>;
  projects: AdvisorProjectSummary[];
  evaluations: AdvisorEvaluationTodo[];
  schedule: AdvisorScheduleItem[];
}

export const advisorDashboardMock: AdvisorDashboardMock = {
  // fill with mock rows
};
```

Use this mock data inside widgets in `src/components/dashboard/widgets/advisor.tsx`.

### Phase B — Replace mock with API calls

When backend endpoints are ready, create a small API module that uses the shared axios client:

- `src/lib/api/advisor/*` (or `src/lib/api/advisor.ts`)

Rules:

- Use the shared axios instance (`src/lib/api/client.ts`) so auth + tenant headers are injected.
- In client components, use **TanStack Query v5** for server state (`useQuery`, `useMutation`).
- Avoid `any`; define/reuse types under `src/types/*`.

## 5) UI rules (important)

- Do **not** edit `src/components/ui/*` directly (shadcn primitives).
- Use Tailwind tokens / existing theme primitives only.
- Prefer composing existing dashboard primitives:
  - `src/components/dashboard/page-primitives.tsx` (header + section cards)
  - `src/components/ui/card`, `button`, `badge`, etc.

## 6) Suggested Advisor home dashboard content (MVP)

Minimum recommended widget set for Advisor:

1. **Summary KPIs**
   - assigned projects
   - active students
   - pending evaluations
   - completion rate (or similar)
2. **Follow-ups / tasks**
   - simple filter (All/Feedback/Review)
3. **Upcoming schedule**
   - next 2–5 items

These are already roughly represented in `src/components/dashboard/widgets/advisor.tsx`.



## 8) Commands

- Dev: `npm run dev`
- Lint: `npm run lint`
- Build: `npm run build`
