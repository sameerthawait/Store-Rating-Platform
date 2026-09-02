# RateHub — Store Rating Platform

A high-performance, enterprise-grade web platform where users discover and rate stores (1–5 stars), store owners gain transparent visibility into their raters and ratings, and platform administrators manage stores, users, and ecosystem health from a centralized dashboard.

Built strictly with **NestJS**, **Prisma**, **PostgreSQL**, **React (Vite)**, **Tailwind CSS**, and **Zustand**.

---

## 1. Prerequisites

Ensure you have the following installed on your local development machine:
- **Node.js**: `v20.x` or higher
- **pnpm**: `v9.x` (`npm install -g pnpm`)
- **Docker & Docker Compose**: latest desktop or engine version
- **Git**

---

## 2. Monorepo Structure

```
ratehub/
├── packages/
│   └── shared/       # Shared TypeScript interfaces, enums, validation constants
├── apps/
│   ├── api/          # NestJS backend API with Prisma ORM
│   └── web/          # React + Vite frontend application (Glassmorphism design)
└── docker-compose.yml # Orchestration for PostgreSQL, API, and Web
```

---

## 3. Local Development Setup (Step-by-Step)

### Step 1: Clone the Repository
```bash
git clone <repository-url>
cd ratehub
```

### Step 2: Install Dependencies
```bash
pnpm install
```

### Step 3: Configure Environment Variables
Copy the `.env.example` files to active `.env` files:

```bash
# Backend configuration
cp apps/api/.env.example apps/api/.env

# Frontend configuration
cp apps/web/.env.example apps/web/.env
```

> **Note**: Update values in `apps/api/.env` (such as `DATABASE_URL`, `JWT_ACCESS_SECRET`, `JWT_REFRESH_SECRET`, `SEED_ADMIN_EMAIL`, and `SEED_ADMIN_PASSWORD`) as appropriate for your local machine.

### Step 4: Start Database Service via Docker
Start the PostgreSQL container:
```bash
docker compose up -d postgres
```

### Step 5: Build Shared Workspace & Generate Prisma Client
```bash
pnpm build:shared
pnpm --filter @ratehub/api prisma:generate
```

### Step 6: Run Database Migrations and Seed
```bash
pnpm --filter @ratehub/api prisma:migrate
pnpm --filter @ratehub/api prisma:seed
```

### Step 7: Start Development Servers
You can run both API and Web concurrently using:
```bash
pnpm dev
```

Or run them individually in separate terminals:
- **Backend API**: `pnpm dev:api` (Runs on `http://localhost:3000`, Swagger at `http://localhost:3000/api/docs`)
- **Frontend Web**: `pnpm dev:web` (Runs on `http://localhost:5173`)

---

## 4. Full Docker Orchestration

To run the entire platform (PostgreSQL, NestJS API, Vite Web) inside Docker:

```bash
docker compose up --build
```

Access:
- Web Application: `http://localhost:5173`
- Backend API & Swagger: `http://localhost:3000/api/docs`

---

## 5. Scripts Reference

| Command | Description |
|---|---|
| `pnpm dev` | Run all applications concurrently in hot-reload mode |
| `pnpm build` | Build shared package, API, and Web bundles |
| `pnpm lint` | Run ESLint across all packages and apps |
| `pnpm lint:fix` | Automatically fix ESLint errors |
| `pnpm format` | Run Prettier across the entire monorepo |
| `pnpm test` | Run test suites across all packages |
| `pnpm db:migrate` | Apply Prisma migrations to the database |
| `pnpm db:seed` | Seed initial admin user and sample data |
| `pnpm docker:up` | Spin up all docker-compose services in the background |
| `pnpm docker:down` | Stop and remove docker-compose containers |

---

## 6. Architecture & Security Invariants

1. **Role Enforcement**: Authentication and role guards (`Admin`, `Normal`, `StoreOwner`) are strictly enforced at the API controller layer on every single request.
2. **Row-Level Security**: Store Owners can only query data where `stores.owner_id = user.id`.
3. **Single Upsert Operations**: Star ratings enforce composite uniqueness on `(user_id, store_id)` and are processed atomically via database-level upserts.
4. **Zero-Leakage**: Argon2 password hashes are never exposed in any API response or payload.
5. **Database-Pushed Querying**: All pagination, filtering, and sorting are executed in PostgreSQL queries, never loaded into application memory.
