ALTER TABLE public.products ADD COLUMN display_order integer NOT NULL DEFAULT 0;

-- Set initial order based on created_at (newest first gets lowest number)
WITH ordered AS (
  SELECT id, ROW_NUMBER() OVER (ORDER BY created_at ASC) as rn
  FROM public.products
)
UPDATE public.products SET display_order = ordered.rn FROM ordered WHERE products.id = ordered.id;