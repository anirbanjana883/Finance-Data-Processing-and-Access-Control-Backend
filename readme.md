# 🏦 Enterprise SaaS Finance Dashboard API

A highly secure, multi-tenant B2B financial backend designed to handle organizational cash flow, granular Role-Based Access Control (RBAC), and complex data aggregations. Built with Node.js, Express, and Prisma ORM.

---

## 🏛️ System Architecture

The platform follows a classic N-Tier Architecture with a strict "Fat Service, Skinny Controller" design pattern. Every request passes through a gauntlet of security middlewares before business logic is executed.

### Architecture Diagram

```text
       [ Client (React / Postman) ]
                  │
                  ▼  JSON / REST (HTTP)
┌──────────────────────────────────────────────────┐
│              EXPRESS.JS API SERVER               │
│                                                  │
│  1. Routes (/api/transactions, /api/users, etc)  │
│                  │                               │
│  2. Middlewares  ▼                               │
│     ├─ Rate Limiter (Brute-force protection)     │
│     ├─ Auth Middleware (JWT -> req.user)         │
│     ├─ RBAC Middleware (Role validation)         │
│     └─ Validation (Zod safeParse payload checks) │
│                  │                               │
│  3. Controllers  ▼                               │
│     └─ Handles HTTP Req/Res & ApiResponse wrapper│
│                  │                               │
│  4. Services     ▼                               │
│     ├─ Core Business Logic                       │
│     ├─ Enforces `orgId` Tenant Isolation         │
│     └─ Executes Parallel Analytics Computations  │
└──────────────────┬───────────────────────────────┘
                   │
                   ▼  Prisma Client
┌──────────────────────────────────────────────────┐
│                   PRISMA ORM                     │
│  (Manages Interactive Transactions & Connection) │
└──────────────────┬───────────────────────────────┘
                   │
                   ▼  TCP / Port 5432
┌──────────────────────────────────────────────────┐
│              POSTGRESQL DATABASE                 │
│                                                  │
│  [ Tables ]                                      │
│   ├─ Organizations (The Multi-Tenant Root)       │
│   ├─ Users (email, password, role, orgId)        │
│   ├─ Transactions (amount, type, orgId)          │
│   └─ Audit_Logs (Polymorphic tracking, orgId)    │
└──────────────────────────────────────────────────┘
```

---

## 🔐 Core Security & Engineering Features

This API was engineered to meet Enterprise standards, focusing heavily on data isolation, traceability, and fault tolerance.

### 1. Multi-Tenant Data Isolation (The Tenant Shield)

The database utilizes a strict multi-tenant architecture. Every user, transaction, and audit log is permanently bound to an `orgId`. The service layer intercepts all database queries and injects an `orgId` lock, making cross-tenant data leaks mathematically impossible.

### 2. Polymorphic Audit Logging (ACID Compliant)

Every data mutation (create, update, delete) across the platform is wrapped in a Prisma Interactive Transaction (`prisma.$transaction`). This ensures that the core action and its corresponding `AuditLog` entry are committed to the database simultaneously. The `targetId` is polymorphic, allowing the system to track mutations on both Users and Transactions seamlessly.

### 3. Strict Role-Based Access Control (RBAC)

The system enforces the Principle of Least Privilege using a hierarchical matrix:

| Role | Description |
|------|-------------|
| **MASTER_ADMIN** | God-mode account. Can only provision new Organizations. Cannot access organizational financial data. |
| **ADMIN** (CEO) | Full read/write access to their Organization. Can invite/modify team members. |
| **ANALYST** (Accountant) | Can view transactions and analytics. Blocked from creating, editing, or deleting financial records. |
| **VIEWER** (CFO/Executive) | Can view the high-level analytics dashboard. Blocked from viewing raw transaction PII. |

### 4. Defensive Engineering

- **Soft Deletion:** Records are never destroyed. The `deletedAt` timestamp ensures historical data remains intact for compliance audits while being hidden from standard queries.
- **Self-Modification Locks:** Admins cannot demote their own roles or deactivate their own accounts.
- **Bulletproof Validation:** Custom Zod middleware bypasses Node.js try/catch traps using `safeParse()`, guaranteeing the server never crashes on malformed JSON.

---

## 🛠️ Setup & Installation

**1. Clone the repository and install dependencies:**

```bash
npm install
```

**2. Configure Environment Variables (`.env`):**

```env
PORT=5000
DATABASE_URL="postgresql://username:password@localhost:5432/finance_db"
JWT_SECRET="your_super_secret_key"
JWT_EXPIRES_IN="1d"
TEST_USER_EMAIL="tony@stark.com" # Used for seeding
```

**3. Sync Database Schema:**

```bash
npx prisma db push
```

**4. Seed the Database** *(Optional — 5,000 record load test)*:

```bash
npm run seed
```

**5. Start the Server:**

```bash
npm run dev
```

---

## 📡 Detailed API Documentation

**Base URL:** `http://localhost:5000/api`

