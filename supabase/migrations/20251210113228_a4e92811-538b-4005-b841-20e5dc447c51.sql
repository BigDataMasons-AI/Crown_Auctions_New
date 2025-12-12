-- Create user_deposits table to track bidding deposits
CREATE TABLE public.user_deposits (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  amount numeric NOT NULL,
  currency text NOT NULL DEFAULT 'USD',
  paypal_order_id text NOT NULL,
  paypal_capture_id text,
  status text NOT NULL DEFAULT 'pending',
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now(),
  refunded_at timestamp with time zone,
  UNIQUE(user_id)
);

-- Enable RLS
ALTER TABLE public.user_deposits ENABLE ROW LEVEL SECURITY;

-- Users can view their own deposit
CREATE POLICY "Users can view their own deposit"
ON public.user_deposits
FOR SELECT
USING (auth.uid() = user_id);

-- Users can insert their own deposit (during signup)
CREATE POLICY "Users can insert their own deposit"
ON public.user_deposits
FOR INSERT
WITH CHECK (auth.uid() = user_id);

-- Admins can view all deposits
CREATE POLICY "Admins can view all deposits"
ON public.user_deposits
FOR SELECT
USING (has_role(auth.uid(), 'admin'::app_role));

-- Admins can update deposits (for refunds)
CREATE POLICY "Admins can update deposits"
ON public.user_deposits
FOR UPDATE
USING (has_role(auth.uid(), 'admin'::app_role));

-- Create index for faster lookups
CREATE INDEX idx_user_deposits_user_id ON public.user_deposits(user_id);
CREATE INDEX idx_user_deposits_status ON public.user_deposits(status);

-- Add trigger for updated_at
CREATE TRIGGER update_user_deposits_updated_at
BEFORE UPDATE ON public.user_deposits
FOR EACH ROW
EXECUTE FUNCTION public.handle_updated_at();