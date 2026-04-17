ALTER TABLE public.products
  ADD COLUMN color text,
  ADD COLUMN price bigint CHECK (price IS NULL OR (price >= 0 AND price % 250 = 0));
