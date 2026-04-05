# 🏦 Enterprise SaaS Finance Dashboard API

A highly secure, multi-tenant B2B financial backend designed to handle organizational cash flow, granular Role-Based Access Control (RBAC), and complex data aggregations. Built with Node.js, Express, and Prisma ORM.

---

## 🚀 Tech Stack

This project leverages a modern Node.js ecosystem, prioritizing type-safety (via Zod), developer experience, and enterprise-grade security.

**Core Infrastructure:**
* **Runtime:** Node.js
* **Framework:** Express.js (v5)
* **Database:** PostgreSQL
* **ORM:** Prisma (`@prisma/client`) - *For type-safe database queries and interactive transactions.*

**Security & Validation:**
* **Authentication:** JSON Web Tokens (`jsonwebtoken`) & bcrypt (`bcryptjs`)
* **Validation:** Zod (`zod`) - *Strict runtime schema validation.*
* **Rate Limiting:** `express-rate-limit` - *Brute-force and DDoS protection.*
* **CORS:** `cors` - *Cross-Origin Resource Sharing middleware.*

**Monitoring & Documentation:**
* **API Docs:** Swagger UI (`swagger-ui-express`, `yamljs`) - *OpenAPI 3.0 specification.*
* **Logging:** Winston (`winston`) & Morgan (`morgan`) - *Structured application and HTTP request logging.*

**Testing:**
* **Integration Tests:** Vitest (`vitest`) & Supertest (`supertest`) - *Automated API route simulation and endpoint assertions.*

**Development Tools:**
* **Seeding:** Faker.js (`@faker-js/faker`) - *For generating massive realistic datasets.*
* **Hot Reloading:** Nodemon

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
│   [ Tables ]                                     │
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
PORT = 5000
DATABASE_URL = "postgresql://username:password@localhost:5432/finance_db"
JWT_SECRET = "your_super_secret_key"
JWT_EXPIRES_IN = "1d"
TEST_USER_EMAIL = "your_test_user_email" # for seeding
DUMMY_HASH = "your_dummy_hash"
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

**6. Swagger API docs:**

```bash
http://localhost:5000/api-docs
```

**7. Run the test suite:**

```bash
npm run test
```
---

## 🧪 Integration Testing

The project includes an automated integration test suite built with **Vitest** and **Supertest**. Instead of testing isolated functions, this suite tests the MVP critical path by simulating real HTTP requests against the live database.

**Test Coverage Scope:**
1. **Authentication:** Verifies successful login and Zod validation blocking for invalid credentials.
2. **RBAC Security:** Proves that the `VIEWER` role is strictly blocked (`403 Forbidden`) from accessing raw `/transactions` ledger data, while `ADMIN` is permitted.
3. **Analytics Engine:** Verifies the `/dashboard/summary` endpoint returns the correct, complex JSON structure and valid aggregated data types.

**How to run the tests:**

1. Ensure your `.env` file contains the seeded test credentials:
```env
TEST_ADMIN_EMAIL="your_TEST_ADMIN_EMAIL"
TEST_VIEWER_EMAIL="your_TEST_VIEWER_EMAIL"
TEST_ADMIN_PASSWORD="your_TEST_ADMIN_PASSWORD"
TEST_VIEWER_PASSWORD="your_TEST_VIEWER_PASSWORD"
TEST_ORG_ID="your_TEST_ORG_ID"
```
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

### 📊 Sample Dashboard Response

Below is a real-world example of the aggregated financial data returned by the `/dashboard/summary` endpoint. This data is computed in real-time across multiple database tables.

**Success Response (`200 OK`):**

