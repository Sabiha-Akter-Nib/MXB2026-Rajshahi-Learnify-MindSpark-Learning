-- Create trigger to auto-create student_stats when user signs up
CREATE OR REPLACE TRIGGER on_auth_user_created_stats
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user_stats();

-- Create student_stats for existing users who don't have one
INSERT INTO public.student_stats (user_id, total_xp, current_streak, longest_streak, total_study_minutes)
SELECT p.user_id, 0, 0, 0, 0
FROM public.profiles p
LEFT JOIN public.student_stats s ON s.user_id = p.user_id
WHERE s.id IS NULL
ON CONFLICT (user_id) DO NOTHING;