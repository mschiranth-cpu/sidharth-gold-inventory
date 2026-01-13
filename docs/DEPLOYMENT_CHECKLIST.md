# Deployment Checklist

## Pre-Deployment

### Code Ready
- [ ] All tests passing locally
- [ ] PR approved and merged
- [ ] Version bumped in package.json
- [ ] CHANGELOG updated
- [ ] No console.log statements in production code

### Environment
- [ ] Environment variables configured
- [ ] Secrets rotated (if needed)
- [ ] SSL certificates valid (30+ days)
- [ ] Database connection verified

### Backup
- [ ] Database backup created
- [ ] Backup verified (can restore)
- [ ] Previous Docker images tagged

## Deployment

### Execute
- [ ] Notify team of deployment
- [ ] Run `./scripts/deploy.sh production vX.X.X`
- [ ] Monitor deployment logs
- [ ] Wait for health checks to pass

### Verify
- [ ] API health endpoint responding
- [ ] Frontend loading correctly
- [ ] Authentication working
- [ ] Critical user flows tested
- [ ] No errors in logs

## Post-Deployment

### Monitoring
- [ ] Check error rates in Grafana
- [ ] Verify response times normal
- [ ] Check memory/CPU usage
- [ ] Review recent logs for anomalies

### Communication
- [ ] Notify team of successful deployment
- [ ] Update status page (if applicable)
- [ ] Document any issues encountered

## Rollback Triggers

Rollback immediately if:
- [ ] Health checks failing
- [ ] Error rate > 5%
- [ ] Response time > 3x normal
- [ ] Critical feature broken

### Rollback Command
```bash
./scripts/rollback.sh production
```

## Emergency Contacts

| Role | Name | Contact |
|------|------|---------|
| DevOps Lead | - | - |
| Backend Lead | - | - |
| DBA | - | - |

---

**Deployed By**: ________________  
**Date**: ________________  
**Version**: ________________  
**Status**: ☐ Success ☐ Rollback
