# Hardware Store Web-Based Ordering System

A comprehensive web application for a local hardware store to accept and manage customer orders online with SMS notifications.

## 🎯 Project Overview

This system allows customers to browse products, place orders for delivery, and receive SMS updates on their order status. Store administrators can manage products, process orders, and track all activities through a dedicated dashboard.

## 🏗️ Project Structure

```
hardware-website/
├── frontend/              # React + Vite application
│   ├── src/
│   │   ├── components/    # Reusable UI components
│   │   ├── pages/         # Page components
│   │   │   ├── customer/  # Customer-facing pages
│   │   │   └── admin/     # Admin dashboard pages
│   │   ├── context/       # React Context providers
│   │   ├── hooks/         # Custom React hooks
│   │   ├── services/      # API service functions
│   │   ├── utils/         # Helper utilities
│   │   └── styles/        # Global styles and themes
│   └── public/            # Static assets
│
├── backend/               # Node.js + Express API
│   ├── src/
│   │   ├── config/        # Configuration files
│   │   ├── controllers/   # Route controllers
│   │   ├── middleware/    # Express middleware
│   │   ├── models/        # Database models
│   │   ├── routes/        # API routes
│   │   ├── services/      # Business logic services
│   │   └── utils/         # Helper utilities
│   └── tests/             # API tests
│
├── database/              # Database files
│   ├── migrations/        # Schema migrations
│   ├── seeds/             # Seed data
│   └── diagrams/          # ERD and documentation
│
└── docs/                  # Project documentation
    ├── api/               # API documentation
    ├── user-guides/       # End-user documentation
    └── technical/         # Technical documentation
```

## 🛠️ Tech Stack

### Frontend
- **React 18** - UI library
- **Vite** - Build tool (faster than CRA)
- **React Router v6** - Navigation
- **Axios** - HTTP client
- **Tailwind CSS** - Styling
- **React Query** - Server state management

### Backend
- **Node.js 18+** - Runtime
- **Express.js** - Web framework
- **PostgreSQL** - Database
- **Prisma** - ORM
- **JWT** - Authentication
- **Semaphore/Vonage** - SMS provider

### Deployment
- **Frontend**: Vercel / Netlify
- **Backend**: Railway / Render
- **Database**: Supabase / Railway PostgreSQL

## 🚀 Getting Started

### Prerequisites
- Node.js 18 or higher
- PostgreSQL 14 or higher
- npm or yarn

### Installation

1. **Clone the repository**
   ```bash
   git clone <repository-url>
   cd hardware-website
   ```

2. **Set up the backend**
   ```bash
   cd backend
   npm install
   cp .env.example .env
   # Edit .env with your database credentials and API keys
   ```

3. **Set up the frontend**
   ```bash
   cd frontend
   npm install
   cp .env.example .env
   # Edit .env with your API URL
   ```

4. **Set up the database**
   ```bash
   cd backend
   npx prisma migrate dev
   npx prisma db seed
   ```

5. **Start development servers**
   ```bash
   # Terminal 1 - Backend
   cd backend
   npm run dev

   # Terminal 2 - Frontend
   cd frontend
   npm run dev
   ```

## 📱 Features

### Customer Portal
- ✅ Browse products by category
- ✅ Search products
- ✅ Add items to cart
- ✅ Checkout with delivery details
- ✅ Receive SMS order updates
- ✅ Track order status

### Admin Dashboard
- ✅ Secure authentication
- ✅ View and manage orders
- ✅ Update order status
- ✅ Manage products and categories
- ✅ Mark items as available/unavailable
- ✅ View basic reports

### SMS Notifications
- 📱 Order confirmation
- 📱 Order accepted/rejected
- 📱 Order being prepared
- 📱 Out for delivery
- 📱 Order completed

## 🔐 Environment Variables

### Backend (.env)
```env
DATABASE_URL=postgresql://user:password@localhost:5432/hardware_store
JWT_SECRET=your-secret-key
SMS_API_KEY=your-sms-api-key
SMS_SENDER_NAME=HardwareStore
PORT=3001
NODE_ENV=development
```

### Frontend (.env)
```env
VITE_API_URL=http://localhost:3001/api
```

## 📋 API Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | /api/products | Get all products |
| GET | /api/products/:id | Get product by ID |
| GET | /api/categories | Get all categories |
| POST | /api/orders | Create new order |
| GET | /api/orders/:id | Get order status |
| POST | /api/admin/login | Admin login |
| GET | /api/admin/orders | Get all orders (admin) |
| PATCH | /api/admin/orders/:id | Update order status |
| POST | /api/admin/products | Create product |
| PATCH | /api/admin/products/:id | Update product |
| DELETE | /api/admin/products/:id | Delete product |

## 🧪 Testing

```bash
# Run backend tests
cd backend
npm test

# Run frontend tests
cd frontend
npm test
```

## 📦 Deployment

See [docs/technical/deployment.md](docs/technical/deployment.md) for detailed deployment instructions.

## 👥 Contributing

1. Create a feature branch
2. Make your changes
3. Submit a pull request

## 📄 License

This project is proprietary and confidential.

## 📞 Support

For technical support, contact the development team.
