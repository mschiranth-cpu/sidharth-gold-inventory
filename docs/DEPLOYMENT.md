# Deployment Guide

## Server Requirements

### Minimum Requirements
| Resource | Staging | Production |
|----------|---------|------------|
| CPU | 2 vCPU | 4 vCPU |
| RAM | 4 GB | 8 GB |
| Storage | 40 GB SSD | 100 GB SSD |
| Bandwidth | 2 TB/month | 5 TB/month |

### Recommended Production Setup
- **Load Balancer**: For high availability
- **Database**: Managed PostgreSQL (AWS RDS, DigitalOcean Managed DB)
- **Cache**: Managed Redis (AWS ElastiCache, DigitalOcean Managed Redis)
- **Storage**: Object storage for backups (S3, Spaces)

## Operating System
- **Recommended**: Ubuntu 22.04 LTS (Jammy Jellyfish)
- **Alternatives**: Debian 12, Amazon Linux 2023

## Software Prerequisites
```bash
# Docker Engine 24+
# Docker Compose v2+
# Nginx 1.24+
# Certbot (for SSL)
# UFW (firewall)
```

## Cloud Provider Quick Start

### DigitalOcean
```bash
# Create droplet
doctl compute droplet create gold-factory \
  --image ubuntu-22-04-x64 \
  --size s-2vcpu-4gb \
  --region nyc1 \
  --ssh-keys YOUR_KEY_ID

# Create managed database
doctl databases create gold-factory-db \
  --engine pg --version 16 \
  --size db-s-1vcpu-1gb
```

### AWS EC2
```bash
# Launch instance
aws ec2 run-instances \
  --image-id ami-0c7217cdde317cfec \
  --instance-type t3.medium \
  --key-name your-key \
  --security-group-ids sg-xxx \
  --subnet-id subnet-xxx

# Create RDS PostgreSQL
aws rds create-db-instance \
  --db-instance-identifier gold-factory \
  --db-instance-class db.t3.micro \
  --engine postgres \
  --master-username postgres \
  --master-user-password YOUR_PASSWORD
```

### Heroku
```bash
# Create app
heroku create gold-factory-app

# Add PostgreSQL
heroku addons:create heroku-postgresql:essential-0

# Add Redis
heroku addons:create heroku-redis:mini

# Deploy
git push heroku main
```

## Environment Configuration

### Required Environment Variables
```bash
# Application
NODE_ENV=production
PORT=5000

# Database
DATABASE_URL=postgresql://user:pass@host:5432/db

# Redis
REDIS_URL=redis://:password@host:6379

# JWT (generate with: openssl rand -hex 64)
JWT_SECRET=your_64_char_secret
JWT_REFRESH_SECRET=your_64_char_refresh_secret

# Security
ENCRYPTION_KEY=your_32_char_key
CORS_ORIGINS=https://yourdomain.com
```

## Deployment Commands

```bash
# Clone repository
git clone https://github.com/your-org/gold-factory.git
cd gold-factory

# Setup environment
cp .env.docker.example .env
nano .env  # Edit with production values

# Deploy
docker-compose up -d

# Check status
docker-compose ps
docker-compose logs -f
```

## SSL/TLS Setup
See [SERVER_SETUP.md](SERVER_SETUP.md#ssl-certificates) for Let's Encrypt configuration.

## Monitoring
See [MONITORING.md](MONITORING.md) for Grafana/Prometheus setup.

## Troubleshooting

### Container won't start
```bash
docker-compose logs backend
docker-compose exec backend npx prisma migrate status
```

### Database connection issues
```bash
docker-compose exec postgres pg_isready
docker-compose exec backend npx prisma db push --force-reset
```

### Out of memory
```bash
# Check memory usage
docker stats
# Increase swap
sudo fallocate -l 4G /swapfile
sudo chmod 600 /swapfile
sudo mkswap /swapfile
sudo swapon /swapfile
```
