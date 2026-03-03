
-- Drop restrictive policies on otp_codes and recreate as permissive
DROP POLICY IF EXISTS "Anyone can create OTP codes" ON public.otp_codes;
DROP POLICY IF EXISTS "Anyone can read OTP codes by email" ON public.otp_codes;
DROP POLICY IF EXISTS "Anyone can update OTP codes" ON public.otp_codes;

-- Recreate as permissive (default)
CREATE POLICY "Anyone can create OTP codes"
ON public.otp_codes
FOR INSERT
TO anon, authenticated
WITH CHECK (true);

CREATE POLICY "Anyone can read OTP codes by email"
ON public.otp_codes
FOR SELECT
TO anon, authenticated
USING (true);

CREATE POLICY "Anyone can update OTP codes"
ON public.otp_codes
FOR UPDATE
TO anon, authenticated
USING (true);

CREATE POLICY "Anyone can delete OTP codes"
ON public.otp_codes
FOR DELETE
TO anon, authenticated
USING (true);
