-- Insert sample activity logs for testing
-- Run this script in your Supabase SQL Editor

-- First, let's get some user IDs to work with
DO $$
DECLARE
    admin_user_id UUID;
    teacher_user_id UUID;
    student_user_id UUID;
BEGIN
    -- Get admin user ID
    SELECT id INTO admin_user_id FROM users WHERE role = 'admin' LIMIT 1;
    
    -- Get teacher user ID
    SELECT id INTO teacher_user_id FROM users WHERE role = 'teacher' LIMIT 1;
    
    -- Get student user ID
    SELECT id INTO student_user_id FROM users WHERE role = 'student' LIMIT 1;

    -- Insert sample activity logs
    INSERT INTO user_activity_logs (user_id, action, details, ip_address, user_agent, created_at) VALUES
    -- Recent activities (last 24 hours)
    (admin_user_id, 'LOGIN', 'User logged in successfully', '192.168.1.100', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36', NOW() - INTERVAL '2 hours'),
    (admin_user_id, 'CREATE_USER', 'Created new teacher account for Dr. Marie Ngozi', '192.168.1.100', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36', NOW() - INTERVAL '4 hours'),
    (teacher_user_id, 'LOGIN', 'User logged in successfully', '192.168.1.101', 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36', NOW() - INTERVAL '6 hours'),
    (teacher_user_id, 'EXAM_CREATED', 'Created Mathematics mid-term exam for Form 5A', '192.168.1.101', 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36', NOW() - INTERVAL '8 hours'),
    (student_user_id, 'LOGIN', 'User logged in successfully', '192.168.1.102', 'Mozilla/5.0 (iPhone; CPU iPhone OS 14_7_1 like Mac OS X) AppleWebKit/605.1.15', NOW() - INTERVAL '10 hours'),
    (student_user_id, 'VIEW_GRADES', 'Viewed academic performance for current semester', '192.168.1.102', 'Mozilla/5.0 (iPhone; CPU iPhone OS 14_7_1 like Mac OS X) AppleWebKit/605.1.15', NOW() - INTERVAL '12 hours'),
    
    -- Activities from yesterday
    (admin_user_id, 'UPDATE_USER', 'Updated profile information for student Paul Biya Mbeki', '192.168.1.100', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36', NOW() - INTERVAL '1 day'),
    (admin_user_id, 'STATUS_CHANGE', 'Changed user status from active to suspended for John Doe', '192.168.1.100', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36', NOW() - INTERVAL '1 day' + INTERVAL '2 hours'),
    (teacher_user_id, 'ATTENDANCE_MARKED', 'Marked attendance for Form 5A - 22 present, 3 absent', '192.168.1.101', 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36', NOW() - INTERVAL '1 day' + INTERVAL '4 hours'),
    (teacher_user_id, 'GRADE_UPDATED', 'Updated grades for Mathematics assignment', '192.168.1.101', 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36', NOW() - INTERVAL '1 day' + INTERVAL '6 hours'),
    
    -- Activities from last week
    (admin_user_id, 'SYSTEM_CONFIG', 'Updated system configuration settings', '192.168.1.100', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36', NOW() - INTERVAL '3 days'),
    (admin_user_id, 'BACKUP_CREATED', 'Created system backup', '192.168.1.100', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36', NOW() - INTERVAL '4 days'),
    (teacher_user_id, 'REPORT_GENERATED', 'Generated class performance report for Form 5A', '192.168.1.101', 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36', NOW() - INTERVAL '5 days'),
    (student_user_id, 'ASSIGNMENT_SUBMITTED', 'Submitted English essay assignment', '192.168.1.102', 'Mozilla/5.0 (iPhone; CPU iPhone OS 14_7_1 like Mac OS X) AppleWebKit/605.1.15', NOW() - INTERVAL '6 days'),
    
    -- Activities from last month
    (admin_user_id, 'BULK_IMPORT', 'Imported 150 new student records', '192.168.1.100', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36', NOW() - INTERVAL '2 weeks'),
    (teacher_user_id, 'CURRICULUM_UPDATED', 'Updated curriculum for Mathematics course', '192.168.1.101', 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36', NOW() - INTERVAL '3 weeks'),
    (student_user_id, 'PROFILE_UPDATED', 'Updated personal profile information', '192.168.1.102', 'Mozilla/5.0 (iPhone; CPU iPhone OS 14_7_1 like Mac OS X) AppleWebKit/605.1.15', NOW() - INTERVAL '4 weeks');

    RAISE NOTICE 'Sample activity logs inserted successfully';
END $$;
