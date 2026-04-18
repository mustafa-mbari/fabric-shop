-- Add product_type free-text field (e.g. قطن، حرير، بوليستر)
ALTER TABLE public.products ADD COLUMN product_type text;
