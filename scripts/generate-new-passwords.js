/**
 * Password Generator Script
 * Generates new passwords for all user types (excluding admin)
 * This script shows you the new passwords that should be set
 */

/**
 * Generates a secure default password for new users
 * Format: Role@Year + 4 random alphanumeric characters
 * Example: Teacher@2024Xy9z
 */
function generateDefaultPassword(role, year = 2024) {
  const randomChars = Math.random().toString(36).substring(2, 6).toUpperCase();
  const capitalizedRole = role.charAt(0).toUpperCase() + role.slice(1);
  return `${capitalizedRole}@${year}${randomChars}`;
}

function generateAllPasswords() {
  console.log('🔐 GENERATING NEW PASSWORDS FOR ALL USER TYPES\n');
  console.log('═'.repeat(80));

  const userTypes = [
    { role: 'student', name: 'Student User', email: 'student@pisonacademy.cm' },
    { role: 'parent', name: 'Parent User', email: 'parent@pisonacademy.cm' },
    { role: 'bursar', name: 'Bursar User', email: 'bursar@pisonacademy.cm' },
    { role: 'teacher', name: 'Teacher User', email: 'teacher@pisonacademy.cm' }
  ];

  const newPasswords = [];

  console.log('📋 NEW USER CREDENTIALS:\n');

  userTypes.forEach((user, index) => {
    const newPassword = generateDefaultPassword(user.role);
    newPasswords.push({
      ...user,
      password: newPassword
    });

    console.log(`🔹 ${user.role.toUpperCase()} USER:`);
    console.log('─'.repeat(40));
    console.log(`📧 Email: ${user.email}`);
    console.log(`👤 Name: ${user.name}`);
    console.log(`🔑 NEW Password: ${newPassword}`);
    console.log('─'.repeat(40));
    console.log('');
  });

  console.log('═'.repeat(80));
  console.log('📝 SUMMARY OF ALL NEW PASSWORDS:');
  console.log('═'.repeat(80));
  
  newPasswords.forEach(user => {
    console.log(`${user.role.toUpperCase()}: ${user.password}`);
  });

  console.log('\n⚠️  IMPORTANT SECURITY NOTES:');
  console.log('• All passwords expire in 30 days');
  console.log('• Users should change passwords on first login');
  console.log('• Store these credentials securely');
  console.log('• Consider using a password manager');

  console.log('\n🛠️  HOW TO APPLY THESE PASSWORDS:');
  console.log('1. Log in as admin (admin@pisonacademy.cm / Admin@2024)');
  console.log('2. Go to User Management');
  console.log('3. Find each user and click "Reset Password"');
  console.log('4. The system will generate new passwords automatically');
  console.log('5. Or manually update passwords using these generated ones');

  return newPasswords;
}

// Run the password generation
if (require.main === module) {
  generateAllPasswords();
}

module.exports = {
  generateDefaultPassword,
  generateAllPasswords
};
