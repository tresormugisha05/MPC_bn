# MPC Backend API

A production-ready Node.js/Express backend API with TypeScript, Prisma ORM, and PostgreSQL. This is the backend service for the MPC (Medical Product Center) e-commerce platform.

## 📋 Table of Contents

- [Project Overview](#project-overview)
- [Tech Stack](#tech-stack)
- [Project Structure](#project-structure)
- [Getting Started](#getting-started)
- [Environment Variables](#environment-variables)
- [Available Scripts](#available-scripts)
- [API Endpoints](#api-endpoints)
- [Features](#features)
- [Database Schema](#database-schema)
- [Utilities](#utilities)
- [Contributing](#contributing)

---

## 🏗️ Project Overview

This is a RESTful API backend for an e-commerce platform with:
- **User Authentication** - JWT-based auth with role management (admin/customer)
- **Product Management** - CRUD operations for products
- **Reservation System** - 5-minute reservation with auto-expiry using cron jobs
- **Order/Checkout** - Complete checkout flow with inventory management
- **Inventory Logging** - Full audit trail for stock changes

---

## 💻 Tech Stack

| Technology | Purpose |
|------------|---------|
| Node.js | Runtime environment |
| Express.js | Web framework |
| TypeScript | Type safety ORM |
| Prisma | Database ORM |
| PostgreSQL | Database |
| JWT | Authentication |
| Swagger/OpenAPI | API Documentation |
| Zod | Input validation |
| Helmet | Security headers |
| CORS | Cross-origin resource sharing |

---

## 📂 Project Structure

```
MPC_bn/
├── prisma/
│   ├── schema.prisma    # Database schema
│   └── seed.ts          # Database seeding script
├── scripts/
│   └── update-admin.ts  # Utility to promote user to admin
├── src/
│   ├── config/
│   │   ├── index.ts     # App configuration
│   │   └── swagger.ts   # Swagger setup
│   ├── controller/
│   │   ├── Order.controller.ts
│   │   ├── Product.controller.ts
│   │   ├── Reservation.controller.ts
│   │   └── User.controller.ts
│   ├── jobs/
│   │   └── reservationExpiry.ts  # Cron job for auto-expiry
│   ├── lib/
│   │   └── prisma.ts   # Prisma client instance
│   ├── middleware/
│   │   ├── auth.ts     # JWT authentication
│   │   ├── errorHandler.ts
│   │   └── logger.ts   # Request logging
│   ├── Routes/
│   │   ├── auth.routes.ts       # /auth (register/login)
│   │   ├── users.routes.ts      # /users (profile)
│   │   ├── product.routes.ts    # /products
│   │   ├── reservation.routes.ts # /reservations
│   │   ├── order.routes.ts     # /orders
│   │   └── index.ts            # Route exports
│   ├── types/
│   │   ├── express.d.ts  # Express type extensions
│   │   └── product.ts     # Product type definitions
│   └── server.ts          # Application entry point
├── .gitignore
├── package.json
├── tsconfig.json
└── README.md
```

---

## 🚀 Getting Started

### Prerequisites

- Node.js 18+
- PostgreSQL database
- npm or yarn

### Installation

1. **Clone the repository**
   
```
bash
   cd MPC_bn
   
```

2. **Install dependencies**
   
```
bash
   npm install
   
```

3. **Set up environment variables**
   
   Create a `.env` file in the root directory:
   
```
env
   DATABASE_URL="postgresql://user:password@localhost:5432/mpc_db"
   JWT_SECRET="your-secret-key-change-in-production"
   PORT=5000
   
```

4. **Generate Prisma Client**
   
```
bash
   npm run db:generate
   
```

5. **Push schema to database**
   
```
bash
   npm run db:push
   
```

6. **Seed the database (optional)**
   
```
bash
   npm run db:seed
   
```

7. **Start development server**
   
```
bash
   npm run dev
   
```

---

## ⚙️ Environment Variables

| Variable | Description | Default |
|----------|-------------|---------|
| `DATABASE_URL` | PostgreSQL connection string | Required |
| `JWT_SECRET` | Secret key for JWT tokens | `your-secret-key-change-in-production` |
| `PORT` | Server port | `5000` |

---

## 📜 Available Scripts

| Script | Description |
|--------|-------------|
| `npm run dev` | Start development server with hot reload |
| `npm run build` | Compile TypeScript to JavaScript |
| `npm run start` | Start production server |
| `npm run db:generate` | Generate Prisma Client |
| `npm run db:push` | Push schema changes to database |
| `npm run db:migrate` | Run database migrations |
| `npm run db:seed` | Seed database with sample data |
| `npm run db:studio` | Open Prisma Studio |

---

## 🔌 API Endpoints

### Base URL
```
http://localhost:5000
```

### Authentication
| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/auth/register` | Register new user |
| POST | `/auth/login` | Login user |

### Users
| Method | Endpoint | Description | Auth |
|--------|----------|-------------|------|
| GET | `/users/me` | Get current user profile | ✅ |
| GET | `/users/:id` | Get user by ID | ❌ |

### Products
| Method | Endpoint | Description | Auth |
|--------|----------|-------------|------|
| GET | `/products` | List all active products | ❌ |
| GET | `/products/:id` | Get product by ID | ❌ |
| POST | `/products` | Create new product | ✅ |
| PUT | `/products/:id` | Update product | ✅ |
| DELETE | `/products/:id` | Soft delete product | ✅ |

### Reservations
| Method | Endpoint | Description | Auth |
|--------|----------|-------------|------|
| GET | `/reservations` | List user reservations | ✅ |
| POST | `/reservations` | Create reservation | ✅ |
| GET | `/reservations/:id` | Get reservation | ✅ |

### Orders
| Method | Endpoint | Description | Auth |
|--------|----------|-------------|------|
| GET | `/orders` | List user orders | ✅ |
| POST | `/orders` | Create order (checkout) | ✅ |
| GET | `/orders/:id` | Get order by ID | ✅ |

### Health & Monitoring
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/health` | Health check |
| GET | `/metrics` | API metrics |
| GET | `/api-docs` | Swagger UI |
| GET | `/api-docs.json` | OpenAPI JSON |

---

## ✨ Features

### 1. User Authentication
- JWT-based authentication
- Role-based access control (admin/customer)
- Secure password hashing with bcrypt

### 2. Product Management
- CRUD operations for products
- Soft delete (is_active flag)
- Owner tracking

### 3. Reservation System
- 5-minute reservation window
- Automatic stock deduction
- Cron job auto-expiry
- Stock restoration on expiry

### 4. Order System
- Checkout from valid reservations
- Atomic transactions
- Order history

### 5. Inventory Management
- Full audit trail
- Stock change tracking
- Immutable logs

### 6. API Documentation
- Interactive Swagger UI
- OpenAPI 3.0 specification
- Request/response schemas

---

## 🗃️ Database Schema

### Models

```
User
├── id (UUID)
├── email (unique)
├── password (hashed)
├── name
├── role (admin/customer)
├── created_at
└── relations: reservations, orders, products

Product
├── id (UUID)
├── name
├── description
├── price
├── stock
├── image_url
├── is_active
├── owner_id (FK to User)
├── created_at
└── relations: reservations, orders, inventory_logs

Reservation
├── id (UUID)
├── user_id (FK)
├── product_id (FK)
├── quantity
├── status (pending/completed/expired/cancelled)
├── expires_at
├── created_at
└── relations: user, product, order, inventory_logs

Order
├── id (UUID)
├── user_id (FK)
├── reservation_id (FK, unique)
├── product_id (FK)
├── quantity
├── total_price
├── created_at
└── relations: user, reservation, product

InventoryLog
├── id (UUID)
├── product_id (FK)
├── change (positive/negative)
├── reason (reserved/expired/checkout/cancelled)
├── reservation_id (optional FK)
├── stock_before
├── stock_after
├── created_at
└── relation: product, reservation
```

---

## 🔧 Utilities

### Update User to Admin
```
bash
# Update specific user to admin role
npx ts-node scripts/update-admin.ts user@example.com

# Default: updates testadmin@example.com
npx ts-node scripts/update-admin.ts
```

---

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Submit a pull request

---

## 📄 License

ISC License

---

## 🔗 Related Projects

- [MPC_fn](https://github.com/tresormugisha/MPC_fn) - Frontend application
