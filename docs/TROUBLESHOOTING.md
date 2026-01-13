# Troubleshooting Guide

## Common Development Issues

### Database Connection Failed

**Error:** `Can't reach database server`

**Solutions:**
```bash
# Check PostgreSQL is running
sudo systemctl status postgresql

# Verify connection string
echo $DATABASE_URL

# Test connection
psql $DATABASE_URL -c "SELECT 1"

# Reset Prisma client
npx prisma generate
```

### Migration Errors

**Error:** `Migration failed to apply`

```bash
# Reset database (development only!)
npx prisma migrate reset

# Force apply migrations
npx prisma migrate deploy --force

# Check migration status
npx prisma migrate status
```

**Error:** `Drift detected`
```bash
# Pull current schema
npx prisma db pull

# Create migration from diff
npx prisma migrate dev --name fix_drift
```

### CORS Errors

**Error:** `Access-Control-Allow-Origin missing`

```typescript
// backend/src/index.ts - Check CORS config
app.use(cors({
  origin: ['http://localhost:5173', process.env.FRONTEND_URL],
  credentials: true,
}));
```

**Checklist:**
- [ ] Frontend URL in allowed origins
- [ ] `credentials: 'include'` in fetch
- [ ] Correct HTTP method allowed

### Authentication Issues

**Error:** `jwt malformed`
```bash
# Check token format
echo $TOKEN | cut -d'.' -f2 | base64 -d

# Verify JWT_SECRET matches
grep JWT_SECRET .env
```

**Error:** `Token expired`
- Check token expiry settings
- Verify refresh token flow
- Clear localStorage and re-login

### Redis Connection

**Error:** `ECONNREFUSED`
```bash
# Check Redis status
redis-cli ping

# Verify REDIS_URL
redis-cli -u $REDIS_URL ping

# Restart Redis
sudo systemctl restart redis
```

## Performance Debugging

### Slow API Responses

```typescript
// Add timing middleware
app.use((req, res, next) => {
  const start = Date.now();
  res.on('finish', () => {
    console.log(`${req.method} ${req.url} - ${Date.now() - start}ms`);
  });
  next();
});
```

**Common causes:**
- Missing database indexes
- N+1 query problems
- Large payloads

### Memory Leaks

```bash
# Check Node memory
node --inspect backend/dist/index.js

# Monitor memory
node --max-old-space-size=512 dist/index.js
```

**Common causes:**
- Unclosed database connections
- Event listener accumulation
- Global variable caching

### Frontend Performance

```bash
# Analyze bundle size
npm run build -- --analyze

# Check React renders
# Add React DevTools Profiler
```

## Quick Fixes

| Issue | Quick Fix |
|-------|-----------|
| Types out of sync | `npx prisma generate` |
| Cache stale | `redis-cli FLUSHALL` |
| Port in use | `kill -9 $(lsof -t -i:5000)` |
| Node modules | `rm -rf node_modules && npm i` |
| Build cache | `rm -rf dist && npm run build` |

## Getting Help

1. Check logs: `docker-compose logs -f`
2. Search issues: GitHub Issues
3. Ask team: #dev-support channel
