# 🚀 Render Quick Deploy Guide - 5 Minutes Setup

## What We're Deploying

Your **Gold Factory Inventory System** will have:
- ✅ Backend API (Node.js + Express + PostgreSQL)
- ✅ Frontend App (React + Vite)
- ✅ Database (PostgreSQL)
- ✅ Cache (Redis)
- ✅ All connected and working together

---

## 📋 Before You Start

**You Need:**
1. ✅ Render account - [Sign up here](https://dashboard.render.com/register) (Free!)
2. ✅ GitHub account - Already done! ✅
3. ✅ Code pushed to GitHub - Already done! ✅

**Repository:** `https://github.com/mschiranth-cpu/sidharth-gold-inventory.git`

---

## 🎯 Step 1: Login to Render

1. Go to: **https://dashboard.render.com**
2. Click **"Sign In"** or **"Get Started"**
3. **Important:** Sign in with **GitHub** (easier integration)
4. Authorize Render to access your GitHub repositories

---

## 🎯 Step 2: Create New Blueprint

1. Once logged in, you'll see the Render Dashboard
2. Click the **"New +"** button (top right)
3. Select **"Blueprint"** from the dropdown

![New Blueprint](https://render.com/docs/assets/img/blueprints/new-blueprint.png)

---

## 🎯 Step 3: Connect Repository

1. You'll see a list of your GitHub repositories
2. Search for: **"sidharth-gold-inventory"**
3. Click **"Connect"** next to it

**If you don't see it:**
- Click **"Configure account"**
- Grant Render access to the repository
- Come back and refresh

---

## 🎯 Step 4: Configure Blueprint

Render will automatically detect the `render.yaml` file!

You'll see a screen showing:
- ✅ gold-factory-db (PostgreSQL Database)
- ✅ gold-factory-redis (Redis Cache)
- ✅ gold-factory-backend (Web Service)
- ✅ gold-factory-frontend (Static Site)

**Don't change anything!** The configuration is already perfect.

---

## 🎯 Step 5: Review and Apply

1. Render will show you a preview of all services
2. **Review the plan:**
   - Free tier: $0/month (services sleep after 15min inactivity)
   - Starter tier: ~$29/month (always on, recommended for testing)
3. Scroll to bottom
4. Click **"Apply"** button

---

## ⏱️ Step 6: Wait for Deployment

Now sit back! Render will:

```
⏳ Creating PostgreSQL database...     (~2 minutes)
⏳ Creating Redis cache...              (~1 minute)
⏳ Building backend...                  (~5 minutes)
⏳ Building frontend...                 (~3 minutes)
```

**Total time: ~10-15 minutes**

You'll see progress bars for each service. They turn **green** when complete!

---

## 🎯 Step 7: Get Your URLs

Once deployment completes, click on each service to get URLs:

### Frontend URL
1. Click **"gold-factory-frontend"**
2. Copy the URL (looks like: `https://gold-factory-frontend.onrender.com`)
3. **This is your app URL!** 🎉

### Backend URL
1. Click **"gold-factory-backend"**
2. Copy the URL (looks like: `https://gold-factory-backend.onrender.com`)
3. This is for API testing

---

## 🌱 Step 8: Seed Initial Data

**Important:** You need to add sample data to test!

1. Go to **"gold-factory-backend"** service
2. Click **"Shell"** tab (in the sidebar)
3. Wait for shell to load (~30 seconds)
4. Copy and paste this command:

```bash
cd backend && npx prisma db seed
```

5. Press Enter
6. Wait ~30 seconds

You'll see output like:
```
✅ Created admin user
✅ Created departments
✅ Created sample workers
✅ Created sample orders
```

---

## 🎊 Step 9: Test Your App!

### Login to Your App

1. Open the **Frontend URL** in your browser
2. You should see the login page
3. Use these credentials:

```
Email:    admin@goldfactory.com
Password: Admin@123
```

4. Click **Login**
5. You should see the Dashboard! 🎉

### What to Test

- ✅ Dashboard shows statistics
- ✅ Orders page loads
- ✅ Factory tracking shows departments
- ✅ Notifications bell works
- ✅ Can create a new order
- ✅ Can view order details

---

## 🔍 Step 10: Verify Everything Works

### Check Backend Health

Open in browser: `https://YOUR-BACKEND-URL.onrender.com/api/health`

Should show:
```json
{
  "status": "ok",
  "timestamp": "2026-01-13T...",
  "uptime": 123.45
}
```

### Check API Documentation

Open: `https://YOUR-BACKEND-URL.onrender.com/api-docs`

You should see **Swagger UI** with all API endpoints!

### Check Database Connection

If you can login and see data, database is connected! ✅

---

## 🐛 Troubleshooting

### Problem: "Build Failed" for Backend

**Solution:**
1. Click on **gold-factory-backend**
2. Click **"Logs"** tab
3. Look for error message
4. Most common: Missing environment variables
5. Check **"Environment"** tab - all variables should be set

---

### Problem: Frontend shows "Network Error"

**Solution:**
1. Check if backend is running (health endpoint)
2. Go to **gold-factory-frontend** → **Environment**
3. Verify `VITE_API_URL` ends with `/api`
4. Should be: `https://YOUR-BACKEND.onrender.com/api`

---

### Problem: Can't login

**Solution:**
1. Make sure you ran the seed command (Step 8)
2. Check backend logs for database errors
3. Try seeding again: `cd backend && npx prisma db seed`

---

### Problem: "Service Unavailable"

**Reason:** Free tier services sleep after 15min inactivity

**Solution:**
- Just wait 30-60 seconds on first request
- Service will wake up automatically
- Or upgrade to Starter plan ($7/month) for always-on

---

## 💡 Pro Tips

### Tip 1: Monitor Your Services

- Check **"Logs"** tab regularly
- Set up email alerts in Render settings
- Monitor CPU and memory usage

### Tip 2: Custom Domain

Want your own domain like `goldfactory.com`?

1. Go to service settings
2. Click **"Custom Domain"**
3. Add your domain
4. Update DNS records as shown
5. Free SSL certificate included!

### Tip 3: Auto-Deploy

Already enabled! Every time you `git push`, Render auto-deploys! 🚀

---

## 📊 What You Get

### Free Tier
- ✅ All services working
- ✅ HTTPS enabled
- ✅ Automatic deployments
- ⚠️ Services sleep after 15min
- ⚠️ 30-60s wake-up time

### Starter Tier ($29/month)
- ✅ Everything from free tier
- ✅ Always on (no sleep)
- ✅ Faster performance
- ✅ More storage
- ✅ Priority support

---

## 🎯 Next Steps After Deployment

1. **Change admin password** (Security!)
   - Login → Profile → Change Password
   - Use strong password

2. **Create user accounts**
   - Go to Users page
   - Add office staff, managers, workers

3. **Test complete workflow**
   - Create order
   - Assign to department
   - Worker submits work
   - Complete order

4. **Customize for your needs**
   - Update company name
   - Add your logo
   - Configure email notifications

5. **Share with team**
   - Send frontend URL
   - Create accounts for everyone
   - Train staff on system

---

## 📞 Need Help?

### Deployment Issues
- Check Render documentation: https://render.com/docs
- Community forum: https://community.render.com

### Application Issues
- Check `docs/TROUBLESHOOTING.md`
- Review `docs/USER_GUIDE.md`
- Check backend logs in Render dashboard

---

## ✅ Deployment Checklist

After following this guide, you should have:

- [x] Code pushed to GitHub
- [ ] Render account created
- [ ] Blueprint deployed (4 services)
- [ ] Database seeded with data
- [ ] Successfully logged in
- [ ] Dashboard showing data
- [ ] All services green (running)
- [ ] Admin password changed
- [ ] Team members added

---

## 🎉 Congratulations!

Your **Gold Factory Inventory System** is now **LIVE** on Render! 

You now have a professional, production-ready application running in the cloud!

**Your URLs:**
- Frontend: `https://gold-factory-frontend-XXXX.onrender.com`
- Backend: `https://gold-factory-backend-XXXX.onrender.com`
- API Docs: `https://gold-factory-backend-XXXX.onrender.com/api-docs`

Share the frontend URL with your team and start tracking orders! 🚀

---

**Questions?** Check the full guide: `docs/RENDER_DEPLOYMENT.md`

**Last Updated:** January 13, 2026
