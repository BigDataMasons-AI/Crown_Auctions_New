-- Add customer_id column to auctions table for unique customer identification
ALTER TABLE public.auctions ADD COLUMN customer_id TEXT DEFAULT NULL;