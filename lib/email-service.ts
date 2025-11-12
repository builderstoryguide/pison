import { Resend } from 'resend';

// Lazy-initialize Resend client to avoid build-time errors
function getResendClient(): Resend {
  const apiKey = process.env.RESEND_API_KEY;
  if (!apiKey) {
    throw new Error('RESEND_API_KEY is not configured. Please set it in your environment variables.');
  }
  return new Resend(apiKey);
}

interface SendTeacherWelcomeEmailParams {
  teacherName: string;
  teacherId: string;
  email: string;
  password: string;
  subsystem?: string;
  subjects?: string[];
  classes?: string[];
}

interface EmailServiceResult {
  success: boolean;
  error?: string;
  emailId?: string;
}

export class EmailService {
  /**
   * Send a welcome email to a newly enrolled teacher
   */
  static async sendTeacherWelcomeEmail(
    params: SendTeacherWelcomeEmailParams
  ): Promise<EmailServiceResult> {
    try {
      const { teacherName, teacherId, email, password, subsystem, subjects = [], classes = [] } = params;

      // Validate required fields
      if (!teacherName || !email || !password) {
        return {
          success: false,
          error: 'Teacher name, email, and password are required',
        };
      }

      // Validate email format
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(email)) {
        return {
          success: false,
          error: 'Invalid email format',
        };
      }

      // Generate email content
      const emailContent = this.generateTeacherWelcomeEmailHTML({
        teacherName,
        teacherId,
        email,
        password,
        subsystem,
        subjects,
        classes,
      });

      // Send email
      const resend = getResendClient();
      const result = await resend.emails.send({
        from: 'Pison Academy <noreply@pisonacademy.cm>',
        to: [email],
        subject: 'Welcome to Pison Academy of Excellence - Teacher Portal Access',
        html: emailContent,
      });

      return {
        success: true,
        emailId: 'data' in result && result.data ? result.data.id : undefined,
      };
    } catch (error) {
      console.error('Error sending teacher welcome email:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to send teacher welcome email',
      };
    }
  }

  /**
   * Generate HTML content for teacher welcome email
   */
  private static generateTeacherWelcomeEmailHTML(params: SendTeacherWelcomeEmailParams): string {
    const { teacherName, teacherId, email, password, subsystem, subjects, classes } = params;

    const subjectsList = subjects.length > 0 
      ? `<ul style="margin: 10px 0; padding-left: 20px;">${subjects.map(s => `<li>${s}</li>`).join('')}</ul>`
      : '<p style="margin: 10px 0; color: #6b7280;">No subjects assigned yet</p>';

    const classesList = classes.length > 0
      ? `<ul style="margin: 10px 0; padding-left: 20px;">${classes.map(c => `<li>${c}</li>`).join('')}</ul>`
      : '<p style="margin: 10px 0; color: #6b7280;">No classes assigned yet</p>';

    return `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Welcome to Pison Academy</title>
        <style>
          body {
            font-family: Arial, sans-serif;
            line-height: 1.6;
            color: #333;
            margin: 0;
            padding: 0;
            background-color: #f4f4f4;
          }
          .container {
            max-width: 600px;
            margin: 20px auto;
            background-color: #ffffff;
            border-radius: 8px;
            overflow: hidden;
            box-shadow: 0 2px 4px rgba(0,0,0,0.1);
          }
          .header {
            background-color: #1e40af;
            color: white;
            padding: 30px 20px;
            text-align: center;
          }
          .header h1 {
            margin: 0;
            font-size: 24px;
          }
          .content {
            padding: 30px 20px;
          }
          .credentials {
            background-color: #f9fafb;
            border: 2px solid #e5e7eb;
            border-radius: 6px;
            padding: 20px;
            margin: 20px 0;
          }
          .credentials h3 {
            margin-top: 0;
            color: #1e40af;
          }
          .credential-item {
            margin: 15px 0;
            padding: 10px;
            background-color: white;
            border-left: 4px solid #1e40af;
            border-radius: 4px;
          }
          .credential-label {
            font-weight: bold;
            color: #6b7280;
            font-size: 14px;
            text-transform: uppercase;
            letter-spacing: 0.5px;
          }
          .credential-value {
            font-size: 18px;
            color: #111827;
            margin-top: 5px;
            font-family: monospace;
          }
          .info-section {
            margin: 20px 0;
            padding: 15px;
            background-color: #f0f9ff;
            border-left: 4px solid #3b82f6;
            border-radius: 4px;
          }
          .info-section h3 {
            margin-top: 0;
            color: #1e40af;
          }
          .security-notice {
            background-color: #fef3c7;
            border: 1px solid #fbbf24;
            border-radius: 6px;
            padding: 15px;
            margin: 20px 0;
          }
          .security-notice h4 {
            margin-top: 0;
            color: #92400e;
          }
          .next-steps {
            background-color: #ecfdf5;
            border-left: 4px solid #10b981;
            border-radius: 4px;
            padding: 15px;
            margin: 20px 0;
          }
          .next-steps h3 {
            margin-top: 0;
            color: #065f46;
          }
          .next-steps ul {
            margin: 10px 0;
            padding-left: 20px;
          }
          .next-steps li {
            margin: 8px 0;
          }
          .footer {
            background-color: #f9fafb;
            padding: 20px;
            text-align: center;
            color: #6b7280;
            font-size: 14px;
            border-top: 1px solid #e5e7eb;
          }
          .button {
            display: inline-block;
            padding: 12px 24px;
            background-color: #1e40af;
            color: white;
            text-decoration: none;
            border-radius: 6px;
            margin: 20px 0;
          }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1>Welcome to Pison Academy of Excellence</h1>
          </div>
          
          <div class="content">
            <h2>Dear ${teacherName},</h2>
            
            <p>Congratulations! Your enrollment as a teacher at Pison Academy of Excellence has been successfully completed.</p>
            
            <div class="credentials">
              <h3>Your Login Credentials</h3>
              <div class="credential-item">
                <div class="credential-label">Teacher ID</div>
                <div class="credential-value">${teacherId}</div>
              </div>
              <div class="credential-item">
                <div class="credential-label">Email</div>
                <div class="credential-value">${email}</div>
              </div>
              <div class="credential-item">
                <div class="credential-label">Password</div>
                <div class="credential-value">${password}</div>
              </div>
            </div>

            ${subsystem ? `
            <div class="info-section">
              <h3>Subsystem</h3>
              <p style="margin: 10px 0; font-size: 16px;">${subsystem} Sub-system</p>
            </div>
            ` : ''}

            <div class="info-section">
              <h3>Assigned Subjects</h3>
              ${subjectsList}
            </div>

            <div class="info-section">
              <h3>Assigned Classes</h3>
              ${classesList}
            </div>

            <div class="security-notice">
              <h4>🔒 Security Reminder</h4>
              <ul style="margin: 10px 0; padding-left: 20px;">
                <li>Keep your credentials secure and confidential</li>
                <li>Change your password immediately after first login</li>
                <li>Do not share your login credentials with anyone</li>
                <li>If you suspect unauthorized access, contact the administration immediately</li>
              </ul>
            </div>

            <div class="next-steps">
              <h3>Next Steps</h3>
              <ul>
                <li>Complete document submission at the school office</li>
                <li>Attend teacher orientation session</li>
                <li>Set up your teaching schedule</li>
                <li>Access the teacher portal with your credentials</li>
                <li>Familiarize yourself with the school management system</li>
              </ul>
            </div>

            <p>We're excited to have you join our teaching staff! If you have any questions or need assistance, please don't hesitate to contact the administration office.</p>
            
            <p>Welcome to our school community!</p>
            
            <p>Best regards,<br>
            <strong>Administration Team</strong><br>
            Pison Academy of Excellence</p>
          </div>
          
          <div class="footer">
            <p>This is an automated email. Please do not reply to this message.</p>
            <p>For assistance, please contact the administration office.</p>
          </div>
        </div>
      </body>
      </html>
    `;
  }
}

