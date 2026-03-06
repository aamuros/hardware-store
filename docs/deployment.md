# Deployment Guide

This guide explains how to deploy the Hardware Store application to the internet using **Railway**. The entire stack — backend, frontend, and database — runs on a single Railway service, so you only need one URL.

The deployment is completely free if you have a GitHub Student Developer Pack.

**What to expect after deployment:**
- The site starts with a blank database — only an admin account is created automatically
- You add products, categories, and images through the admin dashboard after the site is live
- The whole process takes roughly 10 to 15 minutes

---

## What You Need Before Starting

- Your project code must be pushed to a GitHub repository
- You need a GitHub account enrolled in [GitHub Education](https://education.github.com/)

---

## Step 1 — Create a Railway Account

1. Go to [railway.app](https://railway.app)
2. Click **Login**, then choose **Login with GitHub**
3. Authorize Railway when prompted

### Activate Your GitHub Student Credits

1. After logging in, click your profile picture in the top-right corner, then go to **Account Settings**
2. Open the **Plans** tab
3. Click **GitHub Student** and follow the verification steps
4. Once approved, you get **$5 per month** in free credits — more than enough for this project

---

## Step 2 — Create a New Project

1. On the Railway dashboard, click **+ New Project**
2. Select **Deploy from GitHub repo**
3. Find and select your **hardware-store** repository
4. **Do not set a root directory** — leave it on the default (repository root). Railway needs access to both the `backend/` and `frontend/` folders during the build process.
5. Click **Deploy Now**

The initial deployment will probably fail because the database and environment variables are not configured yet. That is expected — you will fix it in the next steps.

---

## Step 3 — Add a PostgreSQL Database

1. Inside your Railway project, click the **+ New** button (top-right area)
2. Select **Database**, then choose **Add PostgreSQL**
3. Railway will spin up a PostgreSQL instance and automatically inject a `DATABASE_URL` variable into your service's environment. You do not need to touch this variable — it is handled for you.

---

## Step 4 — Set Environment Variables

1. Click on your **main service** (the one linked to your GitHub repo — not the database)
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

**How to generate a JWT secret:**

Run this in your terminal to get a random 32-character string:
```bash
openssl rand -base64 32
```
Copy the output and paste it as the value for `JWT_SECRET`.

**Store details:** update `STORE_NAME`, `STORE_PHONE`, and `STORE_ADDRESS` with your actual information. These values are displayed on the customer-facing site.

**SMS settings:** keep `SMS_ENABLED` set to `false` and `SMS_TEST_MODE` set to `true` for now. This prevents accidental charges while you are still testing the deployment.

4. Click **Save**

---

## Step 5 — Trigger the Deployment

1. Go to the **Deployments** tab
2. Railway may have already started a new deployment after you saved the variables. If not, click **Deploy** manually.
3. Wait for the build to finish — this typically takes 3 to 5 minutes

During the build, Railway will automatically:
- Install all npm dependencies for both the backend and frontend
- Build the React frontend into static files using Vite
- Generate the Prisma client configured for PostgreSQL
- Run all database migrations to create the tables
- Seed the database with the default admin account
- Start the Express server, which serves both the API and the frontend

Once the deployment status shows **Active**, your site is live.

---

## Step 6 — Get Your Public URL

1. Go to the **Settings** tab of your service
2. Scroll down to the **Networking** section and click **Generate Domain**
3. Railway will give you a URL like:
   ```
   https://hardware-store-production-xxxx.up.railway.app
   ```
4. Open this URL in your browser — the homepage should load

---

## Step 7 — Verify Everything Works

1. Go to the **Deployments** tab and click on the latest deployment to view its logs
2. You should see output similar to:
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
4. Visit `<your-url>/health` — this should return a JSON response with `"success": true`
5. Go to `<your-url>/admin/login` and log in with:
   - Username: `admin`
   - Password: `admin123`

**Important:** change the admin password after your first login. The default credentials are publicly documented.

The database starts empty (aside from the admin account). You will populate it through the admin dashboard in the next section.

---

## After Deployment — Setting Up Your Store

Once the site is live, populate it with your store's actual data:

1. **Change the admin password**
   - Log in at `/admin/login` with the default credentials
   - Go to your profile and update the password

2. **Create product categories**
   - Navigate to Admin Dashboard → Categories
   - Add your categories (for example: Steel & Metal, Lumber & Wood, Plumbing, Electrical, Paint)

3. **Add products**
   - Go to Admin Dashboard → Products
   - Click "Add Product" and fill in the details: name, description, price, category, stock quantity
   - Upload product images

4. **Create staff accounts** (optional)
   - Go to Admin Dashboard → Staff Management
   - Add accounts for other people who need to manage orders

5. **Test the customer experience**
   - Open the site in an incognito/private browsing window
   - Browse products, add something to the cart, and place a test order
   - Switch back to the admin dashboard and verify the order appears

6. **Share the URL**
   - Send the Railway URL to your instructor, classmates, or clients

---

## Troubleshooting

### The site loads but there are no products

This is expected behavior. The database is intentionally seeded with just an admin account. Log in at `/admin/login` and add categories and products through the dashboard.

### Admin login does not work

Check the deployment logs to confirm that the seed script ran successfully. You should see `✅ Admin user created: admin` in the output. If you do not, open the Railway **Shell** for your service and run:

```bash
npx prisma migrate deploy
npx prisma db seed
```

### Product images disappear after redeployment

Railway resets the filesystem on every deploy. This means uploaded images are lost when a new version is pushed. For a school project, this is manageable — just re-upload the images after each deploy. In a production environment, you would use a cloud storage service like AWS S3 or Cloudinary to persist images.

### Pages return 404 on refresh

This should not happen because the Express server has a catch-all route that serves `index.html` for any non-API path. If you do see this, check the deployment logs to make sure the Vite build completed successfully (look for `vite build` in the output).

### Railway deployment fails

- Open the failed deployment and read the error logs — the error message usually points directly at the problem
- The most common cause is a missing environment variable. Go back to Step 4 and verify all variables are set.
- Make sure the **Root Directory** setting is blank (not set to `backend` or anything else). Railway needs access to the entire repository.
- If you see Prisma or database errors, confirm that the PostgreSQL plugin was added in Step 3 and that `DATABASE_URL` appears automatically in your Variables tab.

### "No start command found"

This means Railway cannot figure out how to run your app. Verify that `railway.json` and `nixpacks.toml` are committed to the root of the repository (not inside `backend/`). Also confirm that the Root Directory setting in Railway is blank.

### Database migration errors

Open the Railway Shell and run the migrations manually:
```bash
cd backend && npx prisma migrate deploy
```

If the migration history is corrupted and you need to start over (**warning: this deletes all data**):
```bash
cd backend && npx prisma migrate reset --force
```
After a reset, the seed script runs automatically and recreates the admin account.

### Accidentally deleted the admin account

The seed script checks whether the admin user exists before creating it, so running it again is safe:
```bash
cd backend && npx prisma db seed
```

---

## Frequently Asked Questions

**Why does the deployed site have no products?**
By design. The site starts empty so you can add your own store's real products and categories.

**Will my uploaded images survive a redeployment?**
No. Railway's filesystem resets on each deploy. For a school project this is acceptable — just re-upload images after a deploy. For a real business, you would integrate a cloud storage solution.

**How do I turn on SMS notifications?**
1. Create an account on [Semaphore](https://semaphore.co/) (a Philippine SMS provider)
2. Copy your API key
3. Add these variables in Railway:
   - `SEMAPHORE_API_KEY=your_key_here`
   - `SMS_ENABLED=true`
   - `SMS_TEST_MODE=false`
   - `ADMIN_NOTIFICATION_PHONE=09XXXXXXXXX`

---

## Summary

| Part of the Stack | Where It Runs |
|-------------------|---------------|
| React frontend | Served as static files by Express on Railway |
| Express API | Railway service |
| PostgreSQL database | Railway (provisioned as an add-on) |

Everything runs on a single Railway service behind one URL. No additional hosting provider is needed.

**Total cost:** free, covered by the GitHub Student Developer Pack ($5/month credit).
