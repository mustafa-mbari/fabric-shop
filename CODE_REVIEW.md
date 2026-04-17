# Code Review — Fabric Shop Manager

**Date:** 2026-04-18  
**Reviewed by:** Claude Code (automated + manual spot-checks)  
**Scope:** Full codebase — API routes, components, hooks, lib, migrations, config

---

## 🔴 Critical Bugs

### 1. Payment default value is always 0
**File:** [app/(dashboard)/debts/[id]/DebtDetail.tsx](app/(dashboard)/debts/[id]/DebtDetail.tsx#L37)

```ts
defaultValues: { amount: Math.min(maxAmount, 0) }
//                                           ^ always 0
```

`Math.min(x, 0)` returns 0 for any positive `x`. The intent is clearly to pre-fill the full remaining amount. Should be:
```ts
defaultValues: { amount: maxAmount }
```

---

### 2. ProductDetail loses `color` and `price` on every edit
**File:** [app/(dashboard)/inventory/[id]/ProductDetail.tsx](app/(dashboard)/inventory/[id]/ProductDetail.tsx#L67-L73)

```tsx
defaultValues={{
  name:        product.name,
  type:        product.type,
  quantity:    product.quantity,
  description: product.description ?? undefined,
  // ❌ color and price missing — silently cleared on save
}}
```

Migration 0012 added `color` and `price` to products. The form `defaultValues` doesn't include them, so submitting the edit form sends `undefined` for both, overwriting existing values with null.

**Fix:**
```tsx
defaultValues={{
  name:        product.name,
  type:        product.type,
  quantity:    product.quantity,
  description: product.description ?? undefined,
  color:       product.color ?? undefined,
  price:       product.price ?? undefined,
}}
```

---

### 3. `database.types.ts` missing `color` and `price` on products
**File:** [types/database.types.ts](types/database.types.ts#L257-L266)

The generated types file predates migration 0012. The `products.Row` type currently is:
```ts
Row: { id, name, type, quantity, description, created_at, deleted_at }
// ❌ color and price absent
```

This means TypeScript won't catch references to `product.color` or `product.price` and IDE autocompletion won't include them.

**Fix:** Run `supabase gen types typescript --local > types/database.types.ts` (or against the remote project).

---

## 🟠 Security Issues

### 4. Orders PATCH has no role check — any worker can edit orders
**File:** [app/api/orders/[id]/route.ts](app/api/orders/[id]/route.ts#L51-L57)

The PATCH handler checks authentication (user must be logged in) but does not call `requireRole()`. Any authenticated worker can change order status, prices, or items. Compare with DELETE on line 99, which correctly requires manager.

Decide whether workers should be allowed to edit orders. If not, add:
```ts
try { await requireRole("manager"); } catch (res) { return res as Response; }
```

---

### 5. Pending users can call any `/api/*` route
**File:** [middleware.ts](middleware.ts#L67)

```ts
if (status === "pending" && !isPendingPath && !pathname.startsWith("/api")) {
//                                            ^^^^^^^^^^^^^^^^^^^^^^^^^^^
//                                            API routes are explicitly excluded
```

Middleware redirects pending users away from UI pages but explicitly skips API routes. A pending user who knows the API can read and mutate data freely.

**Fix:** Remove the `/api` exclusion, or add a separate early-return for pending users on API paths:
```ts
if (status === "pending" && !isPendingPath) {
  if (pathname.startsWith("/api")) {
    return NextResponse.json({ error: "حساب قيد الانتظار" }, { status: 403 });
  }
  return NextResponse.redirect(new URL("/pending", request.url));
}
```

---

### 6. Admin page has no server-side role check
**File:** [app/(dashboard)/admin/users/page.tsx](app/(dashboard)/admin/users/page.tsx)

```tsx
export default function AdminUsersPage() {
  return (
    <AppShell title="إدارة المستخدمين">
      <AdminUsersList />
    </AppShell>
  );
}
```

The page has zero role enforcement. Any authenticated worker who navigates to `/admin/users` directly (bypassing the SideNav) can load the page. The `AdminUsersList` component does check `isSuperAdmin` before rendering the role-change control, but the page and user list itself is exposed.

**Fix:** Add a server-side guard in the page:
```tsx
import { redirect } from "next/navigation";
import { getRole } from "@/lib/auth/requireRole";

export default async function AdminUsersPage() {
  const role = await getRole();
  if (role !== "manager" && role !== "super_admin") redirect("/");
  // ...
}
```

---

### 7. Unsafe `as unknown as` cast bypasses type safety in `requireRole`
**File:** [lib/auth/requireRole.ts](lib/auth/requireRole.ts#L19-L23)

```ts
const raw = await supabase.from("users").select("*").eq("id", user.id).single();
const row = raw as unknown as { data: UserRow | null };
if (!row.data) return null;
return row.data.role as UserRole;
```

The Supabase client already returns `{ data, error }` — the double-cast discards the `error` field. A DB error (e.g. connection timeout) will be silently treated as "user not found" and `getRole()` returns `null`, potentially letting a request through that should fail.

**Fix:**
```ts
const { data, error } = await supabase.from("users").select("role").eq("id", user.id).single();
if (error || !data) return null;
return data.role as UserRole;
```

---

### 8. Missing role checks on financial POST routes
The following POST handlers check authentication but do not enforce manager-only access for operations that affect money or customer records:

| Route | File |
|-------|------|
| Create customer | [app/api/customers/route.ts](app/api/customers/route.ts#L38) |
| Create debt | [app/api/debts/route.ts](app/api/debts/route.ts) |
| Record payment | [app/api/debts/[id]/payments/route.ts](app/api/debts/[id]/payments/route.ts) |

Any worker can currently create debts and record payments without manager approval. Add `requireRole("manager")` to the POST handler of each if the business requires it (verify against PRD).

---

## 🟡 Data / Schema Issues

### 9. `order_items.quantity` is `numeric` in DB but `integer` in Zod
**File:** [supabase/migrations/0006_orders.sql](supabase/migrations/0006_orders.sql)

```sql
quantity  numeric NOT NULL CHECK (quantity > 0)
```

The DB column accepts `0.001`. Zod schema validates `.int()`, so the client will reject fractional quantities, but a direct RPC or SQL call bypasses that check. If integer-only quantities are the requirement (whole meters/units), change the column to `integer` or add `CHECK (quantity = floor(quantity))`.

---

### 10. `created_by` not enforced in RLS insert policies
**Files:** migrations 0004–0009

Multiple tables have `created_by uuid NOT NULL REFERENCES users(id)` but insert RLS policies use `WITH CHECK (true)`. A client can forge attribution by passing any valid user UUID as `created_by`.

**Fix:** Add `WITH CHECK (created_by = auth.uid())` to all insert policies for `orders`, `debts`, `tasks`.

---

### 11. Filter query params not validated by Zod
**Files:** [app/api/debts/route.ts](app/api/debts/route.ts), [app/api/orders/route.ts](app/api/orders/route.ts)

```ts
const type = searchParams.get("type");          // passed directly to .eq("type", type)
const status = searchParams.get("status");      // passed directly to .eq("status", status)
```

Invalid enum values silently return an empty result set with 200 OK, hiding bugs and making debugging hard.

**Fix:**
```ts
const typeResult = z.enum(["WHOLESALE", "RETAIL"]).optional().safeParse(
  searchParams.get("type") ?? undefined
);
if (!typeResult.success) return NextResponse.json({ error: "نوع غير صالح" }, { status: 400 });
```

---

### 12. `paymentId` query param not validated as UUID
**File:** [app/api/debts/[id]/payments/route.ts](app/api/debts/[id]/payments/route.ts#L69)

```ts
const paymentId = searchParams.get("paymentId");
if (!paymentId) return NextResponse.json(...)
// passed directly to .eq("id", paymentId)
```

No UUID format check. Malformed input is passed to the DB query. Add:
```ts
const uuidResult = z.string().uuid().safeParse(paymentId);
if (!uuidResult.success) return NextResponse.json({ error: "معرّف غير صالح" }, { status: 400 });
```

---

## 🔵 UX / Component Bugs

### 13. Payment form has no maximum amount constraint
**File:** [app/(dashboard)/debts/[id]/DebtDetail.tsx](app/(dashboard)/debts/[id]/DebtDetail.tsx)

The payment input has `min={250}` but no `max`. A user can enter an amount larger than the remaining debt. The API route should reject it, but the form gives no instant feedback.

**Fix:** Pass `max={maxAmount}` to the input and add a Zod `.max(maxAmount)` constraint on the `paymentCreateSchema` (or pass `maxAmount` as context and validate server-side).

---

### 14. Search inputs not debounced
**Files:** [app/(dashboard)/customers/CustomersList.tsx](app/(dashboard)/customers/CustomersList.tsx), [app/(dashboard)/inventory/InventoryList.tsx](app/(dashboard)/inventory/InventoryList.tsx), [app/(dashboard)/orders/OrdersList.tsx](app/(dashboard)/orders/OrdersList.tsx)

Every character typed in the search box fires a separate `fetch()` call. On slow connections this creates a backlog of in-flight requests.

**Fix:** Debounce 300–500 ms. Since there's no shared debounce utility yet, the simplest approach is a local `useEffect` with `setTimeout`:
```ts
const [debouncedSearch, setDebouncedSearch] = useState(search);
useEffect(() => {
  const t = setTimeout(() => setDebouncedSearch(search), 300);
  return () => clearTimeout(t);
}, [search]);
// pass debouncedSearch to useCustomers / useProducts / useOrders
```

---

### 15. Missing `dir="ltr"` on email inputs
**Files:** [app/(dashboard)/account/AccountView.tsx](app/(dashboard)/account/AccountView.tsx#L96), [app/(dashboard)/admin/users/AdminUsersList.tsx](app/(dashboard)/admin/users/AdminUsersList.tsx#L97)

Phone inputs correctly have `dir="ltr"` across the app. Email inputs in the account and admin pages are missing this attribute, causing the cursor and text alignment to behave incorrectly on RTL layouts.

---

### 16. Order form allows submitting with zero items
**File:** [app/(dashboard)/orders/new/NewOrderForm.tsx](app/(dashboard)/orders/new/NewOrderForm.tsx)

A user can remove all items and still press Submit. The Zod schema (`items: z.array(...).min(1)`) will reject it, but the error only appears after an API round-trip. Disable the submit button when `fields.length === 0`:
```tsx
<button disabled={isPending || fields.length === 0} ...>
```

---

## ⚪ Minor Improvements

### 17. `useRole()` can show stale role after admin changes it
**File:** [hooks/useRole.ts](hooks/useRole.ts#L14)

The hook reads `user_metadata.role`, which is written at registration and again when the admin updates the role via the admin panel. However, `user_metadata` is stored in the JWT — the client won't see the updated role until the session is refreshed (next sign-in or token refresh cycle). For UI gating this is acceptable, but add a comment so future developers don't rely on it for security decisions.

---

### 18. API response format inconsistent across routes
Several routes respond differently for similar operations:

| Route | Success response |
|-------|-----------------|
| `GET /api/customers` | `{ data: [...] }` |
| `PATCH /api/account` | bare `{ id, full_name, role }` object |
| `PATCH /api/debts/[id]` | `{ success: true }` |
| `DELETE /api/orders/[id]` | `{ success: true }` |

Standardize: `{ data: T }` for all reads/creates/updates; `{ success: true }` only for deletes where no payload is returned.

---

### 19. Wrong HTTP status for not-found on product update
**File:** [app/api/products/[id]/route.ts](app/api/products/[id]/route.ts)

When a PATCH finds no matching product, the route returns 500. It should return 404 with an Arabic error message:
```ts
if (!result.data) return NextResponse.json({ error: "المنتج غير موجود" }, { status: 404 });
```

---

### 20. `MIN_DENOMINATION` magic number repeated across schemas
**Files:** [lib/validation/order.ts](lib/validation/order.ts), [lib/validation/debt.ts](lib/validation/debt.ts), [lib/validation/product.ts](lib/validation/product.ts)

The literal `250` appears in three Zod schemas and in `lib/utils/money.ts`. Extract to a shared constant:
```ts
// lib/utils/money.ts
export const MIN_DENOMINATION = 250; // smallest IQD denomination
```
Then use `z.number().int().nonnegative().multipleOf(MIN_DENOMINATION)` in all schemas.

---

### 21. `DebtsPDF` recalculates totals client-side instead of trusting the DB
**File:** [lib/pdf/DebtsPDF.tsx](lib/pdf/DebtsPDF.tsx#L123-L125)

```ts
const totalRemaining = debts.reduce((s, d) => s + Number(d.remaining), 0);
```

`remaining` is already a DB-generated column — the reduce is correct. But `amount_total` and `amount_paid` are also summed with `Number()`, converting potentially large bigint values. For IQD values up to a few billion this is safe (within JS `Number.MAX_SAFE_INTEGER`), but add a comment noting the assumption.

---

### 22. No security headers configured
**File:** [next.config.ts](next.config.ts)

No `X-Frame-Options`, `X-Content-Type-Options`, or CSP headers. For an internal app this is lower priority, but add at minimum:
```ts
async headers() {
  return [{
    source: "/:path*",
    headers: [
      { key: "X-Frame-Options", value: "SAMEORIGIN" },
      { key: "X-Content-Type-Options", value: "nosniff" },
    ],
  }];
},
```

---

## Summary

| # | Severity | Issue | Status |
|---|----------|-------|--------|
| 1 | 🔴 Critical | Payment default always 0 | Fix now |
| 2 | 🔴 Critical | ProductDetail loses color/price on edit | Fix now |
| 3 | 🔴 Critical | `database.types.ts` missing products fields | Fix now |
| 4 | 🟠 Security | Orders PATCH has no role check | Decide & fix |
| 5 | 🟠 Security | Pending users bypass API guard in middleware | Fix now |
| 6 | 🟠 Security | Admin page unprotected server-side | Fix now |
| 7 | 🟠 Security | Unsafe cast in `requireRole` hides DB errors | Fix now |
| 8 | 🟠 Security | Missing role checks on financial POSTs | Decide & fix |
| 9 | 🟡 Schema | `quantity` is `numeric` not integer in DB | Fix in migration |
| 10 | 🟡 Schema | `created_by` not enforced by RLS | Fix in migration |
| 11 | 🟡 Schema | Filter query params not Zod-validated | Fix now |
| 12 | 🟡 Schema | `paymentId` not validated as UUID | Fix now |
| 13 | 🔵 UX | Payment form missing `max` constraint | Fix now |
| 14 | 🔵 UX | Search inputs fire on every keystroke | Fix now |
| 15 | 🔵 UX | Email inputs missing `dir="ltr"` | Fix now |
| 16 | 🔵 UX | Order form submittable with 0 items | Fix now |
| 17 | ⚪ Minor | `useRole` can show stale role | Add comment |
| 18 | ⚪ Minor | API response format inconsistent | Standardize |
| 19 | ⚪ Minor | Wrong 500 status for not-found on PATCH | Fix to 404 |
| 20 | ⚪ Minor | `250` magic number repeated in schemas | Extract constant |
| 21 | ⚪ Minor | PDF bigint conversion assumption undocumented | Add comment |
| 22 | ⚪ Minor | No security headers in next.config.ts | Add headers |
