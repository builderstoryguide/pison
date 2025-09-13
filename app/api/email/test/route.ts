import { NextRequest, NextResponse } from 'next/server';
import { Resend } from 'resend';

// Initialize Resend client
const resend = new Resend(process.env.RESEND_API_KEY);

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { testEmail } = body;

    if (!testEmail) {
      return NextResponse.json(
        { error: 'Test email address is required' },
        { status: 400 }
      );
    }

    // Test email content
    const testEmailContent = `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Email Service Test</title>
        <style>
          body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
          .container { max-width: 600px; margin: 0 auto; padding: 20px; }
          .header { background-color: #1e40af; color: white; padding: 20px; text-align: center; }
          .content { padding: 20px; background-color: #f9fafb; }
          .success { background-color: #d1fae5; border: 1px solid #10b981; padding: 15px; margin: 15px 0; border-radius: 4px; }
          .footer { text-align: center; padding: 20px; color: #6b7280; font-size: 14px; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1>Email Service Test</h1>
          </div>
          
          <div class="content">
            <h2>Hello!</h2>
            
            <p>This is a test email to verify that the email service is working correctly.</p>
            
            <div class="success">
              <strong>✅ Success!</strong> If you received this email, it means:
              <ul>
                <li>Your Resend API key is configured correctly</li>
                <li>The email service is working properly</li>
                <li>You can now send welcome emails to students and parents</li>
              </ul>
            </div>

            <p><strong>Test Details:</strong></p>
            <ul>
              <li><strong>Timestamp:</strong> ${new Date().toLocaleString()}</li>
              <li><strong>Service:</strong> Resend</li>
              <li><strong>Status:</strong> Working</li>
            </ul>

            <p>You can now proceed with testing the student enrollment email functionality.</p>
          </div>
          
          <div class="footer">
            <p>This is a test email from the School Management System</p>
          </div>
        </div>
      </body>
      </html>
    `;

    // Send test email
    const result = await resend.emails.send({
      from: 'Pison Academy <noreply@pisonacademy.cm>',
      to: [testEmail],
      subject: 'Email Service Test - School Management System',
      html: testEmailContent,
    });

    console.log('Test email sent successfully:', result);

    return NextResponse.json({
      success: true,
      message: 'Test email sent successfully',
      emailId: 'data' in result && result.data ? result.data.id : 'unknown'
    });

  } catch (error) {
    console.error('Error sending test email:', error);
    
    // Provide more detailed error information
    let errorMessage = 'Failed to send test email';
    let errorDetails = '';
    
    if (error instanceof Error) {
      errorMessage = error.message;
      errorDetails = error.stack || '';
    }
    
    return NextResponse.json(
      { 
        success: false, 
        error: errorMessage,
        details: errorDetails,
        timestamp: new Date().toISOString()
      },
      { status: 500 }
    );
  }
}
