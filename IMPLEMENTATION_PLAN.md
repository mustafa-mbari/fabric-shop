# Fabric Shop Manager — Implementation Plan

## Context

This plan translates [PRD.md](PRD.md) into an actionable build roadmap for the **Fabric Shop Manager** — a mobile-first, RTL Arabic web app used internally by shop workers and managers to manage customers, debts, orders, inventory, and tasks.

The repository is a greenfield Next.js + Supabase project. The plan below establishes architecture, data model, module rollout order, and risks so a single developer can execute incrementally without rework.

---

## 1. Architecture Overview

### High-level system design
- **Single Next.js application** (App Router) hosting both the UI and the API layer (Route Handlers).
- **Supabase** acts as the database (Postgres), the auth provider, and the row-level security (RLS) enforcement layer.
- **Server-side data access** via Supabase service role inside Route Handlers for trusted writes (PDF generation, role checks, soft deletes).
- **Client-side reads** via the Supabase JS client (anon key + RLS) for live data on lists/dashboards.
- **PDF generation** runs server-side in a Route Handler.

### Frontend vs Backend responsibilities

| Concern | Frontend (Next.js client) | Backend (Route Handlers / Supabase) |
|---|---|---|
| Rendering pages, forms, tables | Yes | — |
| Auth session, role lookup | Yes (via Supabase client) | Yes (verifies on writes) |
| Reads (lists, dashboards) | Yes via Supabase client + RLS | — |
| Writes (create / edit) | Calls Route Handlers | Yes — validates, enforces role |
| Soft delete, role-gated mutations | — | Yes (service role) |
| PDF export | Triggers download | Yes — generates buffer, streams response |
| Business calculations (debt remaining, order totals) | Optimistic preview only | Yes — source of truth (DB generated columns / triggers) |

### Why this split
- RLS on Supabase covers reads and basic writes.
- Sensitive writes (delete, role changes, PDF data aggregation) flow through Route Handlers so the service role and validation live in one place.

---

## 2. Project Structure

```
fabric-shop/
├── app/
│   ├── (auth)/
│   │   ├── login/page.tsx
│   │   └── layout.tsx
│   ├── (dashboard)/
│   │   ├── layout.tsx                  # Authenticated shell + RTL + nav
│   │   ├── page.tsx                    # Dashboard
│   │   ├── customers/
│   │   │   ├── page.tsx
│   │   │   └── [id]/page.tsx
│   │   ├── debts/
│   │   │   ├── layout.tsx              # Tabs: Wholesale / Retail
│   │   │   ├── wholesale/page.tsx
│   │   │   ├── retail/page.tsx
│   │   │   └── [id]/page.tsx
│   │   ├── orders/
│   │   │   ├── page.tsx
│   │   │   ├── new/page.tsx
│   │   │   └── [id]/page.tsx
│   │   ├── inventory/
│   │   │   └── page.tsx
│   │   └── tasks/
│   │       └── page.tsx
│   ├── api/
│   │   ├── customers/route.ts
│   │   ├── customers/[id]/route.ts
│   │   ├── debts/route.ts
│   │   ├── debts/[id]/payments/route.ts
│   │   ├── orders/route.ts
│   │   ├── orders/[id]/route.ts
│   │   ├── products/route.ts
│   │   ├── tasks/route.ts
│   │   ├── dashboard/summary/route.ts
│   │   └── export/
│   │       ├── debts/route.ts
│   │       └── orders/route.ts
│   └── layout.tsx                       # html dir="rtl" lang="ar"
├── components/
│   ├── ui/                              # Button, Input, Modal, Sheet, Tabs
│   ├── forms/                           # CustomerForm, OrderForm, DebtForm
│   ├── tables/                          # CustomerTable, OrderTable
│   ├── layout/                          # AppShell, BottomNav, TopBar
│   └── dashboard/                       # StatCard, etc.
├── lib/
│   ├── supabase/
│   │   ├── client.ts                    # browser client
│   │   ├── server.ts                    # server client (cookies)
│   │   └── admin.ts                     # service-role client
│   ├── auth/
│   │   ├── getSession.ts
│   │   └── requireRole.ts
│   ├── validation/                      # zod schemas per module
│   ├── pdf/                             # PDF builders
│   └── utils/                           # formatters (currency, dates), arabic helpers
├── hooks/                               # useCustomers, useOrders, …
├── types/                               # Generated Supabase types + DTOs
├── supabase/
│   ├── migrations/                      # SQL migrations, ordered
│   └── seed.sql
├── public/fonts/                        # Arabic-supporting PDF fonts
└── middleware.ts                        # session refresh + auth gate
```

