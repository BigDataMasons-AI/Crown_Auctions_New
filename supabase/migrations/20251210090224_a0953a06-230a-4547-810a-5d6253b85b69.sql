-- Add shipping_label_url column to auctions table
ALTER TABLE public.auctions ADD COLUMN shipping_label_url TEXT DEFAULT NULL;