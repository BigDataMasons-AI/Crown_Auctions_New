-- Grant admin role to user by email
DO $$
DECLARE
  admin_user_id UUID;
BEGIN
  SELECT id INTO admin_user_id
  FROM auth.users
  WHERE email = 'admin@gmail.com';

  IF admin_user_id IS NOT NULL THEN
    INSERT INTO public.user_roles (user_id, role)
    VALUES (admin_user_id, 'admin')
    ON CONFLICT (user_id, role) DO NOTHING;
    
    RAISE NOTICE 'Admin role granted to user: %', admin_user_id;
  ELSE
    RAISE NOTICE 'User with email admin@gmail.com not found';
  END IF;
END $$;