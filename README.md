# 🎓 [Academia](https://github.com/kubsamelkamu/academia) - Academic Project Management Platform

> A comprehensive multi-universities platform designed for academic institutions to streamline project management, advisor-student collaboration, and defense coordination.

This repository contains the source code for **Academia**, an open-source academic project management platform. Visit the [GitHub repository](https://github.com/kubsamelkamu/academia) for the latest updates, issues, and contributions.

[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)
[![Next.js](https://img.shields.io/badge/Next.js-16.1.6-black)](https://nextjs.org/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.0-blue)](https://www.typescriptlang.org/)
[![Tailwind CSS](https://img.shields.io/badge/Tailwind-3.4-38bdf8)](https://tailwindcss.com/)
[![CI](https://github.com/kubsamelkamu/academia/actions/workflows/ci.yml/badge.svg)](https://github.com/kubsamelkamu/academia/actions/workflows/ci.yml)
[![Lint](https://github.com/kubsamelkamu/academia/actions/workflows/lint.yml/badge.svg)](https://github.com/kubsamelkamu/academia/actions/workflows/lint.yml)

**Academia** empowers universities and academic institutions with a modern, scalable platform for managing student projects, coordinating advisors, scheduling defenses, and maintaining academic excellence through streamlined workflows and real-time collaboration.

## 📋 Table of Contents

- [✨ Features](#-features)
- [🏗️ Architecture](#️-architecture)
- [🛠️ Tech Stack](#️-tech-stack)
- [🚀 Getting Started](#-getting-started)
- [📁 Project Structure](#-project-structure)
- [💻 Development](#-development)
- [🚀 Deployment](#-deployment)
- [🤝 Contributing](#-contributing)
- [📄 License](#-license)
- [🔒 Security](#-security)
- [📞 Support](#-support)

## ✨ Features

### 🎓 **Multi-Role Academic Management**
- **Department Heads**: Full institutional oversight and analytics
- **Coordinators**: Project assignment and defense coordination
- **Advisors**: Student guidance and evaluation management
- **Students**: Project submission and progress tracking
- **Committee Members**: Defense evaluation and compliance

### 🏛️ **Multi-Tenant Architecture**
- **Institution Isolation**: Secure data separation per university
- **Subdomain Support**: Custom domains for each institution
- **Scalable Infrastructure**: Support for growing academic networks
- **Unified Administration**: Centralized platform management

### 📊 **Comprehensive Project Lifecycle**
- **Proposal Management**: Student project submissions and reviews
- **Advisor Assignment**: Intelligent matching and workload balancing
- **Progress Tracking**: Real-time milestone monitoring
- **Defense Scheduling**: Automated calendar management
- **Evaluation System**: Structured assessment workflows

### 🔄 **Real-Time Collaboration**
- **Live Notifications**: Instant updates on project status
- **Team Communication**: Integrated messaging and file sharing
- **Document Management**: Version control and secure storage
- **Progress Dashboards**: Visual analytics for all stakeholders

### 📈 **Analytics & Reporting**
- **Institutional Insights**: Department-wide performance metrics
- **Project Analytics**: Success rates and completion tracking
- **User Activity**: Engagement and participation monitoring
- **Compliance Reporting**: Academic standards and audit trails

## 🏗️ Architecture

### System Overview
```
┌─────────────────────────────────────────────────┐
│              Academia Platform                   │
│              (Multi-Tenant SaaS)                │
├─────────────────────────────────────────────────┤
│   university1.academia.com    university2.academia.com   │
│   ┌─────────────────────┐    ┌─────────────────────┐    │
│   │  Institution A      │    │  Institution B      │    │
│   │  ├─ Dept. Head      │    │  ├─ Dept. Head      │    │
│   │  ├─ Coordinators    │    │  ├─ Coordinators    │    │
│   │  ├─ Advisors        │    │  ├─ Advisors        │    │
│   │  ├─ Students        │    │  ├─ Students        │    │
│   │  └─ Committee       │    │  └─ Committee       │    │
│   └─────────────────────┘    └─────────────────────┘    │
└─────────────────────────────────────────────────┘
                 │
                 ▼
        ┌─────────────────┐
        │   Next.js 16    │
        │   App Router    │
        ├─────────────────┤
        │   Middleware    │
        │   (Tenant ID)   │
        └─────────────────┘
                 │
                 ▼
        ┌─────────────────┐
        │   API Routes    │
        │   (REST/GraphQL)│
        └─────────────────┘
                 │
                 ▼
        ┌─────────────────┐
        │   Database      │
        │   (PostgreSQL)  │
        │   ├─ Tenant 1   │
        │   ├─ Tenant 2   │
        │   └─ ...        │
        └─────────────────┘
```

### Key Design Principles
- **Security First**: Multi-tenant data isolation and RBAC
- **Scalability**: Horizontal scaling for growing institutions
- **Performance**: Optimized for real-time collaboration
- **Accessibility**: WCAG 2.1 AA compliant interface
- **Mobile-First**: Responsive design for all devices

## 🛠️ Tech Stack

### **Frontend Framework**
- **Next.js 16.1.6** - React framework with App Router
- **React 18** - UI library with concurrent features
- **TypeScript 5.0** - Type-safe JavaScript
- **Tailwind CSS 3.4** - Utility-first CSS framework

### **UI & Components**
- **shadcn/ui** - Modern component library
- **Radix UI** - Accessible, unstyled UI primitives
- **Lucide React** - Beautiful icon library
- **React Hook Form** - Performant forms with validation
- **Zod** - TypeScript-first schema validation

### **State & Data Management**
- **Zustand** - Lightweight state management
- **TanStack Query** - Powerful data synchronization
- **Axios** - HTTP client with interceptors

### **Development & Quality**
- **ESLint** - Code linting and style enforcement
- **TypeScript** - Static type checking
- **GitHub Actions** - CI/CD automation
- **Prettier** - Code formatting (planned)

### **Infrastructure**
- **Vercel** - Deployment and hosting (recommended)
- **PostgreSQL** - Primary database
- **Redis** - Caching and session storage (planned)
- **AWS S3** - File storage and CDN (planned)

## 🚀 Getting Started

### Prerequisites
- **Node.js** 18.x or higher
- **npm** 9.x or higher
- **Git** 2.x or higher

### Quick Start

1. **Clone the repository**
   ```bash
   git clone https://github.com/kubsamelkamu/academia.git
   cd academia
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Set up environment variables**
   ```bash
   cp .env.example .env.local
   ```

   Configure your `.env.local`:
   ```env
   # Database
   DATABASE_URL="postgresql://username:password@localhost:5432/academia"

   # Authentication
   NEXTAUTH_SECRET="your-secret-key-here"
   NEXTAUTH_URL="http://localhost:3000"

   # External Services (Optional)
   REDIS_URL="redis://localhost:6379"
   AWS_ACCESS_KEY_ID="your-aws-key"
   AWS_SECRET_ACCESS_KEY="your-aws-secret"
   ```

4. **Run database migrations** (if applicable)
   ```bash
   npm run db:migrate
   ```

5. **Start the development server**
   ```bash
   npm run dev
   ```

6. **Open your browser**
   - **Marketing Page**: [http://localhost:3000](http://localhost:3000)
   - **Dashboard**: [http://localhost:3000/dashboard](http://localhost:3000/dashboard)

### Development Scripts
```bash
npm run dev          # Start development server
npm run build        # Build for production
npm run start        # Start production server
npm run lint         # Run ESLint
npm run type-check   # Run TypeScript checking
npm run test         # Run test suite (when implemented)
```

## 📁 Project Structure

```
academia/
├── .github/
│   ├── workflows/           # CI/CD pipelines
│   ├── ISSUE_TEMPLATE/      # GitHub issue templates
│   └── COPILOT_INSTRUCTIONS.md # AI assistant guide
├── public/                  # Static assets
├── src/
│   ├── app/                 # Next.js App Router
│   │   ├── (marketing)/     # Public landing page
│   │   ├── dashboard/       # Protected dashboard routes
│   │   ├── api/             # API route handlers
│   │   ├── globals.css      # Global styles
│   │   ├── layout.tsx       # Root layout
│   │   └── providers.tsx    # App providers
│   ├── components/          # Reusable components
│   │   ├── ui/             # shadcn/ui components
│   │   ├── layout/         # Layout components
│   │   └── dashboard/      # Dashboard-specific components
│   ├── config/             # Configuration files
│   │   └── navigation.ts   # Role-based navigation
│   ├── lib/                # Utility libraries
│   │   ├── api/            # API client
│   │   ├── utils.ts        # General utilities
│   │   └── validations/    # Form validations
│   ├── store/              # State management
│   │   └── sidebar-store.ts # UI state
│   └── types/              # TypeScript definitions
├── .cursorrules            # Cursor IDE instructions
├── .env.example            # Environment template
├── next.config.ts          # Next.js configuration
├── tailwind.config.ts      # Tailwind configuration
├── tsconfig.json           # TypeScript configuration
├── eslint.config.mjs       # ESLint configuration
└── package.json            # Dependencies and scripts
```

## 💻 Development

### Code Quality
- **TypeScript Strict Mode**: Enabled for maximum type safety
- **ESLint Rules**: React, accessibility, and best practices
- **Pre-commit Hooks**: Automated linting and type checking
- **GitHub Actions**: CI/CD with automated testing

### Development Workflow
1. **Create feature branch**: `git checkout -b feature/your-feature`
2. **Make changes**: Follow established patterns and conventions
3. **Test locally**: Run `npm run lint` and `npm run type-check`
4. **Commit changes**: Use conventional commit format
5. **Create PR**: Automated CI will run checks
6. **Code review**: Team review and approval required

### Best Practices
- **Component Design**: Functional components with TypeScript
- **State Management**: Zustand for UI state, TanStack Query for server state
- **Error Handling**: Global error boundaries and user-friendly messages
- **Performance**: Code splitting, lazy loading, and optimization
- **Accessibility**: ARIA labels, keyboard navigation, screen reader support
- **Security**: Input validation, XSS prevention, secure headers

## 🚀 Deployment

### Recommended Platforms
- **Vercel** (Optimal for Next.js)
- **Netlify** (Good alternative)
- **Railway** (Full-stack deployment)
- **AWS/GCP/Azure** (Enterprise solutions)

### Production Checklist
- [ ] Environment variables configured
- [ ] Database connection established
- [ ] SSL certificates installed
- [ ] Domain configured
- [ ] Monitoring and logging set up
- [ ] Backup strategy implemented

### Build Commands
```bash
# Production build
npm run build

# Start production server
npm run start

# Health check
curl https://yourdomain.com/api/health
```

## 🤝 Contributing

We welcome contributions from the community! Please read our [Contributing Guide](CONTRIBUTING.md) for details on:

- Setting up your development environment
- Code style and conventions
- Submitting pull requests
- Reporting bugs and requesting features

### Development Setup for Contributors
```bash
# Fork and clone
git clone https://github.com/kubsamelkamu/academia.git
cd academia

# Install dependencies
npm install

# Set up pre-commit hooks
npm run prepare

# Start development
npm run dev
```

## 📄 License

This project is licensed under the **MIT License** - see the [LICENSE](LICENSE) file for details.

```
MIT License

Copyright (c) 2024 Academia Platform

Permission is hereby granted, free of charge, to any person obtaining a copy
of this software and associated documentation files (the "Software"), to deal
in the Software without restriction, including without limitation the rights
to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
copies of the Software, and to permit persons to whom the Software is
furnished to do so, subject to the following conditions:

The above copyright notice and this permission notice shall be included in all
copies or substantial portions of the Software.
```

## 🔒 Security

Academia takes security seriously. If you discover a security vulnerability, please see our [Security Policy](SECURITY.md) for information on how to report it responsibly.

### Security Features
- **Multi-tenant data isolation**
- **Role-based access control (RBAC)**
- **Input validation and sanitization**
- **Secure authentication with NextAuth.js**
- **CSRF protection**
- **Rate limiting and DDoS protection**

## 📞 Support

### Getting Help
- **📖 Documentation**: [docs.academia.com](https://docs.academia.com)
- **🐛 Bug Reports**: [GitHub Issues](https://github.com/kubsamelkamu/academia/issues)
- **💬 Discussions**: [GitHub Discussions](https://github.com/kubsamelkamu/academia/discussions)
- **📧 Email**: support@academia.com

### Community
- **🌟 Star** the repository if you find it useful
- **🍴 Fork** to contribute improvements
- **📣 Share** with other educational institutions
- **🤝 Contribute** code, documentation, or ideas

## 🙏 Acknowledgments

- **Next.js Team** for the amazing React framework
- **shadcn** for the beautiful component system
- **Vercel** for hosting and deployment platform
- **Academic Community** for inspiration and requirements

---

<div align="center">

**🎓 Academia - Empowering Academic Excellence Through Technology**

*Built with ❤️ for universities, colleges, and educational institutions worldwide*

[🌐 Website](https://academia.com) • [📚 Documentation](https://docs.academia.com) • [🐛 Issues](https://github.com/kubsamelkamu/academia/issues)

</div>

## 📞 Support

### Getting Help
- **📖 Documentation**: Check our [Copilot Instructions](.github/COPILOT_INSTRUCTIONS.md) for detailed guidance
- **🐛 Bug Reports**: [Create an issue](https://github.com/kubsamelkamu/academia/issues/new?template=bug_report.md)
- **💡 Feature Requests**: [Submit ideas](https://github.com/kubsamelkamu/academia/issues/new?template=feature_request.md)
- **💬 Discussions**: [GitHub Discussions](https://github.com/kubsamelkamu/academia/discussions)
- **📧 Security Issues**: See [Security Policy](SECURITY.md)

### Community Guidelines
- **Code of Conduct**: Read our [Code of Conduct](CODE_OF_CONDUCT.md)
- **Contributing Guide**: See [CONTRIBUTING.md](CONTRIBUTING.md) for development setup
- **License**: MIT License - see [LICENSE](LICENSE)

## 🙏 Acknowledgments

**Academia** was built with modern web technologies and best practices:

- **Next.js Team** - Amazing React framework
- **shadcn/ui** - Beautiful component system
- **Tailwind CSS** - Utility-first styling
- **Vercel** - Optimal deployment platform
- **Academic Community** - Inspiration and requirements

---

<div align="center">

# 🎓 **Academia**
### *Academic Project Management Platform*

**Empowering universities worldwide with modern, scalable project management solutions.**

---

[🚀 Live Demo](https://academia.com) • [📚 Documentation](https://docs.academia.com) • [🐛 Report Bug](https://github.com/kubsamelkamu/academia/issues) • [💡 Request Feature](https://github.com/kubsamelkamu/academia/issues)

**Built with ❤️ for educational excellence**

[![GitHub stars](https://img.shields.io/github/stars/kubsamelkamu/academia?style=social)](https://github.com/kubsamelkamu/academia)
[![GitHub forks](https://img.shields.io/github/forks/kubsamelkamu/academia?style=social)](https://github.com/kubsamelkamu/academia)

</div>
