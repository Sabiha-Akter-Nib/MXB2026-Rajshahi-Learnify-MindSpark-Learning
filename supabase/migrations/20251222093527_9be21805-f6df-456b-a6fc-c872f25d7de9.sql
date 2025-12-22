-- Create subjects table
CREATE TABLE public.subjects (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  name_bn TEXT, -- Bangla name
  icon TEXT NOT NULL DEFAULT 'book',
  color TEXT NOT NULL DEFAULT 'primary',
  total_chapters INTEGER NOT NULL DEFAULT 10,
  min_class INTEGER NOT NULL DEFAULT 1,
  max_class INTEGER NOT NULL DEFAULT 10,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Insert NCTB subjects
INSERT INTO public.subjects (name, name_bn, icon, color, total_chapters, min_class, max_class) VALUES
  ('Bangla 1st Paper', 'বাংলা ১ম পত্র', 'book-text', 'primary', 12, 1, 10),
  ('Bangla 2nd Paper', 'বাংলা ২য় পত্র', 'book-text', 'primary', 10, 1, 10),
  ('English 1st Paper', 'ইংরেজি ১ম পত্র', 'languages', 'accent', 12, 1, 10),
  ('English 2nd Paper', 'ইংরেজি ২য় পত্র', 'languages', 'accent', 10, 1, 10),
  ('Mathematics', 'গণিত', 'calculator', 'warning', 15, 1, 10),
  ('General Science', 'সাধারণ বিজ্ঞান', 'atom', 'success', 14, 1, 8),
  ('Physics', 'পদার্থবিজ্ঞান', 'atom', 'success', 12, 9, 10),
  ('Chemistry', 'রসায়ন', 'flask-conical', 'success', 12, 9, 10),
  ('Biology', 'জীববিজ্ঞান', 'leaf', 'success', 12, 9, 10),
  ('Higher Mathematics', 'উচ্চতর গণিত', 'calculator', 'warning', 14, 9, 10),
  ('ICT', 'তথ্য ও যোগাযোগ প্রযুক্তি', 'laptop', 'accent', 8, 6, 10),
  ('Bangladesh & Global Studies', 'বাংলাদেশ ও বিশ্বপরিচয়', 'globe', 'primary', 12, 1, 10);

-- RLS for subjects (public read)
ALTER TABLE public.subjects ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Anyone can view subjects" ON public.subjects FOR SELECT USING (true);

-- Create student progress table
CREATE TABLE public.student_progress (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  subject_id UUID NOT NULL REFERENCES public.subjects(id) ON DELETE CASCADE,
  chapters_completed INTEGER NOT NULL DEFAULT 0,
  current_chapter INTEGER NOT NULL DEFAULT 1,
  xp_earned INTEGER NOT NULL DEFAULT 0,
  last_studied_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(user_id, subject_id)
);

ALTER TABLE public.student_progress ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own progress" 
ON public.student_progress FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own progress" 
ON public.student_progress FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own progress" 
ON public.student_progress FOR UPDATE USING (auth.uid() = user_id);

-- Create study sessions table
CREATE TABLE public.study_sessions (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  subject_id UUID REFERENCES public.subjects(id) ON DELETE SET NULL,
  topic TEXT,
  duration_minutes INTEGER NOT NULL DEFAULT 0,
  xp_earned INTEGER NOT NULL DEFAULT 0,
  bloom_level TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

ALTER TABLE public.study_sessions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own sessions" 
ON public.study_sessions FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own sessions" 
ON public.study_sessions FOR INSERT WITH CHECK (auth.uid() = user_id);

-- Create student stats table for aggregated data
CREATE TABLE public.student_stats (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL UNIQUE REFERENCES auth.users(id) ON DELETE CASCADE,
  total_xp INTEGER NOT NULL DEFAULT 0,
  current_streak INTEGER NOT NULL DEFAULT 0,
  longest_streak INTEGER NOT NULL DEFAULT 0,
  total_study_minutes INTEGER NOT NULL DEFAULT 0,
  last_activity_date DATE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

ALTER TABLE public.student_stats ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own stats" 
ON public.student_stats FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own stats" 
ON public.student_stats FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own stats" 
ON public.student_stats FOR UPDATE USING (auth.uid() = user_id);

-- Trigger to update timestamps
CREATE TRIGGER update_student_progress_updated_at
BEFORE UPDATE ON public.student_progress
FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_student_stats_updated_at
BEFORE UPDATE ON public.student_stats
FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- Function to initialize student stats on signup
CREATE OR REPLACE FUNCTION public.handle_new_user_stats()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER SET search_path = public
AS $$
BEGIN
  INSERT INTO public.student_stats (user_id)
  VALUES (new.id);
  RETURN new;
END;
$$;

-- Trigger to create stats on user signup
CREATE TRIGGER on_auth_user_created_stats
AFTER INSERT ON auth.users
FOR EACH ROW EXECUTE FUNCTION public.handle_new_user_stats();