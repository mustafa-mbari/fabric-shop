-- Add store_worker to user_role enum.
-- store_worker has access only to inventory and tasks (CRUD).
ALTER TYPE public.user_role ADD VALUE IF NOT EXISTS 'store_worker';

-- Fix is_manager() to include super_admin so RLS update policies work for super admins.
CREATE OR REPLACE FUNCTION public.is_manager()
RETURNS boolean
LANGUAGE sql
SECURITY DEFINER
STABLE
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.users
    WHERE id = auth.uid()
      AND role IN ('manager', 'super_admin')
      AND deleted_at IS NULL
  );
$$;
