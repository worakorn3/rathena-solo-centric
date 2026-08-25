# Photonic RO Player Portal (Web Monorepo)

A dedicated, high-performance web portal for **rathena-solo-centric** players to view their consolidated Net Worth, Investment Banker balances, Midgard Municipal Stock Portfolio, Character Equipment Paperdoll, and Solo Hunt Progression.

---

## 🏛️ Architecture

- **Backend:** [Elysia.js](https://elysiajs.com/) on [Bun](https://bun.sh/)
- **Frontend:** [React](https://react.dev/) + [Vite](https://vitejs.dev/) + [Tailwind CSS](https://tailwindcss.com/)
- **Shared Layer:** `@rathena/shared` (TypeScript types, Renewal Job IDs, Eden Treaty RPC contracts)
- **Database Safety:** Connects strictly to the **MariaDB Read-Only Replica on port `3307`** (`ro_user`), ensuring zero query contention on the live game engine.

---

## 🚀 Getting Started (Local Development)

### 1. Install Dependencies
```powershell
cd web
bun install --backend=copyfile
```

### 2. Run Tests
```powershell
bun test --filter @rathena/server
```

### 3. Start Development Servers
In separate terminals:
```powershell
# Start Backend (Port 4000)
cd apps/server
bun dev

# Start Frontend (Port 5173)
cd apps/client
bun dev
```
Open **`http://localhost:5173`** in your browser.

---

## 🐳 Docker Deployment

The container is configured as a multi-stage Bun build that serves both the API and the compiled React SPA from a single lightweight container.

> [!IMPORTANT]
> **Mandatory Web Rebuild Rule:** Always rebuild and restart the Docker Compose container whenever making any changes to the web codebase (frontend or backend):
> ```powershell
> docker compose -f tools/docker/docker-compose.yml up -d --build --no-deps web-portal
> ```

### Run with Docker Compose
```powershell
cd tools/docker
docker compose up -d --build --no-deps web-portal
```
Access at **`http://localhost:3001`**.

---

## 🎨 Interactive Demos & Wireframes

All interactive prototypes and UI design benchmarks are consolidated in **[`web/demos/`](./demos/)**:

- **[`demos/index.html`](./demos/index.html)**: **Master Showcase Hub** — Interactive Tactical Cockpit (Option A Proportional Asset Bar, 4th Job Traits, 48h Rest Bonus, Scalable Roster), Asset Lab, and Eden Bounties.
- **[`demos/asset-allocation-lab.html`](./demos/asset-allocation-lab.html)**: Dynamic stress test lab comparing 4 asset allocation widget designs across digit ranges (1M to 2.14B Zeny).
- **[`demos/bounties-dashboard.html`](./demos/bounties-dashboard.html)**: Eden Group solo hunting quest boards and progression trackers.
- **[`demos/archive/`](./demos/archive/)**: Historical wireframes and exploratory prototypes.

---

## 📖 Specifications & Roadmap
For the detailed architectural specification, database formulas, and roadmap, see:
👉 [Web Portal Specification & Architecture](../ai/plans/web_portal_plan.md)
