import { NextRequest, NextResponse } from 'next/server';

// Mock data to stand in for API response
const MOCK_DATA = {
  student: {
    name: "STUDENT NAME",
    id: "STUDENT123",
    dob: "01/01/2000",
    pob: "CITY NAME",
    sex: "M",
    class: "EPS3",
    speciality: "ELECTRICAL POWER SYSTEM",
    classMaster: "MR. KOME THIERY",
    enrollment: 7,
    photoUrl: null
  },
  academic: {
    year: "2024-2025",
    term: "THIRD TERM REPORT CARD",
    orderNo: "714/24/MINESEC/SG/DESTP/SSETPTP OF 31 DEC 2024"
  },
  subjects: {
    languages: {
      title: "LANGUAGES",
      items: [
        { name: "ENGLISH LANGUAGE", eval: 8, coef: 4, total: 32, grade: "D", rank: 4, remark: "FAIL" },
        { name: "FRENCH LANGUAGE", eval: 8, coef: 4, total: 32, grade: "D", rank: 6, remark: "FAIL" }
      ],
      summary: { coef: 8, total: 64, avg: 8, rank: 6, remark: "Fail languages" }
    },
    rts: {
      title: "R.T.S",
      items: [
        { name: "MATHEMATICS", eval: 5, coef: 4, total: 20, grade: "U", rank: 5, remark: "Very weak" },
        { name: "ENGINEERING SCIENCE", eval: 8, coef: 2, total: 16, grade: "D", rank: 5, remark: "Fail" },
        { name: "ENGINEERING DRAWING", eval: 8, coef: 2, total: 16, grade: "B", rank: 6, remark: "VERY GOOD" }
      ],
      summary: { coef: 8, total: 52, avg: 6.5, rank: 6, remark: "Fail in related trade subjects" }
    },
    trade: {
      title: "TRADE SUBJECTS",
      items: [
        { name: "ELECTRICAL TECHNOLOGY", eval: 11, coef: 8, total: 88, grade: "C", rank: 7, remark: "Pass" },
        { name: "ELECTRICAL CIRCUIT", eval: 7, coef: 8, total: 56, grade: "D", rank: 3, remark: "FAIL" },
        { name: "ELECTRICAL MACHINES", eval: 12.5, coef: 8, total: 100, grade: "C", rank: 6, remark: "PASS" }
      ],
      summary: { coef: 24, total: 244, avg: 10.17, rank: 4, remark: "Pass in trade subject" }
    },
    other: {
      title: "OTHER SUBJECTS",
      items: [
        { name: "CITIZENSHIP", eval: 15, coef: 2, total: 30, grade: "B", rank: 3, remark: "Very Good" },
        { name: "PHYSICAL EDUCATION", eval: 16, coef: 1, total: 16, grade: "B", rank: 4, remark: "Very Good" },
        { name: "MANUAL LABOUR", eval: 18, coef: 1, total: 18, grade: "A", rank: 1, remark: "Excellent" }
      ],
      summary: { coef: 4, total: 64, avg: 9.62, rank: 2, remark: "Good in other subjects" }
    }
  },
  totals: {
    coef: 44,
    score: 424,
    average: 9.64
  },
  history: {
    term1: 9.62,
    term2: 7.5,
    term3: 9.64,
    annualAvg: 8.92,
    rank: 7
  },
  stats: {
    max: 11.89,
    min: 8.92,
    passed: 3,
    percent: 42.85,
    classAvg: 10.32
  }
};

export async function GET(req: NextRequest) {
  // Authentication and Authorization:
  // In a real application, you would verify the user's session and role here.
  // For example:
  // const user = await getAuthenticatedUser();
  // if (!user || user.role !== 'admin') {
  //   return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });
  // }

  const { searchParams } = new URL(req.url);
  const studentId = searchParams.get('studentId');
  const classId = searchParams.get('classId');
  const academicTermId = searchParams.get('academicTermId');

  if (!studentId || !classId || !academicTermId) {
    return NextResponse.json(
      { message: 'Missing studentId, classId, or academicTermId' },
      { status: 400 }
    );
  }

  // Simulate database fetch and data processing
  // In a real scenario, this would involve:
  // 1. Querying your database for student info based on studentId
  // 2. Fetching grades for the student in the given class and term
  // 3. Aggregating subject data, calculating averages, etc.
  // 4. Structuring the data to match the PisonReportCard component's expected format.

  // For now, we'll just return the mock data for any valid request.
  // In a more advanced mock, you could use a map to return different data
  // based on studentId/classId.
  const reportData = JSON.parse(JSON.stringify(MOCK_DATA)); // Deep copy to allow modification

  // Optionally, customize mock data based on input for better demonstration
  reportData.student.id = studentId;
  reportData.student.class = classId;
  reportData.academic.term = academicTermId.toUpperCase() + " TERM REPORT CARD";

  return NextResponse.json(reportData);
}