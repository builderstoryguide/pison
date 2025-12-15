import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

/**
 * Diagnostic endpoint to check if a subject is properly linked to a class
 * Usage: /api/admin/diagnose-class-subject?className=AC 1&subjectName=Computer Aided Management
 */
export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const className = searchParams.get('className');
  const subjectName = searchParams.get('subjectName');

  if (!className || !subjectName) {
    return NextResponse.json(
      { 
        error: 'Missing parameters',
        message: 'Please provide both className and subjectName query parameters',
        example: '/api/admin/diagnose-class-subject?className=AC 1&subjectName=Computer Aided Management'
      },
      { status: 400 }
    );
  }

  const supabase = await createClient();

  try {
    // 1. Find the class
    // Try name first, then class_name
    let { data: classData, error: classError } = await supabase
      .from('classes')
      .select('id, name, class_name')
      .eq('name', className)
      .maybeSingle();

    if (!classData && !classError) {
      ({ data: classData, error: classError } = await supabase
        .from('classes')
        .select('id, name, class_name')
        .eq('class_name', className)
        .maybeSingle());
    }
    if (classError) {
      return NextResponse.json(
        { error: 'Database error', message: classError.message },
        { status: 500 }
      );
    }

    if (!classData) {
      return NextResponse.json({
        found: false,
        issue: 'class_not_found',
        message: `Class "${className}" not found in database`,
        suggestions: [
          'Check if the class name is spelled correctly',
          'Verify the class exists in the classes table',
    // Escape SQL wildcards in user input
    const escapedSubjectName = subjectName.replace(/[%_]/g, '\\          'Check both "name" and "class_name" columns'
        ]
      });
    }

    const classId = classData.id;
');
    
    // 2. Find the subject
    const { data: subjectData, error: subjectError } = await supabase
      .from('subjects')
      .select('id, name, code, is_active')
      .ilike('name', `%${escapedSubjectName}%`)
      .limit(1);

    const subject = subjectData?.[0];    const actualClassName = classData.class_name || classData.name;

    // 2. Find the subject
    const { data: subjectData, error: subjectError } = await supabase
      .from('subjects')
      .select('id, name, code, is_active')
      .ilike('name', `%${subjectName}%`)
      .maybeSingle();

    if (subjectError) {
      return NextResponse.json(
        { error: 'Database error', message: subjectError.message },
        { status: 500 }
      );
    }

    if (!subjectData) {
      // Try exact match
      const { data: exactSubject, error: exactError } = await supabase
        .from('subjects')
        .select('id, name, code, is_active')
        .eq('name', subjectName)
        .maybeSingle();

      if (exactError) {
        return NextResponse.json(
          { error: 'Database error', message: exactError.message },
          { status: 500 }
        );
      }
      if (!exactSubject) {
        return NextResponse.json({
          found: false,
          issue: 'subject_not_found',
          message: `Subject "${subjectName}" not found in subjects table`,
          classFound: true,
          classId: classId,
          className: actualClassName,
          suggestions: [
            'Check if the subject name is spelled correctly',
            'Verify the subject exists in the subjects table',
            'You may need to create the subject first',
            'Check for variations like "Computer-Aided Management" vs "Computer Aided Management"'
          ]
        });
      }

      // Use exact match
      const subjectId = exactSubject.id;

      // 3. Check if subject is linked to class
      const { data: classSubjectLink, error: linkError } = await supabase
        .from('class_subjects')
        .select('id, class_id, subject_id, academic_year, is_trade_subject')
        .eq('class_id', classId)
        .eq('subject_id', subjectId)
        .maybeSingle();

      if (linkError) {
        return NextResponse.json(
          { error: 'Database error', message: linkError.message },
          { status: 500 }
        );
      }

      if (!classSubjectLink) {
        return NextResponse.json({
          found: false,
          issue: 'link_missing',
          message: `Subject "${subjectName}" is not linked to class "${actualClassName}"`,
          classFound: true,
          classId: classId,
          className: actualClassName,
          subjectFound: true,
          subjectId: subjectId,
          subjectName: exactSubject.name,
          fix: {
            action: 'add_subject_to_class',
            classId: classId,
            subjectId: subjectId,
            endpoint: `/api/admin/fix-class-subject-link`,
            method: 'POST',
            body: {
              classId: classId,
              subjectId: subjectId,
              academicYear: '2024-2025' // You may need to adjust this
            }
          },
          suggestions: [
            'The subject exists but is not assigned to this class',
            'Use the fix endpoint or manually add the subject via the class management UI'
          ]
        });
      }

      return NextResponse.json({
        found: true,
        message: `Subject "${exactSubject.name}" is properly linked to class "${actualClassName}"`,
        class: {
          id: classId,
          name: actualClassName
        },
        subject: {
          id: subjectId,
          name: exactSubject.name,
          code: exactSubject.code,
          isActive: exactSubject.is_active
        },
        link: {
          id: classSubjectLink.id,
          academicYear: classSubjectLink.academic_year,
          isTradeSubject: classSubjectLink.is_trade_subject
        }
      });
    }

    // Subject found via partial match
    const subjectId = subjectData.id;

    // 3. Check if subject is linked to class
    const { data: classSubjectLink, error: linkError } = await supabase
      .from('class_subjects')
      .select('id, class_id, subject_id, academic_year, is_trade_subject')
      .eq('class_id', classId)
      .eq('subject_id', subjectId)
      .maybeSingle();

    if (linkError) {
      return NextResponse.json(
        { error: 'Database error', message: linkError.message },
        { status: 500 }
      );
    }

    if (!classSubjectLink) {
      return NextResponse.json({
        found: false,
        issue: 'link_missing',
        message: `Subject "${subjectData.name}" is not linked to class "${actualClassName}"`,
        classFound: true,
        classId: classId,
        className: actualClassName,
        subjectFound: true,
        subjectId: subjectId,
        subjectName: subjectData.name,
        note: `Found subject with similar name: "${subjectData.name}"`,
        fix: {
          action: 'add_subject_to_class',
          classId: classId,
          subjectId: subjectId,
          endpoint: `/api/admin/fix-class-subject-link`,
          method: 'POST',
          body: {
            classId: classId,
            subjectId: subjectId,
            academicYear: '2024-2025' // You may need to adjust this
          }
        },
        suggestions: [
          'The subject exists but is not assigned to this class',
          'Use the fix endpoint or manually add the subject via the class management UI'
        ]
      });
    }

    return NextResponse.json({
      found: true,
      message: `Subject "${subjectData.name}" is properly linked to class "${actualClassName}"`,
      class: {
        id: classId,
        name: actualClassName
      },
      subject: {
        id: subjectId,
        name: subjectData.name,
        code: subjectData.code,
        isActive: subjectData.is_active
      },
      link: {
        id: classSubjectLink.id,
        academicYear: classSubjectLink.academic_year,
        isTradeSubject: classSubjectLink.is_trade_subject
      }
    });

  } catch (error: unknown) {
    console.error('Diagnostic error:', error);
    const message = error instanceof Error ? error.message : 'Internal Server Error';
    return NextResponse.json(
      { error: 'Internal server error', message },
      { status: 500 }
    );
  }
}

