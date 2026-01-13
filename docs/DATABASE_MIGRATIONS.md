# Database Migrations Guide

## Overview
This project uses Prisma ORM for database migrations. All schema changes are version-controlled.

## Running Migrations

### Development
```bash
# Create migration from schema changes
npx prisma migrate dev --name your_migration_name

# Apply pending migrations
npx prisma migrate dev

# Reset database (WARNING: destroys data)
npx prisma migrate reset
```

### Production
```bash
# Apply migrations (safe for production)
npx prisma migrate deploy

# Via Docker
docker-compose exec backend npx prisma migrate deploy
```

## Pre-Migration Checklist

- [ ] Create database backup
- [ ] Review migration SQL
- [ ] Test on staging environment
- [ ] Schedule maintenance window (if needed)
- [ ] Notify team

## Backup Before Migration

```bash
# Always backup before migration
./scripts/backup.sh production pre-migration

# Verify backup
ls -la backups/production/
```

## Migration Workflow

### 1. Create Migration (Development)
```bash
# Edit prisma/schema.prisma
# Then generate migration
npx prisma migrate dev --name add_user_preferences
```

### 2. Review Migration SQL
```bash
# Check generated SQL
cat prisma/migrations/20240115_add_user_preferences/migration.sql
```

### 3. Test on Staging
```bash
# Deploy to staging
ssh staging "cd /opt/gold-factory && docker-compose exec backend npx prisma migrate deploy"

# Verify
ssh staging "cd /opt/gold-factory && docker-compose exec backend npx prisma migrate status"
```

### 4. Deploy to Production
```bash
# Backup
./scripts/backup.sh production pre-migration-$(date +%Y%m%d)

# Deploy
docker-compose exec backend npx prisma migrate deploy

# Verify
docker-compose exec backend npx prisma migrate status
```

## Rollback Procedures

### Option 1: Restore from Backup
```bash
# Stop application
docker-compose stop backend

# Restore database
./scripts/rollback.sh production
# Select "yes" for database rollback

# Restart
docker-compose start backend
```

### Option 2: Manual Rollback Migration
```bash
# Create rollback migration
npx prisma migrate dev --name rollback_user_preferences

# Or manually write down migration
cat > prisma/migrations/manual_rollback/migration.sql << 'EOF'
-- Undo changes
ALTER TABLE "User" DROP COLUMN "preferences";
EOF
```

### Option 3: Reset to Specific Migration
```bash
# View migration history
npx prisma migrate status

# Mark migration as rolled back (then restore backup)
npx prisma migrate resolve --rolled-back 20240115_add_user_preferences
```

## Zero-Downtime Migrations

### Safe Changes (No Downtime)
- Adding new tables
- Adding nullable columns
- Adding indexes
- Adding new enum values

### Risky Changes (Require Strategy)
- Removing columns
- Renaming columns
- Changing column types
- Removing enum values

### Strategy: Expand-Contract Pattern

**Step 1: Expand** - Add new structure
```prisma
model User {
  email     String   // Old column
  emailNew  String?  // New column (nullable)
}
```

**Step 2: Migrate Data**
```sql
UPDATE "User" SET "emailNew" = LOWER("email");
```

**Step 3: Deploy Application** (reads from both)

**Step 4: Contract** - Remove old structure
```prisma
model User {
  email String  // Now uses new column
}
```

## Troubleshooting

### Migration Stuck
```bash
# Check status
npx prisma migrate status

# Force resolve
npx prisma migrate resolve --applied 20240115_migration_name
```

### Schema Drift
```bash
# Compare database with schema
npx prisma db pull

# Or force push schema (DANGER: can lose data)
npx prisma db push --force-reset
```

### Lock Issues
```sql
-- Check for locks
SELECT * FROM pg_locks WHERE NOT granted;

-- Kill blocking query
SELECT pg_terminate_backend(pid) FROM pg_stat_activity WHERE state = 'idle in transaction';
```
