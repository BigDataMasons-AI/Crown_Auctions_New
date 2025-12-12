-- Create a secure view for public auction listing that hides sensitive fields
CREATE OR REPLACE VIEW public.auctions_public AS
SELECT 
  id,
  title,
  description,
  category,
  image_urls,
  starting_price,
  current_bid,
  minimum_increment,
  start_time,
  end_time,
  status,
  approval_status,
  specifications,
  certificates,
  created_at,
  updated_at,
  rejection_reason,
  original_submission_id,
  admin_comparison_comments
FROM public.auctions
WHERE approval_status = 'approved';

-- Grant access to the view
GRANT SELECT ON public.auctions_public TO anon, authenticated;

-- Add comment explaining the purpose
COMMENT ON VIEW public.auctions_public IS 'Public view of auctions that hides sensitive fields like submitted_by, approved_by, and approved_at';