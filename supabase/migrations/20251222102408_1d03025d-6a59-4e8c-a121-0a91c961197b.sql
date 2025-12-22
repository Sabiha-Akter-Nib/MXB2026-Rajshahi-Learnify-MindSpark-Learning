-- Create table for revision scheduling based on spaced repetition
CREATE TABLE public.revision_schedule (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  topic_mastery_id UUID REFERENCES public.topic_mastery(id) ON DELETE CASCADE,
  subject_id UUID REFERENCES public.subjects(id),
  topic_name TEXT NOT NULL,
  next_review_date DATE NOT NULL,
  review_interval_days INTEGER NOT NULL DEFAULT 1,
  ease_factor DECIMAL(3,2) NOT NULL DEFAULT 2.50,
  repetition_count INTEGER NOT NULL DEFAULT 0,
  is_completed BOOLEAN NOT NULL DEFAULT false,
  completed_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.revision_schedule ENABLE ROW LEVEL SECURITY;

-- RLS policies
CREATE POLICY "Users can view their own revisions" ON public.revision_schedule FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert their own revisions" ON public.revision_schedule FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update their own revisions" ON public.revision_schedule FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can delete their own revisions" ON public.revision_schedule FOR DELETE USING (auth.uid() = user_id);

-- Trigger for updated_at
CREATE TRIGGER update_revision_schedule_updated_at BEFORE UPDATE ON public.revision_schedule FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();