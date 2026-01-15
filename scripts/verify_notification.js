const { createClient } = require('@supabase/supabase-js');
const dotenv = require('dotenv');
dotenv.config({ path: '.env.local' });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error('Missing Supabase environment variables');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function verifyNotification() {
  const teacherUserId = 'c79b72eb-38f1-4eb5-a95b-fe908a192b4c'; // From my previous run_command
  const classId = '8fe6b8a4-0eba-4e52-8813-32975299b206'; // AC 4
  const subjectName = 'General Mathematics';
  const title = 'First Sequence';

  console.log('--- STARTING NOTIFICATION VERIFICATION ---');

  // 1. Check for existing notifications for admins to establish baseline
  const { data: admins } = await supabase
    .from('users')
    .select('id, email')
    .in('role', ['admin', 'superadmin']);

  if (!admins || admins.length === 0) {
    console.error('No admins found to notify');
    return;
  }
  console.log(`Found ${admins.length} admins.`);

  // 2. Manually trigger the notification logic (as implemented in the API)
  console.log('Step 2: Triggering notification logic...');
  
  // Logic copied from route.ts
  const { data: teacher } = await supabase
    .from('teachers')
    .select('first_name, last_name')
    .eq('user_id', teacherUserId)
    .maybeSingle()
  
  const teacherName = teacher ? `${teacher.first_name} ${teacher.last_name}` : 'A teacher'

  const { data: classData } = await supabase
    .from('classes')
    .select('name, class_name')
    .eq('id', classId)
    .maybeSingle()
  
  const className = classData?.name || classData?.class_name || 'an unknown class'

  const notificationPayloads = admins.map(admin => ({
    recipient_id: admin.id,
    title: '📝 New Marks Entered (Test)',
    message: `${teacherName} has entered/updated marks for **${subjectName}** in **${className}** (${title}).`,
    type: 'success',
    read: false,
    created_at: new Date().toISOString()
  }))

  const { data: inserted, error: iError } = await supabase
    .from('notifications')
    .insert(notificationPayloads)
    .select();

  if (iError) {
    console.error('Failed to insert notifications:', iError);
    return;
  }
  console.log(`Inserted ${inserted.length} notifications.`);

  // 3. Verify they exist in DB
  const { data: verified, error: vError } = await supabase
    .from('notifications')
    .select('*')
    .eq('title', '📝 New Marks Entered (Test)')
    .order('created_at', { ascending: false })
    .limit(admins.length);

  if (vError) {
    console.error('Failed to verify notifications:', vError);
    return;
  }

  if (verified.length === admins.length) {
    console.log('--- NOTIFICATION VERIFICATION PASSED ---');
    console.log('Sample Notification:', JSON.stringify(verified[0], null, 2));
    
    // Cleanup
    await supabase.from('notifications').delete().eq('title', '📝 New Marks Entered (Test)');
    console.log('Test notifications cleaned up.');
  } else {
    console.error(`Verification failed. Found ${verified.length} notifications, expected ${admins.length}`);
  }
}

verifyNotification();
