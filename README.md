# 🌟 RateHub — Modern Store Rating & SaaS Analytics Platform

A turnkey, enterprise-grade store rating platform designed with a **Liquid Glass + Glassmorphism** aesthetic, high-contrast dark/light mode, and full SaaS analytics. Users discover and rate registered merchants (1–5 stars), store owners monitor customer feedback and score distributions in real-time, and platform administrators oversee the entire ecosystem from a centralized executive dashboard.

Built strictly with **NestJS**, **Prisma ORM**, **PostgreSQL**, **React (Vite)**, **Tailwind CSS**, and **Zustand**.

---

## ⚡ Quick Start (Zero-Config Setup)

### Option A: Run with Docker (Recommended — 1 Command)
The entire stack (PostgreSQL, NestJS API, and React Web) is completely containerized. Database migrations and initial seed accounts are executed automatically upon boot.

```bash
git clone https://github.com/sameerthawait/Store-Rating-Platform.git
cd Store-Rating-Platform
docker compose up -d
```

That's it!
* **Web App**: [http://localhost:5173](http://localhost:5173)
* **Backend API & Swagger Docs**: [http://localhost:3000/api/docs](http://localhost:3000/api/docs)

---

### Option B: Run Locally on Host Machine (2 Commands)

**Prerequisites**: Node.js `v20+` and `pnpm` (`npm install -g pnpm`).

```bash
# 1. Clone and run automated setup (installs dependencies, builds packages, generates Prisma client, and seeds DB)
git clone https://github.com/sameerthawait/Store-Rating-Platform.git
cd Store-Rating-Platform
pnpm setup

# 2. Start both Backend and Frontend concurrently with hot reload
pnpm dev
```

*To run services individually in separate terminals:*
* **Backend API**: `pnpm dev:api` (Runs on `http://localhost:3000`)
* **Frontend Web**: `pnpm dev:web` (Runs on `http://localhost:5173`)

---

## 🔑 Pre-Configured Demo Accounts

The database comes pre-seeded with authentic accounts across all three user roles:

| Role | Email | Password | Access & Functionality |
|---|---|---|---|
| **System Administrator** | `admin@gmail.com` | `Sameer@12345` | Executive dashboard, provision new users & stores, multi-field directory filters |
| **Store Owner (Tech)** | `owner.tech@storerating.local` | `Password123!` | Store Analytics Dashboard, Rating Breakdown Chart (5★ to 1★), customer rater history |
| **Store Owner (Apparel)** | `owner.apparel@storerating.local` | `Password123!` | Store Analytics Dashboard, rater review log |
| **Store Owner (Coffee)** | `owner.coffee@storerating.local` | `Password123!` | Store Analytics Dashboard, rater review log |
| **Normal Shopper** | `alice.walker@storerating.local` | `Password123!` | Browse directory, real-time optimistic ratings submission (1 to 5 stars) |

*(Normal shoppers can also register for a new account anytime at `/signup`).*

---

## 💎 Features & Architecture

### 1. Visual & UX Highlights
* **Liquid Glass + Glassmorphism Aesthetic**: Obsidian black (`#080C14`), gold/amber gradients (`#F59E0B`), specular reflections, and ambient fluid mesh backgrounds.
* **Luxury Typography**: Google Fonts `Cinzel` & `Cormorant Garamond` (editorial display) paired with `Plus Jakarta Sans` (crisp data copy).
* **Dark / Light Mode**: Smooth 300ms animated Sun/Moon toggle with persistent `localStorage` synchronization.
* **Interactive Star Rating**: Golden drop-shadow glow and hover micro-animations.
* **SaaS Analytics Breakdown Chart**: 5-star to 1-star visual distribution progress bars with live percentages, rater counts, and customer sentiment chips.

### 2. Engineering & Security Invariants
* **Strict Role-Based Access Control (RBAC)**: Enforced with JWT tokens, Argon2 password hashing, and NestJS Guards at every API route.
* **Atomic Upserts**: Ratings are enforced with composite uniqueness `(user_id, store_id)` allowing real-time modification without duplicates.
* **Row-Level Isolation**: Store owners can strictly only view ratings and details for stores they own (`stores.owner_id = user.id`).
* **Nulls-Last Sorting**: Database-level PostgreSQL sorting ensures unrated stores appear at the end when sorting by rating.
* **Zero Password Hash Leakage**: Argon2 password hashes and refresh tokens are strictly omitted from all DTOs and API responses.

---

## 📁 Monorepo Structure

```
Store-Rating-Platform/
├── packages/
│   └── shared/       # Shared TypeScript types, Zod schemas, role enums, validation constants
├── apps/
│   ├── api/          # NestJS backend API, Prisma ORM, JWT authentication, throttling
│   └── web/          # React 18, Vite, Tailwind CSS, Zustand, TanStack Query
├── docker-compose.yml # 1-click Docker orchestration
└── pnpm-workspace.yaml# Monorepo package workspace configuration
```

---

## 🛠️ Monorepo Commands

| Command | Description |
|---|---|
| `pnpm setup` | 1-step install, compile shared packages, generate Prisma client, and seed DB |
| `pnpm dev` | Run both Backend API and Frontend Web concurrently |
| `pnpm dev:api` | Run NestJS API in watch mode |
| `pnpm dev:web` | Run Vite frontend with hot module replacement |
| `pnpm build` | Typecheck and build production bundles for all packages |
| `pnpm db:seed` | Re-seed admin and sample stores/users idempotently |
| `pnpm docker:up` | Launch Docker containers in the background |
| `pnpm docker:down` | Stop and tear down Docker containers |
