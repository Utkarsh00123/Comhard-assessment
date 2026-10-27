# Comhard To‑Do Web App

🌐 **Live Deployment:** [https://comhardassessment.vercel.app/](https://comhardassessment.vercel.app/)

### 🔑 Demo Credentials
- **Email:** `demo@example.com`
- **Password:** `Password123!`

*(You can also create a new account directly via the Sign Up screen).*

---

## Instructions to Run & Test

### Testing the Live Application
1. Open the live deployment link: [https://comhardassessment.vercel.app/](https://comhardassessment.vercel.app/)
2. Sign in using the demo credentials provided above (`demo@example.com` / `Password123!`), or click **Sign up** to register a new user.
3. Add, edit, filter, and transition tasks across stages (To Do, In Progress, Done) with automatic SLA time tracking and persistence on Neon PostgreSQL.

### Local Development Setup
```bash
# Clone the repo (if you haven’t already)
git clone https://github.com/Utkarsh00123/Comhard-assessment.git
cd Comhard-assessment

# Install dependencies
npm install

# Copy the example env file and add your Neon credentials
cp .env.example .env.local
# Edit .env.local → set DATABASE_URL (the full connection string)

# Run the dev server
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) and log in with the demo account or sign up locally.

---

## Description

A single‑page task manager that separates the **task list** (left pane) from the **task details** (right pane). The left pane stays fixed while the right pane scrolls when its content exceeds the viewport. All UI elements are styled with Tailwind CSS and the custom fonts from the two linked repositories.

## Interesting techniques

| Technique | Where it’s used | MDN reference |
|-----------|----------------|---------------|
| **CSS Grid + Fixed‑position pane** | `src/components/Layout.tsx` – left pane fixed, right pane scrollable | [CSS Grid Layout](https://developer.mozilla.org/en-US/docs/Web/CSS/CSS_Grid_Layout) |
| **IntersectionObserver** | Lazy‑load task cards in `src/components/TaskCard.tsx` | [IntersectionObserver API](https://developer.mozilla.org/en-US/docs/Web/API/IntersectionObserver) |
| **CSS custom properties for theming** | `src/index.css` defines `--font-sans` and colors | [CSS Variables](https://developer.mozilla.org/en-US/docs/Web/CSS/Using_CSS_custom_properties) |
| **Dynamic imports for route‑level code splitting** | `src/pages/dashboard.tsx` uses `import()` | [Dynamic import](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Statements/import) |
| **Environment variable handling via Vite** | `src/lib/dbClient.ts` reads `import.meta.env` | [Vite Env Variables](https://vitejs.dev/guide/env-and-mode.html) |
| **Tailwind CSS JIT mode** | Tailwind config (`tailwind.config.ts`) uses JIT for on‑demand utilities | [Tailwind JIT](https://tailwindcss.com/docs/just-in-time-mode) |

## Non‑obvious technologies & libraries

- **Neon PostgreSQL** – server‑less PostgreSQL endpoint accessed via the `pg` client (`neon.ts`).
- **React Router v6** – declarative routing (`react-router-dom`).
- **Lucide‑React** – lightweight SVG icons.
- **date‑fns** – date utilities for task timestamps.
- **@tailwindcss/vite** – Vite plugin that enables hot‑reloading of Tailwind classes.
- **Mock auth fallback** – a tiny local‑storage‑based mock that works when the Neon URL is missing (see `src/lib/mockAuth.ts`).

All dependencies are listed in `package.json`.

## Fonts

The UI uses two custom fonts:

- **Clarity City** – from the [vmware‑archive/clarity‑city](https://github.com/vmware-archive/clarity-city) repo.
- **FigTree** – from the [erikdkennedy/figtree](https://github.com/erikdkennedy/figtree) repo.

Both are loaded via `@font-face` rules in `src/index.css`.

## Project structure

```text
/
├─ .git/                     # Git history
├─ .next/                    # Next.js build output
├─ public/                   # Static assets (favicon, robots.txt, etc.)
├─ screenshots/              # Example screenshots used in the README
├─ scripts/                  # Helper scripts (e.g., e2e tests)
├─ src/                      # Application source
│   ├─ app/                  # API routes (e.g., auth/me)
│   ├─ components/           # Reusable UI components
│   ├─ context/              # React context providers (TaskContext, AuthContext)
│   ├─ lib/                  # Neon client & mock auth helpers
│   ├─ pages/                # Next.js pages (dashboard, login, etc.)
│   └─ styles/               # Tailwind entry (index.css)
├─ stitch_minimal_split_view_to_do_app (1)/  # Original design assets
├─ .env.example              # Template for required environment variables
├─ .env                      # Local development env (git‑ignored)
├─ next.config.ts            # Next.js configuration (including font imports)
├─ tailwind.config.ts        # Tailwind configuration
├─ tsconfig.json             # TypeScript configuration
└─ package.json              # Project metadata & scripts
```

*The `src/` folder holds all React code; `public/` contains static files that are served unchanged. The `stitch_minimal_split_view_to_do_app (1)/` directory stores the original UI mock‑ups that inspired the layout.*

---
