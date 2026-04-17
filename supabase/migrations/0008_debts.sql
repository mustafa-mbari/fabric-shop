-- Debts + Payments with trigger-maintained amount_paid
-- =============================================================================

CREATE TABLE public.debts (
  id           uuid       DEFAULT gen_random_uuid() PRIMARY KEY,
  customer_id  uuid       NOT NULL REFERENCES public.customers(id),
  type         debt_type  NOT NULL,
  amount_total bigint     NOT NULL CHECK (amount_total > 0 AND amount_total % 250 = 0),
  amount_paid  bigint     NOT NULL DEFAULT 0 CHECK (amount_paid >= 0 AND amount_paid % 250 = 0),
  remaining    bigint     GENERATED ALWAYS AS (amount_total - amount_paid) STORED,
  note         text,
  order_id     uuid       REFERENCES public.orders(id),
  created_by   uuid       NOT NULL REFERENCES public.users(id),
  created_at   timestamptz DEFAULT now() NOT NULL,
  deleted_at   timestamptz
);

CREATE INDEX debts_customer_idx ON public.debts (customer_id);
CREATE INDEX debts_type_idx     ON public.debts (type);
CREATE INDEX debts_order_idx    ON public.debts (order_id);

CREATE TABLE public.payments (
  id         uuid        DEFAULT gen_random_uuid() PRIMARY KEY,
  debt_id    uuid        NOT NULL REFERENCES public.debts(id) ON DELETE CASCADE,
  amount     bigint      NOT NULL CHECK (amount > 0 AND amount % 250 = 0),
  note       text,
  created_at timestamptz DEFAULT now() NOT NULL
);

CREATE INDEX payments_debt_idx ON public.payments (debt_id);

-- =============================================================================
-- Trigger: keep debts.amount_paid in sync with sum of payments
-- =============================================================================

CREATE OR REPLACE FUNCTION public.recalculate_debt_paid()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_debt_id uuid;
BEGIN
  v_debt_id := COALESCE(NEW.debt_id, OLD.debt_id);
  UPDATE public.debts
    SET amount_paid = COALESCE(
      (SELECT SUM(amount) FROM public.payments WHERE debt_id = v_debt_id),
      0
    )
  WHERE id = v_debt_id;
  RETURN NEW;
END;
$$;

CREATE TRIGGER trg_payments_paid
  AFTER INSERT OR DELETE ON public.payments
  FOR EACH ROW EXECUTE FUNCTION public.recalculate_debt_paid();

-- =============================================================================
-- RLS
-- =============================================================================

ALTER TABLE public.debts    ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.payments ENABLE ROW LEVEL SECURITY;

CREATE POLICY "debts_select" ON public.debts
  FOR SELECT TO authenticated USING (deleted_at IS NULL);

CREATE POLICY "debts_insert" ON public.debts
  FOR INSERT TO authenticated WITH CHECK (true);

CREATE POLICY "debts_update" ON public.debts
  FOR UPDATE TO authenticated USING (deleted_at IS NULL);

CREATE POLICY "debts_no_delete" ON public.debts
  FOR DELETE TO authenticated USING (false);

CREATE POLICY "payments_select" ON public.payments
  FOR SELECT TO authenticated USING (true);

CREATE POLICY "payments_insert" ON public.payments
  FOR INSERT TO authenticated WITH CHECK (true);

-- Only managers can delete payments
CREATE POLICY "payments_delete" ON public.payments
  FOR DELETE TO authenticated USING (is_manager());

GRANT SELECT, INSERT, UPDATE ON public.debts    TO authenticated;
GRANT SELECT, INSERT, DELETE ON public.payments TO authenticated;
