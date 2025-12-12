-- Add update policy for item inquiry images (needed for some storage operations)
CREATE POLICY "Anyone can update item inquiry images"
ON storage.objects
FOR UPDATE
USING (bucket_id = 'item-inquiry-images')
WITH CHECK (bucket_id = 'item-inquiry-images');