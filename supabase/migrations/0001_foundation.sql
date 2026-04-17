-- =============================================================================
-- Migration: 0001_foundation
-- Creates all shared enums, the users table, auth trigger, RLS policies,
-- and the users_active view.
-- All four enums are created here upfront so later migrations can reference
-- them without ordering dependencies.
-- =============================================================================

-- ---------------------------------------------------------------------------
-- ENUMS
-- ---------------------------------------------------------------------------

CREATE TYPE user_role    AS ENUM ('worker', 'manager');
CREATE TYPE order_status AS ENUM ('NEW', 'IN_PROGRESS', 'ON_HOLD', 'READY', 'DELIVERED');
CREATE TYPE debt_type    AS ENUM ('WHOLESALE', 'RETAIL');
CREATE TYPE product_type AS ENUM ('METER', 'UNIT');

-- ---------------------------------------------------------------------------
-- USERS TABLE
-- Mirrors auth.users. The trigger below keeps them in sync.
-- ---------------------------------------------------------------------------

CREATE TABLE public.users (
  id          uuid        PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  full_name   text,
  role        user_role   NOT NULL DEFAULT 'worker',
  created_at  timestamptz NOT NULL DEFAULT now(),
  deleted_at  timestamptz
);

CREATE INDEX idx_users_role ON public.users (role);

-- ---------------------------------------------------------------------------
-- TRIGGER: auth.users INSERT → public.users INSERT
-- Fires when Supabase Auth creates a new user account.
-- ---------------------------------------------------------------------------

CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  INSERT INTO public.users (id, full_name, role)
  VALUES (
    NEW.id,
    COALESCE(NEW.raw_user_meta_data->>'full_name', NEW.email),
    'worker'
  );
  RETURN NEW;
END;
$$;

CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- ---------------------------------------------------------------------------
-- HELPER: is_manager()
-- Used in RLS policies to check role without recursion.
-- ---------------------------------------------------------------------------

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
      AND role = 'manager'
      AND deleted_at IS NULL
  );
$$;

-- ---------------------------------------------------------------------------
-- RLS
-- ---------------------------------------------------------------------------

ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;

-- Authenticated users can read all non-deleted users (needed for task assignment)
CREATE POLICY "users: authenticated can select"
  ON public.users
  FOR SELECT
  TO authenticated
  USING (deleted_at IS NULL);

-- Users can update their own full_name only
CREATE POLICY "users: can update own profile"
  ON public.users
  FOR UPDATE
  TO authenticated
  USING (id = auth.uid())
  WITH CHECK (id = auth.uid());

-- Managers can update any user (e.g. change role)
CREATE POLICY "users: manager can update all"
  ON public.users
  FOR UPDATE
  TO authenticated
  USING (public.is_manager())
  WITH CHECK (public.is_manager());

-- No client-side INSERT (trigger handles it) or hard DELETE (soft delete only via Route Handler)

-- ---------------------------------------------------------------------------
-- ACTIVE VIEW
-- All queries should read from this view to exclude soft-deleted users.
-- ---------------------------------------------------------------------------

CREATE VIEW public.users_active AS
  SELECT * FROM public.users WHERE deleted_at IS NULL;

-- ---------------------------------------------------------------------------
-- GRANTS
-- ---------------------------------------------------------------------------

GRANT USAGE ON SCHEMA public TO anon, authenticated;
GRANT SELECT, UPDATE ON public.users TO authenticated;
GRANT SELECT ON public.users_active TO authenticated;
GRANT EXECUTE ON FUNCTION public.is_manager() TO authenticated;
