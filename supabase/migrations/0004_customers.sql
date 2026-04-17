-- Customers table
CREATE TABLE public.customers (
  id         uuid        DEFAULT gen_random_uuid() PRIMARY KEY,
  name       text        NOT NULL,
  phone      text        NOT NULL,
  address    text,
  created_at timestamptz DEFAULT now() NOT NULL,
  deleted_at timestamptz
);

-- Phone unique among non-deleted (allows reuse after soft delete)
CREATE UNIQUE INDEX customers_phone_unique
  ON public.customers (phone)
  WHERE deleted_at IS NULL;

-- Name index for search
CREATE INDEX customers_name_idx ON public.customers (name);

-- RLS
ALTER TABLE public.customers ENABLE ROW LEVEL SECURITY;

CREATE POLICY "customers_select" ON public.customers
  FOR SELECT TO authenticated USING (deleted_at IS NULL);

CREATE POLICY "customers_insert" ON public.customers
  FOR INSERT TO authenticated WITH CHECK (true);

CREATE POLICY "customers_update" ON public.customers
  FOR UPDATE TO authenticated USING (deleted_at IS NULL);

-- Hard deletes denied to everyone; soft delete via UPDATE deleted_at
CREATE POLICY "customers_no_delete" ON public.customers
  FOR DELETE TO authenticated USING (false);

-- Active view used by all queries
CREATE OR REPLACE VIEW public.customers_active AS
  SELECT * FROM public.customers WHERE deleted_at IS NULL;

GRANT SELECT ON public.customers_active TO authenticated;
GRANT SELECT, INSERT, UPDATE ON public.customers TO authenticated;
