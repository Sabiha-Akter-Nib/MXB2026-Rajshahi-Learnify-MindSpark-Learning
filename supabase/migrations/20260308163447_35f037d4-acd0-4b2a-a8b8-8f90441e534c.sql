CREATE TABLE public.weekly_summaries (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  week_start date NOT NULL,
  summary text NOT NULL,
  stats jsonb DEFAULT '{}'::jsonb,
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE(user_id, week_start)
);

ALTER TABLE public.weekly_summaries ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own summaries" ON public.weekly_summaries
  FOR SELECT TO authenticated USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own summaries" ON public.weekly_summaries
  FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own summaries" ON public.weekly_summaries
  FOR UPDATE TO authenticated USING (auth.uid() = user_id);