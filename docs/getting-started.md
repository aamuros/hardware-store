# Getting Started

This guide walks you through setting up the Hardware Store application on your local machine for development and testing.

## Prerequisites

Make sure you have the following installed before proceeding:

- **Node.js** — version 20.0.0 or newer
- **npm** — version 9.0.0 or newer (this comes bundled with Node.js)
- **Git** — any recent version

You can verify your installations by running:

```bash
node --version    # should print v20.x.x or higher
npm --version     # should print 9.x.x or higher
git --version     # any version is fine
```

If you don't have Node.js installed, download it from [nodejs.org](https://nodejs.org/). Pick the LTS (Long Term Support) version.

## Step-by-Step Setup

### 1. Clone the Repository

```bash
git clone https://github.com/aamuros/hardware-store.git
cd hardware-store
```

### 2. Set Up the Backend

```bash
cd backend

# Install all backend dependencies
npm install

# Create your local environment file from the template
cp .env.example .env

# Initialize the database — this creates the SQLite file and runs all migrations
npx prisma migrate dev

# Populate the database with an admin account and sample data
npx prisma db seed
```

After running the seed command, you should see output confirming that the admin user was created.

### 3. Set Up the Frontend

```bash
# Go back to the project root, then into the frontend folder
cd ../frontend

# Install frontend dependencies
npm install

# Create the frontend environment file
cp .env.example .env
```

### 4. Start Both Servers

You need two separate terminal windows — one for the backend and one for the frontend.

**Terminal 1 — Backend:**
```bash
cd backend
npm run dev
```
The API server will start at `http://localhost:3001`.

**Terminal 2 — Frontend:**
```bash
cd frontend
npm run dev
```
The frontend dev server will start at `http://localhost:5173`.

### 5. Open the Application

Once both servers are running:

- **Customer storefront:** open `http://localhost:5173` in your browser
- **Admin dashboard:** go to `http://localhost:5173/admin/login`

Log into the admin panel with:
- Username: `admin`
- Password: `admin123`

> **Note:** These are default development credentials. In a production deployment, you should change the admin password right away.

## Environment Configuration

Both the backend and frontend use `.env` files for configuration. The `.env.example` files in each directory contain every available option with descriptions. Below are the most important variables.

### Backend — `backend/.env`

```env
# Server settings
NODE_ENV=development
PORT=3001

# Database connection — SQLite is used by default for local development
DATABASE_URL="file:./dev.db"

# JWT settings — used to sign authentication tokens
JWT_SECRET=your-secret-key-change-in-production
JWT_EXPIRES_IN=7d

# SMS — turned off by default so you can develop without needing an API key
SMS_ENABLED=false
SMS_TEST_MODE=true

# Store details — these appear on the frontend
STORE_NAME=Juan's Hardware Store
STORE_PHONE=09171234567

# CORS — must match the URL where your frontend is running
FRONTEND_URL=http://localhost:5173
```

### Frontend — `frontend/.env`

```env
# Points to the backend API
VITE_API_URL=http://localhost:3001/api

# Store name shown in the browser tab and header
VITE_STORE_NAME=Juan's Hardware Store
VITE_STORE_PHONE=09171234567
```

## Useful Commands

Here is a quick reference of the commands you will use most often.

### Backend

| Command | What It Does |
|---------|--------------|
| `npm run dev` | Starts the Express server with hot reload (via nodemon) |
| `npm start` | Starts the server without hot reload (for production) |
| `npm test` | Runs the Jest test suite |
| `npm run lint` | Checks code for linting errors |
| `npm run format` | Auto-formats code using Prettier |
| `npm run db:migrate` | Runs any pending Prisma migrations |
| `npm run db:seed` | Seeds the database with initial data |
| `npm run db:reset` | Drops everything, re-runs migrations, and re-seeds |
| `npm run db:studio` | Opens Prisma Studio (a visual database inspector) at `http://localhost:5555` |

### Frontend

| Command | What It Does |
|---------|--------------|
| `npm run dev` | Starts the Vite dev server with hot module replacement |
| `npm run build` | Compiles the React app into optimized static files |
| `npm run preview` | Serves the production build locally so you can test it |
| `npm run lint` | Checks code for linting errors |
| `npm run format` | Auto-formats code using Prettier |

## Working with the Database

### Viewing Data with Prisma Studio

Prisma Studio gives you a browser-based UI to inspect and edit database records directly. It is very handy during development.

```bash
cd backend
npm run db:studio
```

This opens at `http://localhost:5555`. You can browse tables, filter rows, and even edit data on the spot.

### Resetting the Database

If your local database gets into a messy state, you can wipe it and start fresh:

```bash
cd backend
npm run db:reset
```

This drops all tables, re-applies every migration from scratch, and runs the seed script again.

### Creating a New Migration

Whenever you make changes to the Prisma schema file (`prisma/schema.prisma`), you need to generate a migration:

```bash
cd backend
npx prisma migrate dev --name describe_your_changes
```

This creates a new SQL migration file and applies it to your local database.

## Troubleshooting

### "EADDRINUSE" — Port Already in Use

This means another process is already using port 3001 (or 5173). Find and stop it:

```bash
# See what is using port 3001
lsof -i :3001

# Kill the process by its PID
kill -9 <PID>
```

### Database Errors

If migrations fail or the database seems corrupted, delete the SQLite file and recreate it:

```bash
cd backend
rm prisma/dev.db
npx prisma migrate dev
npx prisma db seed
```

### Missing or Corrupted node_modules

If you see strange module-not-found errors, try a clean reinstall:

```bash
# For the backend
cd backend
rm -rf node_modules package-lock.json
npm install

# For the frontend
cd ../frontend
rm -rf node_modules package-lock.json
npm install
```

### CORS Errors in the Browser

If the frontend cannot reach the backend and you see CORS errors in the browser console, double-check that the `FRONTEND_URL` variable in `backend/.env` matches exactly where the frontend is running:

```env
FRONTEND_URL=http://localhost:5173
```

## What to Read Next

- [API Reference](./api/README.md) — understand how each endpoint works
- [Database Schema](./database/schema.md) — see how the data is structured
- [Testing Guide](./testing/README.md) — learn how to run and write tests
- [Deployment Guide](./deployment.md) — take the app live on Railway
