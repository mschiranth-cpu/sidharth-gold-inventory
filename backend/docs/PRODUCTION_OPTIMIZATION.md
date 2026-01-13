# Backend Production Optimization Guide

This document describes the production optimizations implemented in the Gold Inventory Backend API.

## Table of Contents

1. [Database Optimization](#database-optimization)
2. [Caching Strategy](#caching-strategy)
3. [API Optimization](#api-optimization)
4. [Monitoring & Logging](#monitoring--logging)
5. [Configuration](#configuration)
6. [Deployment Checklist](#deployment-checklist)

---

## Database Optimization

### Indexes

Production-optimized indexes have been added to frequently queried fields in the Prisma schema:

**User Model:**
- `[email]` - Unique email lookup
- `[isActive]` - Active user filtering
- `[role, isActive]` - Role-based queries
- `[department, isActive]` - Department filtering
- `[createdAt(sort: Desc)]` - Recent users

**Order Model:**
- `[orderNumber]` - Unique order lookup
- `[status]` - Status filtering
- `[createdById]` - User's orders
- `[priority(sort: Desc)]` - Priority sorting
- `[status, priority(sort: Desc)]` - Combined status/priority
- `[status, createdAt(sort: Desc)]` - Recent orders by status
- `[createdById, status]` - User's orders by status
- `[updatedAt(sort: Desc)]` - Recently updated

**OrderDetails Model:**
- `[orderId]` - Order lookup
- `[dueDate(sort: Asc)]` - Due date sorting
- `[productType]` - Product type filtering
- `[purity]` - Purity filtering
- `[enteredById]` - Entry tracking

**DepartmentTracking Model:**
- `[orderId]` - Order association
- `[departmentName]` - Department filtering
- `[status]` - Status filtering
- `[assignedToId]` - Worker assignments
- `[departmentName, status]` - Department workflow
- `[assignedToId, status]` - Worker workload
- `[status, startedAt]` - In-progress tracking
- `[completedAt]` - Completion tracking

**FinalSubmission Model:**
- `[submittedAt(sort: Desc)]` - Recent submissions
- `[customerApproved]` - Approval status
- `[qualityGrade]` - Quality filtering
- `[submittedById, submittedAt]` - Worker submissions

### Database Views

SQL views for complex reports are available in `prisma/views.sql`:

1. **v_order_summary** - Combined order/details/submission view
2. **v_department_performance** - Department efficiency metrics
3. **v_worker_productivity** - Worker performance metrics
4. **v_daily_order_metrics** - Daily aggregations for dashboards
5. **v_overdue_orders** - Orders past due date
6. **v_gold_inventory_summary** - Current gold allocation
7. **v_purity_distribution** - Purity breakdown
8. **v_quality_grades_distribution** - Quality grade distribution

To create views after migration:
```bash
psql -d gold_inventory_db -f prisma/views.sql
```

### Connection Pooling

Configure in `.env`:
```env
DATABASE_POOL_MIN=2
DATABASE_POOL_MAX=10
DATABASE_TIMEOUT=30000
```

---

## Caching Strategy

### Redis Setup

Install Redis and configure in `.env`:
```env
REDIS_ENABLED=true
REDIS_HOST=localhost
REDIS_PORT=6379
REDIS_PASSWORD=your_password
REDIS_DB=0
REDIS_KEY_PREFIX=gold_inv:
```

### Cache TTL Configuration

```env
REDIS_TTL_DEFAULT=300      # 5 minutes
REDIS_TTL_SESSION=86400    # 24 hours
REDIS_TTL_DASHBOARD=300    # 5 minutes
REDIS_TTL_ORDERS_LIST=60   # 1 minute
```

### Cache Middleware Usage

Import and use in routes:

```typescript
import { 
  cacheMiddleware, 
  dashboardCacheMiddleware,
  ordersListCacheMiddleware,
  invalidateOrdersCache 
} from '../../middleware/cache';

// Cache GET endpoints
router.get('/stats', dashboardCacheMiddleware, handleGetStats);
router.get('/', ordersListCacheMiddleware, handleGetOrders);

// Invalidate cache on mutations
router.post('/', handleCreate, invalidateOrdersCache);
router.put('/:id', handleUpdate, invalidateOrdersCache);
```

### Cache Service API

```typescript
import { cacheService } from './utils/cache';

// Basic operations
await cacheService.get('key');
await cacheService.set('key', data, ttl);
await cacheService.delete('key');

// Cache-aside pattern
const data = await cacheService.getOrSet('key', async () => {
  return await expensiveDbQuery();
}, 300);

// Bulk operations
await cacheService.mget(['key1', 'key2']);
await cacheService.mset([{ key: 'k1', value: v1 }, { key: 'k2', value: v2 }]);

// Pattern deletion
await cacheService.deleteByPattern('orders:*');
```

---

## API Optimization

### Response Compression

Gzip/Brotli compression is automatically applied:
- Threshold: 1KB (configurable)
- Level: 6 (balanced speed/compression)

Configure in `.env`:
```env
COMPRESSION_ENABLED=true
COMPRESSION_THRESHOLD=1024
COMPRESSION_LEVEL=6
```

### Rate Limiting

Multiple rate limiters are configured:

| Limiter | Window | Max Requests | Use Case |
|---------|--------|--------------|----------|
| Global | 15 min | 1000 | All requests |
| Auth | 1 min | 5 | Login attempts |
| API | 1 min | 100 | API endpoints |
| Upload | 1 hour | 10 | File uploads |
| Reports | 1 min | 10 | Report generation |

Rate limit headers are included in responses:
- `X-RateLimit-Limit`
- `X-RateLimit-Remaining`
- `X-RateLimit-Reset`

### Image Optimization

Import from `utils/imageOptimizer`:

```typescript
import { 
  processUploadedImage,
  validateImage,
  generateThumbnail 
} from './utils/imageOptimizer';

// Process uploaded image (resize, compress, convert to WebP)
const optimized = await processUploadedImage(buffer, {
  maxWidth: 1920,
  maxHeight: 1080,
  quality: 80,
  format: 'webp'
});

// Generate thumbnail
const thumb = await generateThumbnail(buffer, 200, 200);
```

### Cursor-Based Pagination

For large datasets, use cursor-based pagination:

```typescript
import { 
  getPrismaCursorPaginationArgs,
  formatCursorPaginationResult 
} from './utils/pagination';

// In controller
const { cursor, take, direction } = req.query;
const paginationArgs = getPrismaCursorPaginationArgs(cursor, take, direction);

const items = await prisma.order.findMany({
  ...paginationArgs,
  where: { status: 'ACTIVE' },
  orderBy: { createdAt: 'desc' },
});

// Format response with next/prev cursors
const result = formatCursorPaginationResult(items, take, 'id');
res.json(result);
```

### ETag Support

ETags are automatically generated for cached responses. Clients should send `If-None-Match` header to get `304 Not Modified` for unchanged content.

---

## Monitoring & Logging

### Request Logging (Morgan)

Configured for production:
- Format: `combined` (Apache combined log format)
- Skipped paths: `/health`, `/health/live`, `/health/ready`

### Performance Monitoring

Response time is tracked and added to headers:
- `X-Response-Time: 45.23ms`
- `Server-Timing: total;dur=45.23`

Slow requests (>1s) are logged automatically.

Get metrics summary:
```typescript
import { getMetricsSummary } from './middleware/performanceMonitor';

const metrics = getMetricsSummary();
// { totalRequests, avgResponseTime, slowRequests, histogram }
```

### Health Check Endpoints

| Endpoint | Description |
|----------|-------------|
| `GET /health` | Basic health check |
| `GET /health/detailed` | Full system health (DB, Redis) |
| `GET /health/live` | Kubernetes liveness probe |
| `GET /health/ready` | Kubernetes readiness probe |
| `GET /health/metrics` | Prometheus-format metrics |

### Error Tracking (Sentry)

Configure in `.env`:
```env
SENTRY_ENABLED=true
SENTRY_DSN=https://xxx@sentry.io/xxx
SENTRY_ENVIRONMENT=production
SENTRY_TRACES_SAMPLE_RATE=0.1
```

Capture errors:
```typescript
import { captureException, captureMessage } from './utils/sentry';

try {
  // risky operation
} catch (error) {
  captureException(error, { extra: { orderId: '123' } });
}

// Log messages
captureMessage('Payment processed', 'info', { amount: 1000 });
```

---

## Configuration

All optimization settings are centralized in `src/config/performance.config.ts`.

Environment variables (`.env`):

```env
# Database
DATABASE_POOL_MIN=2
DATABASE_POOL_MAX=10
DATABASE_TIMEOUT=30000

# Redis
REDIS_ENABLED=true
REDIS_HOST=localhost
REDIS_PORT=6379
REDIS_PASSWORD=
REDIS_DB=0
REDIS_KEY_PREFIX=gold_inv:
REDIS_TTL_DEFAULT=300
REDIS_TTL_SESSION=86400
REDIS_TTL_DASHBOARD=300
REDIS_TTL_ORDERS_LIST=60

# Rate Limiting
RATE_LIMIT_ENABLED=true
RATE_LIMIT_WINDOW_MS=900000
RATE_LIMIT_MAX_REQUESTS=1000

# Compression
COMPRESSION_ENABLED=true
COMPRESSION_THRESHOLD=1024
COMPRESSION_LEVEL=6

# Image Optimization
IMAGE_MAX_WIDTH=1920
IMAGE_MAX_HEIGHT=1080
IMAGE_QUALITY=80
IMAGE_ENABLE_WEBP=true

# Monitoring
SENTRY_ENABLED=true
SENTRY_DSN=
SENTRY_ENVIRONMENT=production
SENTRY_TRACES_SAMPLE_RATE=0.1
PERFORMANCE_SLOW_REQUEST_THRESHOLD_MS=1000
```

---

## Deployment Checklist

### Pre-Deployment

- [ ] Set `NODE_ENV=production`
- [ ] Configure all production environment variables
- [ ] Run database migrations: `npx prisma migrate deploy`
- [ ] Create database views: `psql -f prisma/views.sql`
- [ ] Install Redis and verify connection
- [ ] Configure Sentry DSN
- [ ] Set strong JWT secrets (32+ characters)

### Dependencies

Install production dependencies:
```bash
npm install --production
```

New dependencies added:
- `compression` - Response compression
- `ioredis` - Redis client
- `rate-limit-redis` - Redis-backed rate limiting
- `sharp` - Image processing
- `@sentry/node` - Error tracking
- `express-rate-limit` - Rate limiting

### Build & Run

```bash
# Build TypeScript
npm run build

# Generate Prisma client
npm run prisma:generate

# Run production server
npm start
```

### Docker

```dockerfile
FROM node:20-alpine

# Install sharp dependencies
RUN apk add --no-cache vips-dev

WORKDIR /app
COPY package*.json ./
RUN npm ci --production

COPY dist ./dist
COPY prisma ./prisma

RUN npx prisma generate

EXPOSE 3000
CMD ["node", "dist/index.js"]
```

### Health Checks

Configure in orchestrator:

```yaml
# Kubernetes
livenessProbe:
  httpGet:
    path: /health/live
    port: 3000
  initialDelaySeconds: 10
  periodSeconds: 30

readinessProbe:
  httpGet:
    path: /health/ready
    port: 3000
  initialDelaySeconds: 5
  periodSeconds: 10
```

---

## Troubleshooting

### Redis Connection Issues

Check Redis connectivity:
```bash
redis-cli ping
```

The application will continue to work without Redis (cache disabled).

### Slow Queries

1. Check logs for "Slow request" warnings
2. Review database indexes
3. Use `EXPLAIN ANALYZE` on slow queries
4. Consider materializing database views

### Memory Issues

1. Monitor with `/health/metrics`
2. Adjust connection pool settings
3. Reduce cache TTLs
4. Consider horizontal scaling

---

## Performance Benchmarks

Expected improvements after optimization:

| Metric | Before | After |
|--------|--------|-------|
| Orders list (GET) | 150ms | 15ms (cached) |
| Dashboard stats | 300ms | 30ms (cached) |
| Report generation | 2s | 200ms (cached) |
| Response size | 100KB | 30KB (compressed) |

---

*Last updated: Production optimization v1.0*
