/**
 * Canonical subject lists per class (AC / BC / HEC / EPS).
 * Used by fix_class_subjects and audit-class-subject-offerings scripts.
 */

export const subjectMap: Record<string, string> = {
  'French Language': 'French Language',
  'English Language': 'ENGLISH LANGUAGE (ENG LAN)',
  Mathematics: 'MATHEMATICS',
  'Computer Aided Management': 'Computer Aided Management (CAM)',
  'Introduction to Marketing': 'Introduction to Marketing',
  Accounting: 'ACCOUNTING',
  'Office Practice': 'OFFICE PRACTICE',
  Citizenship: 'Citizenship (CTZ)',
  'Physical Education': 'Physical Education (PE)',
  'Manual Labour': 'Manual Labour (LB)',
  Drawing: 'Building Construction Drawing (BCD)',
  'Building Drawing': 'Building Construction Drawing (BCD)',
  'Construction Process': 'Construction process and Building practice (CPB)',
  'Engineering Science': 'ENGINEERING SCIENCE',
  'Industrial Computing': 'INDUSTRIAL COMPUTING',
  'Soil Survey Material': 'Survey, Soil Mechanics and Material ( SMS)',
  'Health and Safety': 'QUALITY HYGINE AND SAFTY ENVIRONMENT',
  QFA: 'OHADA Finance Accounting (OFA)',
  IFA: 'International  Finance Accounting  (IFA)',
  QFR: 'OHADA Finance Reporting (OFR)',
  'Business Mathematics': 'Business Mathematics',
  Economics: 'Economics',
  Commerce: 'COMMENCE',
  Entrepreneurship: 'Entrepreneurship',
  'Law and Government': 'Law and government (LG)',
  'Natural Science': 'Natural Science',
  'Family Life': 'Family Life Education and Gerontology (FLEG)',
  'Food and Nutrition': 'Food, Nutrition and Health (FNH)',
  'Resource Management': 'Resource Management on Home Studies (RMHS)',
  'Engineering Drawing': 'ENGINEERING DRAWING',
  'Electrical Technology': 'Electrical Technology and Diagrams (ETD)',
  'Electrical Circuit': 'Electrical and Electronic Circuit (EEC)',
  'Electric Machine': 'Electrical Machines (EM)',
}

export type ClassGroup = {
  userClassName: string
  dbSearchName: string
  subjects: string[]
}

