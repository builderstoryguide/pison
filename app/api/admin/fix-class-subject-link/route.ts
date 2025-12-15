import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { getAcademicYearFromConfig } from '@/lib/app-config-server';

/**
 * Fix endpoint to add a subject to a class if the link is missing
 * Usage: POST /api/admin/fix-class-subject-link
 * Body: { classId: string, subjectId: string, academicYear?: string }
 */
export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { classId, subjectId, academicYear: providedAcademicYear } = body;

    if (!classId || !subjectId) {
      return NextResponse.json(
        { 
          success: false,
          error: 'Missing parameters',
          message: 'Please provide both classId and subjectId',
          example: { classId: 'uuid', subjectId: 'uuid' }
        },
        { status: 400 }
      );
    }

    const supabase = await createClient();

    // Get academic year from config if not provided
    const academicYear = providedAcademicYear || await getAcademicYearFromConfig();

    // 1. Verify class exists
    const { data: classData, error: classError } = await supabase
      .from('classes')
      .select('id, name, class_name')
      .eq('id', classId)
      .single();

    if (classError || !classData) {
      if (classError?.code === 'PGRST116') {
        return NextResponse.json(
          { 
            success: false,
            error: 'Class not found',
            message: `Class with ID ${classId} does not exist`
          },
          { status: 404 }
        );
      }
      return NextResponse.json(
        { 
          success: false,
          error: 'Database error',
          message: classError?.message || 'Failed to fetch class'
        },
        { status: 500 }
      );
    }
    // 2. Verify subject exists
    const { data: subjectData, error: subjectError } = await supabase
      .from('subjects')
      .select('id, name, code')
      .eq('id', subjectId)
      .single();

    if (subjectError || !subjectData) {
      return NextResponse.json(
        { 
          success: false,
          error: 'Subject not found',
          message: `Subject with ID ${subjectId} does not exist`
        },
        { status: 404 }
      );
    }

    // 3. Check if link already exists
    const { data: existingLink, error: checkError } = await supabase
      .from('class_subjects')
      .select('id, academic_year')
      .eq('class_id', classId)
      .eq('subject_id', subjectId)
      .eq('academic_year', academicYear)
      .maybeSingle();

    if (checkError) {
      return NextResponse.json(
        { 
          success: false,
          error: 'Database error',
          message: checkError.message
        },
        { status: 500 }
      );
    }

    if (existingLink) {
      return NextResponse.json({
        success: true,
        message: 'Link already exists',
        link: existingLink,
        class: {
          id: classData.id,
          name: classData.class_name || classData.name
        },
        subject: {
          id: subjectData.id,
          name: subjectData.name
        }
      });
    }

    // 4. Create the link
    const { data: newLink, error: insertError } = await supabase
      .from('class_subjects')
      .insert({
        class_id: classId,
        subject_id: subjectId,
        academic_year: academicYear,
        is_trade_subject: false,
        subject_name: subjectData.name // For backward compatibility
      })
      .select()
      .single();

    if (insertError) {
      // Check if it's a unique constraint violation (link exists for different academic year)
      if (insertError.code === '23505') {
        return NextResponse.json(
          { 
            success: false,
            error: 'Link already exists',
            message: `This subject is already linked to this class for a different academic year. Please check existing links.`
          },
          { status: 409 }
        );
      }

      return NextResponse.json(
        { 
          success: false,
          error: 'Failed to create link',
          message: insertError.message
        },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      message: `Successfully linked "${subjectData.name}" to "${classData.class_name || classData.name}"`,
      link: newLink,
      class: {
        id: classData.id,
        name: classData.class_name || classData.name
      },
      subject: {
        id: subjectData.id,
        name: subjectData.name,
        code: subjectData.code
      },
      academicYear: academicYear
    });

  } catch (error: unknown) {
    console.error('Fix error:', error);
    const message = error instanceof Error ? error.message : 'Internal Server Error';
    return NextResponse.json(
      { 
        success: false,
        error: 'Internal server error',
        message 
      },
      { status: 500 }
    );
  }
}