```json
{
  "statusCode": 200,
  "data": {
    "organizationName": "Google",
    "summary": {
      "totalBalance": -110105.97999999952,
      "totalIncome": 6258248.62,
      "totalExpenses": 6368354.6,
      "savingsRate": -1.8,
      "totalRecords": 5000,
      "avgDailySpend": 14974,
      "savingsStreak": 4
    },
    "trends": [
      {
        "month": "Nov 25",
        "income": 472170.4199999996,
        "expense": 547478.7199999997,
        "balance": -75308.30000000016
      },
      {
        "month": "Dec 25",
        "income": 522732.64000000025,
        "expense": 548134.3300000001,
        "balance": -100709.98999999999
      },
      {
        "month": "Jan 26",
        "income": 516295.1600000001,
        "expense": 474210.0300000002,
        "balance": -58624.8600000001
      },
      {
        "month": "Feb 26",
        "income": 488457.2,
        "expense": 459682.8599999998,
        "balance": -29850.519999999902
      },
      {
        "month": "Mar 26",
        "income": 560877.9400000003,
        "expense": 526668.91,
        "balance": 4358.510000000359
      },
      {
        "month": "Apr 26",
        "income": 201109.69,
        "expense": 66597.78,
        "balance": 138870.42000000036
      }
    ],
    "monthlyComparison": [
      {
        "month": "Nov 25",
        "income": 472170.4199999996,
        "expense": 547478.7199999997,
        "savings": -75308.30000000016
      },
      {
        "month": "Dec 25",
        "income": 522732.64000000025,
        "expense": 548134.3300000001,
        "savings": -25401.689999999828
      },
      {
        "month": "Jan 26",
        "income": 516295.1600000001,
        "expense": 474210.0300000002,
        "savings": 42085.12999999989
      },
      {
        "month": "Feb 26",
        "income": 488457.2,
        "expense": 459682.8599999998,
        "savings": 28774.3400000002
      },
      {
        "month": "Mar 26",
        "income": 560877.9400000003,
        "expense": 526668.91,
        "savings": 34209.03000000026
      },
      {
        "month": "Apr 26",
        "income": 201109.69,
        "expense": 66597.78,
        "savings": 134511.91
      }
    ],
    "categoryBreakdown": [
      {
        "category": "Software",
        "amount": 891637.91,
        "percentage": 14,
        "context": "14% of total expenses"
      },
      {
        "category": "Marketing",
        "amount": 864345.41,
        "percentage": 13.6,
        "context": "13.6% of total expenses"
      },
      {
        "category": "Rent",
        "amount": 823510.93,
        "percentage": 12.9,
        "context": "12.9% of total expenses"
      },
      {
        "category": "Utilities",
        "amount": 819233.39,
        "percentage": 12.9,
        "context": "12.9% of total expenses"
      },
      {
        "category": "Food",
        "amount": 798249.63,
        "percentage": 12.5,
        "context": "12.5% of total expenses"
      }
    ],
    "recentTransactions": [
      {
        "id": "0553f899-d7a7-4aba-91ec-7325d427de54",
        "title": "Testing the POST route",
        "category": "Legal",
        "amount": 99999.99,
        "type": "INCOME",
        "date": "2026-04-04"
      },
      {
        "id": "8e3a1d5c-3dfc-4b22-853c-d3f8ed81b1b7",
        "title": "Usus auctor cupressus summopere addo truculenter delectus ago.",
        "category": "Salary",
        "amount": 866.16,
        "type": "INCOME",
        "date": "2026-04-04"
      },
      {
        "id": "3459f868-b956-4fab-b1e3-aaeec6584407",
        "title": "Ter magnam aegrus suus in colo.",
        "category": "Transport",
        "amount": 2459.15,
        "type": "INCOME",
        "date": "2026-04-04"
      },
      {
        "id": "d8f1e495-feae-4571-a679-0a4a027db36f",
        "title": "Alter vinco appello.",
        "category": "Marketing",
        "amount": -2166.37,
        "type": "EXPENSE",
        "date": "2026-04-04"
      },
      {
        "id": "0c642f63-c2c6-4486-9680-c621214ec9de",
        "title": "Ventus ocer corona quia laboriosam aliquam acerbitas vitae temeritas adipisci.",
        "category": "Rent",
        "amount": 1730.87,
        "type": "INCOME",
        "date": "2026-04-04"
      }
    ],
    "categoryAnalysis": [
      {
        "category": "Software",
        "amount": 891637.91,
        "percentage": 14,
        "context": "14% of total expenses"
      },
      {
        "category": "Marketing",
        "amount": 864345.41,
        "percentage": 13.6,
        "context": "13.6% of total expenses"
      },
      {
        "category": "Rent",
        "amount": 823510.93,
        "percentage": 12.9,
        "context": "12.9% of total expenses"
      },
      {
        "category": "Utilities",
        "amount": 819233.39,
        "percentage": 12.9,
        "context": "12.9% of total expenses"
      },
      {
        "category": "Food",
        "amount": 798249.63,
        "percentage": 12.5,
        "context": "12.5% of total expenses"
      },
      {
        "category": "Legal",
        "amount": 763399.16,
        "percentage": 12,
        "context": "12% of total expenses"
      },
      {
        "category": "Transport",
        "amount": 756889.97,
        "percentage": 11.9,
        "context": "11.9% of total expenses"
      },
      {
        "category": "Salary",
        "amount": 651088.2,
        "percentage": 10.2,
        "context": "10.2% of total expenses"
      }
    ],
    "dailyTrend": [
      {
        "date": "2026-03-07",
        "expense": 8204.91
      },
      {
        "date": "2026-03-08",
        "expense": 20319.46
      },
      {
        "date": "2026-03-09",
        "expense": 15689.89
      },
      {
        "date": "2026-03-10",
        "expense": 4636.77
      },
      {
        "date": "2026-03-11",
        "expense": 19932.629999999997
      },
      {
        "date": "2026-03-12",
        "expense": 11793.38
      },
      {
        "date": "2026-03-13",
        "expense": 10028.919999999998
      },
      {
        "date": "2026-03-14",
        "expense": 10407.76
      },
      {
        "date": "2026-03-15",
        "expense": 15499.76
      },
      {
        "date": "2026-03-16",
        "expense": 9543.34
      },
      {
        "date": "2026-03-17",
        "expense": 8151.1900000000005
      },
      {
        "date": "2026-03-18",
        "expense": 18222.85
      },
      {
        "date": "2026-03-19",
        "expense": 22729.32
      },
      {
        "date": "2026-03-20",
        "expense": 19671.359999999997
      },
      {
        "date": "2026-03-21",
        "expense": 20104.9
      },
      {
        "date": "2026-03-22",
        "expense": 19159.82
      },
      {
        "date": "2026-03-23",
        "expense": 21754.29
      },
      {
        "date": "2026-03-24",
        "expense": 15099.439999999999
      },
      {
        "date": "2026-03-25",
        "expense": 12345.84
      },
      {
        "date": "2026-03-26",
        "expense": 10955.609999999999
      },
      {
        "date": "2026-03-27",
        "expense": 29131.100000000006
      },
      {
        "date": "2026-03-28",
        "expense": 24243.499999999996
      },
      {
        "date": "2026-03-29",
        "expense": 8888.18
      },
      {
        "date": "2026-03-30",
        "expense": 8368.41
      },
      {
        "date": "2026-03-31",
        "expense": 22259.019999999997
      },
      {
        "date": "2026-04-01",
        "expense": 14035.060000000001
      },
      {
        "date": "2026-04-02",
        "expense": 27344.070000000003
      },
      {
        "date": "2026-04-03",
        "expense": 10508.06
      },
      {
        "date": "2026-04-04",
        "expense": 10191.85
      },
      {
        "date": "2026-04-05",
        "expense": 0
      }
    ],
    "incomeSources": [
      {
        "category": "Legal",
        "amount": 893712.52,
        "percentage": 14.3,
        "context": "14.3% of total income"
      },
      {
        "category": "Food",
        "amount": 852835.83,
        "percentage": 13.6,
        "context": "13.6% of total income"
      },
      {
        "category": "Utilities",
        "amount": 829607.6,
        "percentage": 13.3,
        "context": "13.3% of total income"
      },
      {
        "category": "Rent",
        "amount": 789671.16,
        "percentage": 12.6,
        "context": "12.6% of total income"
      },
      {
        "category": "Salary",
        "amount": 777104.46,
        "percentage": 12.4,
        "context": "12.4% of total income"
      },
      {
        "category": "Transport",
        "amount": 754177.77,
        "percentage": 12.1,
        "context": "12.1% of total income"
      },
      {
        "category": "Marketing",
        "amount": 687046.63,
        "percentage": 11,
        "context": "11% of total income"
      },
      {
        "category": "Software",
        "amount": 674092.65,
        "percentage": 10.8,
        "context": "10.8% of total income"
      }
    ],
    "insights": {
      "topCategory": {
        "category": "Software",
        "amount": 891637.91,
        "percentage": 14,
        "context": "14% of total expenses"
      },
      "biggestExpense": {
        "amount": "4998.93",
        "category": "Marketing",
        "date": "2026-02-15"
      },
      "expenseRatio": 101.8
    }
  },
  "message": "Professional Dashboard analytics generated successfully",
  "success": true
}

```