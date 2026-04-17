# CLAUDE.md

Guidance for Claude Code when working in this repository.

## Project

**Fabric Shop Manager** — a mobile-first, RTL Arabic internal web app for a fabric shop. Workers and managers manage customers, debts, orders, inventory, and tasks.

- Product spec: [PRD.md](PRD.md)
- Implementation plan: [IMPLEMENTATION_PLAN.md](IMPLEMENTATION_PLAN.md)

The repo is in the planning/scaffolding phase. Treat `IMPLEMENTATION_PLAN.md` as the authoritative source for architecture decisions, phase order, and conventions.

## Tech stack

- **Framework:** Next.js (App Router, TypeScript)
- **Styling:** Tailwind CSS (logical properties for RTL)
- **Database & Auth:** Supabase (Postgres + RLS + Supabase Auth)
- **Server data:** TanStack React Query
- **Forms:** React Hook Form + Zod
- **PDF:** pdfmake or `@react-pdf/renderer` with embedded Arabic font

## Non-negotiables

1. **Arabic + RTL only.** `<html dir="rtl" lang="ar">`. Use Tailwind logical properties (`ms-*`, `me-*`, `ps-*`, `pe-*`) — never `ml/mr`.
2. **Mobile-first.** Design at 375px first; bottom nav on mobile, side nav on `md+`. Build one responsive component per list (cards on mobile → table on `md+`).
3. **Derived values live in the database.**
   - `orders.total_price`, `debts.amount_paid` updated by triggers.
   - `order_items.total_price`, `debts.remaining` are GENERATED columns.
   - The UI never persists computed totals — it reads them back from the DB.
4. **Money is `numeric(12,2)`.** Never `float`/`double`.
5. **Soft delete only.** Every soft-deletable table has `deleted_at`. Reads go through `*_active` views. RLS denies hard `DELETE` to all clients.
6. **Role enforcement is server-side.** UI hiding a button is cosmetic. Every mutating Route Handler calls `requireRole()` where needed. Manager-only: product writes and all deletes.
7. **Transactional writes** (e.g. order + items) go through Supabase RPCs, not multiple client calls.
8. **Server always re-validates with Zod** — never trust client-side validation.
9. **Phone uniqueness** uses a **partial** unique index `WHERE deleted_at IS NULL` so phones can be reused after soft delete.

## Architecture shape

- Next.js hosts both UI (App Router pages) and API (Route Handlers under `app/api/`).
- Reads use the Supabase JS client (anon key, protected by RLS).
- Writes go through Route Handlers: parse → Zod validate → `requireRole` if needed → service-role client → DB.
- Session is refreshed in `middleware.ts`; `(dashboard)` routes are gated there.

## Folder conventions

```
app/(auth)/        login + auth layout
app/(dashboard)/   protected pages (customers, debts, orders, inventory, tasks)
app/api/           REST Route Handlers — one folder per resource
components/        ui/, forms/, tables/, layout/, dashboard/
lib/supabase/      client.ts (browser), server.ts (cookies), admin.ts (service role)
lib/auth/          getSession, requireRole
lib/validation/    Zod schemas — one per resource per action, shared with forms
lib/pdf/           Arabic-capable PDF builders
hooks/             React Query hooks per resource
supabase/migrations/  ordered SQL migrations
```

**Naming:** kebab-case routes, PascalCase components, camelCase hooks/utilities, snake_case DB tables/columns (plural table names).

## Data model summary

Tables: `users`, `customers`, `products`, `orders`, `order_items`, `debts`, `payments`, `tasks`.

Key relationships:
- `orders.customer_id` → `customers` (nullable; `customer_name` is fallback).
- `order_items.order_id` → `orders` (cascade delete).
- `debts.customer_id` → `customers` (required); `debts.order_id` → `orders` (optional).
- `payments.debt_id` → `debts` (cascade delete).
- `tasks.assigned_to`, `tasks.created_by` → `users`.

Enums: `orders.status` = `NEW | IN_PROGRESS | ON_HOLD | READY | DELIVERED`; `debts.type` = `WHOLESALE | RETAIL`; `products.type` = `METER | UNIT`; `users.role` = `worker | manager`.

Products are loose strings per PRD (name includes color, e.g. "Cotton Fabric - Red"). `order_items.product_name` is a snapshot, **not** a foreign key — orders must not break if a product is later renamed or deleted.

## Build order

Follow [IMPLEMENTATION_PLAN.md](IMPLEMENTATION_PLAN.md) §4. Do not reorder without updating the plan.

```
Foundation → Customers ─┬→ Orders ─┐
                        └→ Debts ──┤
              Inventory ───────────┤→ Dashboard → PDF Export → Polish
              Tasks ───────────────┘
```

## Working rules for Claude

- **Read [IMPLEMENTATION_PLAN.md](IMPLEMENTATION_PLAN.md) first** whenever touching architecture, migrations, or a new module.
- **Never** bypass Zod validation on Route Handlers, even "just this once."
- **Never** compute `remaining` or `total_price` in client code for persistence — read it back from the DB.
- **Never** use `ml-*`/`mr-*` Tailwind classes — always logical (`ms-*`/`me-*`).
- **Never** expose the service-role key to the client.
- One migration file per phase in `supabase/migrations/`, named sequentially.
- When adding a new API route, re-use or extend an existing Zod schema in `lib/validation/` before creating a new one.
- Don't add features outside the PRD (notifications, deadlines, variants, auto stock deduction) — capture requests in a backlog instead.
- Don't add comments that just describe what the code does; only add comments for non-obvious *why*.

## Commands

Commands will be added to this section once the Next.js project is scaffolded (Phase 0 of the plan). Expected:

- `npm run dev` — local dev server
- `npm run build` / `npm run start` — production build
- `npm run lint` / `npm run typecheck`
- `supabase start` / `supabase db reset` / `supabase db push` — local DB workflow
