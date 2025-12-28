-- Create weekly achievements table
CREATE TABLE public.weekly_achievements (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id uuid NOT NULL,
  week_start date NOT NULL,
  achievement_type text NOT NULL,
  achievement_name text NOT NULL,
  achievement_description text NOT NULL,
  icon text NOT NULL DEFAULT 'award',
  target_value integer NOT NULL DEFAULT 1,
  current_value integer NOT NULL DEFAULT 0,
  is_completed boolean NOT NULL DEFAULT false,
  completed_at timestamp with time zone,
  xp_reward integer NOT NULL DEFAULT 10,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now(),
  UNIQUE(user_id, week_start, achievement_type)
);

-- Enable RLS
ALTER TABLE public.weekly_achievements ENABLE ROW LEVEL SECURITY;

-- Create policies
CREATE POLICY "Users can view their own weekly achievements"
ON public.weekly_achievements
FOR SELECT
USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own weekly achievements"
ON public.weekly_achievements
FOR INSERT
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own weekly achievements"
ON public.weekly_achievements
FOR UPDATE
USING (auth.uid() = user_id);

-- Create trigger for updated_at
CREATE TRIGGER update_weekly_achievements_updated_at
BEFORE UPDATE ON public.weekly_achievements
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

-- Create index for efficient lookups
CREATE INDEX idx_weekly_achievements_user_week ON public.weekly_achievements(user_id, week_start);
CREATE INDEX idx_weekly_achievements_week ON public.weekly_achievements(week_start);