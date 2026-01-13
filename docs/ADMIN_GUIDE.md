# Gold Factory Inventory - Administrator Guide

## Table of Contents
1. [Admin Overview](#admin-overview)
2. [User Management](#user-management)
3. [Department Configuration](#department-configuration)
4. [System Configuration](#system-configuration)
5. [Backup & Restore](#backup--restore)
6. [Performance Tuning](#performance-tuning)
7. [Security Management](#security-management)
8. [Maintenance Tasks](#maintenance-tasks)
9. [Monitoring & Alerts](#monitoring--alerts)
10. [Troubleshooting](#troubleshooting)

---

## Admin Overview

### Admin Dashboard

The admin dashboard provides:
- System health status
- Active users count
- Recent activity log
- Quick action buttons

![Admin Dashboard](screenshots/admin-dashboard.png)

### Admin Menu Access

Navigate to **Settings** → **Admin Panel** to access:
- User Management
- Department Settings
- System Configuration
- Audit Logs
- Backup Management

---

## User Management

### Viewing All Users

1. Go to **Admin** → **Users**
2. View list of all users
3. Filter by role, status, department

![User Management](screenshots/user-management.png)

### Creating a New User

1. Click **+ Add User**
2. Fill in user details:

| Field | Description | Required |
|-------|-------------|----------|
| Email | Login email | ✅ |
| Name | Full name | ✅ |
| Password | Temporary password | ✅ |
| Role | Permission level | ✅ |
| Department | Assigned department | For Workers |

3. Click **Create User**
4. User receives welcome email

### User Roles Explained

| Role | Permissions |
|------|------------|
| **ADMIN** | Full system access, user management, configuration |
| **MANAGER** | Order management, department oversight, reports |
| **WORKER** | Department-specific tasks, status updates |

### Editing User Details

1. Find user in list
2. Click **Edit** (pencil icon)
3. Modify fields
4. Click **Save Changes**

### Deactivating Users

Instead of deleting, deactivate users to preserve history:

1. Find user in list
2. Click **Deactivate**
3. Confirm action
4. User cannot log in but data is preserved

### Resetting User Password

1. Find user in list
2. Click **Reset Password**
3. Choose option:
   - Generate random password
   - Set specific password
4. User receives email with new credentials

### Bulk User Operations

1. Select multiple users (checkboxes)
2. Click **Bulk Actions**
3. Choose action:
   - Change role
   - Change department
   - Deactivate
   - Export

---

## Department Configuration

### Viewing Departments

1. Go to **Admin** → **Departments**
2. View workflow order
3. See active/inactive status

### Creating a Department

1. Click **+ Add Department**
2. Enter details:

```
Name: Quality Control
Description: Final inspection before packaging
Sequence: 6 (determines workflow order)
Color: #10B981 (for Kanban board)
```

3. Click **Create Department**

### Editing Department Order

The sequence determines the production workflow:

1. Drag departments to reorder
2. Or click **Edit** and change sequence number
3. Save changes

```
Example Order:
1. Receiving
2. Melting
3. Designing
4. Moulding
5. Polishing
6. Quality Check
7. Packaging
8. Dispatch
```

### Department Settings

| Setting | Description |
|---------|-------------|
| Auto-advance | Automatically move to next department |
| Require notes | Workers must add notes before moving |
| Time limit | Alert if order exceeds time in department |
| Quality check | Require QC approval |

---

## System Configuration

### General Settings

Navigate to **Admin** → **Settings** → **General**

| Setting | Default | Description |
|---------|---------|-------------|
| Company Name | Gold Factory | Displayed in header |
| Order Prefix | ORD | Prefix for order numbers |
| Date Format | DD/MM/YYYY | Date display format |
| Timezone | Asia/Kolkata | System timezone |

### Email Configuration

```yaml
SMTP Settings:
  Host: smtp.gmail.com
  Port: 587
  Security: TLS
  Username: notifications@company.com
  Password: ********
  From Name: Gold Factory System
  From Email: noreply@company.com
```

### Notification Settings

| Notification | Email | In-App | Push |
|--------------|-------|--------|------|
| Order Created | ✅ | ✅ | ❌ |
| Status Changed | ✅ | ✅ | ✅ |
| Order Overdue | ✅ | ✅ | ✅ |
| User Mentioned | ✅ | ✅ | ✅ |

### Feature Flags

Enable/disable features:

```
✅ Real-time notifications
✅ Email alerts
✅ PDF export
✅ Customer portal
❌ SMS notifications
❌ Two-factor authentication
```

---

## Backup & Restore

### Automated Backups

Backups run automatically:

| Type | Frequency | Retention |
|------|-----------|-----------|
| Full database | Daily 2 AM | 30 days |
| Incremental | Every 6 hours | 7 days |
| Config files | Weekly | 90 days |

### Manual Backup

1. Go to **Admin** → **Backup**
2. Click **Create Backup Now**
3. Wait for completion
4. Download backup file (optional)

```bash
# Command line backup
./scripts/backup.sh production manual-$(date +%Y%m%d)
```

### Restore from Backup

⚠️ **Warning**: Restore will overwrite current data

1. Go to **Admin** → **Backup** → **Restore**
2. Select backup file
3. Confirm restore
4. System will restart

```bash
# Command line restore
./scripts/rollback.sh production
# Select backup when prompted
```

### Backup Storage

| Location | Path |
|----------|------|
| Local | `/opt/gold-factory/backups/` |
| Cloud (S3) | `s3://company-backups/gold-factory/` |

### Verify Backup Integrity

```bash
# List available backups
./scripts/backup.sh list production

# Verify backup
gzip -t backups/production/latest.sql.gz && echo "✅ Backup valid"
```

---

## Performance Tuning

### Database Optimization

**Analyze slow queries:**
```sql
-- Check slow queries
SELECT * FROM pg_stat_activity WHERE state = 'active';

-- Analyze table performance
ANALYZE orders;
VACUUM ANALYZE;
```

**Recommended indexes:**
```sql
-- Already created by Prisma migrations
CREATE INDEX idx_orders_status ON orders(status);
CREATE INDEX idx_orders_department ON orders(current_department_id);
CREATE INDEX idx_orders_due_date ON orders(due_date);
```

### Redis Cache Configuration

```yaml
# performance.config.ts
cache:
  ttl:
    dashboard: 60      # 1 minute
    orders: 30         # 30 seconds
    departments: 300   # 5 minutes
  maxSize: 256MB
```

**Clear cache if needed:**
```bash
docker-compose exec redis redis-cli FLUSHALL
```

### Application Performance

**Monitor response times:**
- Target: < 200ms for API calls
- Check `/api/health` for metrics

**Resource limits (docker-compose.yml):**
```yaml
deploy:
  resources:
    limits:
      memory: 1G
      cpus: '1.0'
    reservations:
      memory: 256M
```

### Frontend Optimization

- Enable gzip compression (nginx)
- Use CDN for static assets
- Enable browser caching

---

## Security Management

### Security Checklist

Daily:
- [ ] Review failed login attempts
- [ ] Check active sessions
- [ ] Monitor API usage

Weekly:
- [ ] Review user access
- [ ] Check audit logs
- [ ] Update dependencies

Monthly:
- [ ] Rotate secrets
- [ ] Review permissions
- [ ] Security scan

### Audit Logs

View all system activity:

1. Go to **Admin** → **Audit Logs**
2. Filter by:
   - User
   - Action type
   - Date range
   - Resource

**Log types:**
- Authentication (login, logout, failed attempts)
- Data changes (create, update, delete)
- Configuration changes
- Access violations

### Session Management

**View active sessions:**
1. Go to **Admin** → **Security** → **Sessions**
2. See all logged-in users
3. Force logout if needed

**Session settings:**
```yaml
session:
  accessTokenExpiry: 15m
  refreshTokenExpiry: 7d
  maxConcurrentSessions: 3
  forceLogoutOnPasswordChange: true
```

### IP Whitelisting

Restrict admin access by IP:

```yaml
# security.config.ts
adminAccess:
  allowedIPs:
    - 192.168.1.0/24
    - 10.0.0.1
  enabled: true
```

### Rate Limiting

Current limits:

| Endpoint | Limit | Window |
|----------|-------|--------|
| Login | 5 attempts | 15 min |
| API (authenticated) | 100 requests | 15 min |
| API (unauthenticated) | 20 requests | 15 min |
| File upload | 10 requests | 1 hour |

---

## Maintenance Tasks

### Daily Tasks
- [ ] Check system health dashboard
- [ ] Review error logs
- [ ] Verify backups completed
- [ ] Monitor disk space

### Weekly Tasks
- [ ] Review user activity
- [ ] Clean old sessions
- [ ] Check for updates
- [ ] Review slow queries

### Monthly Tasks
- [ ] Database maintenance (VACUUM)
- [ ] Rotate log files
- [ ] Review security logs
- [ ] Update documentation

### Scheduled Maintenance

**Create maintenance window:**
1. Notify users 24 hours ahead
2. Enable maintenance mode
3. Perform updates
4. Verify system health
5. Disable maintenance mode

```bash
# Enable maintenance mode
docker-compose exec backend node -e "process.env.MAINTENANCE_MODE='true'"

# Disable
docker-compose exec backend node -e "process.env.MAINTENANCE_MODE='false'"
```

### Log Management

**View logs:**
```bash
# All logs
docker-compose logs -f

# Specific service
docker-compose logs -f backend

# Last 100 lines
docker-compose logs --tail=100 backend
```

**Log rotation is automatic** (see `/etc/logrotate.d/gold-factory`)

### Database Maintenance

```bash
# Connect to database
docker-compose exec postgres psql -U postgres -d gold_factory

# Check database size
SELECT pg_size_pretty(pg_database_size('gold_factory'));

# List largest tables
SELECT tablename, pg_size_pretty(pg_total_relation_size(tablename::text))
FROM pg_tables WHERE schemaname = 'public'
ORDER BY pg_total_relation_size(tablename::text) DESC;

# Vacuum and analyze
VACUUM ANALYZE;
```

---

## Monitoring & Alerts

### Health Checks

**Endpoints:**
- `/api/health` - Basic health check
- `/api/health/detailed` - Detailed status (admin only)

**Response:**
```json
{
  "status": "healthy",
  "timestamp": "2024-01-15T10:30:00Z",
  "services": {
    "database": "connected",
    "redis": "connected",
    "storage": "available"
  },
  "metrics": {
    "uptime": "5d 12h 30m",
    "memory": "450MB / 1GB",
    "cpu": "25%"
  }
}
```

### Setting Up Alerts

**Email alerts:**
1. Go to **Admin** → **Alerts**
2. Configure conditions:
   - Error rate > 5%
   - Response time > 2s
   - Disk usage > 80%
   - Memory usage > 90%
3. Add recipients

**Slack integration:**
```yaml
alerts:
  slack:
    webhook: https://hooks.slack.com/services/XXX
    channel: #alerts
    levels: [error, critical]
```

### Monitoring Dashboard

Access Grafana at `/monitoring`:
- System metrics
- API performance
- Database stats
- User activity

---

## Troubleshooting

### Common Issues

**Database connection failed:**
```bash
# Check database container
docker-compose ps postgres

# View logs
docker-compose logs postgres

# Restart if needed
docker-compose restart postgres
```

**Out of memory:**
```bash
# Check memory usage
docker stats

# Increase limits in docker-compose.yml
# Or add swap space
sudo fallocate -l 4G /swapfile
```

**SSL certificate expired:**
```bash
# Renew Let's Encrypt certificate
sudo certbot renew

# Restart nginx
sudo systemctl restart nginx
```

**Application not starting:**
```bash
# Check logs
docker-compose logs backend

# Common issues:
# - Missing environment variables
# - Database not ready
# - Port already in use
```

### Emergency Procedures

**Complete system failure:**
1. Check hosting provider status
2. Verify DNS resolution
3. Check container status
4. Review recent changes
5. Restore from backup if needed

**Data breach response:**
1. Immediately disable affected accounts
2. Force logout all sessions
3. Rotate all secrets
4. Review audit logs
5. Notify relevant parties
6. Document incident

### Support Escalation

| Level | Response Time | Contact |
|-------|---------------|---------|
| L1 | 4 hours | support@company.com |
| L2 | 2 hours | devops@company.com |
| L3 | 30 min | On-call engineer |

---

*Last Updated: January 2026*
*Version: 1.0.0*