### Naming conventions
- Files: `kebab-case` for routes, `PascalCase` for components, `camelCase` for hooks/utilities.
- DB: `snake_case` tables/columns, plural table names.
- API routes mirror DB resources (`/api/customers`, `/api/debts/[id]/payments`).
- Zod schemas: `customerCreateSchema`, `debtUpdateSchema`.

### Separation of concerns
- `components/` — presentational + small container logic.
- `hooks/` — data fetching + mutation wrappers (React Query).
- `lib/` — pure logic, no React.
- `app/api/` — thin controllers: parse → validate → call lib → respond.

---

## 3. Database Design Plan

### Tables & key fields

**users** *(mirrors `auth.users` via trigger)*
- `id` (uuid, PK = auth.users.id)
- `full_name`, `role` (`worker` | `manager`), `created_at`, `deleted_at`

**customers**
- `id` uuid PK
- `name` text not null
- `phone` text not null
- `address` text
- `created_at`, `deleted_at`

**products**
- `id` uuid PK
- `name` text not null  *(name + color combined string per PRD)*
- `type` enum (`METER` | `UNIT`)
- `quantity` numeric default 0
- `description` text
- `created_at`, `deleted_at`

**orders**
- `id` uuid PK
- `customer_id` uuid FK → customers (nullable)
- `customer_name` text  *(fallback if no customer)*
- `status` enum (`NEW`,`IN_PROGRESS`,`ON_HOLD`,`READY`,`DELIVERED`)
- `total_price` numeric  *(maintained by trigger)*
- `notes` text
- `delivery_date` date
- `created_by` uuid FK → users
- `created_at`, `deleted_at`

**order_items**
- `id` uuid PK
- `order_id` uuid FK → orders **on delete cascade**
- `product_name` text  *(snapshot, not FK — products are loose per PRD)*
- `quantity` numeric
- `price_per_unit` numeric
- `total_price` numeric **GENERATED ALWAYS AS (quantity * price_per_unit) STORED**

**debts**
- `id` uuid PK
- `customer_id` uuid FK → customers not null
- `type` enum (`WHOLESALE` | `RETAIL`)
- `amount_total` numeric not null
- `amount_paid` numeric default 0  *(updated by payment trigger)*
- `remaining` numeric **GENERATED ALWAYS AS (amount_total - amount_paid) STORED**
- `note` text
- `order_id` uuid FK → orders (nullable)
- `created_by` uuid FK → users
- `created_at`, `deleted_at`

**payments**
- `id` uuid PK
- `debt_id` uuid FK → debts on delete cascade
- `amount` numeric not null check (amount > 0)
- `created_at`

**tasks**
- `id` uuid PK
- `title` text not null
- `description` text
- `assigned_to` uuid FK → users (nullable)
- `created_by` uuid FK → users
- `done` boolean default false
- `created_at`, `deleted_at`

### Triggers / business rules in DB
- `payments` insert/delete → updates `debts.amount_paid`.
- `order_items` insert/update/delete → recalculates `orders.total_price`.
- `auth.users` insert → inserts row into `public.users` with default role `worker`.

### Indexing
- `customers(phone)` **partial unique** `WHERE deleted_at IS NULL` (allows phone reuse after soft delete).
- `customers(name)` for search (`pg_trgm` GIN if Arabic search proves slow).
- `orders(status)`, `orders(customer_id)`, `orders(delivery_date)`.
- `debts(customer_id)`, `debts(type)`, partial index `WHERE deleted_at IS NULL`.
- `payments(debt_id)`.
- `order_items(order_id)`.
- Soft-delete partial indexes on hot tables to keep active queries fast.

### RLS policies (overview)
- Authenticated users can `SELECT` all non-deleted rows in business tables.
- `INSERT` / `UPDATE` allowed for any authenticated user on tables they own per PRD.
- `DELETE` (soft via `deleted_at`) restricted to managers — enforced server-side; RLS denies hard delete to all clients.
- `products` insert/update restricted to `manager` role via RLS using `users.role`.

