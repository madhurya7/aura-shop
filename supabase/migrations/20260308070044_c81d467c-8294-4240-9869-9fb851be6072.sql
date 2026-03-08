
CREATE OR REPLACE FUNCTION public.decrement_stock(p_product_id uuid, p_quantity integer)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  UPDATE public.products
  SET stock_quantity = GREATEST(stock_quantity - p_quantity, 0)
  WHERE id = p_product_id;
END;
$$;
