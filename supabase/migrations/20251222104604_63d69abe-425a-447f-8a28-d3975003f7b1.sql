-- Create leaderboard view using student_stats
CREATE OR REPLACE VIEW public.leaderboard_view AS
SELECT 
  p.full_name,
  p.class,
  p.school_name,
  ss.total_xp,
  ss.current_streak,
  ss.longest_streak,
  ss.total_study_minutes,
  RANK() OVER (ORDER BY ss.total_xp DESC) as rank
FROM public.student_stats ss
JOIN public.profiles p ON p.user_id = ss.user_id
ORDER BY ss.total_xp DESC;

-- Create leaderboard_entries table for public leaderboard opt-in
CREATE TABLE public.leaderboard_entries (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL UNIQUE,
  display_name TEXT NOT NULL,
  class INTEGER NOT NULL,
  school_name TEXT,
  total_xp INTEGER NOT NULL DEFAULT 0,
  current_streak INTEGER NOT NULL DEFAULT 0,
  is_public BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.leaderboard_entries ENABLE ROW LEVEL SECURITY;

-- Anyone can view public leaderboard entries
CREATE POLICY "Anyone can view public leaderboard entries"
ON public.leaderboard_entries
FOR SELECT
USING (is_public = true);

-- Users can manage their own entry
CREATE POLICY "Users can insert their own leaderboard entry"
ON public.leaderboard_entries
FOR INSERT
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own leaderboard entry"
ON public.leaderboard_entries
FOR UPDATE
USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own leaderboard entry"
ON public.leaderboard_entries
FOR DELETE
USING (auth.uid() = user_id);

-- Create push notification subscriptions table
CREATE TABLE public.push_subscriptions (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  endpoint TEXT NOT NULL,
  p256dh TEXT NOT NULL,
  auth TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(user_id, endpoint)
);

-- Enable RLS
ALTER TABLE public.push_subscriptions ENABLE ROW LEVEL SECURITY;

-- Users can manage their own subscriptions
CREATE POLICY "Users can insert their own push subscription"
ON public.push_subscriptions
FOR INSERT
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can view their own push subscription"
ON public.push_subscriptions
FOR SELECT
USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own push subscription"
ON public.push_subscriptions
FOR DELETE
USING (auth.uid() = user_id);

-- Create offline_lessons table for cached content
CREATE TABLE public.offline_lessons (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  subject_id UUID REFERENCES public.subjects(id),
  chapter_number INTEGER NOT NULL,
  title TEXT NOT NULL,
  title_bn TEXT,
  content JSONB NOT NULL,
  bloom_level TEXT NOT NULL DEFAULT 'remember',
  class_range INT4RANGE NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.offline_lessons ENABLE ROW LEVEL SECURITY;

-- Anyone can view offline lessons
CREATE POLICY "Anyone can view offline lessons"
ON public.offline_lessons
FOR SELECT
USING (true);

-- Add trigger to update leaderboard_entries timestamps
CREATE TRIGGER update_leaderboard_entries_updated_at
BEFORE UPDATE ON public.leaderboard_entries
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();