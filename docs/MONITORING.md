# Monitoring & Observability Guide

Complete monitoring setup for Gold Factory Inventory System.

## Overview

| Component | Purpose | Port |
|-----------|---------|------|
| Prometheus | Metrics collection | 9090 |
| Grafana | Visualization | 3001 |
| Loki | Log aggregation | 3100 |
| Alertmanager | Alert routing | 9093 |
| Sentry | Error tracking | - |

## Health Endpoints

| Endpoint | Description |
|----------|-------------|
| `GET /api/health` | Basic health status |
| `GET /api/health/detailed` | All services status |
| `GET /api/health/db` | Database connection |
| `GET /api/health/redis` | Redis connection |
| `GET /api/health/storage` | File storage check |
| `GET /api/health/metrics` | Prometheus metrics |

## Logging Setup

### Winston Configuration

Logs are written to:
- `logs/error-YYYY-MM-DD.log` - Errors only
- `logs/combined-YYYY-MM-DD.log` - All levels
- `logs/access-YYYY-MM-DD.log` - HTTP requests

### Log Levels
```
error: 0  - Application errors
warn:  1  - Warnings
info:  2  - General info
debug: 3  - Debug info (dev only)
```

### Environment Variables
```env
LOG_DIR=/var/log/gold-factory
LOG_LEVEL=info  # or debug for development
```

## Error Tracking (Sentry)

### Setup
```env
SENTRY_DSN=https://xxx@xxx.ingest.sentry.io/xxx
```

### Features
- Automatic error capture
- User context attachment
- Source maps for stack traces
- Performance tracing
- Slack/Email alerts

## Monitoring Scripts

| Script | Purpose | Schedule |
|--------|---------|----------|
| `scripts/monitor.sh` | Health checks | Every minute |
| `scripts/alert.sh` | Send alerts | On-demand |
| `scripts/backup-check.sh` | Verify backups | Daily 8 AM |

### Crontab Setup
```bash
# Edit crontab
crontab -e

# Add these lines
* * * * * /opt/gold-factory/scripts/monitor.sh
0 8 * * * /opt/gold-factory/scripts/backup-check.sh production
```

## Quick Setup

### 1. Deploy Monitoring Stack
```bash
cd /opt/monitoring
```

Create `docker-compose.yml`:
```yaml
version: '3.8'

services:
  prometheus:
    image: prom/prometheus:latest
    container_name: prometheus
    volumes:
      - ./prometheus.yml:/etc/prometheus/prometheus.yml
      - prometheus_data:/prometheus
    command:
      - '--config.file=/etc/prometheus/prometheus.yml'
      - '--storage.tsdb.retention.time=30d'
    ports:
      - "9090:9090"
    restart: unless-stopped

  grafana:
    image: grafana/grafana:latest
    container_name: grafana
    volumes:
      - grafana_data:/var/lib/grafana
      - ./grafana/provisioning:/etc/grafana/provisioning
    environment:
      - GF_SECURITY_ADMIN_PASSWORD=${GRAFANA_PASSWORD:-admin}
      - GF_USERS_ALLOW_SIGN_UP=false
    ports:
      - "3001:3000"
    restart: unless-stopped

  loki:
    image: grafana/loki:latest
    container_name: loki
    ports:
      - "3100:3100"
    volumes:
      - loki_data:/loki
    restart: unless-stopped

  alertmanager:
    image: prom/alertmanager:latest
    container_name: alertmanager
    volumes:
      - ./alertmanager.yml:/etc/alertmanager/alertmanager.yml
    ports:
      - "9093:9093"
    restart: unless-stopped

volumes:
  prometheus_data:
  grafana_data:
  loki_data:
```

### 2. Configure Prometheus

