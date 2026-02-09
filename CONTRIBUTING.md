# Contributing to Academia

Thank you for your interest in contributing to Academia! 🎓 We welcome contributions from everyone. By participating in this project, you agree to abide by our [Code of Conduct](CODE_OF_CONDUCT.md).

## 📋 Table of Contents

- [Getting Started](#getting-started)
- [Development Setup](#development-setup)
- [How to Contribute](#how-to-contribute)
- [Development Workflow](#development-workflow)
- [Code Guidelines](#code-guidelines)
- [Testing](#testing)
- [Submitting Changes](#submitting-changes)
- [Community](#community)

## 🚀 Getting Started

### Prerequisites

Before you begin, ensure you have the following installed:

- **Node.js**: Version 18.x or higher
- **npm**: Version 9.x or higher (comes with Node.js)
- **Git**: Version 2.30 or higher
- **Code Editor**: VS Code recommended (with our [Cursor Rules](.cursorrules))

### Quick Setup

1. **Fork the repository** on GitHub
2. **Clone your fork**:
   ```bash
   git clone https://github.com/yourusername/academia.git
   cd academia
   ```
3. **Install dependencies**:
   ```bash
   npm install
   ```
4. **Set up environment**:
   ```bash
   cp .env.example .env.local
   # Edit .env.local with your configuration
   ```
5. **Start development server**:
   ```bash
   npm run dev
   ```

## 🛠️ Development Setup

### Environment Configuration

Create a `.env.local` file with the following variables:

```env
# Application
NEXT_PUBLIC_APP_URL=http://localhost:3000
NEXTAUTH_URL=http://localhost:3000
NEXTAUTH_SECRET=your-development-secret

# API
NEXT_PUBLIC_API_URL=http://localhost:8000/api

# Database (if applicable)
DATABASE_URL=postgresql://localhost:5432/academia

# External Services
CLOUDINARY_CLOUD_NAME=your-cloud-name
CLOUDINARY_API_KEY=your-api-key
CLOUDINARY_API_SECRET=your-api-secret
```

### Development Scripts

```bash
# Development
npm run dev          # Start development server
npm run build        # Build for production
npm run start        # Start production server

# Code Quality
npm run lint         # Run ESLint
npm run lint:fix     # Fix ESLint issues
npm run type-check   # Run TypeScript type checking

# Testing
npm run test         # Run tests
npm run test:watch   # Run tests in watch mode
npm run test:coverage # Run tests with coverage

# Database (if applicable)
npm run db:migrate   # Run database migrations
npm run db:seed      # Seed database with test data
```

## 🤝 How to Contribute

### Types of Contributions

We welcome various types of contributions:

- 🐛 **Bug Reports**: Report bugs via [GitHub Issues](https://github.com/yourusername/academia/issues/new?template=bug_report.md)
- 💡 **Feature Requests**: Suggest new features via [GitHub Issues](https://github.com/yourusername/academia/issues/new?template=feature_request.md)
- 📝 **Documentation**: Improve documentation, guides, or comments
- 🧪 **Testing**: Write or improve tests
- 💻 **Code**: Submit pull requests with fixes or new features
- 🎨 **Design**: UI/UX improvements and design contributions

### Finding Issues to Work On

- Check our [GitHub Issues](https://github.com/yourusername/academia/issues) for open tasks
- Look for issues labeled `good first issue` or `help wanted`
- Join our [GitHub Discussions](https://github.com/yourusername/academia/discussions) for ideas

## 🔄 Development Workflow

### 1. Choose an Issue

- Find an issue you'd like to work on
- Comment on the issue to indicate you're working on it
- Wait for maintainer approval if required

### 2. Create a Branch

```bash
# Create and switch to a new branch
git checkout -b feature/your-feature-name
# or
git checkout -b fix/issue-number-description
```

### 3. Make Changes

- Write clear, focused commits
- Follow our [Code Guidelines](#code-guidelines)
- Test your changes thoroughly
- Update documentation if needed

### 4. Test Your Changes

```bash
# Run all checks
npm run lint
npm run type-check
npm run test

# Build to ensure everything works
npm run build
```

### 5. Submit a Pull Request

- Push your branch to your fork
- Create a Pull Request (PR) against the main branch
- Fill out the PR template completely
- Link to any related issues

## 📝 Code Guidelines

### TypeScript/JavaScript

- **Type Safety**: Use strict TypeScript types for all data structures
- **Imports**: Use ES6 imports, group by external libraries, then internal modules
- **Naming**: Use camelCase for variables/functions, PascalCase for components/types
- **Error Handling**: Implement proper error boundaries and user-friendly error messages

### React/Next.js

- **Components**: Use functional components with hooks
- **Server Components**: Prefer server components when possible
- **Client Components**: Mark with `'use client'` directive when needed
- **File Structure**: Follow the established folder structure
- **Styling**: Use Tailwind CSS classes and shadcn/ui components

### Code Style

```typescript
// ✅ Good: Clear naming and types
interface User {
  id: string;
  name: string;
  email: string;
  role: UserRole;
}

const getUserById = async (id: string): Promise<User | null> => {
  // Implementation
};

// ❌ Bad: Unclear naming and no types
const get = (i) => {
  // Implementation
};
```

### Commit Messages

Follow conventional commit format:

```bash
# Format: type(scope): description

feat(auth): add login with Google OAuth
fix(dashboard): resolve memory leak in chart component
docs(readme): update installation instructions
refactor(api): simplify user validation logic
test(utils): add unit tests for date helpers
```

## 🧪 Testing

### Testing Strategy

- **Unit Tests**: Test individual functions and components
- **Integration Tests**: Test component interactions and API calls
- **E2E Tests**: Test complete user workflows (future implementation)

### Running Tests

```bash
# Run all tests
npm run test

# Run tests in watch mode
npm run test:watch

# Run tests with coverage
npm run test:coverage

# Run specific test file
npm run test -- src/components/Button.test.tsx
```

### Writing Tests

```typescript
// Example component test
import { render, screen, fireEvent } from '@testing-library/react';
import { Button } from './Button';

describe('Button', () => {
  it('renders children correctly', () => {
    render(<Button>Click me</Button>);
    expect(screen.getByText('Click me')).toBeInTheDocument();
  });

  it('calls onClick when clicked', () => {
    const handleClick = jest.fn();
    render(<Button onClick={handleClick}>Click me</Button>);
    fireEvent.click(screen.getByText('Click me'));
    expect(handleClick).toHaveBeenCalledTimes(1);
  });
});
```

## 📤 Submitting Changes

### Pull Request Process

1. **Create PR**: Use our PR template
2. **Description**: Clearly describe what your PR does
3. **Link Issues**: Reference any related issues
4. **Screenshots**: Include screenshots for UI changes
5. **Testing**: Describe how you tested your changes

### PR Review Process

- Maintainers will review your PR
- Address any requested changes
- Once approved, a maintainer will merge your PR
- Your contribution will be acknowledged!

### PR Template

```markdown
## Description
Brief description of the changes made.

## Type of Change
- [ ] Bug fix (non-breaking change)
- [ ] New feature (non-breaking change)
- [ ] Breaking change
- [ ] Documentation update

## How Has This Been Tested?
Describe the tests you ran and how to reproduce.

## Screenshots (if applicable)
Add screenshots to help explain your changes.

## Checklist
- [ ] My code follows the project's style guidelines
- [ ] I have performed a self-review of my own code
- [ ] I have commented my code, particularly in hard-to-understand areas
- [ ] I have made corresponding changes to the documentation
- [ ] My changes generate no new warnings
- [ ] I have added tests that prove my fix is effective
- [ ] New and existing unit tests pass locally
```

## 🌐 Community

### Communication Channels

- **GitHub Issues**: For bugs and feature requests
- **GitHub Discussions**: For questions and general discussion
- **Pull Requests**: For code contributions

### Getting Help

- Check our [Copilot Instructions](.github/COPILOT_INSTRUCTIONS.md)
- Read the [Documentation](https://docs.academia.com)
- Join our community discussions

### Recognition

Contributors are recognized in:
- GitHub repository contributors list
- Release notes for significant contributions
- Our community acknowledgments

## 📄 License

By contributing to Academia, you agree that your contributions will be licensed under the same [MIT License](LICENSE) that covers the project.

---

Thank you for contributing to Academia! Your help makes academic project management better for everyone. 🎓✨