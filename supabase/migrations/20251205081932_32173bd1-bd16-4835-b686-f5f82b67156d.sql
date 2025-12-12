-- Drop existing RESTRICTIVE policies on appraiser_applications
DROP POLICY IF EXISTS "Admins can update appraiser applications" ON public.appraiser_applications;
DROP POLICY IF EXISTS "Admins can view all appraiser applications" ON public.appraiser_applications;
DROP POLICY IF EXISTS "Users can create their own appraiser applications" ON public.appraiser_applications;
DROP POLICY IF EXISTS "Users can view their own appraiser applications" ON public.appraiser_applications;

-- Recreate as PERMISSIVE policies with proper authentication scoping

-- Users can only view their own applications (requires authentication)
CREATE POLICY "Users can view their own appraiser applications" 
ON public.appraiser_applications 
FOR SELECT 
TO authenticated
USING (auth.uid() = user_id);

-- Users can only create applications for themselves (requires authentication)
CREATE POLICY "Users can create their own appraiser applications" 
ON public.appraiser_applications 
FOR INSERT 
TO authenticated
WITH CHECK (auth.uid() = user_id);

-- Admins can view all applications (requires authentication + admin role)
CREATE POLICY "Admins can view all appraiser applications" 
ON public.appraiser_applications 
FOR SELECT 
TO authenticated
USING (has_role(auth.uid(), 'admin'::app_role));

-- Admins can update applications (requires authentication + admin role)
CREATE POLICY "Admins can update appraiser applications" 
ON public.appraiser_applications 
FOR UPDATE 
TO authenticated
USING (has_role(auth.uid(), 'admin'::app_role))
WITH CHECK (has_role(auth.uid(), 'admin'::app_role));