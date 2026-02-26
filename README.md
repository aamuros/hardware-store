# Hardware Store — Online Ordering System

An online ordering and store management platform built for local hardware stores in the Philippines. Customers can browse products, place delivery orders, and receive SMS updates, while store owners manage everything from a dedicated admin dashboard.

This project was developed as a capstone/final submission for our web development course. It demonstrates a working full-stack application using modern tools and frameworks, deployed on cloud infrastructure.

## What the System Does

**For Customers:**
- Browse the store's product catalog, organized by category
- Search for specific items and filter by availability
- Add products to a shopping cart (with support for product variants like size or color)
- Place orders for delivery with address and contact details
- Track orders using an order number
- Create an account to save addresses, view past orders, and maintain a wishlist

**For Store Admins/Staff:**
- View a sales dashboard with daily and monthly analytics
- Accept, reject, or update orders through a step-by-step status workflow
- Add, edit, and remove products — including variants and bulk pricing tiers
- Manage product categories
- Create staff accounts with role-based access
- Generate and view sales reports

**Automated SMS Notifications:**
- Customers get text messages when their order is confirmed, accepted, rejected, out for delivery, and delivered
- The store admin receives a text whenever a new order comes in

## Technologies Used

| Layer | Tools |
|-------|-------|
| Frontend | React 18, Vite, Tailwind CSS, React Router v6 |
| Backend | Node.js 20+, Express.js, Prisma ORM |
| Database | SQLite (for local development), PostgreSQL (for production) |
| Authentication | JWT (JSON Web Tokens) |
| SMS Provider | Semaphore (Philippine SMS gateway) |
| Deployment | Railway (backend + database), served as a single service |

## Getting Started

### What You Need

- **Node.js** version 20 or higher
- **npm** version 9 or higher (bundled with Node.js)

### Setup Steps

```bash
# 1. Clone the repo
git clone <repository-url>
cd hardware-store

# 2. Install and configure the backend
cd backend
npm install
cp .env.example .env
npx prisma migrate dev
npx prisma db seed

# 3. Install and configure the frontend
cd ../frontend
npm install
cp .env.example .env
```

### Running the App

Open two terminal windows:

**Terminal 1 — Start the backend server:**
```bash
cd backend
npm run dev
# Runs at http://localhost:3001
```

**Terminal 2 — Start the frontend dev server:**
```bash
cd frontend
npm run dev
# Runs at http://localhost:5173
```

### Default Login

- **Admin panel:** go to `http://localhost:5173/admin/login`
- **Username:** `admin`
- **Password:** `admin123`

## Folder Structure

```
hardware-store/
├── backend/                # Express.js REST API server
│   ├── src/
│   │   ├── controllers/   # Request handlers for each route
│   │   ├── middleware/    # Auth checks, validation, error handling
│   │   ├── routes/        # Route definitions (maps URLs to controllers)
│   │   ├── services/      # Core business logic (SMS sending, etc.)
│   │   └── utils/         # Shared helper functions
│   ├── prisma/            # Database schema, migrations, and seed script
│   └── tests/             # Automated API tests (Jest + Supertest)
│
├── frontend/              # React single-page application
│   └── src/
│       ├── components/    # Reusable UI pieces (Navbar, ProductCard, etc.)
│       ├── pages/         # Full page views (Home, Cart, Admin Dashboard)
│       ├── context/       # React Context for global state (auth, cart)
│       ├── hooks/         # Custom React hooks
│       ├── services/      # Functions that call the backend API
│       └── styles/        # Global CSS
│
├── docs/                  # Project documentation
└── product-images/        # Reference product images
```

## Documentation

For more in-depth information, refer to the docs folder:

| Document | What It Covers |
|----------|----------------|
| [Getting Started](./docs/getting-started.md) | Full local development setup with troubleshooting |
| [API Reference](./docs/api/README.md) | Every API endpoint, request/response formats |
| [Database Schema](./docs/database/schema.md) | All database tables and their relationships |
| [Deployment Guide](./docs/deployment.md) | Step-by-step Railway deployment instructions |
| [Testing](./docs/testing/README.md) | How to run and write tests |
| [SMS Integration](./docs/features/sms-integration.md) | SMS provider setup and message templates |

## Available Scripts

### Backend (`cd backend`)

| Command | What It Does |
|---------|--------------|
| `npm run dev` | Starts the server with auto-reload on file changes |
| `npm start` | Starts the server in production mode |
| `npm test` | Runs the full automated test suite |
| `npm run db:migrate` | Applies pending database migrations |
| `npm run db:seed` | Populates the database with initial data |
| `npm run db:studio` | Opens Prisma Studio — a visual database browser |

### Frontend (`cd frontend`)

| Command | What It Does |
|---------|--------------|
| `npm run dev` | Starts the Vite dev server with hot reload |
| `npm run build` | Compiles the app into optimized static files |
| `npm run preview` | Serves the production build locally for testing |

## Key API Endpoints

| Endpoint | Purpose |
|----------|---------|
| `GET /api/products` | Fetch the product catalog |
| `GET /api/categories` | Fetch product categories |
| `POST /api/orders` | Submit a new customer order |
| `GET /api/orders/:orderNumber` | Look up an order by its tracking number |
| `POST /api/admin/login` | Authenticate as an admin user |
| `GET /api/admin/orders` | Retrieve all orders (admin only) |
| `PATCH /api/admin/orders/:id/status` | Move an order to the next status (admin only) |

The full API reference with request bodies, query parameters, and example responses is in [docs/api/README.md](./docs/api/README.md).

## Environment Variables

### Backend (`backend/.env`)

```env
DATABASE_URL="file:./dev.db"
JWT_SECRET=your-secret-key
SMS_ENABLED=false
FRONTEND_URL=http://localhost:5173
```

### Frontend (`frontend/.env`)

```env
VITE_API_URL=http://localhost:3001/api
VITE_STORE_NAME=Hardware Store
```

Both directories include `.env.example` files with all available options and descriptions.

## Deployment

The application is designed to run as a single Railway service that hosts both the API and the built frontend. PostgreSQL is used as the production database (also on Railway). This setup is free under the GitHub Student Developer Pack.

Full deployment instructions are in the [Deployment Guide](./docs/deployment.md).

## Running Tests

```bash
cd backend
npm test                                         # run all tests
npm test -- --coverage                           # run with coverage report
npm test -- --testPathPattern=orders.test.js      # run a specific test file
```

The test suite covers API endpoints, authentication flows, input validation, order status transitions, and SMS service logic.

## Contributing

1. Create a new branch for your feature or fix
2. Write your code and make sure `npm test` passes
3. Run `npm run lint` to check for style issues
4. Open a pull request with a clear description of the changes

## License

This project is proprietary. All rights reserved.
