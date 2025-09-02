import { EmailService } from './email-service';

export interface EmailData {
  name: string;
  email: string;
  role: string;
  userId?: string;
  password: string;
  className?: string;
  parentName?: string;
  parentEmail?: string;
  parentCode?: string;
  parentPassword?: string;
}

export function generateEmailContent(data: EmailData): string {
  const roleDisplay = data.role.charAt(0).toUpperCase() + data.role.slice(1);
  
  if (data.role === 'student' && data.parentEmail && data.parentName) {
    // Generate combined student and parent email content
    return `
Subject: Welcome to Government Bilingual High School Yaoundé

Dear ${data.name} and Parent/Guardian,

Congratulations! Your enrollment at Government Bilingual High School Yaoundé has been successfully completed.

Student Details:
- Student ID: ${data.userId}
- Parent Access Code: ${data.parentCode}
- Student Password: ${data.password}
- Parent Password: ${data.parentPassword}

Please keep these credentials safe as they will be needed to access the school management system.

Next Steps:
1. Complete document submission at the school office
2. Pay enrollment fees at the bursar's office
3. Collect your student ID card
4. Attend orientation session

Welcome to our school community!

Best regards,
Administration Team
Government Bilingual High School Yaoundé
    `;
  } else {
    // Generate generic email content
    return `
Subject: Welcome to Government Bilingual High School Yaoundé - ${roleDisplay} Access Credentials

Dear ${data.name},

Welcome to the ${roleDisplay} portal of Government Bilingual High School Yaoundé! Your account has been successfully created.

Your Login Credentials:
- Email: ${data.email}
- Password: ${data.password}
${data.userId ? `- User ID: ${data.userId}` : ''}
${data.className ? `- Class: ${data.className}` : ''}

Important: Please keep these credentials safe. You will need them to access the school management system.
For security reasons, please change your password after your first login.

Welcome to our school community! We look forward to working with you.

Best regards,
Administration Team
Government Bilingual High School Yaoundé
    `;
  }
}

export async function sendWelcomeEmail(data: EmailData): Promise<{ success: boolean; error?: string }> {
  try {
    const response = await fetch('/api/users/send-welcome-email', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(data),
    });

    const result = await response.json();

    if (!response.ok) {
      throw new Error(result.error || 'Failed to send welcome email');
    }

    return { success: true };
  } catch (error) {
    console.error('Error sending welcome email:', error);
    return { 
      success: false, 
      error: error instanceof Error ? error.message : 'Failed to send email' 
    };
  }
}

export function downloadEmailContent(data: EmailData): void {
  const content = generateEmailContent(data);
  const blob = new Blob([content], { type: 'text/plain' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `welcome-email-${data.name.replace(/\s+/g, '-').toLowerCase()}.txt`;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}
