-- Campus.com: Auto-confirm User Registration Trigger & Verify Existing Users
-- Run this in Supabase SQL Editor so new students can log in immediately after creating an account without waiting for email confirmation.

-- 1. Confirm any currently pending users (e.g. student2@campus.com)
UPDATE auth.users 
SET email_confirmed_at = COALESCE(email_confirmed_at, now()),
    confirmation_token = COALESCE(confirmation_token, '')
WHERE email_confirmed_at IS NULL;

-- 2. Create trigger function to auto-confirm all future registrations immediately
CREATE OR REPLACE FUNCTION public.auto_confirm_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  NEW.email_confirmed_at := COALESCE(NEW.email_confirmed_at, now());
  NEW.confirmation_token := '';
  RETURN NEW;
END;
$$;

-- 3. Attach trigger to auth.users
DROP TRIGGER IF EXISTS on_auth_user_auto_confirm ON auth.users;
CREATE TRIGGER on_auth_user_auto_confirm
BEFORE INSERT ON auth.users
FOR EACH ROW EXECUTE FUNCTION public.auto_confirm_new_user();

-- 4. Verify profiles and student_records
SELECT id, email, global_role, full_name, is_verified 
FROM public.profiles 
WHERE global_role = 'student';
