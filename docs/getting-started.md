# Getting Started

This guide will help you set up the Hardware Store application for local development.

## Prerequisites

Before you begin, ensure you have the following installed:

- **Node.js** 20.0.0 or higher
- **npm** 9.0.0 or higher (comes with Node.js)
- **Git** for version control

### Verify Installation

```bash
node --version    # Should be v20.x.x or higher
npm --version     # Should be 9.x.x or higher
git --version     # Any recent version
```

## Quick Start

### 1. Clone the Repository

```bash
git clone <repository-url>
cd hardware-store
```

### 2. Set Up the Backend

```bash
# Navigate to backend directory
cd backend

# Install dependencies
npm install

# Create environment file
cp .env.example .env

# Set up the database (creates SQLite database and runs migrations)
npx prisma migrate dev

# Seed the database with sample data
npx prisma db seed
```

### 3. Set Up the Frontend

```bash
# Navigate to frontend directory (from project root)
cd frontend

# Install dependencies
npm install

# Create environment file
cp .env.example .env
```

### 4. Start Development Servers

You'll need two terminal windows:

**Terminal 1 - Backend:**
```bash
cd backend
npm run dev
```
Backend will run at: `http://localhost:3001`

**Terminal 2 - Frontend:**
```bash
cd frontend
npm run dev
```
Frontend will run at: `http://localhost:5173`

### 5. Access the Application

- **Customer Portal:** http://localhost:5173
- **Admin Dashboard:** http://localhost:5173/admin/login

**Default Admin Credentials:**
- Username: `admin`
- Password: `admin123`

> [!WARNING]
> Change the default admin password in production!

## Environment Configuration

### Backend (.env)

```env
# Server
NODE_ENV=development
PORT=3001

# Database (SQLite for development)
DATABASE_URL="file:./dev.db"

# JWT Authentication
JWT_SECRET=your-secret-key-change-in-production
JWT_EXPIRES_IN=7d

# SMS (disabled by default for development)
SMS_ENABLED=false
SMS_TEST_MODE=true

# Store Information
STORE_NAME=Juan's Hardware Store
STORE_PHONE=09171234567

# Frontend URL (for CORS)
FRONTEND_URL=http://localhost:5173
```

### Frontend (.env)

```env
# Backend API URL
VITE_API_URL=http://localhost:5173/api

# Store Information
VITE_STORE_NAME=Juan's Hardware Store
VITE_STORE_PHONE=09171234567
```

## Common Commands

### Backend Commands

| Command | Description |
|---------|-------------|
| `npm run dev` | Start development server with hot reload |
| `npm start` | Start production server |
| `npm test` | Run all tests |
| `npm run lint` | Check code for linting errors |
| `npm run format` | Format code with Prettier |
| `npm run db:migrate` | Run database migrations |
| `npm run db:seed` | Seed database with sample data |
| `npm run db:reset` | Reset database (drops all data) |
| `npm run db:studio` | Open Prisma Studio (visual database browser) |

### Frontend Commands

| Command | Description |
|---------|-------------|
| `npm run dev` | Start development server |
| `npm run build` | Build for production |
| `npm run preview` | Preview production build locally |
| `npm run lint` | Check code for linting errors |
| `npm run format` | Format code with Prettier |

## Database Management

### View Database (Prisma Studio)

```bash
cd backend
npm run db:studio
```

Opens a visual browser for your database at `http://localhost:5555`.

### Reset Database

```bash
cd backend
npm run db:reset
```

This will:
1. Drop all existing data
2. Re-run all migrations
3. Re-seed with sample data

### Create New Migration

After modifying `prisma/schema.prisma`:

```bash
cd backend
npx prisma migrate dev --name describe_your_changes
```

## Troubleshooting

### Port Already in Use

If you see "EADDRINUSE" error:

```bash
# Find process using the port (e.g., 3001)
lsof -i :3001

# Kill the process
kill -9 <PID>
```

### Database Errors

Reset the database:

```bash
cd backend
rm prisma/dev.db
npx prisma migrate dev
npx prisma db seed
```

### Node Modules Issues

Delete and reinstall:

```bash
# Backend
cd backend
rm -rf node_modules package-lock.json
npm install

# Frontend
cd frontend
rm -rf node_modules package-lock.json
npm install
```

### CORS Errors

Ensure `FRONTEND_URL` in backend `.env` matches your frontend URL:

```env
FRONTEND_URL=http://localhost:5173
```

## Next Steps

- [API Documentation](./api/README.md) - Learn about available endpoints
- [Database Schema](./database/schema.md) - Understand the data models
- [Testing Guide](./testing/README.md) - Run and write tests
- [Deployment](./deployment.md) - Deploy to production
