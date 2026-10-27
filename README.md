# Task Management & SLA Engine

A full-stack, enterprise-grade Task Management Application built with **Next.js (App Router)**, **Neon Serverless PostgreSQL**, and a custom **JWT Authentication System** with password hashing via `bcryptjs`. Features real-time SLA metrics, 4 modular views (List, Kanban, Grid, Section), global filtering, and a minimalist split-view interface styled with **Clarity City** and **Figtree** typography.

---

## 📸 Screenshots

### Kanban View
![Kanban View](screenshots/kanban-view.png)

### Grid View
![Grid View](screenshots/grid-view.png)

---

## ✨ Features

- **Custom JWT Authentication (No BaaS Auth):**
  - Secure signup, login, and forgot password endpoints.
  - Passwords hashed with `bcryptjs`.
  - Stateless signed JWTs stored in client and transmitted via `Authorization: Bearer <token>`.
  - Protected application routes with unauthenticated redirect to `/login`.

- **Neon Serverless PostgreSQL Database:**
  - Fast, serverless SQL driver via `@neondatabase/serverless`.
  - Relational schema with user isolation (`users`, `tasks`, `sla_logs`).
  - Indexed for high performance.

- **4 Modular Views (Single Source of Truth):**
  - **List View:** Detailed tabular view with live SLA counters and fast actions.
  - **Kanban View:** Drag-and-drop / single-click stage transitions across `To Do`, `In Progress`, and `Done`.
  - **Grid View:** Responsive card grid highlighting importance and live timers.
  - **Section View:** Grouped accordion view organized by task categories.

- **Strict SLA (Service Level Agreement) Engine:**
  - **Active Section Tracking:** Records exact time elapsed while a task sits in `To Do` or `In Progress`.
  - **Forward Movement:** When tasks move backward (e.g. `In Progress` -> `To Do`), the SLA clock does not reset; it resumes counting forward against the `To Do` bucket.
  - **Completion Zeroing:** SLA for the `Done` stage is strictly `0s`; once a task is marked `Done`, active timers halt permanently.
  - **Metrics Displayed:**
    - Live time spent in current section.
    - Total cumulative time spent across all sections prior to `Done`.
    - Average SLA per stage transition (`Total Time / Transitions`).

- **Global Filtering:**
  - Multi-select filters for `Importance` (`High`, `Medium`, `Low`).
  - Date sorting (`Due Date`, `Creation Date`).
  - Category selector & full-text search across title and description.
  - Filters apply globally across all active views.

- **Design & Typography:**
  - Split-view minimalist desktop application layout.
  - Custom typography utilizing **Clarity City** (headings, numbers, metrics) and **Figtree** (body, controls, UI).
  - Quick keyboard shortcut: Press **`C`** anywhere to create a new task.

---

## 🚀 Getting Started

### 1. Prerequisites
- Node.js 18+ (tested on Node 20 / 24)
- A Neon PostgreSQL Database project ([neon.tech](https://neon.tech))

### 2. Environment Setup
Copy the example environment file and add your credentials:
```bash
cp .env.example .env.local
```
Fill in `.env.local`:
```env
DATABASE_URL="postgresql://user:password@ep-xyz.aws.neon.tech/neondb?sslmode=require"
DATABASE_URL_UNPOOLED="postgresql://user:password@ep-xyz.aws.neon.tech/neondb?sslmode=require"
JWT_SECRET="your_super_secret_jwt_key_here"
```

### 3. Install Dependencies
```bash
npm install
```

### 4. Initialize Database Schema
Run the automated schema migration script to initialize tables and indexes in your Neon database:
```bash
node --env-file=.env.local scripts/init-db.mjs
```

### 5. Start Development Server
```bash
npm run dev
```
Open [http://localhost:3000](http://localhost:3000) in your browser.

---

## 🧪 Testing & Verification

Run the end-to-end integration test suite against the running app:
```bash
node scripts/test-e2e.mjs
```
The suite verifies:
1. User registration (`/api/auth/signup`)
2. Bcrypt password verification & login (`/api/auth/login`)
3. Authenticated session (`/api/auth/me`)
4. Password reset token generation (`/api/auth/forgot-password`)
5. Task creation, listing, forward/backward stage transitions, and SLA logging
6. Task deletion
