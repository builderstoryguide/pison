-- Sample User Data for School Management System
-- Run this script in Supabase SQL Editor after running simple-users-setup.sql

-- Insert sample admin users
INSERT INTO users (id, email, password_hash, name, role, status, phone, gender, has_default_password) VALUES
('550e8400-e29b-41d4-a716-446655440001', 'admin@school.com', '$2a$10$hashed_password_here', 'Admin User', 'admin', 'active', '+237 123456789', 'male', true),
('550e8400-e29b-41d4-a716-446655440002', 'principal@school.com', '$2a$10$hashed_password_here', 'School Principal', 'admin', 'active', '+237 123456790', 'female', true);

-- Insert sample teachers
INSERT INTO users (id, email, password_hash, name, role, status, phone, gender, has_default_password) VALUES
('660e8400-e29b-41d4-a716-446655440001', 'p.mbeki@school.com', '$2a$10$hashed_password_here', 'Paul Biya Mbeki', 'teacher', 'active', '+237 123456791', 'male', true),
('660e8400-e29b-41d4-a716-446655440002', 'm.ngozi@school.com', '$2a$10$hashed_password_here', 'Marie Ngozi', 'teacher', 'active', '+237 123456792', 'female', true),
('660e8400-e29b-41d4-a716-446655440003', 'j.claude@school.com', '$2a$10$hashed_password_here', 'Jean Claude', 'teacher', 'active', '+237 123456793', 'male', true),
('660e8400-e29b-41d4-a716-446655440004', 'g.tabi@school.com', '$2a$10$hashed_password_here', 'Grace Tabi', 'teacher', 'active', '+237 123456794', 'female', true),
('660e8400-e29b-41d4-a716-446655440005', 'a.fru@school.com', '$2a$10$hashed_password_here', 'Amina Fru', 'teacher', 'active', '+237 123456795', 'female', true);

-- Insert sample students
INSERT INTO users (id, email, password_hash, name, role, status, phone, gender, has_default_password) VALUES
('770e8400-e29b-41d4-a716-446655440001', 'student1@school.com', '$2a$10$hashed_password_here', 'John Doe', 'student', 'active', '+237 123456796', 'male', true),
('770e8400-e29b-41d4-a716-446655440002', 'student2@school.com', '$2a$10$hashed_password_here', 'Jane Smith', 'student', 'active', '+237 123456797', 'female', true),
('770e8400-e29b-41d4-a716-446655440003', 'student3@school.com', '$2a$10$hashed_password_here', 'Mike Johnson', 'student', 'active', '+237 123456798', 'male', true),
('770e8400-e29b-41d4-a716-446655440004', 'student4@school.com', '$2a$10$hashed_password_here', 'Sarah Wilson', 'student', 'active', '+237 123456799', 'female', true),
('770e8400-e29b-41d4-a716-446655440005', 'student5@school.com', '$2a$10$hashed_password_here', 'David Brown', 'student', 'active', '+237 123456800', 'male', true);

-- Insert sample parents
INSERT INTO users (id, email, password_hash, name, role, status, phone, gender, has_default_password) VALUES
('880e8400-e29b-41d4-a716-446655440001', 'parent1@email.com', '$2a$10$hashed_password_here', 'Robert Doe', 'parent', 'active', '+237 123456801', 'male', true),
('880e8400-e29b-41d4-a716-446655440002', 'parent2@email.com', '$2a$10$hashed_password_here', 'Mary Smith', 'parent', 'active', '+237 123456802', 'female', true),
('880e8400-e29b-41d4-a716-446655440003', 'parent3@email.com', '$2a$10$hashed_password_here', 'James Johnson', 'parent', 'active', '+237 123456803', 'male', true),
('880e8400-e29b-41d4-a716-446655440004', 'parent4@email.com', '$2a$10$hashed_password_here', 'Lisa Wilson', 'parent', 'active', '+237 123456804', 'female', true),
('880e8400-e29b-41d4-a716-446655440005', 'parent5@email.com', '$2a$10$hashed_password_here', 'Thomas Brown', 'parent', 'active', '+237 123456805', 'male', true);

