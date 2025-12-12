-- Create table for item inquiries from the popup form
CREATE TABLE public.item_inquiries (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  first_name text NOT NULL,
  last_name text NOT NULL,
  email text NOT NULL,
  phone text NOT NULL,
  item_type text NOT NULL,
  ring_setting text,
  diamond_shape text,
  carat_range text,
  diamond_type text,
  watch_brand text,
  watch_model text,
  necklace_brand text,
  bracelet_brand text,
  earring_brand text,
  has_original_box boolean DEFAULT false,
  has_paperwork boolean DEFAULT false,
  image_count integer DEFAULT 0,
  status text NOT NULL DEFAULT 'pending',
  admin_notes text,
  reviewed_by uuid,
  reviewed_at timestamp with time zone,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.item_inquiries ENABLE ROW LEVEL SECURITY;

-- Admins can view all inquiries
CREATE POLICY "Admins can view all item inquiries"
ON public.item_inquiries
FOR SELECT
USING (has_role(auth.uid(), 'admin'::app_role));

-- Admins can update inquiries
CREATE POLICY "Admins can update item inquiries"
ON public.item_inquiries
FOR UPDATE
USING (has_role(auth.uid(), 'admin'::app_role));

-- Anyone can insert (public form submission)
CREATE POLICY "Anyone can submit item inquiries"
ON public.item_inquiries
FOR INSERT
WITH CHECK (true);

-- Add updated_at trigger
CREATE TRIGGER update_item_inquiries_updated_at
BEFORE UPDATE ON public.item_inquiries
FOR EACH ROW
EXECUTE FUNCTION public.handle_updated_at();