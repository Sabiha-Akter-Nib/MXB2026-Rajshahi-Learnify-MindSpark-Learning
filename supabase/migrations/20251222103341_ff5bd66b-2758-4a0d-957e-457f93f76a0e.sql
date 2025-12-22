-- Create achievements table
CREATE TABLE public.achievements (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  name text NOT NULL,
  description text NOT NULL,
  icon text NOT NULL DEFAULT 'award',
  xp_reward integer NOT NULL DEFAULT 10,
  category text NOT NULL DEFAULT 'general',
  requirement_type text NOT NULL,
  requirement_value integer NOT NULL DEFAULT 1,
  created_at timestamp with time zone NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.achievements ENABLE ROW LEVEL SECURITY;

-- Anyone can view achievements
CREATE POLICY "Anyone can view achievements" 
ON public.achievements 
FOR SELECT 
USING (true);

-- Create user_achievements table to track earned achievements
CREATE TABLE public.user_achievements (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id uuid NOT NULL,
  achievement_id uuid NOT NULL REFERENCES public.achievements(id) ON DELETE CASCADE,
  earned_at timestamp with time zone NOT NULL DEFAULT now(),
  UNIQUE(user_id, achievement_id)
);

-- Enable RLS
ALTER TABLE public.user_achievements ENABLE ROW LEVEL SECURITY;

-- Users can view their own achievements
CREATE POLICY "Users can view their own achievements" 
ON public.user_achievements 
FOR SELECT 
USING (auth.uid() = user_id);

-- Users can insert their own achievements
CREATE POLICY "Users can insert their own achievements" 
ON public.user_achievements 
FOR INSERT 
WITH CHECK (auth.uid() = user_id);

-- Insert default achievements
INSERT INTO public.achievements (name, description, icon, xp_reward, category, requirement_type, requirement_value) VALUES
('First Steps', 'Complete your first study session', 'footprints', 10, 'beginner', 'study_sessions', 1),
('Knowledge Seeker', 'Complete 10 study sessions', 'book-open', 50, 'learning', 'study_sessions', 10),
('Scholar', 'Complete 50 study sessions', 'graduation-cap', 200, 'learning', 'study_sessions', 50),
('Quiz Master', 'Complete your first assessment', 'target', 15, 'beginner', 'assessments', 1),
('Assessment Pro', 'Complete 10 assessments', 'award', 75, 'assessment', 'assessments', 10),
('Perfect Score', 'Get 100% on an assessment', 'star', 100, 'achievement', 'perfect_score', 1),
('Streak Starter', 'Maintain a 3-day streak', 'flame', 25, 'streak', 'streak_days', 3),
('Week Warrior', 'Maintain a 7-day streak', 'flame', 75, 'streak', 'streak_days', 7),
('Dedicated Learner', 'Maintain a 30-day streak', 'trophy', 300, 'streak', 'streak_days', 30),
('XP Hunter', 'Earn 100 XP', 'zap', 20, 'xp', 'total_xp', 100),
('XP Champion', 'Earn 1000 XP', 'zap', 100, 'xp', 'total_xp', 1000),
('XP Legend', 'Earn 5000 XP', 'crown', 500, 'xp', 'total_xp', 5000),
('Topic Explorer', 'Study 5 different topics', 'compass', 30, 'exploration', 'topics_studied', 5),
('Subject Master', 'Complete all chapters in a subject', 'medal', 250, 'mastery', 'subject_complete', 1),
('Bloom Climber', 'Reach the Apply level in Bloom''s Taxonomy', 'trending-up', 50, 'bloom', 'bloom_level', 3);