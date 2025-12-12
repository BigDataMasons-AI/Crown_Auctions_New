-- Add pause_on_hover column to hero_settings
ALTER TABLE public.hero_settings 
ADD COLUMN pause_on_hover boolean NOT NULL DEFAULT true;

-- Update existing row to have default value
UPDATE public.hero_settings SET pause_on_hover = true;