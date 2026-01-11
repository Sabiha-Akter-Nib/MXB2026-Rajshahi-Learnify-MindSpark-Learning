-- Create OTP verification codes table
CREATE TABLE public.otp_codes (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  email TEXT NOT NULL,
  code TEXT NOT NULL,
  type TEXT NOT NULL CHECK (type IN ('signup', 'password_reset')),
  expires_at TIMESTAMP WITH TIME ZONE NOT NULL,
  verified BOOLEAN DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.otp_codes ENABLE ROW LEVEL SECURITY;

-- Allow anyone to create OTP codes (before auth)
CREATE POLICY "Anyone can create OTP codes"
ON public.otp_codes
FOR INSERT
WITH CHECK (true);

-- Allow anyone to read their OTP codes by email (for verification)
CREATE POLICY "Anyone can read OTP codes by email"
ON public.otp_codes
FOR SELECT
USING (true);

-- Allow updates for verification
CREATE POLICY "Anyone can update OTP codes"
ON public.otp_codes
FOR UPDATE
USING (true);

-- Create index for faster lookups
CREATE INDEX idx_otp_codes_email ON public.otp_codes(email);
CREATE INDEX idx_otp_codes_expires ON public.otp_codes(expires_at);

-- Auto-delete expired codes after 24 hours
CREATE OR REPLACE FUNCTION public.cleanup_expired_otp_codes()
RETURNS trigger AS $$
BEGIN
  DELETE FROM public.otp_codes WHERE expires_at < now() - interval '24 hours';
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

-- Create trigger to cleanup on insert
CREATE TRIGGER cleanup_otp_codes_trigger
AFTER INSERT ON public.otp_codes
FOR EACH STATEMENT
EXECUTE FUNCTION public.cleanup_expired_otp_codes();

-- Create user_avatars table for custom profile photos
CREATE TABLE public.user_avatars (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL UNIQUE,
  avatar_url TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.user_avatars ENABLE ROW LEVEL SECURITY;

-- Users can view all avatars (for leaderboard etc)
CREATE POLICY "Anyone can view avatars"
ON public.user_avatars
FOR SELECT
USING (true);

-- Users can insert their own avatar
CREATE POLICY "Users can insert own avatar"
ON public.user_avatars
FOR INSERT
WITH CHECK (auth.uid() = user_id);

-- Users can update their own avatar
CREATE POLICY "Users can update own avatar"
ON public.user_avatars
FOR UPDATE
USING (auth.uid() = user_id);

-- Add timestamp trigger
CREATE TRIGGER update_user_avatars_updated_at
BEFORE UPDATE ON public.user_avatars
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

-- Create weekly_notes table for downloadable PDFs
CREATE TABLE public.weekly_notes (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  subject_id UUID REFERENCES public.subjects(id),
  subject_name TEXT NOT NULL,
  week_start DATE NOT NULL,
  week_end DATE NOT NULL,
  notes_content JSONB NOT NULL DEFAULT '[]'::jsonb,
  mcq_content JSONB NOT NULL DEFAULT '[]'::jsonb,
  pdf_url TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.weekly_notes ENABLE ROW LEVEL SECURITY;

-- Users can view their own notes
CREATE POLICY "Users can view own notes"
ON public.weekly_notes
FOR SELECT
USING (auth.uid() = user_id);

-- Users can insert their own notes
CREATE POLICY "Users can insert own notes"
ON public.weekly_notes
FOR INSERT
WITH CHECK (auth.uid() = user_id);

-- Users can update their own notes
CREATE POLICY "Users can update own notes"
ON public.weekly_notes
FOR UPDATE
USING (auth.uid() = user_id);

-- Add timestamp trigger
CREATE TRIGGER update_weekly_notes_updated_at
BEFORE UPDATE ON public.weekly_notes
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

-- Create avatars storage bucket
INSERT INTO storage.buckets (id, name, public) VALUES ('avatars', 'avatars', true)
ON CONFLICT (id) DO NOTHING;

-- Storage policies for avatars
CREATE POLICY "Avatar images are publicly accessible"
ON storage.objects
FOR SELECT
USING (bucket_id = 'avatars');

CREATE POLICY "Users can upload their own avatar"
ON storage.objects
FOR INSERT
WITH CHECK (bucket_id = 'avatars' AND auth.uid()::text = (storage.foldername(name))[1]);

CREATE POLICY "Users can update their own avatar"
ON storage.objects
FOR UPDATE
USING (bucket_id = 'avatars' AND auth.uid()::text = (storage.foldername(name))[1]);

CREATE POLICY "Users can delete their own avatar"
ON storage.objects
FOR DELETE
USING (bucket_id = 'avatars' AND auth.uid()::text = (storage.foldername(name))[1]);