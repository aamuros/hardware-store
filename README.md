# Hardware Store Web Application

A full-stack web ordering system for local hardware stores in the Philippines, featuring a customer storefront, admin dashboard, and SMS notifications.

![Node.js](https://img.shields.io/badge/Node.js-18%2B-339933?logo=node.js)
![React](https://img.shields.io/badge/React-18-61DAFB?logo=react)
![Prisma](https://img.shields.io/badge/Prisma-ORM-2D3748?logo=prisma)
![License](https://img.shields.io/badge/License-Proprietary-red)

## Features

### Customer Portal
- 🛒 Browse products by category
- 🔍 Search and filter products
- 🛍️ Shopping cart with variant support
- 📦 Order tracking by order number
- 👤 Customer accounts with saved addresses
- ❤️ Wishlist functionality

### Admin Dashboard
- 📊 Sales dashboard with analytics
- 📋 Order management with status workflow
- 📦 Product management with variants & bulk pricing
- 📁 Category management
- 👥 Staff user management
- 📈 Reports and insights

### SMS Notifications
- 📱 Order confirmation
- ✅ Order accepted/rejected
- 🚚 Out for delivery alerts
- ✔️ Delivery confirmation
- 🔔 Admin notifications for new orders

## Tech Stack

| Layer | Technology |
|-------|------------|
| **Frontend** | React 18, Vite, Tailwind CSS, React Router v6 |
| **Backend** | Node.js 18+, Express.js, Prisma ORM |
| **Database** | SQLite (development), PostgreSQL (production) |
| **Auth** | JWT (JSON Web Tokens) |
| **SMS** | Semaphore, Movider, Vonage |

## Quick Start

### Prerequisites

- Node.js 18+
- npm 9+

### Installation

```bash
# Clone the repository
git clone <repository-url>
cd hardware-store

# Backend setup
cd backend
npm install
cp .env.example .env
npx prisma migrate dev
npx prisma db seed

# Frontend setup
cd ../frontend
npm install
cp .env.example .env
```

### Running Locally

**Terminal 1 - Backend:**
```bash
cd backend
npm run dev
# Server runs at http://localhost:3001
```

**Terminal 2 - Frontend:**
```bash
cd frontend
npm run dev
# App runs at http://localhost:5173
```

### Default Credentials

- **Admin:** username `admin` / password `admin123`

## Project Structure

```
hardware-store/
├── backend/               # Express.js API
│   ├── src/
│   │   ├── controllers/  # Route handlers
│   │   ├── middleware/   # Express middleware
│   │   ├── routes/       # API routes
│   │   ├── services/     # Business logic
│   │   └── utils/        # Helpers
│   ├── prisma/           # Database schema
│   └── tests/            # API tests
│
├── frontend/             # React application
│   └── src/
│       ├── components/   # UI components
│       ├── pages/        # Page components
│       ├── context/      # React Context
│       ├── hooks/        # Custom hooks
│       └── services/     # API services
│
└── docs/                 # Documentation
```

## Documentation

| Document | Description |
|----------|-------------|
| [Getting Started](./docs/getting-started.md) | Local development setup |
| [API Reference](./docs/api/README.md) | Complete API documentation |
| [Database Schema](./docs/database/schema.md) | Database models |
| [Deployment](./docs/deployment.md) | Production deployment guide |
| [Testing](./docs/testing/README.md) | Testing guide |
| [SMS Integration](./docs/features/sms-integration.md) | SMS configuration |

## Scripts

### Backend

| Command | Description |
|---------|-------------|
| `npm run dev` | Start development server |
| `npm start` | Start production server |
| `npm test` | Run tests |
| `npm run db:migrate` | Run database migrations |
| `npm run db:seed` | Seed database |
| `npm run db:studio` | Open Prisma Studio |

### Frontend

| Command | Description |
|---------|-------------|
| `npm run dev` | Start development server |
| `npm run build` | Build for production |
| `npm run preview` | Preview production build |

## API Overview

| Endpoint | Description |
|----------|-------------|
| `GET /api/products` | List products |
| `GET /api/categories` | List categories |
| `POST /api/orders` | Create order |
| `GET /api/orders/:orderNumber` | Track order |
| `POST /api/admin/login` | Admin login |
| `GET /api/admin/orders` | Admin: list orders |
| `PATCH /api/admin/orders/:id/status` | Admin: update status |

See [API Reference](./docs/api/README.md) for complete documentation.

## Environment Variables

### Backend

```env
DATABASE_URL="file:./dev.db"
JWT_SECRET=your-secret-key
SMS_ENABLED=false
FRONTEND_URL=http://localhost:5173
```

### Frontend

```env
VITE_API_URL=http://localhost:3001/api
VITE_STORE_NAME=Hardware Store
```

See `.env.example` files for all options.

## Deployment

Recommended hosting:

- **Backend:** [Railway](https://railway.app)
- **Frontend:** [Vercel](https://vercel.com)
- **Database:** Railway PostgreSQL or [Supabase](https://supabase.com)

See [Deployment Guide](./docs/deployment.md) for detailed instructions.

## Testing

```bash
# Run all tests
cd backend && npm test

# Run with coverage
npm test -- --coverage

# Run specific test
npm test -- --testPathPattern=orders.test.js
```

## Contributing

1. Create a feature branch
2. Make your changes
3. Run tests: `npm test`
4. Run linting: `npm run lint`
5. Submit a pull request

## License

This project is proprietary and confidential.

## Support

For technical support, please contact the development team.
