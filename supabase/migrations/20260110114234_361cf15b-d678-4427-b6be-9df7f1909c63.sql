-- Add division column to profiles table
ALTER TABLE public.profiles 
ADD COLUMN IF NOT EXISTS division text CHECK (division IN ('science', 'commerce', 'arts') OR division IS NULL);

-- Add comment for clarity
COMMENT ON COLUMN public.profiles.division IS 'Academic division for class 9-10 students: science, commerce, or arts';