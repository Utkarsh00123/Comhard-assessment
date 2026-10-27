# System Specification: Task Management Application

## Core Directives for AI Agent
* **Zero Over-Engineering:** Write strictly what is required to make the system function as a whole. Do not introduce Redux, GraphQL, or complex micro-frontend architectures. Use React Context or basic Zustand for global state.
* **No Hallucinations:** Use standard, stable libraries (e.g., React Router, Tailwind CSS, date-fns, bcryptjs, jsonwebtoken). Do not invent custom utility functions for standard problems. 
* **Component Modularity:** Build agnostic, reusable UI components. The List, Grid, Kanban, and Section views must consume the exact same underlying task state.
* **Resilience:** Ensure the system does not crash on empty states or malformed data. Implement strict TypeScript interfaces for all payloads.

## 1. Custom Authentication System (No BaaS Auth)
* **Scope:** Login, Signup, Forgot Password.
* **Architecture:** Implement custom JWT-based authentication using Next.js API routes and a PostgreSQL database.
* **Security:** 
  * Passwords MUST be hashed using `bcryptjs` before database insertion. Never store plaintext passwords.
  * Successful logins must issue a standard JWT signed with a secure server-side secret.
* **Client Handling:** Store the JWT locally. Attach it as a Bearer token in the Authorization header for all API requests. 
* **Routing:** Protect all primary application routes. Unauthenticated users must be redirected to `/login`.

## 2. Views & UI Architecture
* **State Source of Truth:** A single state array holds all tasks. 
* **Supported Views:**
  * **List View:** Standard tabular layout.
  * **Grid View:** Card-based masonry or CSS grid layout.
  * **Kanban View:** Drag-and-drop board mapping to the three primary statuses (`To Do`, `In Progress`, `Done`).
  * **Section View:** Grouped accordion layout based on user-defined categories.
* **Filtering Mechanism:** Multi-select filters for `Importance` (High, Medium, Low) and `Date` (Due Date, Creation Date). Filters must apply globally across all active views.

## 3. Core Task Entity (CRUD)
Tasks must adhere to the following interface:
* `id`: UUID.
* `user_id`: UUID (Foreign Key linking to the authenticated user).
* `title`: String.
* `description`: String.
* `status`: 'To Do' | 'In Progress' | 'Done'.
* `importance`: 'High' | 'Medium' | 'Low'.
* `dueDate`: Timestamp.
* `createdAt`: Timestamp.

## 4. SLA (Service Level Agreement) Tracking Logic
Implement a strict time-tracking engine for tasks as they move through statuses.
* **Active Section Tracking:** Record the exact time elapsed while a task sits in `To Do` or `In Progress`.
* **Forward Movement:** If a task moves backward (e.g., `In Progress` -> `To Do`), the SLA clock does not reset; it simply resumes counting time against the `To Do` bucket. The total lifecycle SLA must continue moving forward.
* **Completion Zeroing:** The SLA for the `Done` stage is always strictly `0`. Once a task enters `Done`, the active timer stops.
* **Metrics to Display:**
  * Time spent in the current section.
  * Total cumulative time spent across all sections prior to `Done`.
  * Average SLA (total time / number of stage transitions).