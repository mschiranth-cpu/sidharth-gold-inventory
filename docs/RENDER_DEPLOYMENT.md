# Render Deployment Guide

## 🚀 Quick Start Guide for Deploying to Render

This guide will help you deploy the Gold Factory Inventory System to Render.com for testing and production use.

---

## Prerequisites

1. **GitHub Account** with your code repository
2. **Render Account** (Sign up at [render.com](https://render.com))
3. **Code pushed to GitHub** (this repository)

---

## Deployment Options

### Option A: Blueprint (Recommended - Easiest)

Using the `render.yaml` blueprint file to deploy everything at once.

### Option B: Manual Setup

Creating each service individually through Render dashboard.

---

## 🎯 Option A: Blueprint Deployment (Recommended)

### Step 1: Push Code to GitHub

```bash
# Make sure all changes are committed
git add .
git commit -m "Add Render deployment configuration"
git push origin main
```

### Step 2: Create New Blueprint on Render

1. Go to [render.com](https://render.com)
2. Click **"New +"** → **"Blueprint"**
3. Connect your GitHub account if not already connected
4. Select the **sidharth-gold-inventory** repository
5. Render will automatically detect the `render.yaml` file
6. Click **"Apply"**

### Step 3: Configure Environment Variables

Render will prompt you to set these required variables:

**Backend Service:**
- `JWT_SECRET` - Will be auto-generated ✅
- `JWT_REFRESH_SECRET` - Will be auto-generated ✅
- Other variables are auto-configured ✅

### Step 4: Wait for Deployment

- Database setup: ~2-3 minutes
- Redis setup: ~1-2 minutes
- Backend build & deploy: ~5-7 minutes
- Frontend build & deploy: ~3-4 minutes

**Total time: ~15 minutes**

### Step 5: Access Your Application

Once deployed, you'll get URLs like:
- **Frontend**: `https://gold-factory-frontend.onrender.com`
- **Backend API**: `https://gold-factory-backend.onrender.com`

---

## 🔧 Option B: Manual Setup

### Step 1: Create PostgreSQL Database

1. Click **"New +"** → **"PostgreSQL"**
2. **Name**: `gold-factory-db`
3. **Database**: `gold_factory`
4. **Plan**: Starter (Free tier available)
5. **Region**: Singapore (or closest to your users)
6. Click **"Create Database"**
7. Copy the **Internal Connection String**

### Step 2: Create Redis Instance

1. Click **"New +"** → **"Redis"**
2. **Name**: `gold-factory-redis`
3. **Plan**: Starter (Free tier available)
4. **Region**: Singapore
5. **Maxmemory Policy**: `allkeys-lru`
6. Click **"Create Redis"**
7. Copy the **Internal Connection String**

### Step 3: Deploy Backend

1. Click **"New +"** → **"Web Service"**
2. Connect your GitHub repository
3. **Name**: `gold-factory-backend`
4. **Environment**: `Node`
5. **Region**: Singapore
6. **Branch**: `main`
7. **Root Directory**: Leave empty (we'll use commands)
8. **Build Command**:
   ```bash
   cd backend && npm install && npx prisma generate && npm run build
   ```
9. **Start Command**:
   ```bash
   cd backend && npx prisma migrate deploy && npm start
   ```

#### Backend Environment Variables

| Variable | Value | Notes |
|----------|-------|-------|
| `NODE_ENV` | `production` | Required |
| `PORT` | `5000` | Required |
| `DATABASE_URL` | *From Step 1* | Internal PostgreSQL URL |
| `REDIS_URL` | *From Step 2* | Internal Redis URL |
| `JWT_SECRET` | *Generate random* | Min 32 characters |
| `JWT_REFRESH_SECRET` | *Generate random* | Min 32 characters |
| `JWT_EXPIRES_IN` | `15m` | Token expiry |
| `JWT_REFRESH_EXPIRES_IN` | `7d` | Refresh token expiry |
| `CORS_ORIGIN` | *Frontend URL* | From Step 4 |
| `FRONTEND_URL` | *Frontend URL* | From Step 4 |

#### Generate JWT Secrets

```bash
# On Windows PowerShell
[System.Convert]::ToBase64String((1..48|%{Get-Random -Max 256}))

# On Mac/Linux
openssl rand -base64 48

# Or use this JavaScript in browser console
btoa(String.fromCharCode(...crypto.getRandomValues(new Uint8Array(48))))
```

10. **Advanced Settings**:
    - Health Check Path: `/api/health`
    - Auto-Deploy: Yes

11. Click **"Create Web Service"**

### Step 4: Deploy Frontend

1. Click **"New +"** → **"Static Site"**
2. Connect your GitHub repository (same as backend)
3. **Name**: `gold-factory-frontend`
4. **Region**: Singapore
5. **Branch**: `main`
6. **Root Directory**: Leave empty
7. **Build Command**:
   ```bash
   cd frontend && npm install && npm run build
   ```
8. **Publish Directory**: `./frontend/dist`

#### Frontend Environment Variables

| Variable | Value | Notes |
|----------|-------|-------|
| `VITE_API_URL` | `https://gold-factory-backend.onrender.com/api` | Backend URL from Step 3 |
| `VITE_WS_URL` | `https://gold-factory-backend.onrender.com` | Backend URL (WebSocket) |

9. **Advanced Settings**:
    - **Rewrites/Redirects**:
      ```
      /* /index.html 200
      ```
    - **Headers**:
      ```
      /*
        X-Frame-Options: DENY
        X-Content-Type-Options: nosniff
        Referrer-Policy: strict-origin-when-cross-origin
      ```

10. Click **"Create Static Site"**

### Step 5: Update Backend CORS Settings

After frontend deploys:
1. Go to Backend service
2. Add environment variables:
   - `CORS_ORIGIN`: `https://your-frontend-url.onrender.com`
   - `FRONTEND_URL`: `https://your-frontend-url.onrender.com`
3. Backend will auto-redeploy

---

## 🌱 Seed Database with Initial Data

After backend is deployed:

1. Go to Backend service in Render dashboard
2. Click **"Shell"** tab
3. Run:
   ```bash
   cd backend
   npx prisma db seed
   ```

This will create:
- Default admin user
- Sample departments
- Test data

**Default Admin Login:**
- Email: `admin@goldfactory.com`
- Password: `Admin@123` (Change immediately!)

---

## 🔍 Verify Deployment

### Check Backend Health

Visit: `https://your-backend-url.onrender.com/api/health`

Expected response:
```json
{
  "status": "ok",
  "timestamp": "2026-01-13T06:30:00.000Z",
  "uptime": 123.45
}
```

### Check API Documentation

Visit: `https://your-backend-url.onrender.com/api-docs`

You should see Swagger UI with all API endpoints.

### Check Frontend

Visit: `https://your-frontend-url.onrender.com`

You should see the login page.

### Test Login

1. Use default admin credentials
2. You should be redirected to dashboard
3. Check if data loads properly

---

## 📊 Monitoring & Logs

### View Logs

**Backend Logs:**
1. Go to Backend service
2. Click **"Logs"** tab
3. Monitor for errors

**Frontend Logs:**
1. Go to Frontend service
2. Click **"Events"** tab
3. Check build status

### Performance Monitoring

Render provides:
- CPU usage
- Memory usage
- Request/response times
- Error rates

Access from service dashboard.

---

## 🔒 Security Checklist

- ✅ JWT secrets are random and secure (48+ characters)
- ✅ Change default admin password immediately
- ✅ CORS is configured with specific frontend URL
- ✅ HTTPS is enabled by default on Render
- ✅ Environment variables are not exposed
- ✅ Database is only accessible internally

---

## 🐛 Troubleshooting

### Backend Won't Start

**Check logs for:**
```
ERROR: Cannot connect to database
```
**Solution:** Verify `DATABASE_URL` is correct internal connection string.

---

**Check logs for:**
```
ERROR: JWT_SECRET is required
```
**Solution:** Add `JWT_SECRET` and `JWT_REFRESH_SECRET` environment variables.

---

### Frontend Shows "Network Error"

**Issue:** Frontend can't reach backend

**Solution:**
1. Check `VITE_API_URL` has `/api` at the end
2. Verify backend is running (check health endpoint)
3. Check CORS settings in backend

---

### Database Migration Errors

**Issue:** Prisma migration fails

**Solution:**
1. Go to Backend shell
2. Run manually:
   ```bash
   cd backend
   npx prisma migrate reset --force
   npx prisma migrate deploy
   npx prisma db seed
   ```

---

### WebSocket Connection Fails

**Issue:** Real-time notifications don't work

**Solution:**
1. Check `VITE_WS_URL` doesn't have `/api` at the end
2. Verify it uses `https://` (Render handles WebSocket upgrade)
3. Check browser console for connection errors

---

## 💰 Cost Estimation

### Free Tier
- PostgreSQL: 256MB RAM, 1GB storage (Free)
- Redis: 25MB (Free)
- Backend: Spins down after 15 min inactivity (Free)
- Frontend: Unlimited bandwidth (Free)

**Total: $0/month** (with free tier limitations)

### Starter Tier (~$30-40/month)
- PostgreSQL: 1GB RAM, 10GB storage ($7)
- Redis: 512MB ($10)
- Backend: Always on, 512MB RAM ($7)
- Frontend: Included ($0)
- Disk for uploads: 10GB ($5)

**Total: ~$29/month**

### Production Tier (~$80-100/month)
- PostgreSQL: 4GB RAM, 100GB storage ($25)
- Redis: 2GB ($30)
- Backend: 2GB RAM ($25)
- Frontend: CDN included ($0)
- Disk for uploads: 50GB ($25)

**Total: ~$105/month**

---

## 🔄 Auto-Deployment

### Enable Auto-Deploy

Already enabled if using Blueprint!

**Manual Setup:**
1. Go to each service settings
2. Find **"Auto-Deploy"** option
3. Enable: **"Yes"**

Now every `git push` to main branch will trigger deployment.

### Disable Auto-Deploy (for testing)

1. Go to service settings
2. Set Auto-Deploy to **"No"**
3. Manual deploy: Click **"Manual Deploy"** → **"Deploy latest commit"**

---

## 🎯 Custom Domain (Optional)

### Add Custom Domain to Frontend

1. Go to Frontend service
2. Click **"Settings"** → **"Custom Domain"**
3. Add your domain: `goldfactory.yourdomain.com`
4. Add DNS records as instructed:
   ```
   Type: CNAME
   Name: goldfactory
   Value: gold-factory-frontend.onrender.com
   ```

### Add Custom Domain to Backend

1. Go to Backend service
2. Click **"Settings"** → **"Custom Domain"**
3. Add your domain: `api.goldfactory.yourdomain.com`
4. Add DNS records
5. Update frontend environment variables with new URL

---

## 📦 Backup Strategy

### Database Backups

**Automatic Backups:**
- Render takes daily backups automatically (Starter+ plans)
- Retained for 7-30 days depending on plan

**Manual Backup:**
1. Go to Database service
2. Click **"Backups"** tab
3. Click **"Create Backup"**

**Export to Local:**
```bash
# Get connection string from Render dashboard
pg_dump YOUR_DATABASE_URL > backup.sql
```

### Restore from Backup

1. Go to Database service
2. Click **"Backups"** tab
3. Select backup
4. Click **"Restore"**

---

## 🚀 Deployment Checklist

Before going live:

- [ ] All services deployed successfully
- [ ] Database seeded with initial data
- [ ] Default admin password changed
- [ ] Frontend connects to backend
- [ ] WebSocket notifications working
- [ ] File upload works (test with image)
- [ ] All pages load without errors
- [ ] Test creating an order end-to-end
- [ ] Test worker workflow
- [ ] Check mobile responsiveness
- [ ] Performance test (Lighthouse score)
- [ ] Set up monitoring alerts
- [ ] Document admin credentials securely
- [ ] Configure backups
- [ ] Add custom domain (if applicable)

---

## 📞 Support

### Render Support
- Documentation: [render.com/docs](https://render.com/docs)
- Community: [community.render.com](https://community.render.com)
- Email: support@render.com

### Application Issues
- Check `docs/TROUBLESHOOTING.md`
- Review logs in Render dashboard
- Contact: Your admin email

---

## 🎉 You're Done!

Your Gold Factory Inventory System is now live on Render!

**Next Steps:**
1. Share the frontend URL with your team
2. Create user accounts for staff
3. Start creating orders
4. Monitor performance and errors
5. Set up regular backups

---

**Last Updated:** January 13, 2026  
**Version:** 1.0
