# Coding Standards

## Code Style

### TypeScript

```typescript
// ✅ Good - Use interfaces for objects
interface Order {
  id: string;
  customerName: string;
  status: OrderStatus;
}

// ❌ Bad - Avoid type aliases for objects
type Order = { id: string; ... }

// ✅ Good - Explicit return types
function getOrder(id: string): Promise<Order> { }

// ✅ Good - Use enums for fixed values
enum OrderStatus {
  PENDING = 'PENDING',
  IN_PROGRESS = 'IN_PROGRESS',
}

// ✅ Good - Destructure with types
const { id, status }: Order = order;
```

### React Components

```tsx
// ✅ Good - Functional components with types
interface OrderCardProps {
  order: Order;
  onSelect: (id: string) => void;
}

export const OrderCard: React.FC<OrderCardProps> = ({ order, onSelect }) => {
  return (
    <div onClick={() => onSelect(order.id)}>
      {order.customerName}
    </div>
  );
};

// ✅ Good - Custom hooks start with 'use'
export const useOrders = () => { };

// ✅ Good - Memoize expensive operations
const sortedOrders = useMemo(() => 
  orders.sort((a, b) => a.dueDate - b.dueDate),
  [orders]
);
```

## Naming Conventions

| Type | Convention | Example |
|------|------------|---------|
| Files/Folders | kebab-case | `order-card.tsx` |
| Components | PascalCase | `OrderCard` |
| Functions | camelCase | `getOrderById` |
| Constants | UPPER_SNAKE | `MAX_RETRIES` |
| Interfaces | PascalCase | `OrderFilters` |
| Types | PascalCase | `OrderStatus` |
| CSS Classes | kebab-case | `order-card` |
| API Routes | kebab-case | `/api/order-history` |
| DB Tables | snake_case | `order_notes` |

## File Structure

```
src/
├── components/
│   ├── common/          # Shared components
│   │   └── Button.tsx
│   ├── orders/          # Feature-specific
│   │   ├── OrderCard.tsx
│   │   ├── OrderForm.tsx
│   │   └── index.ts     # Barrel export
├── hooks/
│   └── useOrders.ts
├── services/
│   └── orderService.ts
├── types/
│   └── order.types.ts
└── utils/
    └── formatters.ts
```

## API Design

```typescript
// RESTful endpoints
GET    /api/orders          # List all
GET    /api/orders/:id      # Get one
POST   /api/orders          # Create
PUT    /api/orders/:id      # Update
DELETE /api/orders/:id      # Delete

// Response format
{
  "success": true,
  "data": { },
  "message": "Order created",
  "pagination": { "page": 1, "total": 100 }
}

// Error format
{
  "success": false,
  "error": {
    "code": "VALIDATION_ERROR",
    "message": "Invalid input",
    "details": [{ "field": "email", "message": "Required" }]
  }
}
```

## Git Commit Format

```
<type>(<scope>): <subject>

[optional body]

[optional footer]
```

**Types:**
- `feat`: New feature
- `fix`: Bug fix
- `docs`: Documentation
- `style`: Formatting
- `refactor`: Code restructure
- `test`: Adding tests
- `chore`: Maintenance

**Examples:**
```
feat(orders): add priority filter to order list
fix(auth): resolve token refresh race condition
docs(api): update swagger documentation
```

## PR Checklist

- [ ] Code follows style guidelines
- [ ] Self-review completed
- [ ] Tests added/updated
- [ ] No console.log statements
- [ ] TypeScript errors resolved
- [ ] Documentation updated
- [ ] Tested locally
