-- =====================================================
-- INSERT SAMPLE TIMETABLE CLASSES
-- =====================================================
-- This script inserts sample classes for testing the timetable management system
-- 
-- Author: School Management System
-- Date: December 2024
-- =====================================================

-- Insert sample classes for timetable management
INSERT INTO timetable_classes (name, level, subsystem, branch, academic_year, is_active) VALUES
-- English Subsystem
('Form 1A', 'Form 1', 'english', 'grammar', '2024-2025', true),
('Form 1B', 'Form 1', 'english', 'grammar', '2024-2025', true),
('Form 2A', 'Form 2', 'english', 'grammar', '2024-2025', true),
('Form 2B', 'Form 2', 'english', 'technical', '2024-2025', true),
('Form 3A', 'Form 3', 'english', 'grammar', '2024-2025', true),
('Form 3B', 'Form 3', 'english', 'commercial', '2024-2025', true),
('Form 4A', 'Form 4', 'english', 'grammar', '2024-2025', true),
('Form 4B', 'Form 4', 'english', 'technical', '2024-2025', true),
('Form 5A', 'Form 5', 'english', 'grammar', '2024-2025', true),
('Form 5B', 'Form 5', 'english', 'technical', '2024-2025', true),

-- French Subsystem
('Sixième A', 'Sixième', 'french', 'grammar', '2024-2025', true),
('Sixième B', 'Sixième', 'french', 'grammar', '2024-2025', true),
('Cinquième A', 'Cinquième', 'french', 'grammar', '2024-2025', true),
('Cinquième B', 'Cinquième', 'french', 'technical', '2024-2025', true),
('Quatrième A', 'Quatrième', 'french', 'grammar', '2024-2025', true),
('Quatrième B', 'Quatrième', 'french', 'commercial', '2024-2025', true),
('Troisième A', 'Troisième', 'french', 'grammar', '2024-2025', true),
('Troisième B', 'Troisième', 'french', 'technical', '2024-2025', true),
('Seconde A', 'Seconde', 'french', 'grammar', '2024-2025', true),
('Seconde B', 'Seconde', 'french', 'technical', '2024-2025', true)
ON CONFLICT (class_id, academic_year) DO NOTHING;

-- Insert sample teachers
INSERT INTO timetable_teachers (name, email, phone, max_periods_per_day, max_periods_per_week, is_active) VALUES
('Paul Biya Mbeki', 'p.mbeki@school.com', '+237 123456789', 6, 30, true),
('Marie Ngozi', 'm.ngozi@school.com', '+237 123456790', 6, 30, true),
('Jean Claude', 'j.claude@school.com', '+237 123456791', 6, 30, true),
('Grace Tabi', 'g.tabi@school.com', '+237 123456792', 6, 30, true),
('Amina Fru', 'a.fru@school.com', '+237 123456793', 6, 30, true),
('David Wilson', 'd.wilson@school.com', '+237 123456794', 6, 30, true),
('Sarah Johnson', 's.johnson@school.com', '+237 123456795', 6, 30, true),
('Michael Brown', 'm.brown@school.com', '+237 123456796', 6, 30, true)
ON CONFLICT (teacher_id) DO NOTHING;

-- Insert sample rooms
INSERT INTO timetable_rooms (name, room_number, capacity, room_type, building, floor, is_active) VALUES
('Room 101', '101', 30, 'classroom', 'Main Building', 1, true),
('Room 102', '102', 30, 'classroom', 'Main Building', 1, true),
('Room 103', '103', 30, 'classroom', 'Main Building', 1, true),
('Room 201', '201', 30, 'classroom', 'Main Building', 2, true),
('Room 202', '202', 30, 'classroom', 'Main Building', 2, true),
('Science Lab 1', 'SL1', 25, 'science_lab', 'Science Building', 1, true),
('Science Lab 2', 'SL2', 25, 'science_lab', 'Science Building', 1, true),
('Computer Lab 1', 'CL1', 20, 'computer_lab', 'IT Building', 1, true),
('Computer Lab 2', 'CL2', 20, 'computer_lab', 'IT Building', 1, true),
('Library', 'LIB', 50, 'library', 'Main Building', 2, true),
('Assembly Hall', 'AH', 200, 'hall', 'Main Building', 1, true)
ON CONFLICT (name, building) DO NOTHING;

-- Insert sample subjects
INSERT INTO timetable_subjects (name, code, description, hours_per_week, is_active) VALUES
('Mathematics', 'MATH', 'Advanced Mathematics', 6, true),
('English Language', 'ENG', 'English Language and Literature', 5, true),
('Biology', 'BIO', 'Biology and Life Sciences', 4, true),
('Chemistry', 'CHEM', 'Chemistry and Laboratory', 4, true),
('Physics', 'PHY', 'Physics and Mechanics', 4, true),
('History', 'HIST', 'World History and Geography', 3, true),
('Geography', 'GEO', 'Physical and Human Geography', 3, true),
('French Language', 'FREN', 'French Language and Literature', 5, true),
('Spanish Language', 'SPAN', 'Spanish Language and Culture', 3, true),
('Computer Science', 'CS', 'Computer Programming and IT', 4, true),
('Economics', 'ECON', 'Economics and Business Studies', 3, true),
('Physical Education', 'PE', 'Physical Education and Sports', 2, true)
ON CONFLICT (subject_id) DO NOTHING;

