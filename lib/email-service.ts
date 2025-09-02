import { Resend } from 'resend';

// Initialize Resend client
const resend = new Resend(process.env.RESEND_API_KEY);

export interface WelcomeEmailData {
  studentName: string;
  studentEmail: string;
  parentName: string;
  parentEmail: string;
  studentId: string;
  parentCode: string;
  studentPassword: string;
  parentPassword: string;
  className: string;
}

export interface GenericWelcomeEmailData {
  name: string;
  email: string;
  role: string;
  userId?: string;
  password: string;
  className?: string;
}

export class EmailService {
  /**
   * Send welcome email to student and parent with their login credentials
   */
  static async sendWelcomeEmail(data: WelcomeEmailData): Promise<{ success: boolean; error?: string }> {
    try {
      // Send combined email to student
      if (data.studentEmail) {
        await resend.emails.send({
          from: 'Government Bilingual High School <noreply@gbhs-yaounde.cm>',
          to: [data.studentEmail],
          subject: 'Welcome to Government Bilingual High School Yaoundé',
          html: this.generateStudentWelcomeEmail(data),
        });
      }

      // Send combined email to parent as well
      if (data.parentEmail) {
        await resend.emails.send({
          from: 'Government Bilingual High School <noreply@gbhs-yaounde.cm>',
          to: [data.parentEmail],
          subject: 'Welcome to Government Bilingual High School Yaoundé',
          html: this.generateStudentWelcomeEmail(data),
        });
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

  /**
   * Send generic welcome email for non-student users (teachers, parents, bursars, admins)
   */
  static async sendGenericWelcomeEmail(data: GenericWelcomeEmailData): Promise<{ success: boolean; error?: string }> {
    try {
      await resend.emails.send({
        from: 'Government Bilingual High School <noreply@gbhs-yaounde.cm>',
        to: [data.email],
        subject: `Welcome to Government Bilingual High School Yaoundé - ${data.role.charAt(0).toUpperCase() + data.role.slice(1)} Access Credentials`,
        html: this.generateGenericWelcomeEmail(data),
      });

      return { success: true };
    } catch (error) {
      console.error('Error sending generic welcome email:', error);
      return { 
        success: false, 
        error: error instanceof Error ? error.message : 'Failed to send email' 
      };
    }
  }

  /**
   * Generate HTML email content for generic users
   */
  private static generateGenericWelcomeEmail(data: GenericWelcomeEmailData): string {
    const roleDisplay = data.role.charAt(0).toUpperCase() + data.role.slice(1)
    
    return `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Welcome to Government Bilingual High School Yaoundé</title>
        <style>
          body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
          .container { max-width: 600px; margin: 0 auto; padding: 20px; }
          .header { background-color: #1e40af; color: white; padding: 20px; text-align: center; }
          .content { padding: 20px; background-color: #f9fafb; }
          .credentials { background-color: white; padding: 15px; margin: 15px 0; border-left: 4px solid #1e40af; }
          .credential-item { margin: 10px 0; }
          .credential-label { font-weight: bold; color: #374151; }
          .credential-value { font-family: monospace; background-color: #f3f4f6; padding: 5px 10px; border-radius: 4px; }
          .footer { text-align: center; padding: 20px; color: #6b7280; font-size: 14px; }
          .important { background-color: #fef3c7; border: 1px solid #f59e0b; padding: 15px; margin: 15px 0; border-radius: 4px; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1>Welcome to Government Bilingual High School Yaoundé</h1>
          </div>
          
          <div class="content">
            <h2>Dear ${data.name},</h2>
            
            <p>Welcome to the ${roleDisplay} portal of Government Bilingual High School Yaoundé! Your account has been successfully created.</p>
            
            <div class="credentials">
              <h3>Your Login Credentials</h3>
              <div class="credential-item">
                <span class="credential-label">Email:</span>
                <div class="credential-value">${data.email}</div>
              </div>
              <div class="credential-item">
                <span class="credential-label">Password:</span>
                <div class="credential-value">${data.password}</div>
              </div>
              ${data.userId ? `
              <div class="credential-item">
                <span class="credential-label">User ID:</span>
                <div class="credential-value">${data.userId}</div>
              </div>
              ` : ''}
              ${data.className ? `
              <div class="credential-item">
                <span class="credential-label">Class:</span>
                <div class="credential-value">${data.className}</div>
              </div>
              ` : ''}
            </div>

            <div class="important">
              <strong>Important:</strong> Please keep these credentials safe. You will need them to access the school management system.
              For security reasons, please change your password after your first login.
            </div>

            <p>Welcome to our school community! We look forward to working with you.</p>
            
            <p>Best regards,<br>
            Administration Team<br>
            Government Bilingual High School Yaoundé</p>
          </div>
          
          <div class="footer">
            <p>This is an automated message. Please do not reply to this email.</p>
            <p>For assistance, contact the school administration.</p>
          </div>
        </div>
      </body>
      </html>
    `;
  }

  /**
   * Generate HTML email content for student
   */
  private static generateStudentWelcomeEmail(data: WelcomeEmailData): string {
    return `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Welcome to Government Bilingual High School Yaoundé</title>
        <style>
          body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
          .container { max-width: 600px; margin: 0 auto; padding: 20px; }
          .header { background-color: #1e40af; color: white; padding: 20px; text-align: center; }
          .content { padding: 20px; background-color: #f9fafb; }
          .credentials { background-color: white; padding: 15px; margin: 15px 0; border-left: 4px solid #1e40af; }
          .credential-item { margin: 10px 0; }
          .credential-label { font-weight: bold; color: #374151; }
          .credential-value { font-family: monospace; background-color: #f3f4f6; padding: 5px 10px; border-radius: 4px; }
          .steps { background-color: white; padding: 15px; margin: 15px 0; }
          .step { margin: 10px 0; padding: 10px; background-color: #f9fafb; border-radius: 4px; }
          .footer { text-align: center; padding: 20px; color: #6b7280; font-size: 14px; }
          .important { background-color: #fef3c7; border: 1px solid #f59e0b; padding: 15px; margin: 15px 0; border-radius: 4px; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1>Welcome to Government Bilingual High School Yaoundé</h1>
          </div>
          
          <div class="content">
            <h2>Dear ${data.studentName} and Parent/Guardian,</h2>
            
            <p>Congratulations! Your enrollment at Government Bilingual High School Yaoundé has been successfully completed.</p>
            
            <div class="credentials">
              <h3>Student Details:</h3>
              <div class="credential-item">
                <span class="credential-label">• Student ID:</span>
                <div class="credential-value">${data.studentId}</div>
              </div>
              <div class="credential-item">
                <span class="credential-label">• Parent Access Code:</span>
                <div class="credential-value">${data.parentCode}</div>
              </div>
              <div class="credential-item">
                <span class="credential-label">• Student Password:</span>
                <div class="credential-value">${data.studentPassword}</div>
              </div>
              <div class="credential-item">
                <span class="credential-label">• Parent Password:</span>
                <div class="credential-value">${data.parentPassword}</div>
              </div>
            </div>

            <div class="important">
              <strong>Please keep these credentials safe as they will be needed to access the school management system.</strong>
            </div>

            <div class="steps">
              <h3>Next Steps:</h3>
              <div class="step">
                <strong>1. Complete document submission at the school office</strong>
              </div>
              <div class="step">
                <strong>2. Pay enrollment fees at the bursar's office</strong>
              </div>
              <div class="step">
                <strong>3. Collect your student ID card</strong>
              </div>
              <div class="step">
                <strong>4. Attend orientation session</strong>
              </div>
            </div>

            <p>Welcome to our school community!</p>
            
            <p>Best regards,<br>
            Administration Team<br>
            Government Bilingual High School Yaoundé</p>
          </div>
          
          <div class="footer">
            <p>This is an automated message. Please do not reply to this email.</p>
            <p>For assistance, contact the school administration.</p>
          </div>
        </div>
      </body>
      </html>
    `;
  }

  /**
   * Generate HTML email content for parent
   */
  private static generateParentWelcomeEmail(data: WelcomeEmailData): string {
    return `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Parent Access - Government Bilingual High School Yaoundé</title>
        <style>
          body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
          .container { max-width: 600px; margin: 0 auto; padding: 20px; }
          .header { background-color: #1e40af; color: white; padding: 20px; text-align: center; }
          .content { padding: 20px; background-color: #f9fafb; }
          .credentials { background-color: white; padding: 15px; margin: 15px 0; border-left: 4px solid #1e40af; }
          .credential-item { margin: 10px 0; }
          .credential-label { font-weight: bold; color: #374151; }
          .credential-value { font-family: monospace; background-color: #f3f4f6; padding: 5px 10px; border-radius: 4px; }
          .student-info { background-color: white; padding: 15px; margin: 15px 0; }
          .footer { text-align: center; padding: 20px; color: #6b7280; font-size: 14px; }
          .important { background-color: #fef3c7; border: 1px solid #f59e0b; padding: 15px; margin: 15px 0; border-radius: 4px; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1>Parent Access - Government Bilingual High School Yaoundé</h1>
          </div>
          
          <div class="content">
            <h2>Dear ${data.parentName},</h2>
            
            <p>Welcome to the parent portal of Government Bilingual High School Yaoundé! Your child ${data.studentName} has been successfully enrolled.</p>
            
            <div class="student-info">
              <h3>Student Information</h3>
              <div class="credential-item">
                <span class="credential-label">Student Name:</span>
                <div class="credential-value">${data.studentName}</div>
              </div>
              <div class="credential-item">
                <span class="credential-label">Student ID:</span>
                <div class="credential-value">${data.studentId}</div>
              </div>
              <div class="credential-item">
                <span class="credential-label">Class:</span>
                <div class="credential-value">${data.className}</div>
              </div>
            </div>

            <div class="credentials">
              <h3>Your Parent Access Credentials</h3>
              <div class="credential-item">
                <span class="credential-label">Parent Access Code:</span>
                <div class="credential-value">${data.parentCode}</div>
              </div>
              <div class="credential-item">
                <span class="credential-label">Email:</span>
                <div class="credential-value">${data.parentEmail}</div>
              </div>
              <div class="credential-item">
                <span class="credential-label">Password:</span>
                <div class="credential-value">${data.parentPassword}</div>
              </div>
            </div>

            <div class="important">
              <strong>Important:</strong> Please keep these credentials safe. You will need them to access your child's academic progress, 
              communicate with teachers, and view financial records. For security reasons, please change your password after your first login.
            </div>

            <h3>What You Can Do</h3>
            <ul>
              <li>View your child's academic progress and grades</li>
              <li>Communicate with teachers and school administration</li>
              <li>View and manage financial records and payments</li>
              <li>Access school announcements and important updates</li>
              <li>Schedule parent-teacher meetings</li>
            </ul>

            <p>We look forward to partnering with you in your child's educational journey.</p>
            
            <p>Best regards,<br>
            Administration Team<br>
            Government Bilingual High School Yaoundé</p>
          </div>
          
          <div class="footer">
            <p>This is an automated message. Please do not reply to this email.</p>
            <p>For assistance, contact the school administration.</p>
          </div>
        </div>
      </body>
      </html>
    `;
  }
}
