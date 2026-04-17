-- Enforce created_by = auth.uid() on insert policies for orders, debts, tasks.
-- Previously these used WITH CHECK (true), allowing any authenticated client to
-- attribute a row to a different user by supplying an arbitrary created_by UUID.
-- App writes go through the service-role client (bypasses RLS), so normal flows
-- are unaffected — this closes the gap for direct Supabase REST/JS API calls.

-- Orders
DROP POLICY IF EXISTS "orders_insert" ON public.orders;
CREATE POLICY "orders_insert" ON public.orders
  FOR INSERT TO authenticated
  WITH CHECK (created_by = auth.uid());

-- Debts
DROP POLICY IF EXISTS "debts_insert" ON public.debts;
CREATE POLICY "debts_insert" ON public.debts
  FOR INSERT TO authenticated
  WITH CHECK (created_by = auth.uid());

-- Tasks
DROP POLICY IF EXISTS "tasks_insert" ON public.tasks;
CREATE POLICY "tasks_insert" ON public.tasks
  FOR INSERT TO authenticated
  WITH CHECK (created_by = auth.uid());
