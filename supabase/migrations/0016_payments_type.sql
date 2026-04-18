-- Add type column to payments to distinguish payments from debt additions
-- Trigger must only sum PAYMENT rows for amount_paid

ALTER TABLE public.payments
  ADD COLUMN type text NOT NULL DEFAULT 'PAYMENT'
  CHECK (type IN ('PAYMENT', 'DEBT_ADDED'));

-- Update trigger function to ignore DEBT_ADDED rows
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
      (SELECT SUM(amount) FROM public.payments
       WHERE debt_id = v_debt_id AND type = 'PAYMENT'),
      0
    )
  WHERE id = v_debt_id;
  RETURN NEW;
END;
$$;
