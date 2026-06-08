-- Run in Supabase SQL editor for NextStep integration
ALTER TABLE orders ADD COLUMN IF NOT EXISTS courier_provider text;
ALTER TABLE manual_orders ADD COLUMN IF NOT EXISTS courier_provider text;
