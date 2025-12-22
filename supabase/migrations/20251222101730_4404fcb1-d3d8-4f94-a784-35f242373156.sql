-- Create table for tracking topic mastery and weak areas
CREATE TABLE public.topic_mastery (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  subject_id UUID REFERENCES public.subjects(id),
  topic_name TEXT NOT NULL,
  bloom_level TEXT NOT NULL DEFAULT 'remember' CHECK (bloom_level IN ('remember', 'understand', 'apply', 'analyze', 'evaluate', 'create')),
  mastery_score INTEGER NOT NULL DEFAULT 0 CHECK (mastery_score >= 0 AND mastery_score <= 100),
  attempts INTEGER NOT NULL DEFAULT 0,
  correct_answers INTEGER NOT NULL DEFAULT 0,
  last_practiced_at TIMESTAMP WITH TIME ZONE,
  is_weak_topic BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create table for assessments
CREATE TABLE public.assessments (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  subject_id UUID REFERENCES public.subjects(id),
  topic TEXT,
  bloom_level TEXT NOT NULL DEFAULT 'remember',
  total_questions INTEGER NOT NULL DEFAULT 0,
  correct_answers INTEGER NOT NULL DEFAULT 0,
  xp_earned INTEGER NOT NULL DEFAULT 0,
  time_taken_seconds INTEGER,
  completed_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create table for learning plans
CREATE TABLE public.learning_plans (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  plan_type TEXT NOT NULL DEFAULT 'daily' CHECK (plan_type IN ('daily', 'weekly')),
  start_date DATE NOT NULL,
  end_date DATE NOT NULL,
  status TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'completed', 'cancelled')),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create table for learning plan tasks
CREATE TABLE public.learning_plan_tasks (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  plan_id UUID NOT NULL REFERENCES public.learning_plans(id) ON DELETE CASCADE,
  subject_id UUID REFERENCES public.subjects(id),
  topic TEXT NOT NULL,
  bloom_level TEXT NOT NULL DEFAULT 'remember',
  target_xp INTEGER NOT NULL DEFAULT 10,
  is_completed BOOLEAN NOT NULL DEFAULT false,
  completed_at TIMESTAMP WITH TIME ZONE,
  priority INTEGER NOT NULL DEFAULT 1,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.topic_mastery ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.assessments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.learning_plans ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.learning_plan_tasks ENABLE ROW LEVEL SECURITY;

-- RLS policies for topic_mastery
CREATE POLICY "Users can view their own topic mastery" ON public.topic_mastery FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert their own topic mastery" ON public.topic_mastery FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update their own topic mastery" ON public.topic_mastery FOR UPDATE USING (auth.uid() = user_id);

-- RLS policies for assessments
CREATE POLICY "Users can view their own assessments" ON public.assessments FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert their own assessments" ON public.assessments FOR INSERT WITH CHECK (auth.uid() = user_id);

-- RLS policies for learning_plans
CREATE POLICY "Users can view their own plans" ON public.learning_plans FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert their own plans" ON public.learning_plans FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update their own plans" ON public.learning_plans FOR UPDATE USING (auth.uid() = user_id);

-- RLS policies for learning_plan_tasks (via plan ownership)
CREATE POLICY "Users can view their plan tasks" ON public.learning_plan_tasks FOR SELECT 
USING (EXISTS (SELECT 1 FROM public.learning_plans WHERE id = plan_id AND user_id = auth.uid()));
CREATE POLICY "Users can insert their plan tasks" ON public.learning_plan_tasks FOR INSERT 
WITH CHECK (EXISTS (SELECT 1 FROM public.learning_plans WHERE id = plan_id AND user_id = auth.uid()));
CREATE POLICY "Users can update their plan tasks" ON public.learning_plan_tasks FOR UPDATE 
USING (EXISTS (SELECT 1 FROM public.learning_plans WHERE id = plan_id AND user_id = auth.uid()));

-- Trigger for updated_at
CREATE TRIGGER update_topic_mastery_updated_at BEFORE UPDATE ON public.topic_mastery FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER update_learning_plans_updated_at BEFORE UPDATE ON public.learning_plans FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();