-- Delete existing subjects for grades 6-8 and recreate with proper structure
DELETE FROM subjects WHERE min_class = 6 AND max_class = 8;

-- Insert subjects for classes 6-8 with separate Bangla and English papers
INSERT INTO subjects (name, name_bn, icon, color, min_class, max_class, total_chapters, category, division) VALUES
-- Bangla Papers
('Bangla 1st Paper', 'বাংলা ১ম পত্র', 'book-open', 'emerald', 6, 8, 12, 'compulsory', NULL),
('Bangla 2nd Paper', 'বাংলা ২য় পত্র', 'book-text', 'green', 6, 8, 10, 'compulsory', NULL),
-- English Papers
('English 1st Paper', 'ইংরেজি ১ম পত্র', 'languages', 'blue', 6, 8, 12, 'compulsory', NULL),
('English 2nd Paper', 'ইংরেজি ২য় পত্র', 'book-text', 'sky', 6, 8, 10, 'compulsory', NULL),
-- Other subjects
('Mathematics', 'গণিত', 'calculator', 'purple', 6, 8, 14, 'compulsory', NULL),
('Science', 'বিজ্ঞান', 'flask-conical', 'cyan', 6, 8, 14, 'compulsory', NULL),
('Bangladesh & Global Studies', 'বাংলাদেশ ও বিশ্বপরিচয়', 'globe', 'amber', 6, 8, 14, 'compulsory', NULL),
('ICT', 'তথ্য ও যোগাযোগ প্রযুক্তি', 'monitor', 'indigo', 6, 8, 10, 'compulsory', NULL);