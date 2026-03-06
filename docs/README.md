# Project Documentation

This folder contains all the technical documentation for the Hardware Store web application, submitted as our final project for Software Engineering. Whether you need to set up the project locally, understand how the API works, or deploy the site to production, you will find what you need here.

## Guides

| Guide | Description |
|-------|-------------|
| [Getting Started](./getting-started.md) | How to set up the project on your machine for local development |
| [Requirements Analysis](./requirements-analysis.md) | Functional and non-functional requirements of the system |
| [Deployment](./deployment.md) | How to deploy the application to Railway for production use |
| [API Reference](./api/README.md) | Full documentation for every REST API endpoint |
| [Database Schema](./database/schema.md) | Overview of all database tables, columns, and relationships |
| [Testing](./testing/README.md) | How to run the automated test suite and write new tests |

## Feature Documentation

| Feature | Description |
|---------|-------------|
| [SMS Integration](./features/sms-integration.md) | How the SMS notification system works and how to configure it |

## System Overview

The Hardware Store application is a full-stack web platform designed for local hardware shops in the Philippines. It allows customers to browse a product catalog, place delivery orders, and receive SMS updates about their order status. Store owners use an admin dashboard to manage products, process incoming orders, and track sales.

### How the System is Organized

The project follows a standard client-server architecture. The frontend is a React single-page application that communicates with a Node.js/Express backend through REST API calls. The backend handles all business logic, database operations, and external integrations like SMS.

```
┌──────────────────────────────────────────────────────────┐
│                      Frontend                            │
│             React 18 + Vite + Tailwind CSS               │
│                   (Port 5173)                            │
└────────────────────────┬─────────────────────────────────┘
                         │ REST API calls (HTTP)
                         ▼
┌──────────────────────────────────────────────────────────┐
│                      Backend                             │
│             Express.js + Prisma ORM                      │
│                   (Port 3001)                            │
├────────────────────────┬─────────────────────────────────┤
│       Database         │        SMS Service              │
│  SQLite / PostgreSQL   │   Semaphore (PH provider)       │
└────────────────────────┴─────────────────────────────────┘
```

### Technology Choices

| Layer | Technology | Why We Chose It |
|-------|------------|-----------------|
| Frontend | React 18 with Vite | Fast build times; component-based UI makes the app easier to maintain |
| Styling | Tailwind CSS | Speeds up styling without writing much custom CSS |
| Routing | React Router v6 | Industry-standard client-side routing for React apps |
| Backend | Express.js on Node.js 20 | Lightweight and well-documented; large ecosystem of middleware |
| ORM | Prisma | Type-safe database queries with automatic migrations |
| Database | SQLite (dev) / PostgreSQL (prod) | SQLite for zero-config local development; PostgreSQL for reliability in production |
| Auth | JWT | Stateless authentication that works well with REST APIs |
| SMS | Semaphore | Affordable Philippine SMS gateway with straightforward API |

### Directory Layout

```
hardware-store/
├── frontend/                # React application
│   ├── src/
│   │   ├── components/     # Reusable UI components (Navbar, Cards, Modals)
│   │   ├── pages/          # Full page views — both customer-facing and admin
│   │   ├── context/        # React Context providers (AuthContext, CartContext)
│   │   ├── hooks/          # Custom React hooks
│   │   ├── services/       # API client — functions that call the backend
│   │   └── styles/         # Global stylesheets
│   └── public/             # Static files served as-is
│
├── backend/                 # Express.js API server
│   ├── src/
│   │   ├── config/         # App configuration (database, environment)
│   │   ├── controllers/    # Route handlers — receive requests and return responses
│   │   ├── middleware/     # Reusable middleware (auth, validation, error handling)
│   │   ├── routes/         # URL-to-controller mappings
│   │   ├── services/       # Business logic (SMS sending, etc.)
│   │   └── utils/          # Helper utilities (phone validation, date formatting)
│   ├── prisma/             # Schema definition, migration files, and seed script
│   └── tests/              # Automated API tests
│
├── docs/                    # This documentation folder
└── product-images/          # Reference product images
```

## Where to Go from Here

- **Just cloned the repo?** Start with the [Getting Started](./getting-started.md) guide.
- **Need to know how an endpoint works?** Check the [API Reference](./api/README.md).
- **Ready to go live?** Follow the [Deployment Guide](./deployment.md).
- **Running or writing tests?** See the [Testing Guide](./testing/README.md).
