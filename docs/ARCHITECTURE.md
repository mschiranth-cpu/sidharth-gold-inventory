# System Architecture

## Overview

```
┌─────────────────────────────────────────────────────────────────┐
│                         CLIENT LAYER                             │
│  ┌─────────────┐  ┌─────────────┐  ┌─────────────┐              │
│  │   Browser   │  │   Mobile    │  │    PWA      │              │
│  └──────┬──────┘  └──────┬──────┘  └──────┬──────┘              │
└─────────┼────────────────┼────────────────┼─────────────────────┘
          │                │                │
          ▼                ▼                ▼
┌─────────────────────────────────────────────────────────────────┐
│                         FRONTEND (React)                         │
│  ┌──────────┐  ┌──────────┐  ┌──────────┐  ┌──────────┐        │
│  │  Pages   │  │Components│  │  Hooks   │  │ Services │        │
│  └──────────┘  └──────────┘  └──────────┘  └──────────┘        │
│                      React Query + Context                       │
└────────────────────────────┬────────────────────────────────────┘
                             │ HTTP/WebSocket
                             ▼
┌─────────────────────────────────────────────────────────────────┐
│                          NGINX                                   │
│                    (Reverse Proxy + SSL)                         │
└────────────────────────────┬────────────────────────────────────┘
                             │
                             ▼
┌─────────────────────────────────────────────────────────────────┐
│                      BACKEND (Express)                           │
│  ┌──────────┐  ┌──────────┐  ┌──────────┐  ┌──────────┐        │
│  │  Routes  │  │Middleware│  │ Services │  │  Prisma  │        │
│  └──────────┘  └──────────┘  └──────────┘  └──────────┘        │
│                       Socket.io                                  │
└───────┬─────────────────────────────────────┬───────────────────┘
        │                                     │
        ▼                                     ▼
┌───────────────┐                    ┌────────────────┐
│  PostgreSQL   │                    │     Redis      │
│   (Primary)   │                    │    (Cache)     │
└───────────────┘                    └────────────────┘
```

## Frontend Architecture

### Component Hierarchy

```
App
├── AuthProvider
│   ├── QueryClientProvider
│   │   ├── Router
│   │   │   ├── PublicRoutes
│   │   │   │   └── LoginPage
│   │   │   └── ProtectedRoutes
│   │   │       ├── DashboardLayout
│   │   │       │   ├── Sidebar
│   │   │       │   ├── Header
│   │   │       │   └── Outlet
│   │   │       │       ├── DashboardPage
│   │   │       │       ├── OrdersPage
│   │   │       │       ├── FactoryTrackingPage
│   │   │       │       ├── ReportsPage
│   │   │       │       └── UsersPage
```

### State Management

| Type | Solution | Use Case |
|------|----------|----------|
| Server State | React Query | API data, caching |
| Auth State | Context + localStorage | User session |
| UI State | useState/useReducer | Component state |
| Form State | React Hook Form | Form handling |

### Key Patterns

```typescript
// Custom Hook Pattern
const useOrders = (filters: OrderFilters) => {
  return useQuery({
    queryKey: ['orders', filters],
    queryFn: () => orderService.getAll(filters),
    staleTime: 30000,
  });
};

// Service Layer Pattern
class OrderService {
  async getAll(filters: OrderFilters): Promise<Order[]> {
    const { data } = await api.get('/orders', { params: filters });
    return data;
  }
}
```

## Backend Architecture

### Module Structure

```
src/
├── index.ts           # Entry point
├── routes/
│   ├── auth.routes.ts
│   ├── orders.routes.ts
│   ├── departments.routes.ts
│   └── users.routes.ts
├── middleware/
│   ├── auth.middleware.ts
│   ├── validate.middleware.ts
│   └── error.middleware.ts
├── services/
│   ├── auth.service.ts
│   ├── order.service.ts
│   └── notification.service.ts
├── config/
│   ├── database.ts
│   ├── redis.ts
│   └── swagger.config.ts
└── prisma/
    └── schema.prisma
```

### Request Flow

