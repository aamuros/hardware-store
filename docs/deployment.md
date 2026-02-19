# Deployment Guide

This guide walks you through hosting the Hardware Store website using **Railway only** — a single service that runs both the backend API and serves the frontend. Free under the GitHub Student Developer Pack.

**What to expect:**
- Your site will deploy with a **blank slate** — only an admin account exists
- You'll add all products, categories, and images through the admin dashboard after deployment
- Total deployment time: **~10-15 minutes**
- Total cost: **$0** (with GitHub Student Pack)

---

## Prerequisites

- Your code is pushed to GitHub (`aamuros/hardware-store`)
- You have a GitHub account enrolled in [GitHub Education](https://education.github.com/)

---

## Part 1 — Create a Railway Account

1. Go to [railway.app](https://railway.app)
2. Click **Login** → **Login with GitHub**
3. Authorize Railway to access your GitHub account

### Activate GitHub Student free credits

1. After logging in, click your profile picture → **Account Settings**
2. Go to the **Plans** tab
3. Click **GitHub Student** and follow the prompts to verify your student status
4. You will receive **$5/month** in free credits (more than enough)

---

## Part 2 — Create a New Railway Project

1. From the Railway dashboard, click **+ New Project**
2. Select **Deploy from GitHub repo**
3. Find and select **aamuros/hardware-store**
4. ⚠️ **Do NOT set a root directory** — leave it as the **default (root)**. Railway needs access to both `backend/` and `frontend/` folders.
5. Click **Deploy Now** — Railway will start an initial deployment. It may fail at first; that's fine, you still need to add the database and environment variables.

---

## Part 3 — Add a PostgreSQL Database

1. Inside your Railway project, click **+ New** (top right)
2. Select **Database** → **Add PostgreSQL**
3. Railway will create a PostgreSQL database and automatically add the `DATABASE_URL` environment variable to your service. **Do not touch or change this variable.**

---

## Part 4 — Add Environment Variables

1. Click on your **backend service** (the one connected to GitHub, not the database)
2. Go to the **Variables** tab
3. Click **Raw Editor** and paste the following:

```
NODE_ENV=production
JWT_SECRET=<generate-a-secure-secret-here>
JWT_EXPIRES_IN=7d
SMS_ENABLED=false
SMS_TEST_MODE=true
STORE_NAME=Your Hardware Store Name
STORE_PHONE=09171234567
STORE_ADDRESS=Your Store Address Here
```

> **JWT_SECRET** — Generate a secure 32+ character secret:
> ```bash
> openssl rand -base64 32
> ```
> Copy the output and replace `<generate-a-secure-secret-here>` with it.

> **STORE_NAME, STORE_PHONE, STORE_ADDRESS** — Update these with your actual store information. These will appear in the frontend footer and contact sections.

> **SMS settings** — Keep `SMS_ENABLED=false` and `SMS_TEST_MODE=true` for now. This prevents accidental SMS costs during testing.

4. Click **Save**

---

## Part 5 — Deploy

1. Go to the **Deployments** tab
2. Click **Deploy** (it may redeploy automatically after saving variables)
3. Wait for the deployment to finish — this usually takes 3-5 minutes
4. During deployment, Railway will automatically:
   - Install all dependencies (backend + frontend)
   - Build the React frontend
   - Generate Prisma client for PostgreSQL
   - Run database migrations (create all tables)
   - Seed the database with the admin account
   - Start the server (which serves both the API and the frontend)
5. Once it shows **Active**, your full site is ready!

---

## Part 6 — Generate a Public URL

1. Go to the **Settings** tab of your service
2. Under the **Networking** section, click **Generate Domain**
3. Copy the URL — it will look like:
   ```
   https://hardware-store-production-xxxx.up.railway.app
   ```
4. Open this URL in your browser — the homepage should load!

---

## Part 7 — Verify the Deployment

1. Go to the **Deployments** tab and click on the latest deployment
2. Check the deployment logs — you should see:
   ```
   The following migration(s) have been applied:
   migrations/
     └─ 20251211101811_init/
       └─ migration.sql
   
   🌱 Starting database seed...
   ✅ Admin user created: admin
   🎉 Database seeded successfully!
   
   [OK] Database connected successfully
   ```
3. Visit your Railway URL — the homepage should render
4. Visit `<your-url>/health` — should return `{"success": true, ...}`
5. Visit `<your-url>/admin/login` and log in with:
   - Username: `admin`
   - Password: `admin123`

> **⚠️ IMPORTANT: Change this password immediately after your first login!**
>
> The database starts as a **blank slate** — you'll add categories, products, and other data through the admin dashboard after deployment.

---

## After Deployment Checklist

### Setting Up Your Store

Your store is deployed as a **blank slate**. Follow these steps to populate it:

1. **Change the admin password**
   - Go to `/admin/login` and log in with `admin` / `admin123`
   - Click your profile → Change Password
   - Set a secure password

2. **Create product categories**
   - Go to Admin Dashboard → Categories
   - Add categories like: Steel & Metal, Lumber & Wood, Plumbing, Electrical, etc.

3. **Add products**
   - Go to Admin Dashboard → Products
   - Click "Add Product"
   - Fill in product details (name, description, price, category, stock quantity)
   - Upload product images

4. **Create additional staff accounts** (optional)
   - Go to Admin Dashboard → Staff Management

5. **Test the customer experience**
   - Open your site in an incognito window
   - Browse products, add items to cart, and place a test order
   - Verify you can see the order in the admin dashboard

6. **Share your live site**
   - Share your Railway URL with your professor or clients!

---

## Troubleshooting

### The site loads but shows no products
- **This is normal!** The database starts empty (blank slate)
- Log in to `/admin/login` with `admin` / `admin123`
- Add categories and products through the admin dashboard

### Admin login fails
- Check the Railway deployment logs to confirm seeding completed successfully
- You should see `✅ Admin user created: admin` in the logs
- If seeding failed, open the Railway **Shell** and manually run:
  ```bash
  npx prisma migrate deploy
  npx prisma db seed
  ```

### Images are not showing after upload
- Images are stored on Railway's server. They persist while the service is running.
- If images disappear after a redeploy, Railway's filesystem resets on each deploy. For a school project this is fine — just re-upload images if needed.

### Page shows 404 when refreshing
- This should not happen. The Express server has a catch-all route that serves `index.html` for all non-API requests.
- If it does happen, check that the frontend built successfully during deployment (look for `vite build` output in the deployment logs).

### Railway deployment fails
- Go to the **Deployments** tab and click the failed deployment to read the error logs
- The most common cause is a missing environment variable — double-check all variables in Part 4
- ⚠️ Make sure the **Root Directory** is **NOT set** (it should be blank/root). Railway needs access to both `backend/` and `frontend/` folders.
- If you see a Prisma/database error, make sure the PostgreSQL plugin is added and `DATABASE_URL` is auto-populated in the Variables tab

### Railway build shows "no start command"
- Make sure `railway.json` and `nixpacks.toml` are committed and pushed to the **root** of the repo (not inside `backend/`)
- In Railway Settings → General, confirm **Root Directory** is blank (not `backend`)

### Database migration errors on Railway
- Open the Railway **Shell** on your service and run:
  ```bash
  cd backend && npx prisma migrate deploy
  ```
- If the migration state is corrupt, you can reset (⚠️ **WARNING: This deletes all data!**):
  ```bash
  cd backend && npx prisma migrate reset --force
  ```
- After a reset, the admin account will be recreated automatically

### How do I re-run the seed if I deleted the admin account?
- The seed is **idempotent** — safe to run multiple times
- In Railway Shell, run: `cd backend && npx prisma db seed`
- It will check if admin exists, and create it only if needed

---

## Frequently Asked Questions

### Why does my deployed site have no products?
This is **by design**. The site starts as a blank slate so you can add your own store's products and categories.

### Where did all the sample products go?
They were removed from the repository to keep it clean for deployment.

### Will my uploaded images persist after redeployment?
On Railway's free tier, the filesystem resets on each deploy. For a school project this is fine — just re-upload images if needed. For production, you'd use cloud storage (AWS S3, Cloudinary, etc.).

### What if I want to enable SMS notifications?
1. Sign up for a [Semaphore account](https://semaphore.co/) (Philippines SMS provider)
2. Add your API key to Railway environment variables: `SEMAPHORE_API_KEY=your_key_here`
3. Set `SMS_ENABLED=true` and `SMS_TEST_MODE=false`
4. Add your phone number: `ADMIN_NOTIFICATION_PHONE=09XXXXXXXXX`

---

## Summary

| Component | Where It Runs |
|---|---|
| Frontend (React) | Served as static files by Express on Railway |
| Backend API | Express on Railway |
| Database | PostgreSQL on Railway |

Everything runs on a **single Railway service** with one URL. No need for Vercel or any other hosting provider.

**Total cost: $0** — Railway is covered by your GitHub Student Pack ($5/month credit).

**Deployment complete!** 🎉 Your hardware store is now live and ready to accept orders.
