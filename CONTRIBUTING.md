# Contributing Guide

Thank you for contributing to Gold Factory Inventory!

## Development Setup

### Prerequisites
- Node.js 20+
- PostgreSQL 14+
- Redis 7+
- Git

### Setup Steps

```bash
# 1. Fork and clone
git clone https://github.com/YOUR-USERNAME/gold-factory-inventory.git
cd gold-factory-inventory

# 2. Add upstream remote
git remote add upstream https://github.com/org/gold-factory-inventory.git

# 3. Install dependencies
cd backend && npm install
cd ../frontend && npm install

# 4. Setup environment
cp backend/.env.example backend/.env
cp frontend/.env.example frontend/.env

# 5. Setup database
cd backend
npx prisma migrate dev
npx prisma db seed

# 6. Start development
npm run dev  # in both frontend and backend directories
```

## Development Workflow

### 1. Create Feature Branch

```bash
# Sync with upstream
git fetch upstream
git checkout main
git merge upstream/main

# Create branch
git checkout -b feat/your-feature-name
```

**Branch naming:**
- `feat/` - New features
- `fix/` - Bug fixes
- `docs/` - Documentation
- `refactor/` - Code improvements

### 2. Make Changes

- Follow [Coding Standards](docs/CODING_STANDARDS.md)
- Write/update tests
- Update documentation

### 3. Test Your Changes

```bash
# Backend tests
cd backend && npm test

# Frontend tests
cd frontend && npm test

# Type checking
npm run typecheck

# Linting
npm run lint
```

### 4. Commit Changes

```bash
# Stage changes
git add .

# Commit with conventional format
git commit -m "feat(orders): add bulk delete functionality"
```

**Commit format:** `type(scope): description`

Types: `feat`, `fix`, `docs`, `style`, `refactor`, `test`, `chore`

### 5. Submit Pull Request

```bash
# Push branch
git push origin feat/your-feature-name
```

Then on GitHub:
1. Click "New Pull Request"
2. Fill PR template
3. Request review

## PR Requirements

- [ ] All tests pass
- [ ] No linting errors
- [ ] TypeScript compiles
- [ ] Documentation updated
- [ ] PR description complete

## Code Review

### For Authors
- Respond to feedback promptly
- Explain complex changes
- Update based on review

### For Reviewers
- Be constructive
- Approve when ready
- Use suggestions for minor changes

## Questions?

- Open a Discussion on GitHub
- Ask in #dev channel

Thank you for contributing! 🙏
