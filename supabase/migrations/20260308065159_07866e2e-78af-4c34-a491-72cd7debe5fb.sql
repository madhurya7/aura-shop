
ALTER TABLE public.addresses ADD COLUMN IF NOT EXISTS is_default boolean NOT NULL DEFAULT false;

-- Function to enforce max 5 addresses per user and manage default flag
CREATE OR REPLACE FUNCTION public.enforce_address_limits()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  address_count integer;
BEGIN
  -- Check max 5 addresses
  SELECT count(*) INTO address_count FROM public.addresses WHERE user_id = NEW.user_id;
  IF TG_OP = 'INSERT' AND address_count >= 5 THEN
    RAISE EXCEPTION 'Maximum of 5 addresses allowed per user';
  END IF;

  -- If this is set as default, unset other defaults
  IF NEW.is_default = true THEN
    UPDATE public.addresses SET is_default = false WHERE user_id = NEW.user_id AND id != NEW.id;
  END IF;

  -- If this is the first address, make it default
  IF TG_OP = 'INSERT' AND address_count = 0 THEN
    NEW.is_default := true;
  END IF;

  RETURN NEW;
END;
$$;

CREATE TRIGGER enforce_address_limits_trigger
  BEFORE INSERT OR UPDATE ON public.addresses
  FOR EACH ROW
  EXECUTE FUNCTION public.enforce_address_limits();