```
Request → Rate Limiter → Auth Middleware → Validation → Route Handler → Service → Prisma → Response
```

### Middleware Stack

```typescript
app.use(helmet());           // Security headers
app.use(cors(corsOptions));  // CORS
app.use(compression());      // Gzip
app.use(rateLimiter);        // Rate limiting
app.use(express.json());     // Body parsing
app.use(authenticate);       // JWT verification
app.use(requestLogger);      // Logging
```

## Database Schema

```
┌──────────────┐       ┌──────────────┐       ┌──────────────┐
│    User      │       │    Order     │       │  Department  │
├──────────────┤       ├──────────────┤       ├──────────────┤
│ id           │       │ id           │       │ id           │
│ email        │       │ orderNumber  │◄──────│ name         │
│ password     │       │ customerName │       │ description  │
│ name         │       │ product      │       │ sequence     │
│ role         │       │ quantity     │       │ color        │
│ departmentId │◄──┐   │ goldWeight   │       └──────────────┘
└──────────────┘   │   │ purity       │              ▲
                   │   │ priority     │              │
                   │   │ status       │              │
                   │   │ dueDate      │       ┌──────┴───────┐
                   │   │ departmentId─┼───────►DeptHistory   │
                   │   │ createdById  │       ├──────────────┤
                   │   └──────────────┘       │ orderId      │
                   │          │               │ departmentId │
                   │          ▼               │ enteredAt    │
                   │   ┌──────────────┐       │ exitedAt     │
                   └───┤  OrderNote   │       └──────────────┘
                       ├──────────────┤
                       │ id           │
                       │ orderId      │
                       │ content      │
                       │ userId       │
                       └──────────────┘
```

## Authentication Flow

```
┌────────┐         ┌────────┐         ┌────────┐
│ Client │         │ Server │         │  Redis │
└───┬────┘         └───┬────┘         └───┬────┘
    │   POST /login    │                  │
    │─────────────────►│                  │
    │                  │ Validate creds   │
    │                  │                  │
    │   Access Token   │                  │
    │   + Refresh Token│                  │
    │◄─────────────────│                  │
    │                  │ Store refresh    │
    │                  │─────────────────►│
    │                  │                  │
    │ GET /orders      │                  │
    │ (Bearer token)   │                  │
    │─────────────────►│                  │
    │                  │ Verify JWT       │
    │   Orders data    │                  │
    │◄─────────────────│                  │
    │                  │                  │
    │ POST /refresh    │                  │
    │─────────────────►│                  │
    │                  │ Validate refresh │
    │                  │◄─────────────────│
    │   New tokens     │                  │
    │◄─────────────────│                  │
```

## Real-time Notifications

```
┌────────┐         ┌────────┐         ┌────────┐
│Client A│         │ Server │         │Client B│
└───┬────┘         └───┬────┘         └───┬────┘
    │ Connect WS       │                  │
    │─────────────────►│                  │
    │                  │   Connect WS     │
    │                  │◄─────────────────│
    │                  │                  │
    │ Update Order     │                  │
    │─────────────────►│                  │
    │                  │ Emit to room     │
    │                  │─────────────────►│
    │                  │   Order Updated  │
    │                  │                  │
```

### Socket Events

| Event | Direction | Description |
|-------|-----------|-------------|
| `order:created` | Server → Client | New order created |
| `order:updated` | Server → Client | Order status changed |
| `order:moved` | Server → Client | Order moved to department |
| `notification` | Server → Client | General notification |

## Caching Strategy

| Data | TTL | Invalidation |
|------|-----|--------------|
| Dashboard stats | 60s | On order change |
| Orders list | 30s | On CRUD operation |
| Departments | 5min | On config change |
| User session | 15min | On logout |

```typescript
// Cache-aside pattern
async getOrders(filters) {
  const cacheKey = `orders:${hash(filters)}`;
  const cached = await redis.get(cacheKey);
  if (cached) return JSON.parse(cached);
  
  const data = await prisma.order.findMany(filters);
  await redis.setex(cacheKey, 30, JSON.stringify(data));
  return data;
}
```