---

## 4. Feature Breakdown (Step-by-Step)

### Phase 0 — Foundation (must come first)
1. Init Next.js (App Router, TypeScript), Tailwind, ESLint/Prettier.
2. Supabase project + local CLI; first migration with `users` table + auth trigger.
3. Configure Tailwind for RTL (`dir="rtl"`, logical properties, Arabic font like Cairo/Tajawal).
4. Implement Supabase clients (`client.ts`, `server.ts`, `admin.ts`) and `middleware.ts`.
5. Auth pages + protected layout + role lookup helper.

### Phase 1 — Customers (no deps beyond auth)
1. Migration: `customers` table + RLS.
2. Zod schema, API routes (`GET`, `POST`, `PATCH`).
3. Customer list page (search by name/phone).
4. Customer create/edit form.
5. Reusable `<CustomerPicker />` (used later in orders & debts).

### Phase 2 — Inventory (independent)
1. Migration: `products` table + manager-only RLS.
2. API routes.
3. Inventory page (list, manual quantity adjust).
4. Product create/edit (manager only).

### Phase 3 — Orders (depends on customers; reuses CustomerPicker)
1. Migration: `orders` + `order_items` + total trigger.
2. Validation schemas (order header + items array).
3. API: create order with items in single transaction (RPC `create_order_with_items`).
4. Order list with status filter.
5. Order create/edit page (multi-item form, "create customer" popup wired to Phase 1).
6. Status transitions (5 statuses).

### Phase 4 — Debts (depends on customers; optionally on orders)
1. Migration: `debts` + `payments` + paid-amount trigger.
2. API for debts and nested payments.
3. Debts page with Wholesale/Retail tabs.
4. Debt detail page: payment history, add payment.
5. Optional `order_id` link UI.

### Phase 5 — Tasks (independent)
1. Migration + RLS.
2. Tasks page (list, create, assign optional, mark done).

### Phase 6 — Dashboard (depends on all above)
1. RPC `dashboard_summary()` returning today's order count, in-progress count, total outstanding debts, total customers.
2. Dashboard page composed of `StatCard`s.

### Phase 7 — PDF Export
1. Server-side PDF builder (pdfmake or `@react-pdf/renderer`) with embedded Arabic font.
2. Export endpoints: single customer debts, all debts, single order, all orders.
3. Download buttons in relevant pages.

### Phase 8 — Polish
- Soft-delete UI (manager-only delete buttons + confirmation).
- Empty states, loading skeletons, error boundaries.
- Accessibility pass (focus, ARIA, contrast).

### Dependency graph
```
Foundation → Customers ─┬→ Orders ─┐
                        └→ Debts ──┤
              Inventory ───────────┤→ Dashboard → PDF Export → Polish
              Tasks ───────────────┘
```

---

## 5. API Design Plan

REST-style Route Handlers grouped by resource.

| Method | Path | Notes |
|---|---|---|
| GET | `/api/customers?search=` | list + search |
| POST | `/api/customers` | create |
| PATCH | `/api/customers/[id]` | edit |
| DELETE | `/api/customers/[id]` | soft delete (manager) |
| GET | `/api/products` | list |
| POST/PATCH/DELETE | `/api/products[/id]` | manager only |
| GET | `/api/orders?status=&customer_id=` | filterable list |
| POST | `/api/orders` | create with items (transaction via RPC) |
| PATCH | `/api/orders/[id]` | edit header + items |
| GET | `/api/orders/[id]` | detail |
| GET | `/api/debts?type=&customer_id=` | filter by wholesale/retail |
| POST | `/api/debts` | create |
| PATCH | `/api/debts/[id]` | edit |
| GET | `/api/debts/[id]/payments` | list |
| POST | `/api/debts/[id]/payments` | add payment |
| GET/POST/PATCH | `/api/tasks` | tasks CRUD |
| GET | `/api/dashboard/summary` | aggregate metrics |
| GET | `/api/export/debts?customer_id=` | PDF stream |
| GET | `/api/export/orders?id=` | PDF stream |

