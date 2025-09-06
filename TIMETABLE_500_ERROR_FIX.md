# Timetable 500 Error Debug & Fix

## 🔍 **Error Analysis**

**Error**: `HTTP 500: Internal Server Error` in `lib/timetable-context.tsx` at line 277

**Root Cause**: The API endpoint `/api/timetable` is trying to query a database view `v_class_timetables` that doesn't exist in your database.

## 📊 **Debug Results**

✅ **Database Connection**: Working  
✅ **All Timetable Tables**: Present and populated  
✅ **Sample Data**: Available (5 classes, 5 periods)  
❌ **Missing View**: `v_class_timetables` view doesn't exist  

### Current Data Status:
- **Timetable Classes**: 5 classes (Form 1A, 1B, 2A, 2B, 3A)
- **Timetable Periods**: 5 periods scheduled for Monday
- **Academic Year**: 2024-2025
- **Existing Schedule**: Already created for "2024-2025, first" term

## 🛠️ **The Fix**

The issue is that the `v_class_timetables` view is defined in `scripts/timetable-database-setup.sql` but was never created in your database. The API endpoint in `app/api/timetable/route.ts` (line 49) tries to query this view:

```javascript
let query = supabase
  .from('v_class_timetables')  // ← This view doesn't exist!
  .select('*');
```

## 🚀 **Solution Steps**

### **Option 1: Quick Fix (Recommended)**
1. **Open your Supabase Dashboard**
2. **Go to SQL Editor**
3. **Copy and paste the contents of `scripts/create-missing-view.sql`**
4. **Execute the SQL**

### **Option 2: Full Database Setup**
If you want to ensure everything is properly set up:
1. **Run the complete timetable database setup**
2. **Copy contents of `scripts/timetable-database-setup.sql`**
3. **Execute in Supabase SQL Editor**

## 📋 **Quick Fix SQL**

```sql
-- Create the missing view that's causing the 500 error
CREATE OR REPLACE VIEW v_class_timetables AS
SELECT 
    tc.id as class_id,
    tc.name as class_name,
    tc.level,
    tc.subsystem,
    tc.branch,
    tc.academic_year,
    tp.id as period_id,
    tp.day_of_week,
    tp.start_time,
    tp.end_time,
    tp.period_number,
    COALESCE(ts.name, 'TBD') as subject_name,
    COALESCE(tch.name, 'TBD') as teacher_name,
    COALESCE(tr.name, 'TBD') as room_name,
    tr.room_type,
    tp.period_type,
    tp.is_break,
    tp.notes
FROM timetable_classes tc
LEFT JOIN timetable_periods tp ON tc.id = tp.class_id
LEFT JOIN timetable_subjects ts ON tp.subject_id = ts.id
LEFT JOIN timetable_teachers tch ON tp.teacher_id = tch.id
LEFT JOIN timetable_rooms tr ON tp.room_id = tr.id
WHERE tc.is_active = true
ORDER BY tc.name, tp.day_of_week, tp.start_time;
```

## ✅ **After the Fix**

Once you create the view, your timetable system will:

1. **✅ Load timetables successfully** - No more 500 errors
2. **✅ Display existing periods** - You already have 5 periods for Monday
3. **✅ Support timetable generation** - Can generate new timetables
4. **✅ Handle duplicate prevention** - Uses the enhanced functions we created

## 🧪 **Testing the Fix**

After creating the view, test by:

1. **Refreshing your timetable page** - Should load without errors
2. **Viewing existing timetables** - Should show the Monday periods
3. **Generating new timetables** - Should work with duplicate prevention
4. **Checking different classes** - Should display all 5 classes

## 🔍 **Debug Tools Created**

- **`scripts/debug-timetable-api.js`** - Diagnoses timetable API issues
- **`scripts/create-missing-view.sql`** - Creates the missing view
- **Previous fixes** - Duplicate prevention and enhanced generation

## 📚 **Related Files**

- **Error Location**: `lib/timetable-context.tsx:277`
- **API Endpoint**: `app/api/timetable/route.ts:49`
- **View Definition**: `scripts/timetable-database-setup.sql:291-317`
- **Quick Fix**: `scripts/create-missing-view.sql`

## 🎯 **Why This Happened**

The timetable database setup script contains the view definition, but it seems like only the tables were created in your database, not the views. This commonly happens when:

1. **Partial script execution** - Only part of the setup script was run
2. **Manual table creation** - Tables were created individually
3. **Migration issues** - Views were missed during database migrations

## 🛡️ **Prevention**

To prevent similar issues in the future:

1. **Always run complete setup scripts** 
2. **Use the debug script** to verify all components exist
3. **Check database schema** after major changes
4. **Test API endpoints** after database modifications

---

**Summary**: Your 500 error is caused by a missing database view. Creating the `v_class_timetables` view will immediately fix the issue and restore full timetable functionality.
