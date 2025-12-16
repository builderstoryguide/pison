import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

export async function GET(req: NextRequest) {
  const supabase = await createClient();
  
  // 1. Get Class ID for "AC 1"
  const { data: classes, error: classError } = await supabase
    .from('classes')
    .select('id, name, class_name')
    .or('name.eq.AC 1,class_name.eq.AC 1');

  if (classError || !classes || classes.length === 0) {
    return NextResponse.json({ 
      error: 'Class "AC 1" not found',
      ...(process.env.NODE_ENV === 'development' && { details: classError })
    });
  }
  const classId = classes[0].id;

  // 2. Get subjects for this class
  const { data: classSubjects, error: subjectsError } = await supabase
    .from('class_subjects')
    .select(`
        subject_id,
        subjects (
          id,
          name,
          code,
          coefficient
        )
      `)
    .eq('class_id', classId);

  if (subjectsError) {
    return NextResponse.json({ 
      error: 'Error fetching subjects',
      ...(process.env.NODE_ENV === 'development' && { details: subjectsError })
    });
  }

  if (!classSubjects || classSubjects.length === 0) {
    return NextResponse.json({ 
      error: 'No subjects found for this class'
    });
  }

  const subjects = classSubjects
    .filter((cs: any) => cs.subjects)
    .map((cs: any) => ({
      name: cs.subjects?.name,
      id: cs.subjects?.id,
      coef: cs.subjects?.coefficient
    }));

  const mathSubject = subjects.find((s: any) => 
    s.name?.toLowerCase().includes('math')
  );

  const { data: students, error: studentsError } = await supabase
    .from('students')
    .select('id')
    .eq('class', classId)
    .limit(1);

  if (studentsError) {
    return NextResponse.json({ 
      error: 'Error fetching students',
      ...(process.env.NODE_ENV === 'development' && { details: studentsError })
    });
  }

  return NextResponse.json({
      class: classes[0],
      studentId: students && students.length > 0 ? students[0].id : null,
      totalSubjects: subjects.length,
      mathFound: !!mathSubject,
      mathDetails: mathSubject,
      allSubjects: subjects.map((s: any) => s.name)
  });
}
