-- Add image_urls column to item_inquiries table
ALTER TABLE public.item_inquiries
ADD COLUMN image_urls text[] DEFAULT '{}';

-- Create storage bucket for item inquiry images
INSERT INTO storage.buckets (id, name, public)
VALUES ('item-inquiry-images', 'item-inquiry-images', true)
ON CONFLICT (id) DO NOTHING;

-- Create storage policies for item inquiry images
CREATE POLICY "Anyone can view item inquiry images"
ON storage.objects
FOR SELECT
USING (bucket_id = 'item-inquiry-images');

CREATE POLICY "Anyone can upload item inquiry images"
ON storage.objects
FOR INSERT
WITH CHECK (bucket_id = 'item-inquiry-images');