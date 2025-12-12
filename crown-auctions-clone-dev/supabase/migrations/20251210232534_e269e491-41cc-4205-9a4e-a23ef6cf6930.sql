-- Create hero_images table for managing carousel images
CREATE TABLE public.hero_images (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  image_url text NOT NULL,
  display_order integer NOT NULL DEFAULT 0,
  is_active boolean NOT NULL DEFAULT true,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.hero_images ENABLE ROW LEVEL SECURITY;

-- Anyone can view active hero images (for the public carousel)
CREATE POLICY "Anyone can view active hero images"
ON public.hero_images
FOR SELECT
USING (is_active = true);

-- Admins can view all hero images
CREATE POLICY "Admins can view all hero images"
ON public.hero_images
FOR SELECT
USING (has_role(auth.uid(), 'admin'::app_role));

-- Admins can create hero images
CREATE POLICY "Admins can create hero images"
ON public.hero_images
FOR INSERT
WITH CHECK (has_role(auth.uid(), 'admin'::app_role));

-- Admins can update hero images
CREATE POLICY "Admins can update hero images"
ON public.hero_images
FOR UPDATE
USING (has_role(auth.uid(), 'admin'::app_role));

-- Admins can delete hero images
CREATE POLICY "Admins can delete hero images"
ON public.hero_images
FOR DELETE
USING (has_role(auth.uid(), 'admin'::app_role));

-- Create trigger for updated_at
CREATE TRIGGER update_hero_images_updated_at
BEFORE UPDATE ON public.hero_images
FOR EACH ROW
EXECUTE FUNCTION public.handle_updated_at();

-- Create storage bucket for hero images
INSERT INTO storage.buckets (id, name, public) 
VALUES ('hero-images', 'hero-images', true)
ON CONFLICT (id) DO NOTHING;

-- Storage policies for hero images bucket
CREATE POLICY "Anyone can view hero images"
ON storage.objects
FOR SELECT
USING (bucket_id = 'hero-images');

CREATE POLICY "Admins can upload hero images"
ON storage.objects
FOR INSERT
WITH CHECK (bucket_id = 'hero-images' AND has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Admins can delete hero images"
ON storage.objects
FOR DELETE
USING (bucket_id = 'hero-images' AND has_role(auth.uid(), 'admin'::app_role));