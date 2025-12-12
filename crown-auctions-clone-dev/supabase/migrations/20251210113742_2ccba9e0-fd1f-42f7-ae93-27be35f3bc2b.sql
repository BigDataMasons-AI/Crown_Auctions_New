-- Allow users to update their own deposit (for refund requests)
CREATE POLICY "Users can update their own deposit"
ON public.user_deposits
FOR UPDATE
USING (auth.uid() = user_id)
WITH CHECK (auth.uid() = user_id);