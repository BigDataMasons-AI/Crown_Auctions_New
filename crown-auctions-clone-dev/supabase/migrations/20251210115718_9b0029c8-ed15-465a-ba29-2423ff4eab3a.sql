-- Create deposit_transactions table to track all deposit events
CREATE TABLE public.deposit_transactions (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  deposit_id uuid NOT NULL REFERENCES public.user_deposits(id) ON DELETE CASCADE,
  user_id uuid NOT NULL,
  transaction_type text NOT NULL, -- 'deposit_created', 'deposit_completed', 'refund_requested', 'refund_approved', 'refund_rejected'
  amount numeric NOT NULL,
  currency text NOT NULL DEFAULT 'USD',
  description text,
  created_at timestamp with time zone NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.deposit_transactions ENABLE ROW LEVEL SECURITY;

-- Users can view their own transactions
CREATE POLICY "Users can view their own transactions"
ON public.deposit_transactions
FOR SELECT
USING (auth.uid() = user_id);

-- Users can insert their own transactions (for deposit creation)
CREATE POLICY "Users can insert their own transactions"
ON public.deposit_transactions
FOR INSERT
WITH CHECK (auth.uid() = user_id);

-- Admins can view all transactions
CREATE POLICY "Admins can view all transactions"
ON public.deposit_transactions
FOR SELECT
USING (has_role(auth.uid(), 'admin'::app_role));

-- Admins can insert transactions (for refund processing)
CREATE POLICY "Admins can insert transactions"
ON public.deposit_transactions
FOR INSERT
WITH CHECK (has_role(auth.uid(), 'admin'::app_role));

-- Create index for faster lookups
CREATE INDEX idx_deposit_transactions_user_id ON public.deposit_transactions(user_id);
CREATE INDEX idx_deposit_transactions_deposit_id ON public.deposit_transactions(deposit_id);