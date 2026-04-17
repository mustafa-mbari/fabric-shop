-- =============================================================================
-- Tasks table
-- =============================================================================

CREATE TABLE public.tasks (
  id          uuid        DEFAULT gen_random_uuid() PRIMARY KEY,
  title       text        NOT NULL,
  description text,
  assigned_to uuid        REFERENCES public.users(id),
  created_by  uuid        NOT NULL REFERENCES public.users(id),
  done        boolean     NOT NULL DEFAULT false,
  created_at  timestamptz DEFAULT now() NOT NULL,
  deleted_at  timestamptz
);

CREATE INDEX tasks_assigned_idx ON public.tasks (assigned_to);
CREATE INDEX tasks_done_idx     ON public.tasks (done);

ALTER TABLE public.tasks ENABLE ROW LEVEL SECURITY;

CREATE POLICY "tasks_select" ON public.tasks
  FOR SELECT TO authenticated USING (deleted_at IS NULL);

CREATE POLICY "tasks_insert" ON public.tasks
  FOR INSERT TO authenticated WITH CHECK (true);

CREATE POLICY "tasks_update" ON public.tasks
  FOR UPDATE TO authenticated USING (deleted_at IS NULL);

-- Only managers can hard-soft-delete tasks
CREATE POLICY "tasks_no_delete" ON public.tasks
  FOR DELETE TO authenticated USING (false);

GRANT SELECT, INSERT, UPDATE ON public.tasks TO authenticated;

-- =============================================================================
-- Dashboard summary RPC
-- =============================================================================

CREATE OR REPLACE FUNCTION public.dashboard_summary()
RETURNS json
LANGUAGE sql
SECURITY DEFINER
SET search_path = public
STABLE
AS $$
  SELECT json_build_object(
    'total_customers',     (SELECT COUNT(*)                    FROM customers WHERE deleted_at IS NULL),
    'orders_today',        (SELECT COUNT(*)                    FROM orders    WHERE deleted_at IS NULL AND created_at::date = CURRENT_DATE),
    'orders_in_progress',  (SELECT COUNT(*)                    FROM orders    WHERE deleted_at IS NULL AND status = 'IN_PROGRESS'),
    'total_debt_remaining',(SELECT COALESCE(SUM(remaining), 0) FROM debts     WHERE deleted_at IS NULL),
    'tasks_pending',       (SELECT COUNT(*)                    FROM tasks     WHERE deleted_at IS NULL AND done = false)
  );
$$;

GRANT EXECUTE ON FUNCTION public.dashboard_summary() TO authenticated;