Create `prometheus.yml`:
```yaml
global:
  scrape_interval: 15s
  evaluation_interval: 15s

alerting:
  alertmanagers:
    - static_configs:
        - targets: ['alertmanager:9093']

rule_files:
  - 'alert_rules.yml'

scrape_configs:
  - job_name: 'prometheus'
    static_configs:
      - targets: ['localhost:9090']

  - job_name: 'gold-factory-backend'
    static_configs:
      - targets: ['host.docker.internal:5000']
    metrics_path: '/api/metrics'

  - job_name: 'node-exporter'
    static_configs:
      - targets: ['node-exporter:9100']

  - job_name: 'postgres'
    static_configs:
      - targets: ['postgres-exporter:9187']
```

### 3. Alert Rules

Create `alert_rules.yml`:
```yaml
groups:
  - name: gold-factory-alerts
    rules:
      - alert: HighErrorRate
        expr: rate(http_requests_total{status=~"5.."}[5m]) > 0.1
        for: 5m
        labels:
          severity: critical
        annotations:
          summary: High error rate detected

      - alert: ServiceDown
        expr: up{job="gold-factory-backend"} == 0
        for: 1m
        labels:
          severity: critical
        annotations:
          summary: Backend service is down

      - alert: HighMemoryUsage
        expr: (node_memory_MemTotal_bytes - node_memory_MemAvailable_bytes) / node_memory_MemTotal_bytes > 0.9
        for: 5m
        labels:
          severity: warning
        annotations:
          summary: Memory usage above 90%

      - alert: DatabaseConnectionsHigh
        expr: pg_stat_activity_count > 80
        for: 5m
        labels:
          severity: warning
        annotations:
          summary: Database connections above 80
```

### 4. Alertmanager Configuration

Create `alertmanager.yml`:
```yaml
global:
  smtp_smarthost: 'smtp.gmail.com:587'
  smtp_from: 'alerts@yourdomain.com'
  smtp_auth_username: 'alerts@yourdomain.com'
  smtp_auth_password: 'your_app_password'

  slack_api_url: 'https://hooks.slack.com/services/YOUR/SLACK/WEBHOOK'

route:
  group_by: ['alertname']
  group_wait: 30s
  group_interval: 5m
  repeat_interval: 4h
  receiver: 'team-notifications'

receivers:
  - name: 'team-notifications'
    email_configs:
      - to: 'team@yourdomain.com'
    slack_configs:
      - channel: '#alerts'
        send_resolved: true
        title: '{{ .Status | toUpper }}: {{ .CommonAnnotations.summary }}'
```

### 5. Start Monitoring
```bash
docker-compose up -d
```

## Access Dashboards

| Service | URL | Default Credentials |
|---------|-----|---------------------|
| Grafana | http://server:3001 | admin / admin |
| Prometheus | http://server:9090 | - |
| Alertmanager | http://server:9093 | - |

## Grafana Dashboards

Import these dashboard IDs:
- **Node Exporter**: 1860
- **Docker**: 893
- **PostgreSQL**: 9628
- **Nginx**: 12708

## Application Metrics

Add to backend for custom metrics:
```typescript
// src/middleware/metrics.ts
import promClient from 'prom-client';

const httpRequestsTotal = new promClient.Counter({
  name: 'http_requests_total',
  help: 'Total HTTP requests',
  labelNames: ['method', 'path', 'status']
});

const httpRequestDuration = new promClient.Histogram({
  name: 'http_request_duration_seconds',
  help: 'HTTP request duration',
  labelNames: ['method', 'path']
});

// Expose /api/metrics endpoint
app.get('/api/metrics', async (req, res) => {
  res.set('Content-Type', promClient.register.contentType);
  res.end(await promClient.register.metrics());
});
```

## Log Aggregation

### Send Docker Logs to Loki
```yaml
# In docker-compose.yml
services:
  backend:
    logging:
      driver: loki
      options:
        loki-url: "http://localhost:3100/loki/api/v1/push"
        loki-batch-size: "100"
```

### Query Logs in Grafana
```logql
{container="gold-factory-backend"} |= "error"
{container="gold-factory-backend"} | json | level="error"
```

## Health Checks

```bash
# Check all services
curl http://localhost:5000/api/health
curl http://localhost:9090/-/healthy
curl http://localhost:3001/api/health
```
