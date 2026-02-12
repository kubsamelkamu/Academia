# GitHub Copilot Instructions - Academia Platform

## 🎓 Welcome to Academia - Academic Project Management System

**Academia**   is a comprehensive academic project management platform designed to streamline collaboration between students, advisors, coordinators, and department heads in managing academic projects, theses, and defense processes.

## 🏗️ Architecture Overview

### Tech Stack
- **Frontend**: Next.js 16 + TypeScript + Tailwind CSS + shadcn/ui
- **State**: Zustand (UI) + TanStack Query (server state)
- **Backend**: Next.js API routes with multi-tenant middleware
- **Styling**: Tailwind CSS with custom design system

### Key Features
- Multi-tenant architecture (subdomain-based)
- 5 user roles: Department Head, Coordinator, Advisor, Student, Committee Member
- Project lifecycle management
- Defense scheduling system
- Real-time notifications
- Role-based dashboards

## 📁 File Structure Guide

```
src/
├── app/                    # Next.js App Router pages
│   ├── (marketing)/       # Public landing page
│   ├── dashboard/         # Protected dashboard routes
│   ├── api/               # Backend API routes
│   └── layout.tsx         # Root layout with providers
├── components/
│   ├── ui/               # shadcn/ui components (don't modify)
│   ├── layout/           # Sidebar, header, mobile nav
│   └── dashboard/        # Dashboard-specific components
├── config/navigation.ts   # Role-based menu configuration
├── lib/
│   ├── utils.ts          # General utilities (cn, etc.)
│   └── api/              # API client setup
├── store/                # Zustand stores
└── types/                # TypeScript definitions
```

## 👥 User Roles & Navigation

### Role-Based Access
1. **Department Head**: Full system overview, manages coordinators
2. **Coordinator**: Project management, advisor assignment, defense scheduling
3. **Advisor**: Student guidance, project reviews, defense participation
4. **Student**: Project submission, progress tracking, defense preparation
5. **Committee Member**: Defense evaluation, expert feedback

### Navigation Config
- Located in `src/config/navigation.ts`
- Role-based menu items with icons and permissions
- Supports nested navigation items

## 🔧 Development Patterns

### Component Creation
```typescript
// ✅ Good: Server component by default
export default function ProjectsPage() {
  return <div>Projects</div>
}

// ✅ Good: Client component only when needed
'use client'
export function ProjectForm() {
  const [title, setTitle] = useState('')
  // Interactive logic here
}
```

### State Management
```typescript
// UI State (Zustand)
import { useSidebarStore } from '@/store/sidebar-store'

// Server State (TanStack Query)
import { useQuery } from '@tanstack/react-query'
```

### API Patterns
```typescript
// API routes in src/app/api/
export async function GET(request: Request) {
  // Server-side logic
  return Response.json({ data })
}

// Client-side API calls
import { api } from '@/lib/api/client'
```

## 🎨 UI/UX Guidelines

### Design System
- **Colors**: Use Tailwind CSS variables and shadcn/ui theme
- **Typography**: Inter font family, responsive text sizes
- **Spacing**: Consistent padding/margins using Tailwind scale
- **Components**: Prefer shadcn/ui components over custom implementations

### Responsive Design
- Mobile-first approach
- Breakpoints: sm (640px), md (768px), lg (1024px), xl (1280px)
- Sidebar collapses to mobile sheet on small screens

## 🔒 Security & Multi-Tenant

### Authentication
- Session-based auth with secure cookies
- Role-based access control (RBAC)
- Route protection middleware

### Multi-Tenant Architecture
- Subdomain-based tenant isolation (e.g., `university.academia.com`)
- Middleware sets `x-tenant-id` header
- Database queries filtered by tenant
- Shared codebase, isolated data

## 📝 Code Quality Standards

### TypeScript
- Strict mode enabled
- Proper typing for all props, state, and API responses
- Avoid `any` type - use proper interfaces

### ESLint Rules
- React best practices
- Accessibility requirements
- Consistent code formatting
- No unused imports/variables

### Git Workflow
- Feature branches from `main`
- Conventional commit messages
- Pull request reviews required
- CI/CD checks must pass

## 🚀 Deployment & DevOps

### Build Process
- `npm run build` - Production build with static generation
- `npm run lint` - Code quality checks
- `npm run dev` - Development server

### Environment Setup
- `.env.local` for local development
- Environment variables for different stages
- Database connections and API keys

## 🧪 Testing Approach

### Current State
- No tests implemented yet
- Plan for: Component tests, API tests, E2E tests

### Future Testing
- Jest + React Testing Library for components
- API route testing
- E2E with Playwright (planned)

## 🔄 Common Workflows

### Adding New Features
1. Check user role requirements
2. Add navigation items to config
3. Create API routes if needed
4. Build UI components
5. Add proper TypeScript types
6. Test across different screen sizes

### Database Changes
1. Update API route handlers
2. Modify data fetching logic
3. Update TypeScript interfaces
4. Test with different user roles

### UI Component Creation
1. Check if shadcn/ui component exists
2. Use consistent styling patterns
3. Ensure accessibility compliance
4. Add proper TypeScript props
5. Test responsive behavior

## ⚠️ Important Reminders

- **Always consider multi-tenant context** - data isolation is critical
- **Role-based permissions** - different users see different data/actions
- **Mobile responsiveness** - test on small screens
- **Type safety** - avoid `any` types, use proper interfaces
- **Accessibility** - ARIA labels, keyboard navigation, screen reader support
- **Performance** - optimize images, lazy loading, efficient re-renders

## 📞 Support & Resources

- **Documentation**: This file and inline code comments
- **Issues**: Create GitHub issues for bugs/features
- **Code Reviews**: Required for all PRs
- **Architecture**: Refer to established patterns in existing code

---

**Remember**: You are building **Academia** - a professional academic management platform. Always prioritize:
- **Educational institution security** and data privacy
- **Multi-tenant architecture** for different universities
- **Role-based access control** for 5 distinct user types
- **Academic integrity** and compliance standards
- **Scalable architecture** for growing institutions

**Academia** serves universities worldwide - build it right! 🎓