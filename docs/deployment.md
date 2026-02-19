# Deployment Guide

This guide walks you through hosting the Hardware Store website for free using **Railway** (backend + database) and **Vercel** (frontend). Both are free under the GitHub Student Developer Pack.

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

## Part 1 — Deploy the Backend on Railway

### Step 1 — Create a Railway account

1. Go to [railway.app](https://railway.app)
2. Click **Login** → **Login with GitHub**
3. Authorize Railway to access your GitHub account

### Step 2 — Activate GitHub Student free credits

1. After logging in, click your profile picture → **Account Settings**
2. Go to the **Plans** tab
3. Click **GitHub Student** and follow the prompts to verify your student status
4. You will receive **$5/month** in free credits (more than enough)

### Step 3 — Create a new Railway project

1. From the Railway dashboard, click **+ New Project**
2. Select **Deploy from GitHub repo**
3. Find and select **aamuros/hardware-store**
4. When asked for the root directory, type: `backend`
5. Click **Deploy Now** — Railway will start an initial deployment. That is fine, you still need to add the database and environment variables.

### Step 4 — Add a PostgreSQL database

1. Inside your Railway project, click **+ New** (top right)
2. Select **Database** → **Add PostgreSQL**
3. Railway will create a PostgreSQL database and automatically add the `DATABASE_URL` environment variable to your backend service. **Do not touch or change this variable.**

### Step 5 — Add environment variables

1. Click on your **backend service** (not the database)
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
FRONTEND_URL=https://PLACEHOLDER.vercel.app
```

> **JWT_SECRET** — Generate a secure 32+ character secret:
> ```bash
> openssl rand -base64 32
> ```
> Copy the output and replace `<generate-a-secure-secret-here>` with it.

> **STORE_NAME, STORE_PHONE, STORE_ADDRESS** — Update these with your actual store information. These will appear in the frontend footer and contact sections.

> **FRONTEND_URL** — Leave as `https://PLACEHOLDER.vercel.app` for now. You'll update this after deploying the frontend in Part 2.

> **SMS settings** — Keep `SMS_ENABLED=false` and `SMS_TEST_MODE=true` for now. This prevents accidental SMS costs during testing.

4. Click **Save**

### Step 6 — Trigger a new deployment

1. Go to the **Deployments** tab
2. Click **Deploy** (it may redeploy automatically after saving variables)
3. Wait for the deployment to finish — this usually takes 2-3 minutes
4. During deployment, Railway will automatically:
   - Install all dependencies
   - Generate Prisma client for PostgreSQL
   - Run database migrations (create all tables)
   - Seed the database with the admin account
   - Start the server
5. Once it shows **Active**, the backend is ready!

### Step 7 — Copy your Railway backend URL

1. Go to the **Settings** tab of your backend service
2. Under the **Networking** section, click **Generate Domain**
3. Copy the URL — it will look like:
   ```
   https://hardware-store-production-xxxx.up.railway.app
   ```
   Keep this URL — you will need it in Part 2.

### Step 8 — Verify the deployment

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
3. This confirms the database was migrated and the admin account was created

> **Default admin credentials:**
> - Username: `admin`
> - Password: `admin123`
>
> **⚠️ IMPORTANT: Change this password immediately after your first login!**
>
> The database starts as a **blank slate** — you'll add categories, products, and other data through the admin dashboard after deployment.

---

## Part 2 — Deploy the Frontend on Vercel

### Step 1 — Create a Vercel account

1. Go to [vercel.com](https://vercel.com)
2. Click **Sign Up** → **Continue with GitHub**
3. Authorize Vercel to access your GitHub account

### Step 2 — Import the project

1. From the Vercel dashboard, click **Add New** → **Project**
2. Find **aamuros/hardware-store** and click **Import**

### Step 3 — Configure the project settings

Fill in the form as follows:

| Field | Value |
|---|---|
| Project Name | `hardware-store` (or any name you like) |
| Framework Preset | `Vite` |
| Root Directory | `frontend` |
| Build Command | `vite build` |
| Output Directory | `dist` |
| Install Command | leave as default |

### Step 4 — Add environment variables

In the **Environment Variables** section, add these three:

| Key | Value |
|---|---|
| `VITE_API_URL` | `https://hardware-store-production-xxxx.up.railway.app/api` |
| `VITE_STORE_NAME` | `Your Hardware Store Name` |
| `VITE_STORE_PHONE` | `09171234567` |

> **VITE_API_URL**: Replace `hardware-store-production-xxxx.up.railway.app` with your **actual Railway backend URL** from Part 1, Step 7. 
> 
> ⚠️ **IMPORTANT**: Make sure to append `/api` at the end of the URL!
>
> **VITE_STORE_NAME** and **VITE_STORE_PHONE**: Use the same values you set in Railway's environment variables. These appear in your site's header and footer.

### Step 5 — Deploy

1. Click **Deploy**
2. Wait for the build to complete (usually 1–2 minutes)
3. Once finished, Vercel will give you a URL like:
   ```
   https://hardware-store-xxxx.vercel.app
   ```
4. Copy this URL

---

## Part 3 — Link Frontend and Backend

### Step 1 — Update Railway with the Vercel URL

1. Go back to [railway.app](https://railway.app) → your project → backend service
2. Go to the **Variables** tab
3. Find `FRONTEND_URL` and update its value to your Vercel URL:
   ```
   FRONTEND_URL=https://hardware-store-xxxx.vercel.app
   ```
4. Click **Save** — Railway will automatically redeploy

### Step 2 — Verify everything works

1. Open your Vercel URL in the browser
2. The homepage should load (it will be empty — no products yet)
3. Try refreshing a page like `/products` — it should not show a 404
4. Go to `/admin/login` and log in with:
   - Username: `admin`
   - Password: `admin123`
5. You should now be in the admin dashboard — this is where you'll add all your store data

---

## Part 4 — After Deployment Checklist

### Setting Up Your Store

Your store is deployed as a **blank slate**. Follow these steps to populate it:

1. **Change the admin password**
   - Go to `/admin/login` and log in with `admin` / `admin123`
   - Click your profile → Change Password
   - Set a secure password

2. **Create product categories**
   - Go to Admin Dashboard → Categories
   - Add categories like: Steel & Metal, Lumber & Wood, Plumbing, Electrical, etc.
   - You can add an icon/emoji for each category (optional)

3. **Add products**
   - Go to Admin Dashboard → Products
   - Click "Add Product"
   - Fill in product details (name, description, price, category, stock quantity)
   - Upload product images (you can upload one main image per product)
   - If a product has variants (sizes, colors), you can add those too

4. **Create additional staff accounts** (optional)
   - Go to Admin Dashboard → Staff Management
   - Add staff users who can help manage orders

5. **Test the customer experience**
   - Open your site in an incognito window
   - Browse products, add items to cart, and place a test order
   - Verify you can see the order in the admin dashboard

6. **Share your live site**
   - Share your Vercel URL with your professor or clients
   - The site is now fully functional and ready for real orders!

---

## Troubleshooting

### The site loads but shows no products
- **This is normal!** The database starts empty (blank slate)
- Log in to `/admin/login` with `admin` / `admin123`
- Add categories and products through the admin dashboard
- If you want to verify the backend is working, check that `VITE_API_URL` in Vercel ends with `/api`

### Admin login fails
- Check the Railway deployment logs to confirm seeding completed successfully
- You should see `✅ Admin user created: admin` in the logs
- If seeding failed, open the Railway **Shell** and manually run:
  ```bash
  npx prisma migrate deploy
  npx prisma db seed
  ```
- Check Railway deployment logs for any database connection errors

### Images are not showing after upload
- Images are stored on Railway's server. They persist while the service is running.
- If images disappear after a redeploy, Railway's filesystem resets on each deploy. For a school project this is fine — just re-upload images if needed.

### Page shows 404 when refreshing
- Make sure the `vercel.json` file exists in the `frontend/` folder of your repo. It should already be there from the code setup.

### Railway deployment fails
- Go to the **Deployments** tab and click the failed deployment to read the error logs
- The most common cause is a missing environment variable — double-check all variables in Part 1, Step 5
- Make sure the **Root Directory** is set to `backend` in your Railway service settings (Settings → General → Root Directory)
- If you see a Prisma/database error, make sure the PostgreSQL plugin is added and `DATABASE_URL` is auto-populated in the Variables tab
- If you see `prisma generate` errors, try redeploying — Railway sometimes has transient build issues

### Railway build shows "no start command"
- Make sure `railway.json` and `nixpacks.toml` are committed and pushed to the repo inside the `backend/` folder
- In Railway Settings → General, confirm **Root Directory** is `backend`

### Database migration errors on Railway
- Open the Railway **Shell** on your backend service and run:
  ```bash
  npx prisma migrate deploy
  ```
- If the migration state is corrupt, you can reset (⚠️ **WARNING: This deletes all data!**):
  ```bash
  npx prisma migrate reset --force
  ```
- After a reset, the admin account will be recreated automatically

### I want to add sample data / test products
- The seed only creates the admin account (intentional — clean slate for your store)
- Add products, categories, and images manually through the admin dashboard
- If you want to restore the full seed with sample data (for testing), you can:
  1. Locally, run: `node backend/prisma/seed-full.js` (if you kept this file)
  2. Or manually add a few test products through the admin panel

### How do I re-run the seed if I deleted the admin account?
- The seed is **idempotent** — safe to run multiple times
- In Railway Shell, run: `npx prisma db seed`
- It will check if admin exists, and create it only if needed

---

## Frequently Asked Questions

### Why does my deployed site have no products?
This is **by design**. The site starts as a blank slate so you can add your own store's products and categories. This makes it production-ready without test/dummy data.

### Where did all the sample products go?
They were removed from the repository to keep it clean for deployment. All product images, seed data, and sample content were intentionally excluded to give you a fresh start.

### Can I get the sample data back for testing?
Yes! The full seed file is saved locally as `backend/prisma/seed-full.js` (not tracked in git). You can run it locally if you want sample data for testing. However, it's better to add real products through the admin panel.

### How do I add products?
1. Log in to `/admin/login`
2. Go to the admin dashboard
3. Navigate to Categories → Add your product categories first
4. Then go to Products → Add products one by one
5. Upload images for each product

### Will my uploaded images persist after redeployment?
On Railway's free tier, the filesystem resets on each deploy. For a school project, this is fine — just re-upload images if needed. For production, you'd use cloud storage (AWS S3, Cloudinary, etc.), but that's beyond the scope of this project.

### What if I want to enable SMS notifications?
1. Sign up for a [Semaphore account](https://semaphore.co/) (Philippines SMS provider)
2. Add your API key to Railway environment variables: `SEMAPHORE_API_KEY=your_key_here`
3. Set `SMS_ENABLED=true` and `SMS_TEST_MODE=false`
4. Add your phone number: `ADMIN_NOTIFICATION_PHONE=09XXXXXXXXX`

---

## Summary

| Service | URL | Purpose |
|---|---|---|
| Railway | `https://hardware-store-xxxx.up.railway.app` | Backend API + PostgreSQL database |
| Vercel | `https://hardware-store-xxxx.vercel.app` | Frontend (customer and admin UI) |

**Total cost: $0** — Railway is covered by your GitHub Student Pack ($5/month credit), and Vercel is free forever on the Hobby plan.

**Deployment complete!** 🎉 Your hardware store is now live and ready to accept orders.
