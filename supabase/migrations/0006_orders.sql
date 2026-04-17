-- Orders + order_items tables with trigger-maintained total_price
-- =============================================================================

CREATE TABLE public.orders (
  id            uuid         DEFAULT gen_random_uuid() PRIMARY KEY,
  customer_id   uuid         REFERENCES public.customers(id),
  customer_name text,
  status        order_status NOT NULL DEFAULT 'NEW',
  total_price   bigint       NOT NULL DEFAULT 0 CHECK (total_price >= 0),
  notes         text,
  delivery_date date,
  created_by    uuid         NOT NULL REFERENCES public.users(id),
  created_at    timestamptz  DEFAULT now() NOT NULL,
  deleted_at    timestamptz,
  -- Either linked customer or a fallback name must be present
  CONSTRAINT orders_customer_check CHECK (customer_id IS NOT NULL OR customer_name IS NOT NULL)
);

CREATE INDEX orders_customer_idx    ON public.orders (customer_id);
CREATE INDEX orders_status_idx      ON public.orders (status);
CREATE INDEX orders_delivery_idx    ON public.orders (delivery_date);
CREATE INDEX orders_created_by_idx  ON public.orders (created_by);

-- =============================================================================
-- Order items — product snapshot, not FK to products
-- total_price is a generated column: quantity * price_per_unit
-- =============================================================================

CREATE TABLE public.order_items (
  id             uuid    DEFAULT gen_random_uuid() PRIMARY KEY,
  order_id       uuid    NOT NULL REFERENCES public.orders(id) ON DELETE CASCADE,
  product_name   text    NOT NULL,
  quantity       numeric NOT NULL CHECK (quantity > 0),
  price_per_unit bigint  NOT NULL CHECK (price_per_unit >= 0 AND price_per_unit % 250 = 0),
  total_price    bigint  GENERATED ALWAYS AS (CAST(quantity * price_per_unit AS bigint)) STORED
);

CREATE INDEX order_items_order_idx ON public.order_items (order_id);

-- =============================================================================
-- Trigger: recalculate orders.total_price when items change
-- =============================================================================

CREATE OR REPLACE FUNCTION public.recalculate_order_total()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_order_id uuid;
BEGIN
  v_order_id := COALESCE(NEW.order_id, OLD.order_id);
  UPDATE public.orders
    SET total_price = COALESCE(
      (SELECT SUM(total_price) FROM public.order_items WHERE order_id = v_order_id),
      0
    )
  WHERE id = v_order_id;
  RETURN NEW;
END;
$$;

CREATE TRIGGER trg_order_items_total
  AFTER INSERT OR UPDATE OR DELETE ON public.order_items
  FOR EACH ROW EXECUTE FUNCTION public.recalculate_order_total();

-- =============================================================================
-- RPC: create_order_with_items — atomic order + items insert
-- =============================================================================

CREATE OR REPLACE FUNCTION public.create_order_with_items(
  p_customer_id   uuid,
  p_customer_name text,
  p_status        order_status,
  p_notes         text,
  p_delivery_date date,
  p_created_by    uuid,
  p_items         jsonb   -- array of {product_name, quantity, price_per_unit}
)
RETURNS uuid
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_order_id uuid;
  v_item     jsonb;
BEGIN
  INSERT INTO public.orders (customer_id, customer_name, status, notes, delivery_date, created_by)
  VALUES (p_customer_id, p_customer_name, p_status, p_notes, p_delivery_date, p_created_by)
  RETURNING id INTO v_order_id;

  FOR v_item IN SELECT * FROM jsonb_array_elements(p_items)
  LOOP
    INSERT INTO public.order_items (order_id, product_name, quantity, price_per_unit)
    VALUES (
      v_order_id,
      v_item->>'product_name',
      (v_item->>'quantity')::numeric,
      (v_item->>'price_per_unit')::bigint
    );
  END LOOP;

  RETURN v_order_id;
END;
$$;

-- =============================================================================
-- RLS
-- =============================================================================

ALTER TABLE public.orders     ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.order_items ENABLE ROW LEVEL SECURITY;

CREATE POLICY "orders_select" ON public.orders
  FOR SELECT TO authenticated USING (deleted_at IS NULL);

CREATE POLICY "orders_insert" ON public.orders
  FOR INSERT TO authenticated WITH CHECK (true);

CREATE POLICY "orders_update" ON public.orders
  FOR UPDATE TO authenticated USING (deleted_at IS NULL);

CREATE POLICY "orders_no_delete" ON public.orders
  FOR DELETE TO authenticated USING (false);

CREATE POLICY "order_items_select" ON public.order_items
  FOR SELECT TO authenticated USING (true);

CREATE POLICY "order_items_insert" ON public.order_items
  FOR INSERT TO authenticated WITH CHECK (true);

CREATE POLICY "order_items_update" ON public.order_items
  FOR UPDATE TO authenticated USING (true);

CREATE POLICY "order_items_delete" ON public.order_items
  FOR DELETE TO authenticated USING (true);

-- Active views
CREATE OR REPLACE VIEW public.orders_active AS
  SELECT * FROM public.orders WHERE deleted_at IS NULL;

GRANT SELECT ON public.orders_active TO authenticated;
GRANT SELECT, INSERT, UPDATE ON public.orders TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.order_items TO authenticated;
GRANT EXECUTE ON FUNCTION public.create_order_with_items TO authenticated;
