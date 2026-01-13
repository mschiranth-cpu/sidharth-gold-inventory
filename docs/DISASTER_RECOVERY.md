# Disaster Recovery Plan

## Gold Factory Inventory System

**Document Version:** 1.0  
**Last Updated:** January 2026  
**Owner:** IT Operations Team

---

## 1. Recovery Objectives

### RTO (Recovery Time Objective)

| Tier | Systems | RTO |
|------|---------|-----|
| Critical | Database, API Server | 1 hour |
| High | Frontend, Authentication | 2 hours |
| Medium | Reporting, Notifications | 4 hours |
| Low | Analytics, Backups | 24 hours |

### RPO (Recovery Point Objective)

| Data Type | RPO | Backup Frequency |
|-----------|-----|------------------|
| Orders, Inventory | 1 hour | Hourly WAL archiving |
| User Data | 24 hours | Daily backup |
| Uploaded Files | 24 hours | Daily sync |
| Logs | 7 days | Weekly archive |

---

## 2. Emergency Contacts

| Role | Name | Phone | Email |
|------|------|-------|-------|
| Primary On-Call | [Name] | [Phone] | [Email] |
| Backup On-Call | [Name] | [Phone] | [Email] |
| Database Admin | [Name] | [Phone] | [Email] |
| Cloud Provider | AWS Support | - | support@aws.com |

---

## 3. Quick Recovery Commands

### Database Recovery
```bash
# Download latest backup
aws s3 cp s3://BUCKET/production/database/daily/latest.sql.gz /tmp/

# Restore
./scripts/restore-db.sh /tmp/latest.sql.gz production
```

### Full System Recovery
```bash
# 1. Restore database
./scripts/restore-db.sh s3://BUCKET/path/backup.sql.gz

# 2. Restore files
./scripts/restore-files.sh s3://BUCKET/path/files.tar.gz

# 3. Restart services
docker-compose up -d
```

---

## 4. Scenario Procedures

### 4.1 Database Corruption

1. Stop application: `docker-compose stop backend`
2. Identify last good backup
3. Restore: `./scripts/restore-db.sh <backup_path>`
4. Verify data integrity
5. Restart: `docker-compose start backend`

**Estimated Recovery:** 30-60 minutes

### 4.2 Server Failure

1. Provision new server from infrastructure template
2. Deploy application: `docker-compose up -d`
3. Restore database from backup
4. Update DNS/load balancer
5. Verify functionality

**Estimated Recovery:** 1-2 hours

### 4.3 Ransomware/Security Breach

1. **ISOLATE** - Disconnect affected systems immediately
2. Notify security team and management
3. Preserve evidence (logs, memory dumps)
4. Provision clean environment
5. Restore from verified clean backup
6. Reset all credentials
7. Conduct post-incident review

**Estimated Recovery:** 4-24 hours

### 4.4 Cloud Provider Outage

1. Activate secondary region (if configured)
2. Update DNS to failover endpoint
3. Monitor primary region status
4. Failback when stable

---

## 5. Backup Verification

### Automated Testing (Monthly)
```bash
./scripts/backup-test.sh staging
```

### Manual Verification Checklist
- [ ] Download random backup
- [ ] Verify file integrity
- [ ] Restore to test environment
- [ ] Check record counts match
- [ ] Test critical queries
- [ ] Document results

---

## 6. Testing Schedule

| Test Type | Frequency | Next Scheduled |
|-----------|-----------|----------------|
| Backup Integrity | Weekly | Every Monday |
| Restore Test | Monthly | First Saturday |
| Full DR Drill | Quarterly | [Date] |
| Failover Test | Bi-annually | [Date] |

---

## 7. Recovery Checklist

### Pre-Recovery
- [ ] Assess impact and scope
- [ ] Notify stakeholders
- [ ] Identify recovery point (which backup)
- [ ] Prepare recovery environment

### During Recovery
- [ ] Execute restore procedures
- [ ] Document all actions taken
- [ ] Test each component as restored

### Post-Recovery
- [ ] Verify all data integrity
- [ ] Test critical user flows
- [ ] Update monitoring
- [ ] Communicate resolution
- [ ] Schedule post-mortem

---

## 8. Document Review

This document must be reviewed and tested:
- After any major infrastructure change
- After any disaster recovery event
- Minimum quarterly review
- Annual full drill

**Last Review:** [Date]  
**Next Review:** [Date]
