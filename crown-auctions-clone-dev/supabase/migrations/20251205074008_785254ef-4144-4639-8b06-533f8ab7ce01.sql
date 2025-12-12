-- Drop existing restrictive policies
DROP POLICY IF EXISTS "Anyone can view active categories" ON public.categories;
DROP POLICY IF EXISTS "Admins can view all categories" ON public.categories;

-- Recreate as PERMISSIVE policies (default behavior - OR logic)
CREATE POLICY "Anyone can view active categories"
  ON public.categories
  FOR SELECT
  TO public
  USING (is_active = true);

CREATE POLICY "Admins can view all categories"
  ON public.categories
  FOR SELECT
  TO authenticated
  USING (public.has_role(auth.uid(), 'admin'));