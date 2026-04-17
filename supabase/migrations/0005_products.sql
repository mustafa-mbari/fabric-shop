-- Products / Inventory table
CREATE TABLE public.products (
  id          uuid         DEFAULT gen_random_uuid() PRIMARY KEY,
  name        text         NOT NULL,
  type        product_type NOT NULL,
  quantity    numeric      NOT NULL DEFAULT 0 CHECK (quantity >= 0),
  description text,
  created_at  timestamptz  DEFAULT now() NOT NULL,
  deleted_at  timestamptz
);

CREATE INDEX products_name_idx ON public.products (name);

ALTER TABLE public.products ENABLE ROW LEVEL SECURITY;

-- Any authenticated user can read active products
CREATE POLICY "products_select" ON public.products
  FOR SELECT TO authenticated USING (deleted_at IS NULL);

-- Only managers can write
CREATE POLICY "products_insert" ON public.products
  FOR INSERT TO authenticated WITH CHECK (is_manager());

CREATE POLICY "products_update" ON public.products
  FOR UPDATE TO authenticated USING (deleted_at IS NULL) WITH CHECK (is_manager());

-- No hard deletes; soft delete via UPDATE
CREATE POLICY "products_no_delete" ON public.products
  FOR DELETE TO authenticated USING (false);

CREATE OR REPLACE VIEW public.products_active AS
  SELECT * FROM public.products WHERE deleted_at IS NULL;

GRANT SELECT ON public.products_active TO authenticated;
GRANT SELECT, INSERT, UPDATE ON public.products TO authenticated;