-- Insert teacher-subject assignments
INSERT INTO timetable_teacher_subjects (teacher_id, subject_id, proficiency_level, years_of_experience, is_primary, is_active) VALUES
-- Paul Biya Mbeki - Mathematics and Physics
((SELECT id FROM timetable_teachers WHERE name = 'Paul Biya Mbeki'), (SELECT id FROM timetable_subjects WHERE code = 'MATH'), 'expert', 8, true, true),
((SELECT id FROM timetable_teachers WHERE name = 'Paul Biya Mbeki'), (SELECT id FROM timetable_subjects WHERE code = 'PHY'), 'expert', 8, false, true),

-- Marie Ngozi - English and French
((SELECT id FROM timetable_teachers WHERE name = 'Marie Ngozi'), (SELECT id FROM timetable_subjects WHERE code = 'ENG'), 'expert', 6, true, true),
((SELECT id FROM timetable_teachers WHERE name = 'Marie Ngozi'), (SELECT id FROM timetable_subjects WHERE code = 'FREN'), 'intermediate', 6, false, true),

-- Jean Claude - Biology and Chemistry
((SELECT id FROM timetable_teachers WHERE name = 'Jean Claude'), (SELECT id FROM timetable_subjects WHERE code = 'BIO'), 'expert', 7, true, true),
((SELECT id FROM timetable_teachers WHERE name = 'Jean Claude'), (SELECT id FROM timetable_subjects WHERE code = 'CHEM'), 'expert', 7, false, true),

-- Grace Tabi - History and Geography
((SELECT id FROM timetable_teachers WHERE name = 'Grace Tabi'), (SELECT id FROM timetable_subjects WHERE code = 'HIST'), 'expert', 5, true, true),
((SELECT id FROM timetable_teachers WHERE name = 'Grace Tabi'), (SELECT id FROM timetable_subjects WHERE code = 'GEO'), 'expert', 5, false, true),

-- Amina Fru - French and Spanish
((SELECT id FROM timetable_teachers WHERE name = 'Amina Fru'), (SELECT id FROM timetable_subjects WHERE code = 'FREN'), 'expert', 4, true, true),
((SELECT id FROM timetable_teachers WHERE name = 'Amina Fru'), (SELECT id FROM timetable_subjects WHERE code = 'SPAN'), 'intermediate', 4, false, true),

-- David Wilson - Computer Science
((SELECT id FROM timetable_teachers WHERE name = 'David Wilson'), (SELECT id FROM timetable_subjects WHERE code = 'CS'), 'expert', 9, true, true),

-- Sarah Johnson - Economics
((SELECT id FROM timetable_teachers WHERE name = 'Sarah Johnson'), (SELECT id FROM timetable_subjects WHERE code = 'ECON'), 'expert', 6, true, true),

-- Michael Brown - Physical Education
((SELECT id FROM timetable_teachers WHERE name = 'Michael Brown'), (SELECT id FROM timetable_subjects WHERE code = 'PE'), 'expert', 5, true, true)
ON CONFLICT (teacher_id, subject_id) DO NOTHING;

-- Insert time slots
INSERT INTO timetable_time_slots (slot_name, slot_number, start_time, end_time, is_break, is_active) VALUES
('Period 1', 1, '08:00:00', '08:45:00', false, true),
('Period 2', 2, '08:45:00', '09:30:00', false, true),
('Period 3', 3, '09:30:00', '10:15:00', false, true),
('Period 4', 4, '10:15:00', '11:00:00', false, true),
('Break 1', 5, '11:00:00', '11:15:00', true, true),
('Period 5', 6, '11:15:00', '12:00:00', false, true),
('Period 6', 7, '12:00:00', '12:45:00', false, true),
('Lunch Break', 8, '12:45:00', '13:30:00', true, true),
('Period 7', 9, '13:30:00', '14:15:00', false, true),
('Period 8', 10, '14:15:00', '15:00:00', false, true),
('Period 9', 11, '15:00:00', '15:45:00', false, true),
('Period 10', 12, '15:45:00', '16:30:00', false, true)
ON CONFLICT (slot_id) DO NOTHING;

-- Display summary
SELECT 
    'Classes inserted: ' || COUNT(*) as summary
FROM timetable_classes 
WHERE academic_year = '2024-2025';

SELECT 
    'Teachers inserted: ' || COUNT(*) as summary
FROM timetable_teachers 
WHERE is_active = true;

SELECT 
    'Rooms inserted: ' || COUNT(*) as summary
FROM timetable_rooms 
WHERE is_active = true;

SELECT 
    'Subjects inserted: ' || COUNT(*) as summary
FROM timetable_subjects 
WHERE is_active = true;
