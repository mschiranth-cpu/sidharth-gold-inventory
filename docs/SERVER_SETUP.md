# Server Setup Guide

## 1. Initial Server Setup (Ubuntu 22.04)

### Create Non-Root User
```bash
# As root
adduser deploy
usermod -aG sudo deploy
su - deploy
```

### SSH Key Authentication
```bash
# On local machine
ssh-copy-id deploy@your-server-ip

# On server - disable password auth
sudo nano /etc/ssh/sshd_config
# Set: PasswordAuthentication no
sudo systemctl restart sshd
```

### System Updates
```bash
sudo apt update && sudo apt upgrade -y
sudo apt install -y curl wget git htop vim ufw fail2ban
```

## 2. Install Docker

```bash
# Install Docker
curl -fsSL https://get.docker.com | sh
sudo usermod -aG docker $USER
newgrp docker

# Install Docker Compose
sudo curl -L "https://github.com/docker/compose/releases/latest/download/docker-compose-$(uname -s)-$(uname -m)" -o /usr/local/bin/docker-compose
sudo chmod +x /usr/local/bin/docker-compose

# Verify
docker --version
docker-compose --version
```

## 3. Configure Firewall (UFW)

```bash
# Setup UFW
sudo ufw default deny incoming
sudo ufw default allow outgoing
sudo ufw allow ssh
sudo ufw allow 80/tcp
sudo ufw allow 443/tcp
sudo ufw enable
sudo ufw status
```

## 4. Install Nginx

```bash
sudo apt install -y nginx

# Create site config
sudo nano /etc/nginx/sites-available/gold-factory
```

### Nginx Configuration
```nginx
upstream backend {
    server 127.0.0.1:5000;
}

server {
    listen 80;
    server_name yourdomain.com www.yourdomain.com;
    return 301 https://$server_name$request_uri;
}

server {
    listen 443 ssl http2;
    server_name yourdomain.com www.yourdomain.com;

    ssl_certificate /etc/letsencrypt/live/yourdomain.com/fullchain.pem;
    ssl_certificate_key /etc/letsencrypt/live/yourdomain.com/privkey.pem;

    # Security headers
    add_header X-Frame-Options "SAMEORIGIN" always;
    add_header X-Content-Type-Options "nosniff" always;
    add_header X-XSS-Protection "1; mode=block" always;

    # Gzip
    gzip on;
    gzip_types text/plain text/css application/json application/javascript;

    location / {
        proxy_pass http://127.0.0.1:80;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }

    location /api {
        proxy_pass http://backend;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection "upgrade";
    }

    location /socket.io {
        proxy_pass http://backend;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection "upgrade";
    }
}
```

```bash
# Enable site
sudo ln -s /etc/nginx/sites-available/gold-factory /etc/nginx/sites-enabled/
sudo nginx -t
sudo systemctl restart nginx
```

## 5. SSL Certificates (Let's Encrypt)

```bash
# Install Certbot
sudo apt install -y certbot python3-certbot-nginx

# Obtain certificate
sudo certbot --nginx -d yourdomain.com -d www.yourdomain.com

# Auto-renewal (already configured by certbot)
sudo certbot renew --dry-run
```

## 6. Automated Backups

```bash
# Create backup script
sudo nano /opt/gold-factory/backup-cron.sh
```

```bash
#!/bin/bash
cd /opt/gold-factory
./scripts/backup.sh production daily
# Upload to S3 (optional)
aws s3 sync ./backups s3://your-bucket/backups/
```

```bash
# Add to crontab
sudo crontab -e
# Add: 0 2 * * * /opt/gold-factory/backup-cron.sh >> /var/log/backup.log 2>&1
```

## 7. Log Rotation

```bash
sudo nano /etc/logrotate.d/gold-factory
```

```
/opt/gold-factory/logs/*.log {
    daily
    rotate 14
    compress
    delaycompress
    missingok
    notifempty
    create 0640 deploy deploy
}
```

## 8. Monitoring Setup

```bash
# Create monitoring stack
mkdir -p /opt/monitoring
cd /opt/monitoring

# docker-compose.monitoring.yml
cat > docker-compose.yml << 'EOF'
version: '3.8'
services:
  prometheus:
    image: prom/prometheus:latest
    volumes:
      - ./prometheus.yml:/etc/prometheus/prometheus.yml
      - prometheus_data:/prometheus
    ports:
      - "9090:9090"

  grafana:
    image: grafana/grafana:latest
    volumes:
      - grafana_data:/var/lib/grafana
    ports:
      - "3001:3000"
    environment:
      - GF_SECURITY_ADMIN_PASSWORD=your_password

volumes:
  prometheus_data:
  grafana_data:
EOF

docker-compose up -d
```

## 9. Deploy Application

```bash
# Clone repository
cd /opt
sudo git clone https://github.com/your-org/gold-factory.git
sudo chown -R deploy:deploy gold-factory
cd gold-factory

# Setup environment
cp .env.docker.example .env
nano .env

# Start application
docker-compose up -d

# Verify
curl http://localhost:5000/api/health
```

## 10. Security Hardening

```bash
# Fail2ban for SSH
sudo cp /etc/fail2ban/jail.conf /etc/fail2ban/jail.local
sudo systemctl enable fail2ban
sudo systemctl start fail2ban

# Automatic security updates
sudo apt install -y unattended-upgrades
sudo dpkg-reconfigure -plow unattended-upgrades
```
