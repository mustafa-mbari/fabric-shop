-- Add email column to public.users so it's visible alongside profile data
ALTER TABLE public.users ADD COLUMN IF NOT EXISTS email text;

-- Backfill from auth.users for existing rows
UPDATE public.users pu
SET email = au.email
FROM auth.users au
WHERE pu.id = au.id AND pu.email IS NULL;

-- Partial unique index: emails must be unique among non-deleted users
CREATE UNIQUE INDEX IF NOT EXISTS users_email_unique
  ON public.users (email)
  WHERE deleted_at IS NULL;

-- Update the trigger so new registrations copy the email automatically
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  INSERT INTO public.users (id, full_name, email, role, status)
  VALUES (
    NEW.id,
    NEW.raw_user_meta_data->>'full_name',
    NEW.email,
    COALESCE((NEW.raw_user_meta_data->>'role')::user_role, 'worker'),
    COALESCE((NEW.raw_user_meta_data->>'status')::user_status, 'pending')
  );
  RETURN NEW;
END;
$$;
