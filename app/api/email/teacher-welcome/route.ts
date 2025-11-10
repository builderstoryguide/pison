import { NextRequest, NextResponse } from 'next/server';
import { EmailService } from '@/lib/email-service';

// Email validation regex
const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export async function POST(request: NextRequest) {
  try {
    // Check for authorization header or session token
    const authHeader = request.headers.get('authorization');
    const sessionToken = request.cookies.get('session')?.value;
    
    if (!authHeader && !sessionToken) {
      return NextResponse.json(
        { error: 'Unauthorized: Missing authentication' },
        { status: 401 }
      );
    }

    // TODO: Add proper JWT/session validation here
    // For now, we'll just check if some form of auth is present
    
    const body = await request.json();
    const {
      teacherName,
      teacherId,
      email,
      password,
      subsystem,
      subjects = [],
      classes = []
    } = body;

    // Validate required fields
    if (!teacherName || !email || !password) {
      return NextResponse.json(
        { error: 'Teacher name, email, and password are required' },
        { status: 400 }
      );
    }

    // Validate email format
    if (!EMAIL_REGEX.test(email)) {
      return NextResponse.json(
        { error: 'Invalid email format' },
        { status: 400 }
      );
    }

    // Validate teacher name length
    if (teacherName.length < 2 || teacherName.length > 100) {
      return NextResponse.json(
        { error: 'Teacher name must be between 2 and 100 characters' },
        { status: 400 }
      );
    }

    // Validate password length
    if (password.length < 6 || password.length > 50) {
      return NextResponse.json(
        { error: 'Password must be between 6 and 50 characters' },
        { status: 400 }
      );
    }

    // Ensure subjects and classes are arrays
    const validatedSubjects = Array.isArray(subjects) ? subjects : [];
    const validatedClasses = Array.isArray(classes) ? classes : [];

    const result = await EmailService.sendTeacherWelcomeEmail({
      teacherName,
      teacherId: teacherId || '',
      email,
      password,
      subsystem: subsystem || '',
      subjects: validatedSubjects,
      classes: validatedClasses
    });

    if (result.success) {
      return NextResponse.json({
        success: true,
        message: 'Teacher welcome email sent successfully'
      });
    } else {
      return NextResponse.json(
        { error: result.error || 'Failed to send teacher welcome email' },
        { status: 500 }
      );
    }

  } catch (error) {
    console.error('Error in teacher welcome email API:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