### Request/response patterns
- Requests: JSON body validated by Zod at the top of each handler.
- Responses: `{ data, error }` shape; HTTP status reflects outcome.
- Pagination: cursor or `?page=&limit=` for lists once data grows; OK to skip in MVP.
- All write handlers: load session → resolve role → enforce → execute.

### Validation strategy
- One Zod schema per resource per action under `lib/validation/`.
- Reused by both API routes and React forms (single source of truth).
- Server always re-validates — never trust client-side validation alone.

---

## 6. State Management Strategy

- **Server data**: TanStack React Query.
  - One query key per resource (`['customers', filters]`).
  - Mutations call API routes and `invalidateQueries` on success.
  - Stale time ~30s; refetch on window focus for dashboard.
- **Auth state**: Supabase client + a small React Context that exposes `{ user, role, loading }`. No external store needed.
- **Form state**: React Hook Form + Zod resolver.
- **UI state** (modals, tabs): local `useState`. No global store — Zustand not needed for MVP scope.
- **Where state lives**: page-level queries fetch server data; child components receive via props or read the same query key (React Query dedupes).

---

## 7. Authentication & Authorization Plan

- **Supabase Auth** with email/password (manager creates worker accounts manually in MVP — no public signup).
- `users` table mirrors `auth.users` via trigger; `role` column is the source of truth.
- **Server-side session**: `@supabase/ssr` with cookies; `middleware.ts` refreshes the session and gates `(dashboard)` routes — unauthenticated → `/login`.
- **Role enforcement**:
  - In Route Handlers: `requireRole('manager')` helper that throws 403.
  - In RLS: policies reference `public.users.role` for products & deletes.
  - In UI: hide manager-only buttons via `useRole()` (cosmetic; server is source of truth).
- **Soft delete**: only managers; performed via Route Handler that sets `deleted_at`. RLS denies hard `DELETE` to everyone.

---

## 8. UI/UX Implementation Plan

### Global
- `html dir="rtl" lang="ar"` in `app/layout.tsx`.
- Tailwind with logical properties (`ms-*`, `me-*`, `ps-*`, `pe-*`) instead of `ml/mr`.
- Arabic font (Cairo or Tajawal) loaded via `next/font`.
- Mobile-first: design at 375px first; scale up with `md:`/`lg:`.
- Bottom nav on mobile (icons + Arabic labels), side nav on `md+`.

### Page structure
1. `/` Dashboard — 4 stat cards.
2. `/customers` — search + list + "+" FAB.
3. `/debts/wholesale` and `/debts/retail` — tabbed shell.
4. `/orders` — list with status filter chips.
5. `/orders/new`, `/orders/[id]` — multi-item form.
6. `/inventory` — list with type badges.
7. `/tasks` — simple list with checkbox.

### Component hierarchy (key)
- `AppShell` → `TopBar` + `BottomNav` + `<main>{children}</main>`.
- Forms: `Form > FormField > Input/Select`.
- Tables on desktop, stacked Cards on mobile (single component, responsive).
- `Modal` / `Sheet` (drawer from bottom on mobile) for create-customer-inside-order popup.

### Navigation flow
- Dashboard → any module via bottom nav.
- Order create → Customer popup → returns selected customer to order form (no navigation).
- Debts list → Debt detail → add payment (sheet).

---

## 9. Data Flow & Business Logic

### Read flow
`Page → React Query hook → Supabase client (RLS-protected) → render`

### Write flow
`Form (RHF + Zod) → fetch('/api/...') → Route Handler → Zod re-validate → role check → Supabase admin client → DB → triggers update derived fields → response → React Query invalidates → UI updates`

### Key business rules
- **Debts**: `remaining` is a generated column = `amount_total - amount_paid`. Adding/removing a payment fires a trigger that updates `debts.amount_paid`. UI never computes `remaining` for persistence.
- **Orders**: `order_items.total_price` is a generated column. `orders.total_price` is recalculated by trigger whenever items change. Editing an order is allowed at any status.
- **Customers in orders**: if `customer_id` is null, `customer_name` must be provided (DB check constraint).
- **Inventory**: stock is manual — no trigger reduces `products.quantity` from order items.
- **Soft delete**: every list query filters `WHERE deleted_at IS NULL` (use Postgres views like `customers_active`).
- **Role gating**: only `manager` can hit `DELETE` endpoints and product write endpoints.

