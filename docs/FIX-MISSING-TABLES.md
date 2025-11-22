## 🚨 CRITICAL ERROR: Missing Database Tables

### Error Message
```
ERROR: 42P01: relation "teacher_branch_assignments" does not exist
```

### What This Means
The `teacher_branch_assignments` table (and possibly other related tables) don't exist in your database. This is why the teacher grades/assignments API is timing out - it's trying to query tables that don't exist!

---

## ✅ IMMEDIATE FIX (5 minutes)

### **Run This Script in Supabase SQL Editor:**

**File:** `scripts/setup-teacher-assignments-complete.sql`

This single script will:
1. ✅ Create `subject_branches` table
2. ✅ Create `teacher_branch_assignments` table  
3. ✅ Create all necessary indexes
4. ✅ Set up triggers and policies
5. ✅ Verify everything is working

### **Steps:**

1. Open [Supabase Dashboard](https://supabase.com/dashboard)
2. Go to **SQL Editor**
3. Copy the entire contents of `scripts/setup-teacher-assignments-complete.sql`
4. Paste and click **Run**
5. Wait for completion (~10-30 seconds)

**Expected Output:**
```
✅ All required tables exist!
✅ Setup complete! You can now run diagnose-performance.sql
```

---

## 📊 Verify It Worked

After running the setup script, run the diagnostic:

**File:** `scripts/diagnose-performance.sql`

**Expected Output:**
```
table_name                    | status
------------------------------|----------
teacher_branch_assignments    | ✅ EXISTS
subject_branches              | ✅ EXISTS
classes                       | ✅ EXISTS
teachers                      | ✅ EXISTS
teacher_subjects              | ✅ EXISTS
```

---

## 🎯 Why This Happened

The `teacher_branch_assignments` table was never created in your database. This table is essential for:
- Assigning teachers to subject branches
- Linking teachers to classes
- Tracking academic year/term assignments
- The teacher grades entry system

Without it, **all teacher assignment queries fail**.

---

## 🔄 What Happens After the Fix

Once the tables are created:

### **Immediate:**
- ✅ No more "relation does not exist" errors
- ✅ Diagnostic script will run successfully
- ✅ API endpoints will stop timing out with "table not found" errors

### **Next:**
- The API may still be slow initially (empty tables = no data)
- You'll need to populate the tables through the UI or import data
- Once populated, run `scripts/create-performance-indexes.sql` for optimal speed

### **Timeline:**
1. **Now:** Create tables (5 min)
2. **Then:** Test API works (1 min)
3. **Next:** Add performance indexes (5 min)
4. **Finally:** Populate data through UI

---

## 📋 Complete Setup Checklist

- [ ] Run `setup-teacher-assignments-complete.sql`
- [ ] Verify with `diagnose-performance.sql`  
- [ ] Run `create-performance-indexes.sql`
- [ ] Test teacher grades page loads
- [ ] Check browser console for timing logs

---

## 🆘 If You Still Get Errors

### Error: `subjects table does not exist`
**Fix:** Run this first:
```sql
CREATE TABLE IF NOT EXISTS public.subjects (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    subject_name VARCHAR(100) NOT NULL,
    subject_code VARCHAR(50),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);
```

### Error: `teachers table does not exist`  
**Fix:** Run the teachers migration:
```bash
scripts/2025-11-04_002_academics_people.sql
```

### Error: `classes table does not exist`
**Fix:** Run the classes migration:
```bash
scripts/2025-11-04_003_classes_subjects.sql
```

---

## 💡 Prevention

To avoid this in the future:

1. **Always run migrations in order** - Check the date prefix (e.g., `2025-11-04_001_`)
2. **Use the diagnostic script regularly** - It will catch missing tables early
3. **Check table dependencies** - Some tables depend on others existing first

---

## 🎓 Understanding the Schema

```
subjects (base subjects like "Mathematics")
    └── subject_branches (like "Algebra", "Geometry")
            └── teacher_branch_assignments
                    ├── teacher_id → teachers table
                    ├── class_id → classes table
                    └── academic_year, term
```

**Dependencies:**
1. `subjects` table must exist first
2. Then `subject_branches` can be created
3. Finally `teacher_branch_assignments` can link everything

---

## ✨ Success Indicators

You'll know it's working when:

1. **Diagnostic script runs without errors**
2. **Browser console shows:**
   ```
   [Lightweight API] Request completed in 234ms
   ✅ [Teacher Grades] Successfully fetched 5 classes
   ```
3. **No "relation does not exist" errors**
4. **Teacher grades page loads (even if empty)**

---

**IMPORTANT:** Run `setup-teacher-assignments-complete.sql` NOW to fix this issue! 🚀