export const classGroups: ClassGroup[] = [
  { userClassName: 'Ac 1', dbSearchName: 'AC 1', subjects: ['French Language', 'English Language', 'Mathematics', 'Computer Aided Management', 'Introduction to Marketing', 'Accounting', 'Office Practice', 'Citizenship', 'Physical Education', 'Manual Labour'] },
  { userClassName: 'Ac 2', dbSearchName: 'AC 2', subjects: ['French Language', 'English Language', 'Mathematics', 'Computer Aided Management', 'Introduction to Marketing', 'Accounting', 'Office Practice', 'Citizenship', 'Physical Education', 'Manual Labour'] },
  { userClassName: 'Ac 3', dbSearchName: 'AC 3', subjects: ['French Language', 'English Language', 'Mathematics', 'QFA', 'IFA', 'QFR', 'Business Mathematics', 'Economics', 'Commerce', 'Entrepreneurship', 'Citizenship', 'Law and Government', 'Physical Education', 'Manual Labour'] },
  { userClassName: 'Ac 4', dbSearchName: 'AC 4', subjects: ['French Language', 'English Language', 'Mathematics', 'QFA', 'IFA', 'QFR', 'Business Mathematics', 'Economics', 'Commerce', 'Entrepreneurship', 'Citizenship', 'Law and Government', 'Physical Education', 'Manual Labour'] },
  { userClassName: 'Ac 5', dbSearchName: 'AC 5', subjects: ['French Language', 'English Language', 'Mathematics', 'QFA', 'IFA', 'QFR', 'Business Mathematics', 'Economics', 'Commerce', 'Entrepreneurship', 'Citizenship', 'Law and Government', 'Physical Education', 'Manual Labour'] },
  { userClassName: 'Bc 1', dbSearchName: 'Form 1 BC', subjects: ['Drawing', 'Construction Process', 'French Language', 'English Language', 'Mathematics', 'Engineering Science', 'Industrial Computing', 'Citizenship', 'Physical Education', 'Manual Labour', 'Soil Survey Material', 'Health and Safety'] },
  { userClassName: 'Bc 2', dbSearchName: 'Form 2 BC', subjects: ['Drawing', 'Construction Process', 'French Language', 'English Language', 'Mathematics', 'Engineering Science', 'Industrial Computing', 'Citizenship', 'Physical Education', 'Manual Labour', 'Soil Survey Material', 'Health and Safety'] },
  { userClassName: 'Bc 3', dbSearchName: 'Form 3 BC', subjects: ['Building Drawing', 'Construction Process', 'Soil Survey Material', 'Mathematics', 'Health and Safety', 'Industrial Computing', 'Engineering Science', 'French Language', 'English Language', 'Citizenship', 'Law and Government', 'Physical Education', 'Manual Labour'] },
  { userClassName: 'Bc 4', dbSearchName: 'Form 4 BC', subjects: ['Building Drawing', 'Construction Process', 'Soil Survey Material', 'Mathematics', 'Health and Safety', 'Industrial Computing', 'Engineering Science', 'French Language', 'English Language', 'Citizenship', 'Law and Government', 'Physical Education', 'Manual Labour'] },
  { userClassName: 'Bc 5', dbSearchName: 'Form 5 BC', subjects: ['Building Drawing', 'Construction Process', 'Soil Survey Material', 'Mathematics', 'Health and Safety', 'Industrial Computing', 'Engineering Science', 'French Language', 'English Language', 'Citizenship', 'Law and Government', 'Physical Education', 'Manual Labour'] },
  { userClassName: 'Hec 1', dbSearchName: 'HEC 1', subjects: ['French Language', 'English Language', 'Mathematics', 'Natural Science', 'Family Life', 'Food and Nutrition', 'Resource Management', 'Citizenship', 'Physical Education', 'Manual Labour'] },
  { userClassName: 'Hec 2', dbSearchName: 'HEC 2', subjects: ['French Language', 'English Language', 'Mathematics', 'Natural Science', 'Family Life', 'Food and Nutrition', 'Resource Management', 'Citizenship', 'Physical Education', 'Manual Labour'] },
  { userClassName: 'Hec 3', dbSearchName: 'HEC 3', subjects: ['French Language', 'English Language', 'Mathematics', 'Natural Science', 'Business Mathematics', 'Entrepreneurship', 'Family Life', 'Resource Management', 'Food and Nutrition', 'Citizenship', 'Law and Government', 'Physical Education', 'Manual Labour'] },
  { userClassName: 'Hec 4', dbSearchName: 'HEC 4', subjects: ['French Language', 'English Language', 'Mathematics', 'Natural Science', 'Business Mathematics', 'Entrepreneurship', 'Family Life', 'Resource Management', 'Food and Nutrition', 'Citizenship', 'Law and Government', 'Physical Education', 'Manual Labour'] },
  { userClassName: 'Hec 5', dbSearchName: 'HEC 5', subjects: ['French Language', 'English Language', 'Mathematics', 'Natural Science', 'Business Mathematics', 'Entrepreneurship', 'Family Life', 'Resource Management', 'Food and Nutrition', 'Citizenship', 'Law and Government', 'Physical Education', 'Manual Labour'] },
  { userClassName: 'EPS 1', dbSearchName: 'form 1 EPS', subjects: ['French Language', 'English Language', 'Mathematics', 'Engineering Science', 'Engineering Drawing', 'Electrical Technology', 'Industrial Computing', 'Citizenship', 'Manual Labour', 'Physical Education'] },
  { userClassName: 'EPS 2', dbSearchName: 'Form 2 EPS', subjects: ['French Language', 'English Language', 'Mathematics', 'Engineering Science', 'Engineering Drawing', 'Electrical Technology', 'Industrial Computing', 'Citizenship', 'Manual Labour', 'Physical Education'] },
  { userClassName: 'EPS 3', dbSearchName: 'FORM 3 EPS', subjects: ['French Language', 'English Language', 'Mathematics', 'Engineering Science', 'Engineering Drawing', 'Industrial Computing', 'Electrical Circuit', 'Electrical Technology', 'Electric Machine', 'Citizenship', 'Law and Government', 'Physical Education', 'Manual Labour'] },
  { userClassName: 'EPS 4', dbSearchName: 'form 4 EPS', subjects: ['French Language', 'English Language', 'Mathematics', 'Engineering Science', 'Engineering Drawing', 'Industrial Computing', 'Electrical Circuit', 'Electrical Technology', 'Electric Machine', 'Citizenship', 'Law and Government', 'Physical Education', 'Manual Labour'] },
  { userClassName: 'EPS 5', dbSearchName: 'Form 5 EPS', subjects: ['French Language', 'English Language', 'Mathematics', 'Engineering Science', 'Engineering Drawing', 'Industrial Computing', 'Electrical Circuit', 'Electrical Technology', 'Electric Machine', 'Citizenship', 'Law and Government', 'Physical Education', 'Manual Labour'] },
]
