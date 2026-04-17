-- Add optional note field to customers
ALTER TABLE public.customers ADD COLUMN IF NOT EXISTS note text;
