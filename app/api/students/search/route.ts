import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

// Types
interface Student {
  id: string;
  student_id: string;
  first_name: string;
  last_name: string;
  email?: string;
  class?: string;
  enrollment_status?: string;
  status?: string;
}

// Mock data for fallback
const mockStudents: Student[] = [
  {
    id: '1',
    student_id: 'STU001',
    first_name: 'John',
    last_name: 'Doe',
    email: 'john.doe@school.com',
    class: 'Form 5A',
    enrollment_status: 'enrolled',
    status: 'active'
  },
  {
    id: '2',
    student_id: 'STU002',
    first_name: 'Jane',
    last_name: 'Smith',
    email: 'jane.smith@school.com',
    class: 'Form 4B',
    enrollment_status: 'enrolled',
    status: 'active'
  },
  {
    id: '3',
    student_id: 'STU003',
    first_name: 'Mike',
    last_name: 'Johnson',
    email: 'mike.johnson@school.com',
    class: 'Form 3A',
    enrollment_status: 'enrolled',
    status: 'active'
  },
  {
    id: '4',
    student_id: 'STU004',
    first_name: 'Sarah',
    last_name: 'Wilson',
    email: 'sarah.wilson@school.com',
    class: 'Form 5B',
    enrollment_status: 'enrolled',
    status: 'active'
  },
  {
    id: '5',
    student_id: 'STU005',
    first_name: 'David',
    last_name: 'Brown',
    email: 'david.brown@school.com',
    class: 'Form 4A',
    enrollment_status: 'enrolled',
    status: 'active'
  },
  {
    id: '6',
    student_id: 'STU006',
    first_name: 'Emily',
    last_name: 'Davis',
    email: 'emily.davis@school.com',
    class: 'Form 3B',
    enrollment_status: 'enrolled',
    status: 'active'
  },
  {
    id: '7',
    student_id: 'STU007',
    first_name: 'James',
    last_name: 'Miller',
    email: 'james.miller@school.com',
    class: 'Form 5A',
    enrollment_status: 'enrolled',
    status: 'active'
  },
  {
    id: '8',
    student_id: 'STU008',
    first_name: 'Lisa',
    last_name: 'Garcia',
    email: 'lisa.garcia@school.com',
    class: 'Form 4B',
    enrollment_status: 'enrolled',
    status: 'active'
  }
];

// GET - Search students
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const query = searchParams.get('q') || '';
    const limit = parseInt(searchParams.get('limit') || '10');

    const supabase = await createClient();

    // Try to fetch from database first
    let students: Student[] = [];
    let error = null;

    try {
      // Sanitize the search query to prevent SQL injection
      const sanitizedQuery = query
        .replace(/[%_\\]/g, '\\$&') // Escape special characters for ilike
        .replace(/[()]/g, '') // Remove parentheses that could break the filter
        .trim();
      
      // Build the query based on whether we have a search term
      let dbQuery = supabase
        .from('students')
        .select(`
          id,
          student_id,
          first_name,
          last_name,
          email,
          class,
          enrollment_status,
          status
        `)
        .in('enrollment_status', ['enrolled', 'pending'])
        .in('status', ['active', 'pending'])
        .order('first_name', { ascending: true })
        .limit(limit);
      
      // Only add search filter if query is not empty
      if (sanitizedQuery) {
        dbQuery = dbQuery.or(`first_name.ilike.%${sanitizedQuery}%,last_name.ilike.%${sanitizedQuery}%,student_id.ilike.%${sanitizedQuery}%`);
      }
      
      const { data, error: dbError } = await dbQuery;

      if (dbError) {
        console.warn('Database query failed, using mock data:', dbError);
        error = dbError;
      } else {
        students = data || [];
      }
    } catch (dbError) {
      console.warn('Database connection failed, using mock data:', dbError);
      error = dbError;
    }

    // Fallback to mock data only if database query actually errored
    if (error) {
      students = mockStudents.filter(student => 
        student.first_name.toLowerCase().includes(query.toLowerCase()) ||
        student.last_name.toLowerCase().includes(query.toLowerCase()) ||
        student.student_id.toLowerCase().includes(query.toLowerCase()) ||
        `${student.first_name} ${student.last_name}`.toLowerCase().includes(query.toLowerCase())
      ).slice(0, limit);
    }

    // Format the response
    const formattedStudents = students.map(student => ({
      id: student.id,
      studentId: student.student_id,
      fullName: `${student.first_name} ${student.last_name}`,
      firstName: student.first_name,
      lastName: student.last_name,
      email: student.email,
      className: student.class || 'N/A',
      enrollmentStatus: student.enrollment_status
    }));

    return NextResponse.json({
      students: formattedStudents,
      total: formattedStudents.length,
      fallback: !!error
    });

  } catch (error) {
    console.error('Error in GET /api/students/search:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
