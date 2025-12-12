-- Add customer_phone column to auctions table for customer contact information
ALTER TABLE public.auctions ADD COLUMN customer_phone TEXT DEFAULT NULL;