---

## 10. MVP Roadmap

### Milestone 1 — Foundation (Week 1)
Project setup, Supabase wiring, RTL/Arabic shell, auth + login, protected layout, role helper.

### Milestone 2 — Customers + Orders + Debts (Weeks 2–3) *(PRD Phase 1)*
Deliver the core flow a worker uses daily: create customer → create order → record debt → take payment.

### Milestone 3 — Inventory + Tasks + Dashboard (Week 4) *(PRD Phase 2)*
Manager tooling and overview metrics.

### Milestone 4 — PDF Export + Polish (Week 5) *(PRD Phase 3)*
PDF endpoints, soft-delete UX, empty/loading/error states, accessibility.

### Delay until post-MVP
- Notifications, deadlines on tasks.
- Variant system for products.
- Auto stock deduction.
- Hard-delete cron job.
- Activity log / audit trail.
- Multi-language (currently Arabic only).

---

## 11. Risks & Complexity Areas

| Risk | Why it matters | Mitigation |
|---|---|---|
| **RTL + Arabic in PDFs** | Most PDF libraries render Arabic LTR or break ligatures | Pick a library with confirmed Arabic shaping (pdfmake with custom Amiri/Cairo font, or `@react-pdf/renderer` with bidi setup); prototype in Phase 0. |
| **Order-with-items transactional write** | Partial writes corrupt totals | Use a Supabase RPC (`create_order_with_items`) wrapping insert in a single transaction. |
| **Generated columns + triggers feedback loops** | Mis-ordered triggers cause stale `total_price` / `amount_paid` | Write integration tests on the SQL layer; keep one trigger per derived field. |
| **Soft delete leaking into queries** | Deleted rows showing up everywhere | Create `customers_active`, `orders_active`, etc. views and read from those. |
| **Role enforcement drift** | UI hides button but API still allows it (or vice versa) | Single `requireRole()` helper used in every mutating handler; cover with a test matrix. |
| **Phone uniqueness vs. soft delete** | Re-creating a deleted customer with same phone fails on unique index | Use partial unique index `WHERE deleted_at IS NULL`. |
| **Mobile-first with desktop tables** | Two-layout duplication | Build one responsive component (cards on mobile → table on `md+`) from the start. |
| **Search performance with Arabic text** | `ILIKE` on Arabic can be slow / accent-insensitive issues | Add `pg_trgm` GIN index on `customers.name` if/when search lags. |
| **Currency / decimal precision** | Floats cause off-by-cent errors | Use `numeric(12,2)` for all money columns. |
| **No notifications/deadlines** | Out of scope per PRD; pressure may rise to add | Hold the line until MVP ships; capture requests in a backlog file. |

---

## Verification

End-to-end checks once each milestone ships:

1. **Auth**: log in as worker → cannot see manager-only buttons; hit `DELETE /api/customers/[id]` directly → 403. Log in as manager → succeeds.
2. **Customers**: create, edit, search by Arabic name and by phone. Phone uniqueness error surfaces in Arabic.
3. **Orders**: create with 3 items → `orders.total_price` matches sum of items. Edit an item → total updates via trigger. Status transitions work.
4. **Debts**: create debt 1000, add payment 300 → `remaining` reads 700. Delete payment → returns to 1000. Tabs filter correctly.
5. **Inventory**: worker cannot create product (UI hidden + API 403). Manager can. Manual stock edit persists.
6. **Tasks**: create unassigned + assigned tasks; mark done.
7. **Dashboard**: numbers match raw SQL counts.
8. **PDF**: export single-customer debts → opens in viewer with correct Arabic shaping and RTL alignment.
9. **Soft delete**: deleted customer disappears from all lists; phone can be reused.
10. **Mobile check**: every page works at 375px width with bottom nav.

---

## Critical files (to be created)

- `app/layout.tsx` — RTL + Arabic font shell
- `middleware.ts` — auth gate
- `lib/supabase/{server,client,admin}.ts`
- `lib/auth/requireRole.ts`
- `supabase/migrations/` — one file per phase
- `app/api/orders/route.ts` — order+items transactional write
- `lib/pdf/` — Arabic-capable PDF builders
