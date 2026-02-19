# Deployment Guide

This guide walks you through hosting the Hardware Store website for free using **Railway** (backend + database) and **Vercel** (frontend). Both are free under the GitHub Student Developer Pack.

---

## Prerequisites

- Your code is pushed to GitHub (`aamuros/hardware-store`)
- You have a GitHub account enrolled in [GitHub Education](https://education.github.com/)

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
JWT_SECRET=<run: openssl rand -base64 32>
JWT_EXPIRES_IN=7d
SMS_ENABLED=false
SMS_TEST_MODE=true
SEMAPHORE_API_KEY=ac766256a5f652da185050a707d19a61
STORE_NAME=Wena's Hardware Store
STORE_PHONE=09660020335
STORE_ADDRESS=123 Main St, Barangay Sample, City, Philippines
FRONTEND_URL=https://PLACEHOLDER.vercel.app
```

> **JWT_SECRET** — generate a secure value by running this in your terminal:
> ```bash
> openssl rand -base64 32
> ```
> Copy the output and paste it as the value.

> **FRONTEND_URL** — leave it as the placeholder for now. You will update it after deploying the frontend in Part 2.

4. Click **Save**

### Step 6 — Trigger a new deployment

1. Go to the **Deployments** tab
2. Click **Deploy** (it may redeploy automatically after saving variables)
3. Wait for the deployment to finish — it will run `prisma migrate deploy` automatically before starting the server
4. Once it shows **Active**, click on the deployment to see the logs and confirm it started successfully

### Step 7 — Copy your Railway backend URL

1. Go to the **Settings** tab of your backend service
2. Under the **Networking** section, click **Generate Domain**
3. Copy the URL — it will look like:
   ```
   https://hardware-store-production-xxxx.up.railway.app
   ```
   Keep this URL — you will need it in Part 2.

### Step 8 — Seed the database with initial data

1. In Railway, go to your backend service
2. Click the **Shell** tab (or "New Shell")
3. Run:
   ```bash
   node prisma/seed.js
   ```
4. Wait for it to complete — this creates the default admin account and sample products

> **Default admin credentials after seeding:**
> - Username: `admin`
> - Password: `admin123`
>
> **Change this password immediately after your first login.**

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
| `VITE_STORE_NAME` | `Wena's Hardware Store` |
| `VITE_STORE_PHONE` | `09660020335` |

> Replace `hardware-store-production-xxxx.up.railway.app` with the **actual Railway URL** you copied in Part 1, Step 7. Make sure to append `/api` at the end.

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
2. The homepage should load with products
3. Try refreshing a page like `/products` — it should not show a 404
4. Go to `/admin/login` and log in with:
   - Username: `admin`
   - Password: `admin123`

---

## Part 4 — After Deployment Checklist

- [ ] Change the admin password from `admin123` to something secure
- [ ] Add real product data and categories through the admin panel
- [ ] Upload product images through the admin panel
- [ ] Test placing a sample order end-to-end
- [ ] Share your live Vercel URL with your professor

---

## Troubleshooting

### The site loads but shows no products
- Check that the Railway backend shows a green **Active** status
- Check that `VITE_API_URL` in Vercel ends with `/api` (not just the domain)
- Open browser DevTools → Network tab and look for failed API requests

### Admin login fails
- Make sure you ran `node prisma/seed.js` in the Railway shell (Part 1, Step 8)
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
- If the migration state is corrupt, you can reset (WARNING: deletes all data):
  ```bash
  npx prisma migrate reset --force
  ```

---

## Summary

| Service | URL | Purpose |
|---|---|---|
| Railway | `https://hardware-store-xxxx.up.railway.app` | Backend API + PostgreSQL database |
| Vercel | `https://hardware-store-xxxx.vercel.app` | Frontend (customer and admin UI) |

**Total cost: $0** — Railway is covered by your GitHub Student Pack ($5/month credit), and Vercel is free forever on the Hobby plan.
