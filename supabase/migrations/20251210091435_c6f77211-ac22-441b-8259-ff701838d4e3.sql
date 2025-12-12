-- Allow admins to upload shipping labels to the auction-images bucket
CREATE POLICY "Admins can upload shipping labels"
ON storage.objects
FOR INSERT
WITH CHECK (
  bucket_id = 'auction-images' 
  AND has_role(auth.uid(), 'admin'::app_role)
);

-- Allow admins to update/upsert shipping labels
CREATE POLICY "Admins can update shipping labels"
ON storage.objects
FOR UPDATE
USING (
  bucket_id = 'auction-images' 
  AND has_role(auth.uid(), 'admin'::app_role)
);