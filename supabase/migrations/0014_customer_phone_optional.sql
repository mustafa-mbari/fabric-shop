-- Make customer phone optional (nullable)
-- NULL values do not violate the partial unique index, so no index changes needed
ALTER TABLE public.customers ALTER COLUMN phone DROP NOT NULL;
