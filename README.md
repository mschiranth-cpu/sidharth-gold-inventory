# Gold Factory Inventory System

A comprehensive inventory management system for gold jewelry factories, enabling real-time order tracking through production departments.

## ✨ Features

- **Order Management** - Create, track, and manage customer orders
- **Factory Tracking** - Kanban board for visual production flow  
- **Real-time Updates** - Socket.io powered notifications
- **Role-based Access** - Admin, Manager, Worker permissions
- **Reports & Analytics** - Production and efficiency reports
- **PWA Support** - Offline-capable progressive web app
- **API Documentation** - Swagger/OpenAPI at `/api-docs`

## 🛠 Tech Stack

| Layer | Technologies |
|-------|-------------|
| **Frontend** | React 18, TypeScript, TailwindCSS, React Query, Vite |
| **Backend** | Node.js, Express, TypeScript, Prisma ORM |
| **Database** | PostgreSQL 14+, Redis 7+ |
| **Auth** | JWT (access + refresh tokens), bcrypt |
| **Real-time** | Socket.io |
| **Testing** | Jest, Vitest, Playwright |
| **DevOps** | Docker, GitHub Actions, Nginx |

## 📁 Project Structure

```
├── frontend/           # React SPA
│   ├── src/
│   │   ├── components/ # UI components
│   │   ├── pages/      # Route pages
│   │   ├── hooks/      # Custom hooks
│   │   ├── contexts/   # React contexts
│   │   └── services/   # API clients
├── backend/            # Express API
│   ├── src/
│   │   ├── routes/     # API routes
│   │   ├── middleware/ # Express middleware
│   │   ├── services/   # Business logic
│   │   └── prisma/     # Database schema
├── docs/               # Documentation
└── docker-compose.yml  # Container orchestration
```

## 🚀 Getting Started

### Prerequisites
- Node.js 20+
- PostgreSQL 14+
- Redis 7+
- npm or yarn

### Quick Start

```bash
# Clone and install
git clone https://github.com/your-org/gold-factory-inventory.git
cd gold-factory-inventory

# Backend setup
cd backend
npm install
cp .env.example .env
npx prisma migrate dev
npx prisma db seed

# Frontend setup  
cd ../frontend
npm install
cp .env.example .env
```

### Environment Variables

**Backend (.env)**
```env
DATABASE_URL="postgresql://user:pass@localhost:5432/gold_factory"
JWT_SECRET="your-secret-key-min-32-chars"
JWT_REFRESH_SECRET="your-refresh-secret"
REDIS_URL="redis://localhost:6379"
PORT=5000
NODE_ENV=development
```

**Frontend (.env)**
```env
VITE_API_URL=http://localhost:5000/api
VITE_WS_URL=ws://localhost:5000
```

### Running Development Servers

```bash
# Terminal 1 - Backend (http://localhost:5000)
cd backend && npm run dev

# Terminal 2 - Frontend (http://localhost:5173)
cd frontend && npm run dev
```

## 🧪 Testing

```bash
# Backend unit/integration tests
cd backend && npm test

# Frontend component tests
cd frontend && npm test

# E2E tests (requires servers running)
npm run test:e2e

# Coverage report
npm run test:coverage
```

## 🏗 Production Build

```bash
# Build applications
cd backend && npm run build
cd frontend && npm run build

# Using Docker
docker-compose up -d
```

## 📚 Documentation

| Document | Description |
|----------|-------------|
| [Architecture](docs/ARCHITECTURE.md) | System design & diagrams |
| [API Docs](http://localhost:5000/api-docs) | Swagger UI |
| [User Guide](docs/USER_GUIDE.md) | End-user documentation |
| [Admin Guide](docs/ADMIN_GUIDE.md) | System administration |
| [Deployment](docs/DEPLOYMENT.md) | Production deployment |
| [Troubleshooting](docs/TROUBLESHOOTING.md) | Common issues |

## 🤝 Contributing

See [CONTRIBUTING.md](CONTRIBUTING.md) for development workflow and guidelines.

## 📄 License

MIT License - see [LICENSE](LICENSE) for details.

---

## Backend Setup (Detailed)

1. Navigate to the backend directory:
   ```bash
   cd backend
   ```

2. Install dependencies:
   ```bash
   npm install
   ```

3. Set up environment variables:
   ```bash
   cp .env.example .env
   ```
   Update the `.env` file with your database credentials.

4. Run database migrations:
   ```bash
   npx prisma migrate dev
   ```

5. Generate Prisma client:
   ```bash
   npx prisma generate
   ```

6. Start the development server:
   ```bash
   npm run dev
   ```

### Frontend Setup

1. Navigate to the frontend directory:
   ```bash
   cd frontend
   ```

2. Install dependencies:
   ```bash
   npm install
   ```

3. Set up environment variables:
   ```bash
   cp .env.example .env
   ```

4. Start the development server:
   ```bash
   npm run dev
   ```

## API Endpoints

### Users
- `GET /api/users` - Get all users
- `POST /api/users` - Create a new user
- `GET /api/users/:id` - Get user by ID
- `PUT /api/users/:id` - Update user
- `DELETE /api/users/:id` - Delete user

### Orders
- `GET /api/orders` - Get all orders
- `POST /api/orders` - Create a new order
- `GET /api/orders/:id` - Get order by ID
- `PUT /api/orders/:id` - Update order
- `DELETE /api/orders/:id` - Delete order

### Factory
- `GET /api/factory/inventory` - Get inventory
- `POST /api/factory/inventory` - Add inventory item
- `PUT /api/factory/inventory/:id` - Update inventory item
- `DELETE /api/factory/inventory/:id` - Delete inventory item

### Departments
- `GET /api/departments` - Get all departments
- `POST /api/departments` - Create department
- `GET /api/departments/:id` - Get department by ID
- `PUT /api/departments/:id` - Update department
- `DELETE /api/departments/:id` - Delete department

## License

MIT
