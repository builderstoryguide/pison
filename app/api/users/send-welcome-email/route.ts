import { NextRequest, NextResponse } from 'next/server';
import { EmailService } from '@/lib/email-service';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const {
      name,
      email,
      role,
      userId,
      password,
      className,
      parentName,
      parentEmail,
      parentCode,
      parentPassword
    } = body;

    // Validate required fields
    if (!name || !email || !role || !password) {
      return NextResponse.json(
        { error: 'Name, email, role, and password are required' },
        { status: 400 }
      );
    }

    let result: { success: boolean; error?: string };

    if (role === 'student' && parentEmail && parentName && parentCode && parentPassword) {
      // Send welcome emails for student and parent
      result = await EmailService.sendWelcomeEmail({
        studentName: name,
        studentEmail: email,
        parentName: parentName,
        parentEmail: parentEmail,
        studentId: userId || '',
        parentCode: parentCode,
        studentPassword: password,
        parentPassword: parentPassword,
        className: className || ''
      });
    } else {
      // Send generic welcome email for other roles
      result = await EmailService.sendGenericWelcomeEmail({
        name: name,
        email: email,
        role: role,
        userId: userId,
        password: password,
        className: className
      });
    }

    if (result.success) {
      return NextResponse.json({
        success: true,
        message: 'Welcome email sent successfully'
      });
    } else {
      return NextResponse.json(
        { error: result.error || 'Failed to send welcome email' },
        { status: 500 }
      );
    }

  } catch (error) {
    console.error('Error in send welcome email API:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
