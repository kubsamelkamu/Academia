# Academia - Academic Project Management Platform

Multi-tenant academic project management UI for universities: dashboards by role (department head, coordinator, advisor, student, committee) plus supporting marketing/auth flows.

[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)
[![Next.js](https://img.shields.io/badge/Next.js-16.1.6-black)](https://nextjs.org/)
[![React](https://img.shields.io/badge/React-19.x-61dafb)](https://react.dev/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.x-3178c6)](https://www.typescriptlang.org/)
[![Tailwind CSS](https://img.shields.io/badge/Tailwind-4.x-38bdf8)](https://tailwindcss.com/)
[![CI](https://github.com/kubsamelkamu/academia/actions/workflows/ci.yml/badge.svg)](https://github.com/kubsamelkamu/academia/actions/workflows/ci.yml)
[![Lint](https://github.com/kubsamelkamu/academia/actions/workflows/lint.yml/badge.svg)](https://github.com/kubsamelkamu/academia/actions/workflows/lint.yml)

## Tech stack

- Next.js App Router + TypeScript (strict)
- Tailwind CSS v4 + shadcn/ui (Radix primitives)
- Zustand (UI/auth) + TanStack Query v5 (server state)
- Axios client with request/response interceptors

## Getting started

### Prerequisites

- Node.js 18+
- npm

### Run locally

1) Install dependencies

```bash
npm install
```

2) Create `.env.local`

This app talks to an upstream backend API. The client axios instance reads `NEXT_PUBLIC_API_BASE_URL` from the environment.

```env
# Example (matches the contact proxy route)
NEXT_PUBLIC_API_BASE_URL="https://api.academia.et/api/v1"
```

3) Start dev server

```bash
npm run dev
```

Open http://localhost:3000

## Multi-tenant behavior

There are two tenant signals in the codebase:

- `src/middleware.ts` derives a tenant identifier from the request host and forwards it as `x-tenant-id` for internal Next.js requests.
   - Middleware skips `localhost` hosts.
   - Middleware currently only runs when the first DNS label (subdomain) contains a `-` (hyphen).
- `src/lib/api/client.ts` injects upstream headers for backend calls:
   - `X-Tenant-Domain` from the auth store (`tenantDomain`)
   - `Authorization: Bearer <token>` when available

If you need to test the middleware logic locally, use a custom host mapped to `127.0.0.1` (Windows `hosts` file) such as `tenant-dev.local`, and browse http://tenant-dev.local:3000.

## Scripts

```bash
npm run dev    # start dev server
npm run lint   # run ESLint
npm run build  # production build
npm run start  # run production server
```

## Project structure

```
src/
   app/                 # App Router routes/layouts
      (auth)/            # login/register
      (marketing)/       # landing pages
      api/               # route handlers
      dashboard/         # dashboard routes
   components/
      ui/                # shadcn/ui primitives
      layout/            # header/sidebar/footer
      dashboard/         # dashboards + widgets
   config/
      navigation.ts      # role navigation config
   lib/
      api/               # axios client + API modules
   store/               # Zustand stores
   types/               # shared TS types
   validations/         # zod schemas
```

## Contributing

See [CONTRIBUTING.md](CONTRIBUTING.md) and [CODE_OF_CONDUCT.md](CODE_OF_CONDUCT.md).

## Security

If you discover a security issue, please follow [SECURITY.md](SECURITY.md).

## License

MIT - see [LICENSE](LICENSE).
