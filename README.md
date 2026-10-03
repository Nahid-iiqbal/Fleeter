# 🚛 Fleeter — Fleet Management System

A full-stack fleet management platform for vehicle owners, managers, and drivers. Track vehicles in real-time, manage trips, monitor fuel consumption, handle maintenance records, and coordinate your entire fleet from a single dashboard.

> Built with **React 19**, **Material UI 9**, **Node.js / Express 5**, and **PostgreSQL 18**.

---

## 📋 Table of Contents

- [Features](#-features)
- [Tech Stack](#-tech-stack)
- [Project Structure](#-project-structure)
- [Database Schema](#-database-schema)
- [Getting Started](#-getting-started)
  - [Prerequisites](#prerequisites)
  - [Installation](#installation)
  - [Environment Variables](#environment-variables)
  - [Database Setup](#database-setup)
  - [Running the App](#running-the-app)
- [Deployment](#-deployment)
- [API Endpoints](#-api-endpoints)
- [User Roles](#-user-roles)

---

## ✨ Features

### 🔐 Authentication & Authorization
- JWT-based authentication with token blacklisting (server-side logout)
- Role-based access control (Admin, Owner, Manager, Driver)
- Rate-limited login/register endpoints
- Secure password hashing with bcrypt

### 🏢 Owner / Manager Dashboard
- **Overview** — Metric cards for total vehicles, active drivers, system alerts
- **Fleet Analytics** — Utilization gauge, driver efficiency rankings, fuel consumption rankings, maintenance cost breakdowns
- **Vehicle Management** — Add/edit vehicles, upload documents & images, view expense ledgers
- **Driver Management** — View driver profiles, assign trips, filter by status
- **Trip Management** — Create trips, assign drivers/vehicles/routes, view route maps on Leaflet
- **Alerts System** — Expiring documents, maintenance due dates, system warnings
- **Company Recruitment** — Send/receive join requests for drivers and managers
- **Messaging** — In-app messaging between users with read receipts

### 🚗 Driver Portal
- View assigned trips and trip history
- Log fuel consumption records
- Report incidents
- Request vehicle maintenance
- Upload personal documents (license, certifications)

### 🛡️ Admin Panel
- Platform-wide user roster management
- Role modification and user deletion
- System analytics and platform health monitoring

### 📱 Responsive Design
- Collapsible sidebar with hamburger menu on mobile devices
- Fully responsive tables and forms
- Dark theme by default with light mode toggle

### 🗺️ Live Mapping
- Real-time vehicle tracking with Leaflet + OpenStreetMap
- Trip route visualization on interactive maps
- GPS telemetry data storage with time-series partitioning

---

## 🛠 Tech Stack

| Layer | Technology |
|-------|-----------|
| **Frontend** | React 19, Material UI 9, React Router 7, React-Leaflet 5 |
| **Backend** | Node.js, Express 5, JWT, Multer, Helmet, CORS |
| **Database** | PostgreSQL 18 (views, triggers, stored procedures, table partitioning) |
| **Maps** | Leaflet + OpenStreetMap (no API key required) |
| **Deployment** | Render (or any Node.js + PostgreSQL host) |

---

## 📁 Project Structure

```
Fleeter/
├── fleeter-backend/
│   ├── config/
│   │   ├── db.js                # PostgreSQL connection pool
│   │   ├── schema.sql           # Full database schema
│   │   ├── initDb.js            # Schema initialization script
│   │   ├── seedDb.js            # Seed data script
│   │   ├── seed_data.sql        # Exported seed data (SQL)
│   │   └── fleeter_full_dump.sql # Complete DB dump (schema + data)
│   ├── middleware/
│   │   ├── authMiddleware.js    # JWT verification & role authorization
│   │   └── upload.js            # Multer file upload configuration
│   ├── routes/
│   │   ├── auth.js              # Login, register, account settings
│   │   ├── dashboard.js         # Dashboard stats & fleet analytics
│   │   ├── tracking.js          # Vehicle telemetry & trip routes
│   │   └── vehicles.js          # Vehicle CRUD, documents, images
│   ├── server.js                # Express app entry point
│   └── .env                     # Environment variables
│
├── fleeter-frontend/
│   ├── src/
│   │   ├── components/          # Reusable UI widgets, tables, and maps
│   │   ├── pages/               # Main route views mapped to user roles
│   │   ├── utils/
│   │   │   └── api.js           # API client with base URL & auth headers
│   │   └── App.js               # Root component with routing
│   └── package.json
└── README.md
```

---

## 🗄 Database Schema

The database consists of **22 tables** utilizing advanced PostgreSQL features:

- **Views:** `v_vehicle_expense_ledger`, `v_vehicle_cost_summary`
- **Triggers:** `trg_log_vehicle_status` — Automatically logs vehicle status changes
- **Functions:** `calculate_fleet_utilization(owner_id)` — Calculates percentage of dispatched vehicles
- **Stored Procedures:** `assign_trip_workflow(...)` — Multi-table transaction for trip assignment
- **Table Partitioning:** `Vehicle_Telemetry` is range-partitioned by timestamp
- **Window Functions:** Used in analytics for fuel consumption ranking

---

## 🚀 Getting Started

### Prerequisites
- **Node.js** v18+ and npm
- **PostgreSQL** v15+

### Installation

```bash
# Clone the repository
git clone https://github.com/your-username/fleeter.git
cd fleeter

# Install backend dependencies
cd fleeter-backend
npm install

# Install frontend dependencies
cd ../fleeter-frontend
npm install
```

### Environment Variables

Create a `.env` file inside `fleeter-backend/`:

```env
PORT=5000
DB_USER=postgres
DB_PASSWORD=your_password
DB_HOST=localhost
DB_PORT=5432
DB_NAME=fleeter_db
JWT_SECRET=your_super_secret_jwt_key
FRONTEND_URL=http://localhost:3000
```

For the frontend, create a `.env` file inside `fleeter-frontend/` (only needed for production):

```env
REACT_APP_API_URL=https://your-backend-url.onrender.com
```

### Database Setup

Initialize the database schema and seed it with demo data:

```bash
cd fleeter-backend
node config/initDb.js
node config/seedDb.js
```

### Running the App

```bash
# Terminal 1 — Start the backend
cd fleeter-backend
npm run dev

# Terminal 2 — Start the frontend
cd fleeter-frontend
npm start
```

---

## ☁️ Deployment

### Deploying to Render

1. **Database:** Create a PostgreSQL instance on Render. Copy the `External Database URL`. Import your schema using `psql <DATABASE_URL> -f config/fleeter_full_dump.sql`.
2. **Backend:** Create a Web Service. Root dir: `fleeter-backend`. Build cmd: `npm install`. Start cmd: `npm start`. Add env vars: `DATABASE_URL`, `JWT_SECRET`, `FRONTEND_URL`, `NODE_ENV=production`.
3. **Frontend:** Create a Static Site. Root dir: `fleeter-frontend`. Build cmd: `npm install && npm run build`. Publish dir: `build`. Add env var: `REACT_APP_API_URL`.

---

## 📡 API Endpoints

- **Auth:** `POST /api/auth/login`, `POST /api/auth/register`, `PUT /api/auth/account`
- **Dashboard:** `GET /api/dashboard/stats`, `GET /api/dashboard/analytics`
- **Company:** `GET /api/company/managers`, `GET /api/company/trips`, `GET /api/company/alerts`
- **Vehicles:** `GET /api/vehicles`, `POST /api/vehicles`, `GET /api/vehicles/:id`
- **Drivers:** `POST /api/driver/log-fuel`, `POST /api/driver/log-incident`
- **Messages:** `GET /api/messages`, `POST /api/messages`
- **Admin:** `GET /api/admin/users`, `PUT /api/admin/users/:id/role`

---

## 👥 User Roles

| Role | Access |
|------|--------|
| **Admin** | Full platform access. Manage all users, view system analytics. |
| **Owner** | Company dashboard. Manage vehicles, drivers, managers, trips, alerts. View fleet analytics. |
| **Manager** | Same as owner but cannot manage other managers. Must be invited by an owner. |
| **Driver** | Driver portal only. View assigned trips, log fuel/incidents, upload documents. |
