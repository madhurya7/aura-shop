
-- Shipping zones table
CREATE TABLE public.shipping_zones (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  countries jsonb NOT NULL DEFAULT '[]'::jsonb,
  currency_code text NOT NULL DEFAULT 'USD',
  currency_symbol text NOT NULL DEFAULT '$',
  exchange_rate numeric NOT NULL DEFAULT 1.0,
  standard_rate numeric NOT NULL DEFAULT 0,
  express_rate numeric NOT NULL DEFAULT 0,
  standard_days text NOT NULL DEFAULT '7-14 days',
  express_days text NOT NULL DEFAULT '3-5 days',
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.shipping_zones ENABLE ROW LEVEL SECURITY;

-- Everyone can read shipping zones
CREATE POLICY "Shipping zones are viewable by everyone"
ON public.shipping_zones FOR SELECT
USING (true);

-- Only admins can manage
CREATE POLICY "Admins can insert shipping zones"
ON public.shipping_zones FOR INSERT
WITH CHECK (has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Admins can update shipping zones"
ON public.shipping_zones FOR UPDATE
USING (has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Admins can delete shipping zones"
ON public.shipping_zones FOR DELETE
USING (has_role(auth.uid(), 'admin'::app_role));

-- Trigger for updated_at
CREATE TRIGGER update_shipping_zones_updated_at
  BEFORE UPDATE ON public.shipping_zones
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Seed data
INSERT INTO public.shipping_zones (name, countries, currency_code, currency_symbol, exchange_rate, standard_rate, express_rate, standard_days, express_days) VALUES
('India', '["IN"]'::jsonb, 'INR', '₹', 83.0, 150, 400, '5-7 days', '2-3 days'),
('South Asia', '["BD","NP","LK"]'::jsonb, 'USD', '$', 1.0, 8, 20, '7-10 days', '3-5 days'),
('Southeast Asia', '["SG","TH","MY"]'::jsonb, 'USD', '$', 1.0, 10, 25, '7-10 days', '3-5 days'),
('Europe', '["GB","DE","FR"]'::jsonb, 'GBP', '£', 0.79, 8, 22, '7-14 days', '3-5 days'),
('North America', '["US","CA"]'::jsonb, 'USD', '$', 1.0, 5, 15, '5-7 days', '2-3 days'),
('Rest of World', '["*"]'::jsonb, 'USD', '$', 1.0, 15, 35, '14-21 days', '5-7 days');
