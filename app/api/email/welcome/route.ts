import { NextRequest, NextResponse } from 'next/server';
import { EmailService, WelcomeEmailData } from '@/lib/email-service';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const {
      studentName,
      studentEmail,
      parentName,
      parentEmail,
      studentId,
      parentCode,
      studentPassword,
      parentPassword,
      className
    } = body;

    // Validate required fields
    if (!studentName || !studentId || !parentCode || !className) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      );
    }

    // Check if we have at least one email to send to
    if (!studentEmail && !parentEmail) {
      return NextResponse.json(
        { error: 'At least one email address is required' },
        { status: 400 }
      );
    }

    const emailData: WelcomeEmailData = {
      studentName,
      studentEmail: studentEmail || '',
      parentName: parentName || 'Parent/Guardian',
      parentEmail: parentEmail || '',
      studentId,
      parentCode,
      studentPassword: studentPassword || '',
      parentPassword: parentPassword || '',
      className
    };

    const result = await EmailService.sendWelcomeEmail(emailData);

    if (result.success) {
      return NextResponse.json({
        success: true,
        message: 'Welcome emails sent successfully'
      });
    } else {
      return NextResponse.json(
        { error: result.error || 'Failed to send welcome emails' },
        { status: 500 }
      );
    }

  } catch (error) {
    console.error('Error in welcome email API:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
