# Hardware Store Documentation

Welcome to the Hardware Store documentation! This guide will help you understand, set up, and work with the hardware store web application.

## Quick Links

| Guide | Description |
|-------|-------------|
| [Getting Started](./getting-started.md) | Set up your local development environment |
| [Deployment](./deployment.md) | Deploy to production (Railway, Vercel) |
| [API Reference](./api/README.md) | Complete API documentation |
| [Database Schema](./database/schema.md) | Database models and relationships |
| [Testing](./testing/README.md) | How to run and write tests |

## Feature Guides

| Feature | Description |
|---------|-------------|
| [SMS Integration](./features/sms-integration.md) | SMS notifications for orders |
| [Product Variants](./features/product-variants.md) | Product variants (size, color) |
| [Bulk Pricing](./features/bulk-pricing.md) | Volume discounts |

## Project Overview

The Hardware Store is a full-stack web application designed for local hardware stores in the Philippines. It enables customers to browse products, place orders for delivery, and receive SMS updates on their order status.

### Key Features

- **Customer Portal** - Browse products, add to cart, checkout with delivery details
- **Admin Dashboard** - Manage products, process orders, view reports
- **SMS Notifications** - Automated order status updates via SMS
- **Customer Accounts** - Save addresses, view order history, manage wishlist
- **Product Variants** - Support for product variations (size, color, etc.)
- **Bulk Pricing** - Volume discounts for wholesale customers

### Technology Stack

| Layer | Technology |
|-------|------------|
| Frontend | React 18, Vite, Tailwind CSS, React Router v6 |
| Backend | Node.js 18+, Express.js, Prisma ORM |
| Database | SQLite (dev), PostgreSQL (production) |
| Authentication | JWT (JSON Web Tokens) |
| SMS | Semaphore, Movider, Vonage |

## Architecture Overview

```
┌─────────────────────────────────────────────────────────────┐
│                        Frontend                              │
│              React + Vite + Tailwind CSS                     │
│                    (Port 5173)                               │
└─────────────────────────┬───────────────────────────────────┘
                          │ HTTP/REST
                          ▼
┌─────────────────────────────────────────────────────────────┐
│                        Backend                               │
│              Express.js + Prisma ORM                         │
│                    (Port 3001)                               │
├─────────────────────────┬───────────────────────────────────┤
│         Database        │         SMS Service               │
│    SQLite/PostgreSQL    │    Semaphore/Movider/Vonage       │
└─────────────────────────┴───────────────────────────────────┘
```

## Directory Structure

```
hardware-store/
├── frontend/               # React application
│   ├── src/
│   │   ├── components/    # Reusable UI components
│   │   ├── pages/         # Page components (customer & admin)
│   │   ├── context/       # React Context providers
│   │   ├── hooks/         # Custom React hooks
│   │   ├── services/      # API service functions
│   │   └── styles/        # Global styles
│   └── public/            # Static assets
│
├── backend/               # Express.js API
│   ├── src/
│   │   ├── config/        # Configuration
│   │   ├── controllers/   # Route handlers
│   │   ├── middleware/    # Express middleware
│   │   ├── routes/        # API routes
│   │   ├── services/      # Business logic (SMS, etc.)
│   │   └── utils/         # Helper utilities
│   ├── prisma/            # Database schema & migrations
│   └── tests/             # API tests
│
└── docs/                  # Documentation (you are here)
```

## Getting Help

- **Setup issues?** Check [Getting Started](./getting-started.md)
- **API questions?** See [API Reference](./api/README.md)
- **Deployment?** Read [Deployment Guide](./deployment.md)
- **Testing?** Refer to [Testing Guide](./testing/README.md)
