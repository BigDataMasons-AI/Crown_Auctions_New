-- Create hero_settings table for carousel configuration
CREATE TABLE public.hero_settings (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  auto_scroll_interval integer NOT NULL DEFAULT 8000,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.hero_settings ENABLE ROW LEVEL SECURITY;

-- RLS policies
CREATE POLICY "Anyone can view hero settings" 
ON public.hero_settings 
FOR SELECT 
USING (true);

CREATE POLICY "Admins can update hero settings" 
ON public.hero_settings 
FOR UPDATE 
USING (has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Admins can insert hero settings" 
ON public.hero_settings 
FOR INSERT 
WITH CHECK (has_role(auth.uid(), 'admin'::app_role));

-- Insert default settings row
INSERT INTO public.hero_settings (auto_scroll_interval) VALUES (8000);

-- Add trigger for updated_at
CREATE TRIGGER update_hero_settings_updated_at
BEFORE UPDATE ON public.hero_settings
FOR EACH ROW
EXECUTE FUNCTION public.handle_updated_at();