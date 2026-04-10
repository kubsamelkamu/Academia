# Academia

<p align="center">
  <img src="public/favicon.png" alt="Academia logo" width="96" height="96" />
</p>

<p align="center">
  <strong>Academic project management and collaboration platform for universities.</strong>
</p>

<p align="center">
  <a href="https://academia.et">academia.et</a>
</p>

[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)
[![Next.js](https://img.shields.io/badge/Next.js-16.1.6-black)](https://nextjs.org/)
[![React](https://img.shields.io/badge/React-19.x-61dafb)](https://react.dev/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.x-3178c6)](https://www.typescriptlang.org/)
[![Tailwind CSS](https://img.shields.io/badge/Tailwind-4.x-38bdf8)](https://tailwindcss.com/)
[![CI](https://github.com/kubsamelkamu/academia/actions/workflows/ci.yml/badge.svg)](https://github.com/kubsamelkamu/academia/actions/workflows/ci.yml)
[![Lint](https://github.com/kubsamelkamu/academia/actions/workflows/lint.yml/badge.svg)](https://github.com/kubsamelkamu/academia/actions/workflows/lint.yml)

## Overview

Academia is a multi-tenant academic project management platform built for universities. It provides role-based workspaces for department heads, coordinators, advisors, evaluators, committee members, and students—covering the full lifecycle from project intake to defense and reporting.

## Table of contents

- [Key features](#key-features)
- [Role-based workspaces](#role-based-workspaces)
- [Screenshots](#screenshots)
- [Tech stack](#tech-stack)
- [Architecture highlights](#architecture-highlights)
- [Getting started](#getting-started)
- [Environment variables](#environment-variables)
- [Scripts](#scripts)
- [Multi-tenant behavior](#multi-tenant-behavior)
- [Backend API](#backend-api)
- [Contributing](#contributing)
- [Security](#security)
- [License](#license)

## Key features

- End-to-end project lifecycle tracking (proposal → milestones → defense).
- Role-based dashboards with approvals, scheduling, and reporting.
- Real-time collaboration: messaging, notifications, and document workflows.
- Evaluation tools with rubrics, scoring, and audit-friendly reviews.
- Multi-tenant architecture for institutional isolation.
- PWA-ready UX and responsive layouts across devices.

## Role-based workspaces

- **Department Head**: faculty oversight, approvals, department reports.
- **Coordinator**: project assignments, schedules, communication, analytics.
- **Advisor**: supervise projects, feedback loops, student progress.
- **Evaluator**: evaluate submissions, manage defense sessions, recommendations.
- **Department Committee**: assigned reviews, scheduling, reporting.
- **Student**: project workspace, submissions, milestones, defense prep.

## Screenshots

| Landing & About | Student Workspace | Coordinator | Advisor | Evaluator |
| --- | --- | --- | --- | --- |
| ![Landing](public/image.png) | ![Students](public/students.png) | ![Coordinator](public/coordinator.png) | ![Advisor](public/advisor.png) | ![Evaluator](public/evaluator.png) |

Additional assets are available in `public/` (e.g., `about.png`, `sign-in-campus.jpg`).

## Tech stack

- **Next.js 16** (App Router) + **React 19** + **TypeScript** (strict)
- **Tailwind CSS v4** + **shadcn/ui** (Radix primitives)
- **Zustand** (UI/auth state) + **TanStack Query v5** (server state)
- **Axios** client with request/response interceptors

## Architecture highlights

- App Router routes and layouts live under `src/app/`.
- Multi-tenant middleware derives tenant context from the request host.
- Shared API client (`src/lib/api/client.ts`) injects auth + tenant headers.
- Role-based navigation is centralized in `src/config/navigation.ts`.

## Getting started

### Prerequisites

- Node.js 18+
- npm 9+

### Run locally

```bash
npm install
```

```bash
npm run dev
```

Open http://localhost:3000.

## Environment variables

Create `.env.local` in the project root:

```env
# Backend API base URL (should include /api/v1)
NEXT_PUBLIC_API_BASE_URL="https://api.academia.et/api/v1"

# Optional: local app URL
NEXT_PUBLIC_APP_URL="http://localhost:3000"

# Optional: mock dashboard role for local previews
# department_head | coordinator | advisor | evaluator | student | department_committee
NEXT_PUBLIC_ACADEMIA_MOCK_ROLE="coordinator"
```

## Scripts

```bash
npm run dev            # Start dev server (webpack)
npm run dev:turbo      # Start dev server (turbopack)
npm run dev:clean      # Start dev server (clean build)
npm run lint           # Run ESLint
npm run build          # Production build
npm run start          # Start production server

# Playwright (responsive checks)
npm run test:responsive:coordinator
npm run test:responsive:coordinator:auth
```

> Note: Playwright tests require browsers to be installed (`npx playwright install`).

## Multi-tenant behavior

- `src/middleware.ts` derives a tenant identifier from the request host and forwards it as `x-tenant-id` for internal Next.js requests.
- `src/lib/api/client.ts` injects upstream headers for backend calls:
  - `X-Tenant-Domain` from the auth store (`tenantDomain`)
  - `Authorization: Bearer <token>` when available

For local testing of tenant resolution, use a custom host mapped to `127.0.0.1` (e.g., `tenant-dev.local`).

## Backend API

Backend repository: https://github.com/kubsamelkamu/academia-backend-api

This frontend expects the backend base URL via `NEXT_PUBLIC_API_BASE_URL` (including `/api/v1`).

## Contributing

See [CONTRIBUTING.md](CONTRIBUTING.md) and [CODE_OF_CONDUCT.md](CODE_OF_CONDUCT.md).

## Security

If you discover a security issue, please follow [SECURITY.md](SECURITY.md).

## License

MIT - see [LICENSE](LICENSE).
