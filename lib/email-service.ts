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

export class EmailService {
  /**
   * Send welcome email to student and parent with their login credentials
   */
  static async sendWelcomeEmail(data: WelcomeEmailData): Promise<{ success: boolean; error?: string }> {
    try {
      // Send email to student
      if (data.studentEmail) {
        await resend.emails.send({
          from: 'Government Bilingual High School <noreply@gbhs-yaounde.cm>',
          to: [data.studentEmail],
          subject: 'Welcome to Government Bilingual High School Yaoundé - Your Login Credentials',
          html: this.generateStudentWelcomeEmail(data),
        });
      }

      // Send email to parent
      if (data.parentEmail) {
        await resend.emails.send({
          from: 'Government Bilingual High School <noreply@gbhs-yaounde.cm>',
          to: [data.parentEmail],
          subject: 'Welcome to Government Bilingual High School Yaoundé - Parent Access Credentials',
          html: this.generateParentWelcomeEmail(data),
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
            <h2>Dear ${data.studentName},</h2>
            
            <p>Congratulations! Your enrollment at Government Bilingual High School Yaoundé has been successfully completed.</p>
            
            <div class="credentials">
              <h3>Your Login Credentials</h3>
              <div class="credential-item">
                <span class="credential-label">Student ID:</span>
                <div class="credential-value">${data.studentId}</div>
              </div>
              <div class="credential-item">
                <span class="credential-label">Email:</span>
                <div class="credential-value">${data.studentEmail}</div>
              </div>
              <div class="credential-item">
                <span class="credential-label">Password:</span>
                <div class="credential-value">${data.studentPassword}</div>
              </div>
              <div class="credential-item">
                <span class="credential-label">Class:</span>
                <div class="credential-value">${data.className}</div>
              </div>
            </div>

            <div class="important">
              <strong>Important:</strong> Please keep these credentials safe. You will need them to access the school management system.
              For security reasons, please change your password after your first login.
            </div>

            <div class="steps">
              <h3>Next Steps</h3>
              <div class="step">
                <strong>1. Complete Document Submission</strong><br>
                Visit the school office with original documents for verification
              </div>
              <div class="step">
                <strong>2. Pay Enrollment Fees</strong><br>
                Complete fee payment at the bursar's office
              </div>
              <div class="step">
                <strong>3. Collect Student ID Card</strong><br>
                Pick up your official student identification card
              </div>
              <div class="step">
                <strong>4. Attend Orientation</strong><br>
                Join the new student orientation session
              </div>
            </div>

            <p>Welcome to our school community! We look forward to supporting your academic journey.</p>
            
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
