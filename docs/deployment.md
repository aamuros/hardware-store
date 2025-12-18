# Deployment Guide

This guide covers deploying the Hardware Store application to production using Railway (backend) and Vercel (frontend).

## Prerequisites

- GitHub account with your code pushed to a repository
- Railway account (https://railway.app)
- Vercel account (https://vercel.com)
- SMS provider API key (Semaphore recommended for Philippines)

## Backend Deployment (Railway)

### 1. Create Railway Project

1. Go to [Railway](https://railway.app) and sign in with GitHub
2. Click **"New Project"** → **"Deploy from GitHub repo"**
3. Select your repository
4. Set the **root directory** to `backend`

### 2. Add PostgreSQL Database

1. In your Railway project, click **"New"** → **"Database"** → **"PostgreSQL"**
2. Wait for the database to provision
3. Click on the PostgreSQL service and copy the `DATABASE_URL` from the **Variables** tab

### 3. Configure Environment Variables

In your Railway backend service, go to **Variables** and add:

```env
# Required
NODE_ENV=production
DATABASE_URL=<your-postgresql-url-from-step-2>
JWT_SECRET=<generate-with: openssl rand -base64 64>
FRONTEND_URL=<your-vercel-url>  # Add after frontend deployment

# SMS Configuration
SMS_ENABLED=true
SMS_TEST_MODE=false
SEMAPHORE_API_KEY=<your-semaphore-api-key>
SMS_SENDER_NAME=HARDWARE
ADMIN_NOTIFICATION_PHONE=09171234567

# Store Information
STORE_NAME=Your Hardware Store
STORE_PHONE=09171234567
```

> [!IMPORTANT]
> Generate a strong JWT_SECRET:
> ```bash
> openssl rand -base64 64
> ```

### 4. Deploy

Railway will automatically:
1. Run `npm install`
2. Run `prisma generate` (via postinstall script)
3. Start the server with `npm start`

### 5. Run Database Migrations

Open the Railway CLI or use the Railway shell:

```bash
npx prisma migrate deploy
```

Optionally seed the database:
```bash
npx prisma db seed
```

### 6. Get Your Backend URL

Your backend will be available at: `https://your-project.railway.app`

Note this URL for frontend configuration.

---

## Frontend Deployment (Vercel)

### 1. Import Project to Vercel

1. Go to [Vercel](https://vercel.com) and sign in with GitHub
2. Click **"Add New..."** → **"Project"**
3. Import your repository
4. Set the **Root Directory** to `frontend`

### 2. Configure Build Settings

| Setting | Value |
|---------|-------|
| Framework Preset | Vite |
| Build Command | `npm run build` |
| Output Directory | `dist` |
| Install Command | `npm install` |

### 3. Set Environment Variables

Add these environment variables in Vercel:

```env
VITE_API_URL=https://your-backend.railway.app/api
VITE_STORE_NAME=Your Hardware Store
VITE_STORE_PHONE=09171234567
```

### 4. Deploy

Click **"Deploy"** and wait for the build to complete.

### 5. Update Backend CORS

After getting your Vercel URL, go back to Railway and update:

```env
FRONTEND_URL=https://your-frontend.vercel.app
```

---

## Post-Deployment Checklist

### Security

- [ ] Changed default admin password
- [ ] JWT_SECRET is a strong, unique value
- [ ] Database credentials are secure
- [ ] CORS is properly configured

### SMS Setup

- [ ] Semaphore account created and funded
- [ ] API key configured in Railway
- [ ] Test SMS by creating an order
- [ ] Verify admin receives notifications

### Testing

- [ ] Customer can browse products
- [ ] Customer can place an order
- [ ] Admin can log in
- [ ] Admin can update order status
- [ ] SMS notifications are received

---

## Domain Configuration

### Custom Domain on Vercel

1. Go to your Vercel project → **Settings** → **Domains**
2. Add your custom domain
3. Update DNS records as instructed
4. Wait for SSL certificate provisioning

### Custom Domain on Railway

1. Go to your Railway service → **Settings** → **Networking**
2. Click **"Generate Domain"** or add custom domain
3. Update DNS records as instructed

---

## Database Management

### Running Migrations

```bash
# Via Railway CLI
railway run npx prisma migrate deploy

# Or via Railway shell
npx prisma migrate deploy
```

### Database Backups

Railway PostgreSQL includes automatic daily backups. For manual backups:

```bash
# Export
pg_dump DATABASE_URL > backup.sql

# Import
psql DATABASE_URL < backup.sql
```

### Direct Database Access

Use Prisma Studio (locally with production database):

```bash
DATABASE_URL="postgresql://..." npx prisma studio
```

---

## Monitoring & Logs

### Railway Logs

1. Click on your service in Railway
2. Go to the **"Logs"** tab
3. View real-time or historical logs

### Vercel Logs

1. Go to your Vercel project
2. Click **"Logs"** tab
3. Filter by type (Runtime, Edge, Build)

---

## Environment Variables Reference

### Backend (Production)

| Variable | Required | Description |
|----------|----------|-------------|
| `NODE_ENV` | Yes | Set to `production` |
| `DATABASE_URL` | Yes | PostgreSQL connection string |
| `JWT_SECRET` | Yes | Secret for JWT signing (min 32 chars) |
| `FRONTEND_URL` | Yes | Frontend URL for CORS |
| `SMS_ENABLED` | Yes | Enable SMS sending |
| `SEMAPHORE_API_KEY` | If SMS | Semaphore API key |
| `ADMIN_NOTIFICATION_PHONE` | No | Admin phone for order alerts |
| `STORE_NAME` | No | Store name in SMS messages |

### Frontend (Production)

| Variable | Required | Description |
|----------|----------|-------------|
| `VITE_API_URL` | Yes | Backend API URL (with /api) |
| `VITE_STORE_NAME` | No | Store name in UI |
| `VITE_STORE_PHONE` | No | Contact phone in UI |

---

## Troubleshooting

### Backend Won't Start

1. Check logs in Railway for errors
2. Verify all required env variables are set
3. Ensure DATABASE_URL is correct
4. Run migrations: `npx prisma migrate deploy`

### Database Connection Errors

1. Verify DATABASE_URL format
2. Check if PostgreSQL service is running
3. Ensure DATABASE_URL uses the internal Railway URL

### CORS Errors

1. Verify FRONTEND_URL matches exactly
2. No trailing slash in FRONTEND_URL
3. Redeploy backend after updating

### SMS Not Sending

1. Verify SMS_ENABLED=true
2. Check SEMAPHORE_API_KEY is correct
3. Verify account has SMS credits
4. Check logs for SMS errors

---

## Cost Estimates

### Railway (Backend + Database)

- **Hobby Plan**: $5/month
- **Pro Plan**: Pay-per-use (~$5-20/month for small apps)
- PostgreSQL: Included in plan limits

### Vercel (Frontend)

- **Hobby Plan**: Free
- **Pro Plan**: $20/month (if needed)

### SMS (Semaphore)

- ~₱0.35 per SMS
- 100 orders/month × 3 SMS = ~₱105/month

**Estimated Total: $10-25/month + SMS costs**