**Response Wrapper:** All successful responses follow a standardized format:

```json
{
  "success": true,
  "statusCode": 200,
  "message": "Human readable message",
  "data": { ... }
}
```

---

## 1️⃣ Authentication & Provisioning (`/api/auth`)

### 📌 Bootstrap System Admin

Creates the foundational "God Mode" account.

- **Endpoint:** `POST /auth/bootstrap`
- **Auth Required:** Public *(Locks permanently after first successful execution)*

**Request Body** (`application/json`):

| Field | Type | Required |
|-------|------|----------|
| `name` | string | ✅ |
| `email` | string | ✅ |
| `password` | string | ✅ |

**Success Response** `201 Created`: Returns the Master Admin user object and a JWT.

**Error Responses:**
- `403 Forbidden` — "System is already bootstrapped."
- `400 Bad Request` — Validation failure.

---

### 📌 Setup New Organization (Tenant)

Provisions a new company and its initial CEO/Admin.

- **Endpoint:** `POST /auth/organization`
- **Auth Required:** Bearer Token
- **Role Required:** `MASTER_ADMIN`

**Request Body** (`application/json`):

| Field | Type | Required |
|-------|------|----------|
| `orgName` | string | ✅ |
| `adminUser` | object `{ "name": "...", "email": "...", "password": "..." }` | ✅ |

**Success Response** `201 Created`: Returns the new Organization and Admin details.

---

### 📌 Tenant Login

- **Endpoint:** `POST /auth/login`
- **Auth Required:** Public *(Protected by `loginLimiter` to prevent brute force)*

**Request Body** (`application/json`):

| Field | Type | Required | Notes |
|-------|------|----------|-------|
| `email` | string | ✅ | |
| `password` | string | ✅ | |
| `orgId` | string | ✅ | Crucial for multi-tenant routing |

**Success Response** `200 OK`: Returns User profile and `accessToken`.

**Error Responses:**
- `401 Unauthorized` — "Invalid credentials"
- `403 Forbidden` — "Account is deactivated."
- `429 Too Many Requests` — Triggered after 5 failed attempts.

---

### 📌 Get Current Profile

- **Endpoint:** `GET /auth/me`
- **Auth Required:** Bearer Token

**Success Response** `200 OK`: Returns the currently authenticated user's profile based on the JWT payload.

---

## 2️⃣ User & Team Management (`/api/users`)

> All routes in this block require **Bearer Token** and the **`ADMIN`** role.

### 📌 Invite Employee

- **Endpoint:** `POST /users`

**Request Body** (`application/json`):

| Field | Type | Required |
|-------|------|----------|
| `name` | string | ✅ |
| `email` | string | ✅ |
| `password` | string | ✅ |
| `role` | enum: `ADMIN`, `ANALYST`, `VIEWER` | ✅ |

**Success Response** `201 Created`: Returns the created user object (excluding password).

**Error Responses:**
- `409 Conflict` — "Email already exists in this organization."

---

### 📌 Get All Users (Directory)

- **Endpoint:** `GET /users`

**Query Parameters:**

| Parameter | Type | Default | Notes |
|-----------|------|---------|-------|
| `page` | number | `1` | |
| `limit` | number | `10` | |
| `search` | string | — | Fuzzy searches name and email |
| `status` | enum: `ACTIVE`, `INACTIVE` | — | Optional |
| `role` | enum | — | Optional |

**Success Response** `200 OK`: Returns an array of users inside `data`, and pagination details inside `meta` (`totalRecords`, `currentPage`, `totalPages`).

---

### 📌 Change Employee Role

- **Endpoint:** `PATCH /users/:id/role`
- **Request Params:** `id` (UUID of the target user)

**Request Body** (`application/json`):

| Field | Type | Required |
|-------|------|----------|
| `role` | enum: `ADMIN`, `ANALYST`, `VIEWER` | ✅ |

**Success Response** `200 OK`: Returns updated user object.

**Error Responses:**
- `403 Forbidden` — "You cannot demote your own account."

---

### 📌 Change Employee Status (Deactivate)

- **Endpoint:** `PATCH /users/:id/status`
- **Request Params:** `id` (UUID of the target user)

**Request Body** (`application/json`):

| Field | Type | Required |
|-------|------|----------|
| `status` | enum: `ACTIVE`, `INACTIVE` | ✅ |

**Success Response** `200 OK`: Returns updated user object.

**Error Responses:**
- `403 Forbidden` — "You cannot deactivate your own account."

---

## 3️⃣ Transaction Engine (`/api/transactions`)

### 📌 Fetch Transactions (Ledger)

- **Endpoint:** `GET /transactions`
- **Auth Required:** Bearer Token
- **Role Required:** `ADMIN`, `ANALYST` *(Viewers are blocked at the middleware level)*

**Query Parameters:**