-- Insert sample bursar
INSERT INTO users (id, email, password_hash, name, role, status, phone, gender, has_default_password) VALUES
('990e8400-e29b-41d4-a716-446655440001', 'bursar@school.com', '$2a$10$hashed_password_here', 'Finance Manager', 'bursar', 'active', '+237 123456806', 'female', true);

-- Insert user profiles for teachers
INSERT INTO user_profiles (user_id, role_specific_id, subsystem, branch, occupation) VALUES
('660e8400-e29b-41d4-a716-446655440001', 'TCH2024001', 'english', 'grammar', 'Mathematics Teacher'),
('660e8400-e29b-41d4-a716-446655440002', 'TCH2024002', 'english', 'grammar', 'English Teacher'),
('660e8400-e29b-41d4-a716-446655440003', 'TCH2024003', 'french', 'technical', 'Science Teacher'),
('660e8400-e29b-41d4-a716-446655440004', 'TCH2024004', 'english', 'commercial', 'History Teacher'),
('660e8400-e29b-41d4-a716-446655440005', 'TCH2024005', 'french', 'grammar', 'French Teacher');

-- Insert user profiles for students
INSERT INTO user_profiles (user_id, role_specific_id, subsystem, branch, class_name) VALUES
('770e8400-e29b-41d4-a716-446655440001', 'STU2024001', 'english', 'grammar', 'Form 1A'),
('770e8400-e29b-41d4-a716-446655440002', 'STU2024002', 'english', 'technical', 'Form 2B'),
('770e8400-e29b-41d4-a716-446655440003', 'english', 'commercial', 'Form 3B'),
('770e8400-e29b-41d4-a716-446655440004', 'french', 'grammar', 'Sixième A'),
('770e8400-e29b-41d4-a716-446655440005', 'french', 'technical', 'Cinquième B');

-- Insert user profiles for parents
INSERT INTO user_profiles (user_id, role_specific_id, occupation, relationship, emergency_contact_name, emergency_contact_phone) VALUES
('880e8400-e29b-41d4-a716-446655440001', 'PAR2024001', 'Engineer', 'father', 'Robert Doe', '+237 123456807'),
('880e8400-e29b-41d4-a716-446655440002', 'PAR2024002', 'Doctor', 'mother', 'Mary Smith', '+237 123456808'),
('880e8400-e29b-41d4-a716-446655440003', 'PAR2024003', 'Lawyer', 'father', 'James Johnson', '+237 123456809'),
('880e8400-e29b-41d4-a716-446655440004', 'PAR2024004', 'Teacher', 'mother', 'Lisa Wilson', '+237 123456810'),
('880e8400-e29b-41d4-a716-446655440005', 'PAR2024005', 'Business Owner', 'father', 'Thomas Brown', '+237 123456811');

-- Insert user profiles for bursar
INSERT INTO user_profiles (user_id, role_specific_id, occupation) VALUES
('990e8400-e29b-41d4-a716-446655440001', 'BUR2024001', 'Finance Manager');

-- Insert some activity logs
INSERT INTO user_activity_logs (user_id, action, details, ip_address) VALUES
('550e8400-e29b-41d4-a716-446655440001', 'login', 'User logged in successfully', '192.168.1.1'),
('660e8400-e29b-41d4-a716-446655440001', 'login', 'User logged in successfully', '192.168.1.2'),
('770e8400-e29b-41d4-a716-446655440001', 'login', 'User logged in successfully', '192.168.1.3'),
('880e8400-e29b-41d4-a716-446655440001', 'login', 'User logged in successfully', '192.168.1.4'),
('990e8400-e29b-41d4-a716-446655440001', 'login', 'User logged in successfully', '192.168.1.5');

-- Display summary
SELECT 
    'Users inserted: ' || COUNT(*) as summary
FROM users;

SELECT 
    'User profiles inserted: ' || COUNT(*) as summary
FROM user_profiles;

SELECT 
    'Activity logs inserted: ' || COUNT(*) as summary
FROM user_activity_logs;
