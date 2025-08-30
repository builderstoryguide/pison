-- Create student_fee_assignments table
CREATE TABLE IF NOT EXISTS student_fee_assignments (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  student_id UUID NOT NULL REFERENCES students(id) ON DELETE CASCADE,
  fee_structure_id UUID NOT NULL REFERENCES fee_structures(id) ON DELETE CASCADE,
  academic_year VARCHAR(9) NOT NULL,
  term VARCHAR(10) NOT NULL CHECK (term IN ('first', 'second', 'third')),
  total_amount DECIMAL(10,2) NOT NULL,
  amount_paid DECIMAL(10,2) DEFAULT 0,
  balance DECIMAL(10,2) GENERATED ALWAYS AS (total_amount - amount_paid) STORED,
  status VARCHAR(10) DEFAULT 'pending' CHECK (status IN ('pending', 'partial', 'paid', 'overdue')),
  due_date DATE NOT NULL,
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create payment_plans table
CREATE TABLE IF NOT EXISTS payment_plans (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  student_id UUID NOT NULL REFERENCES students(id) ON DELETE CASCADE,
  total_amount DECIMAL(10,2) NOT NULL,
  amount_paid DECIMAL(10,2) DEFAULT 0,
  number_of_installments INTEGER NOT NULL CHECK (number_of_installments > 0 AND number_of_installments <= 12),
  start_date DATE NOT NULL,
  status VARCHAR(10) DEFAULT 'active' CHECK (status IN ('active', 'completed', 'defaulted')),
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create payment_plan_installments table
CREATE TABLE IF NOT EXISTS payment_plan_installments (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  payment_plan_id UUID NOT NULL REFERENCES payment_plans(id) ON DELETE CASCADE,
  installment_number INTEGER NOT NULL,
  amount DECIMAL(10,2) NOT NULL,
  due_date DATE NOT NULL,
  status VARCHAR(10) DEFAULT 'pending' CHECK (status IN ('pending', 'paid', 'overdue')),
  paid_date DATE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_student_fee_assignments_student_id ON student_fee_assignments(student_id);
CREATE INDEX IF NOT EXISTS idx_student_fee_assignments_fee_structure_id ON student_fee_assignments(fee_structure_id);
CREATE INDEX IF NOT EXISTS idx_student_fee_assignments_status ON student_fee_assignments(status);
CREATE INDEX IF NOT EXISTS idx_student_fee_assignments_academic_year ON student_fee_assignments(academic_year);

CREATE INDEX IF NOT EXISTS idx_payment_plans_student_id ON payment_plans(student_id);
CREATE INDEX IF NOT EXISTS idx_payment_plans_status ON payment_plans(status);

CREATE INDEX IF NOT EXISTS idx_payment_plan_installments_plan_id ON payment_plan_installments(payment_plan_id);
CREATE INDEX IF NOT EXISTS idx_payment_plan_installments_status ON payment_plan_installments(status);
CREATE INDEX IF NOT EXISTS idx_payment_plan_installments_due_date ON payment_plan_installments(due_date);

-- Enable Row Level Security (RLS)
ALTER TABLE student_fee_assignments ENABLE ROW LEVEL SECURITY;
ALTER TABLE payment_plans ENABLE ROW LEVEL SECURITY;
ALTER TABLE payment_plan_installments ENABLE ROW LEVEL SECURITY;

-- Create RLS policies for student_fee_assignments
DROP POLICY IF EXISTS "Enable read access for all users" ON student_fee_assignments;
CREATE POLICY "Enable read access for all users" ON student_fee_assignments
  FOR SELECT USING (true);

DROP POLICY IF EXISTS "Enable insert access for all users" ON student_fee_assignments;
CREATE POLICY "Enable insert access for all users" ON student_fee_assignments
  FOR INSERT WITH CHECK (true);

DROP POLICY IF EXISTS "Enable update access for all users" ON student_fee_assignments;
CREATE POLICY "Enable update access for all users" ON student_fee_assignments
  FOR UPDATE USING (true);

DROP POLICY IF EXISTS "Enable delete access for all users" ON student_fee_assignments;
CREATE POLICY "Enable delete access for all users" ON student_fee_assignments
  FOR DELETE USING (true);

-- Create RLS policies for payment_plans
DROP POLICY IF EXISTS "Enable read access for all users" ON payment_plans;
CREATE POLICY "Enable read access for all users" ON payment_plans
  FOR SELECT USING (true);

DROP POLICY IF EXISTS "Enable insert access for all users" ON payment_plans;
CREATE POLICY "Enable insert access for all users" ON payment_plans
  FOR INSERT WITH CHECK (true);

DROP POLICY IF EXISTS "Enable update access for all users" ON payment_plans;
CREATE POLICY "Enable update access for all users" ON payment_plans
  FOR UPDATE USING (true);

DROP POLICY IF EXISTS "Enable delete access for all users" ON payment_plans;
CREATE POLICY "Enable delete access for all users" ON payment_plans
  FOR DELETE USING (true);

-- Create RLS policies for payment_plan_installments
DROP POLICY IF EXISTS "Enable read access for all users" ON payment_plan_installments;
CREATE POLICY "Enable read access for all users" ON payment_plan_installments
  FOR SELECT USING (true);

DROP POLICY IF EXISTS "Enable insert access for all users" ON payment_plan_installments;
CREATE POLICY "Enable insert access for all users" ON payment_plan_installments
  FOR INSERT WITH CHECK (true);

DROP POLICY IF EXISTS "Enable update access for all users" ON payment_plan_installments;
CREATE POLICY "Enable update access for all users" ON payment_plan_installments
  FOR UPDATE USING (true);

DROP POLICY IF EXISTS "Enable delete access for all users" ON payment_plan_installments;
CREATE POLICY "Enable delete access for all users" ON payment_plan_installments
  FOR DELETE USING (true);

-- Create a view for student fee assignments with student and fee structure details
CREATE OR REPLACE VIEW student_fee_assignments_with_details AS
SELECT 
  sfa.id,
  sfa.student_id,
  CONCAT(s.first_name, ' ', s.last_name) as student_name,
  s.student_id as student_number,
  sfa.fee_structure_id,
  fs.name as fee_structure_name,
  sfa.academic_year,
  sfa.term,
  sfa.total_amount,
  sfa.amount_paid,
  sfa.balance,
  sfa.status,
  sfa.due_date,
  sfa.notes,
  sfa.created_at,
  sfa.updated_at
FROM student_fee_assignments sfa
JOIN students s ON sfa.student_id = s.id
JOIN fee_structures fs ON sfa.fee_structure_id = fs.id;

-- Create a view for payment plans with student details and installment summary
CREATE OR REPLACE VIEW payment_plans_with_details AS
SELECT 
  pp.id,
  pp.student_id,
  CONCAT(s.first_name, ' ', s.last_name) as student_name,
  s.student_id as student_number,
  pp.total_amount,
  pp.amount_paid,
  pp.number_of_installments,
  pp.start_date,
  pp.status,
  pp.notes,
  pp.created_at,
  pp.updated_at,
  COUNT(ppi.id) as total_installments,
  COUNT(CASE WHEN ppi.status = 'paid' THEN 1 END) as paid_installments,
  COUNT(CASE WHEN ppi.status = 'overdue' THEN 1 END) as overdue_installments
FROM payment_plans pp
JOIN students s ON pp.student_id = s.id
LEFT JOIN payment_plan_installments ppi ON pp.id = ppi.payment_plan_id
GROUP BY pp.id, s.first_name, s.last_name, s.student_id;

-- Insert sample data for testing
INSERT INTO student_fee_assignments (student_id, fee_structure_id, academic_year, term, total_amount, due_date, notes)
SELECT 
  s.id,
  fs.id,
  '2024-2025',
  'first',
  fs.amount,
  fs.due_date,
  'Sample fee assignment'
FROM students s
CROSS JOIN fee_structures fs
WHERE s.id IN (SELECT id FROM students LIMIT 2)
AND fs.id IN (SELECT id FROM fee_structures LIMIT 2)
ON CONFLICT DO NOTHING;

-- Insert sample payment plans
INSERT INTO payment_plans (student_id, total_amount, number_of_installments, start_date, notes)
SELECT 
  s.id,
  75000,
  3,
  '2024-09-01',
  'Sample payment plan'
FROM students s
LIMIT 2
ON CONFLICT DO NOTHING;

-- Insert sample installments for the payment plans
INSERT INTO payment_plan_installments (payment_plan_id, installment_number, amount, due_date)
SELECT 
  pp.id,
  generate_series(1, pp.number_of_installments),
  25000,
  pp.start_date + (generate_series(1, pp.number_of_installments) - 1) * INTERVAL '1 month'
FROM payment_plans pp
ON CONFLICT DO NOTHING;

-- Display the created tables
SELECT 'student_fee_assignments' as table_name, COUNT(*) as record_count FROM student_fee_assignments
UNION ALL
SELECT 'payment_plans' as table_name, COUNT(*) as record_count FROM payment_plans
UNION ALL
SELECT 'payment_plan_installments' as table_name, COUNT(*) as record_count FROM payment_plan_installments;
