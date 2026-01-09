-- Add division and category columns to subjects table
ALTER TABLE public.subjects 
ADD COLUMN IF NOT EXISTS division text,
ADD COLUMN IF NOT EXISTS category text DEFAULT 'compulsory';

-- Clear all tables that reference subjects (to avoid FK constraint errors)
DELETE FROM public.topic_mastery;
DELETE FROM public.student_progress;
DELETE FROM public.study_sessions;
DELETE FROM public.assessments;
DELETE FROM public.learning_plan_tasks;
DELETE FROM public.revision_schedule;
DELETE FROM public.offline_lessons;

-- Now clear existing subjects
DELETE FROM public.subjects;

-- Insert subjects for Grades 1-2 (3 subjects)
INSERT INTO public.subjects (name, name_bn, icon, color, min_class, max_class, total_chapters, category) VALUES
('Bangla', 'বাংলা', 'book-open', 'emerald', 1, 2, 12, 'compulsory'),
('English', 'ইংরেজি', 'languages', 'blue', 1, 2, 12, 'compulsory'),
('Mathematics', 'গণিত', 'calculator', 'purple', 1, 2, 10, 'compulsory');

-- Insert subjects for Grades 3-5 (5 subjects)
INSERT INTO public.subjects (name, name_bn, icon, color, min_class, max_class, total_chapters, category) VALUES
('Bangla', 'বাংলা', 'book-open', 'emerald', 3, 5, 14, 'compulsory'),
('English', 'ইংরেজি', 'languages', 'blue', 3, 5, 14, 'compulsory'),
('Mathematics', 'গণিত', 'calculator', 'purple', 3, 5, 12, 'compulsory'),
('Science', 'বিজ্ঞান', 'flask-conical', 'cyan', 3, 5, 12, 'compulsory'),
('Bangladesh & Global Studies', 'বাংলাদেশ ও বিশ্বপরিচয়', 'globe', 'amber', 3, 5, 12, 'compulsory');

-- Insert subjects for Grades 6-8 (8 subjects)
INSERT INTO public.subjects (name, name_bn, icon, color, min_class, max_class, total_chapters, category) VALUES
('Bangla', 'বাংলা', 'book-open', 'emerald', 6, 8, 16, 'compulsory'),
('English', 'ইংরেজি', 'languages', 'blue', 6, 8, 16, 'compulsory'),
('Mathematics', 'গণিত', 'calculator', 'purple', 6, 8, 14, 'compulsory'),
('Science', 'বিজ্ঞান', 'flask-conical', 'cyan', 6, 8, 14, 'compulsory'),
('Bangladesh & Global Studies', 'বাংলাদেশ ও বিশ্বপরিচয়', 'globe', 'amber', 6, 8, 14, 'compulsory'),
('ICT', 'তথ্য ও যোগাযোগ প্রযুক্তি', 'monitor', 'indigo', 6, 8, 10, 'compulsory'),
('Physical Education', 'শারীরিক শিক্ষা', 'heart-pulse', 'rose', 6, 8, 8, 'compulsory'),
('Arts & Crafts', 'চারু ও কারুকলা', 'palette', 'orange', 6, 8, 8, 'compulsory');

-- Insert COMPULSORY subjects for Grades 9-10 (all divisions)
INSERT INTO public.subjects (name, name_bn, icon, color, min_class, max_class, total_chapters, category) VALUES
('Bangla 1st Paper', 'বাংলা প্রথম পত্র', 'book-open', 'emerald', 9, 10, 18, 'compulsory'),
('Bangla 2nd Paper', 'বাংলা দ্বিতীয় পত্র', 'book-text', 'green', 9, 10, 14, 'compulsory'),
('English 1st Paper', 'ইংরেজি প্রথম পত্র', 'languages', 'blue', 9, 10, 16, 'compulsory'),
('English 2nd Paper', 'ইংরেজি দ্বিতীয় পত্র', 'file-text', 'sky', 9, 10, 12, 'compulsory'),
('Mathematics', 'গণিত', 'calculator', 'purple', 9, 10, 16, 'compulsory'),
('ICT', 'তথ্য ও যোগাযোগ প্রযুক্তি', 'monitor', 'indigo', 9, 10, 12, 'compulsory');

-- Insert SCIENCE division subjects for Grades 9-10
INSERT INTO public.subjects (name, name_bn, icon, color, min_class, max_class, total_chapters, division, category) VALUES
('Physics', 'পদার্থবিজ্ঞান', 'atom', 'violet', 9, 10, 14, 'science', 'division'),
('Chemistry', 'রসায়ন', 'flask-conical', 'cyan', 9, 10, 14, 'science', 'division'),
('Biology', 'জীববিজ্ঞান', 'leaf', 'lime', 9, 10, 14, 'science', 'division'),
('Higher Mathematics', 'উচ্চতর গণিত', 'sigma', 'fuchsia', 9, 10, 12, 'science', 'division'),
('Bangladesh & Global Studies', 'বাংলাদেশ ও বিশ্বপরিচয়', 'globe', 'amber', 9, 10, 12, 'science', 'division');

-- Insert ARTS division subjects for Grades 9-10
INSERT INTO public.subjects (name, name_bn, icon, color, min_class, max_class, total_chapters, division, category) VALUES
('History of Bangladesh and World Civilization', 'বাংলাদেশের ইতিহাস ও বিশ্বসভ্যতা', 'landmark', 'amber', 9, 10, 14, 'arts', 'division'),
('Geography and Environment', 'ভূগোল ও পরিবেশ', 'mountain', 'teal', 9, 10, 12, 'arts', 'division'),
('Economics', 'অর্থনীতি', 'trending-up', 'yellow', 9, 10, 12, 'arts', 'division'),
('Civics and Citizenship', 'পৌরনীতি ও নাগরিকতা', 'scale', 'slate', 9, 10, 12, 'arts', 'division'),
('Science', 'বিজ্ঞান', 'flask-conical', 'cyan', 9, 10, 12, 'arts', 'division');

-- Insert COMMERCE division subjects for Grades 9-10
INSERT INTO public.subjects (name, name_bn, icon, color, min_class, max_class, total_chapters, division, category) VALUES
('Science', 'বিজ্ঞান', 'flask-conical', 'cyan', 9, 10, 12, 'commerce', 'division'),
('Accounting', 'হিসাববিজ্ঞান', 'receipt', 'emerald', 9, 10, 14, 'commerce', 'division'),
('Finance and Banking', 'ফিন্যান্স ও ব্যাংকিং', 'landmark', 'blue', 9, 10, 12, 'commerce', 'division'),
('Business Entrepreneurship', 'ব্যবসায় উদ্যোগ', 'briefcase', 'orange', 9, 10, 12, 'commerce', 'division');

-- Insert OPTIONAL (4th) subjects for Grades 9-10 (all divisions)
INSERT INTO public.subjects (name, name_bn, icon, color, min_class, max_class, total_chapters, category) VALUES
('Home Science', 'গার্হস্থ্যবিজ্ঞান', 'home', 'pink', 9, 10, 10, 'optional'),
('Agricultural Studies', 'কৃষিশিক্ষা', 'wheat', 'lime', 9, 10, 12, 'optional');