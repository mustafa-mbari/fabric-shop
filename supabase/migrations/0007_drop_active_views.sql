-- Drop redundant *_active views — the API layer filters deleted_at IS NULL directly.
-- These views appeared as duplicate "tables" in the Supabase dashboard.
DROP VIEW IF EXISTS public.customers_active;
DROP VIEW IF EXISTS public.orders_active;
DROP VIEW IF EXISTS public.products_active;
DROP VIEW IF EXISTS public.users_active;