| Parameter | Type | Default | Notes |
|-----------|------|---------|-------|
| `page` | number | `1` | |
| `limit` | number | `10` | |
| `type` | enum: `INCOME`, `EXPENSE` | — | Optional |
| `category` | string | — | Optional |
| `startDate` | ISO Date string | — | Optional |
| `endDate` | ISO Date string | — | Optional |
| `search` | string | — | Fuzzy searches category and notes |
| `sortBy` | string | `date` | |
| `order` | enum: `asc`, `desc` | `desc` | |

**Success Response** `200 OK`: Array of transactions scoped to the user's `orgId`.

---

### 📌 Create Transaction

- **Endpoint:** `POST /transactions`
- **Auth Required:** Bearer Token
- **Role Required:** `ADMIN`

**Request Body** (`application/json`):

| Field | Type | Required | Notes |
|-------|------|----------|-------|
| `amount` | number (strictly positive) | ✅ | |
| `type` | enum: `INCOME`, `EXPENSE` | ✅ | |
| `category` | string | ✅ | Backend automatically normalizes to lowercase |
| `date` | ISO Date string | — | Optional, defaults to now |
| `notes` | string | — | Optional |

**Success Response** `201 Created`: Returns inserted transaction. Triggers Audit Log.

---

### 📌 Update Transaction

- **Endpoint:** `PATCH /transactions/:id`
- **Auth Required:** Bearer Token
- **Role Required:** `ADMIN`

**Request Body** (`application/json`): Accepts partial updates of `amount`, `type`, `category`, `date`, or `notes`.

**Success Response** `200 OK`: Returns updated transaction. Triggers full JSON trace Audit Log.

**Error Responses:**
- `404 Not Found` — "Transaction not found."

---

### 📌 Delete Transaction (Archive)

- **Endpoint:** `DELETE /transactions/:id`
- **Auth Required:** Bearer Token
- **Role Required:** `ADMIN`

**Success Response** `200 OK`: "Transaction deleted successfully."

> **Behavior:** Performs a Soft-Delete (`deletedAt = now()`) and updates status to `ARCHIVED`.

---

## 4️⃣ Analytics Dashboard (`/api/dashboard`)

### 📌 Get Executive Summary

Compiles massive multi-table aggregations in a single parallel O(1) database trip.

- **Endpoint:** `GET /dashboard/summary`
- **Auth Required:** Bearer Token
- **Role Required:** ANY (`ADMIN`, `ANALYST`, `VIEWER`)

**Success Response** `200 OK`:

```json
{
  "success": true,
  "statusCode": 200,
  "message": "Dashboard summary generated successfully",
  "data": {
    "organizationName": "Stark Industries",
    "summary": {
      "totalBalance": 458965,
      "totalIncome": 579500,
      "totalExpenses": 120535,
      "savingsRate": 79.2,
      "totalRecords": 37,
      "avgDailySpend": 913,
      "savingsStreak": 6
    },
    "trends": [...],
    "monthlyComparison": [...],
    "categoryBreakdown": [...],
    "recentTransactions": [...],
    "categoryAnalysis": [
       { "category": "Housing", "amount": 66000, "percentage": 54.8, "context": "54.8% of total expenses" }
    ],
    "dailyTrend": [...],
    "incomeSources": [...],
    "insights": {
      "topCategory": { "category": "Housing", "amount": 66000, "percentage": 54.8, "context": "54.8% of total expenses" },
      "biggestExpense": { "amount": 22000, "category": "Rent", "date": "2026-03-30" },
      "expenseRatio": 20.8
    }
  }
}
```

---

## 🚀 Future Roadmap & Scaling Improvements

While the current architecture is highly optimized for enterprise multi-tenancy, a production rollout at massive scale (1M+ transactions per tenant) would benefit from the following architectural upgrades:

### ⚡ 1. Performance & Caching (Redis)

- **Dashboard Aggregation Caching:** The `/api/dashboard/summary` endpoint currently calculates aggregations in real-time. Implementing a Redis caching layer with a 15-minute TTL (Time-To-Live) would reduce database load to near-zero for executive viewers.
- **Cache Invalidation Strategy:** The transaction `POST/PATCH/DELETE` routes would emit events to flush the specific tenant's Redis cache key upon mutation.

### 🛡️ 2. Advanced Security & Auth

- **Two-Factor Authentication (2FA):** Implement TOTP (Time-based One-Time Password) using `otplib` and `qrcode` for all `ADMIN` accounts to protect sensitive financial data.
- **OAuth 2.0 Integration:** Add Google Workspace / Microsoft Entra ID SSO (Single Sign-On) for seamless enterprise employee onboarding.
- **Session Management:** Transition from stateless JWTs to Redis-backed session tokens to allow for instant remote logout and "Force Log Out All Devices" functionality.

### ⚙️ 3. Asynchronous Processing (Message Queues)

- **Background Jobs (BullMQ / RabbitMQ):**
  - Offload heavy CSV/PDF financial export generation to a background worker.
  - Handle transactional emails (e.g., "You've been invited to Stark Industries") asynchronously to prevent blocking the main Express event loop.