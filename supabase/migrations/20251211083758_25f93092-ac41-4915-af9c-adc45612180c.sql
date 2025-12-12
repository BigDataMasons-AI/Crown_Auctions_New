-- Add region column to hero_images table for region-based filtering
ALTER TABLE public.hero_images 
ADD COLUMN region text DEFAULT 'global';

-- Update existing images with region hints based on URL patterns
UPDATE public.hero_images 
SET region = CASE 
  WHEN image_url ILIKE '%qatar%' THEN 'QA'
  WHEN image_url ILIKE '%uae%' THEN 'AE'
  ELSE 'global'
END;