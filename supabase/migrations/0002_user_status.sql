-- =============================================================================
-- Migration: 0002_user_status
-- Adds a status field to users for the registration-with-approval flow.
-- New registrations start as 'pending'; admin sets them to 'active'.
-- =============================================================================

CREATE TYPE user_status AS ENUM ('pending', 'active', 'rejected');

ALTER TABLE public.users
  ADD COLUMN status user_status NOT NULL DEFAULT 'pending';

-- Existing users (created before this migration) are treated as active.
UPDATE public.users SET status = 'active';

-- ---------------------------------------------------------------------------
-- Update trigger to read status and role from user_metadata.
-- This lets admin-created users be born as 'active' + 'manager'
-- by passing { status: 'active', role: 'manager' } in user_metadata.
-- Regular self-registrations don't pass these, so they default to
-- 'worker' + 'pending'.
-- ---------------------------------------------------------------------------

CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_role   user_role;
  v_status user_status;
BEGIN
  v_role := COALESCE(
    (NEW.raw_user_meta_data->>'role')::user_role,
    'worker'
  );
  v_status := COALESCE(
    (NEW.raw_user_meta_data->>'status')::user_status,
    'pending'
  );

  INSERT INTO public.users (id, full_name, role, status)
  VALUES (
    NEW.id,
    COALESCE(NEW.raw_user_meta_data->>'full_name', NEW.email),
    v_role,
    v_status
  );
  RETURN NEW;
EXCEPTION WHEN others THEN
  -- Silently ignore if row already exists (idempotent re-runs)
  RETURN NEW;
END;
$$;

-- ---------------------------------------------------------------------------
-- Index for status lookups (middleware checks status on every auth'd request)
-- ---------------------------------------------------------------------------

CREATE INDEX idx_users_status ON public.users (status);

-- ---------------------------------------------------------------------------
-- RLS: managers can update any user's status
-- (reusing the existing is_manager() helper)
-- ---------------------------------------------------------------------------

CREATE POLICY "users: manager can update status"
  ON public.users
  FOR UPDATE
  TO authenticated
  USING (public.is_manager())
  WITH CHECK (public.is_manager());
