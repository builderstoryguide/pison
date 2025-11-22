# 🐛 Debugging Teacher Assignment Timeouts

## Problem
The teacher grades component is timing out when trying to fetch class assignments, showing errors like:
```
Request Timeout: All attempts to fetch classes have timed out
Error: Request timed out after 15000ms
```

## Root Cause Analysis

The timeout issues are likely caused by one or more of the following:

### 1. **Missing Database Indexes** (Most Common)
Without proper indexes, database queries can take 10-100x longer, especially when:
- Querying `teacher_branch_assignments` by `teacher_id`
- Joining multiple tables (`classes`, `students`, `subjects`)
- Filtering by `status = 'active'`

### 2. **Large Data Sets**
If a teacher has:
- Many classes (>20)
- Many students per class (>100)
- Complex data relationships

The API may need to process thousands of records.

### 3. **Network Latency**
If your database is hosted far from your application server, network round-trips add up.

## ✅ Solutions

### **Step 1: Run Performance Diagnostics**

1. Open Supabase SQL Editor
2. Run the diagnostic script:
   ```bash
   scripts/diagnose-performance.sql
   ```
3. Check the results:
   - **Table sizes**: Are any tables unexpectedly large?
   - **Existing indexes**: Do the required indexes exist?
   - **Query performance**: Does the sample query take >100ms?

### **Step 2: Create Performance Indexes** ⭐ **MOST IMPORTANT**

1. In Supabase SQL Editor, run:
   ```bash
   scripts/create-performance-indexes.sql
   ```
2. This creates critical indexes on:
   - `teacher_branch_assignments(teacher_id, status)`
   - `classes(class_teacher_id, status)`
   - `teachers(user_id)`
   - `teacher_subjects(teacher_id, is_active)`
   - And more...

**Expected improvement**: Queries should go from 5-30 seconds down to <1 second

### **Step 3: Monitor API Performance**

After creating indexes, check the browser console:
```
[Lightweight API] Request completed in 234ms
[Teacher Grades] Successfully fetched 5 classes from endpoint 1 (234ms)
```

- **Good**: <500ms total time
- **Acceptable**: 500ms - 2 seconds
- **Problem**: >2 seconds (needs further optimization)

### **Step 4: Check Server Logs**

Look for these log messages to identify which query is slow:

```
[Lightweight API] Starting request...
[Lightweight API] Verifying user...
[Lightweight API] Finding teacher record...
[Lightweight API] Fetching assignments...
[Lightweight API] Found X unique class IDs
[Lightweight API] Fetching class details...
[Lightweight API] Retrieved X class details
[Lightweight API] Fetching subjects...
[Lightweight API] Request completed in XXXms
```

If the logs stop at a particular step, that query is the bottleneck.

## 🔧 Advanced Troubleshooting

### If Timeouts Persist After Adding Indexes:

#### **Option 1: Increase Timeout Values**
Already implemented - timeouts are now:
- Endpoint 1 (lightweight): 30 seconds
- Endpoint 2 (summaryOnly): 45 seconds  
- Endpoint 3 (regular): 60 seconds

#### **Option 2: Reduce Data Fetched**
The lightweight endpoint now:
- Fetches only active classes
- Excludes student and subject details
- Uses separate queries instead of joins
- Limits results to 100 classes

#### **Option 3: Check Database Performance**

Run in Supabase SQL Editor:
```sql
-- Check for slow queries
SELECT 
  query,
  calls,
  mean_exec_time,
  max_exec_time
FROM pg_stat_statements
WHERE query LIKE '%teacher_branch_assignments%'
ORDER BY mean_exec_time DESC
LIMIT 10;
```

#### **Option 4: Check Supabase Plan Limits**
- Free tier: Limited compute resources
- Pro tier: Better performance
- Consider upgrading if database is consistently slow

#### **Option 5: Optimize Data Model**

If you have thousands of records, consider:
- Archiving old academic years
- Soft-deleting instead of keeping old records
- Adding data pruning scripts

## 📊 Performance Benchmarks

Expected query times after optimization:

| Query | Before Indexes | After Indexes |
|-------|---------------|---------------|
| Find teacher record | 50-200ms | 5-20ms |
| Get teacher assignments | 2-10s | 50-200ms |
| Get class details | 1-5s | 20-100ms |
| Get teacher subjects | 500ms-2s | 10-50ms |
| **Total API time** | **5-30s** | **<500ms** |

## 🆘 Still Having Issues?

If timeouts persist after:
1. ✅ Creating all indexes
2. ✅ Checking server logs  
3. ✅ Verifying database performance

Then:

### **Check Browser Console**
Look for the exact error and timing:
```
[Teacher Grades] Endpoint 1 failed: "Request timed out after 30000ms"
[Teacher Grades] Endpoint 2 failed: "Request timed out after 45000ms"
[Teacher Grades] All endpoints timed out
```

### **Check Network Tab**
- Open DevTools > Network
- Look for the API request to `/api/teachers/[id]/assignments/lightweight`
- Check:
  - **Status**: 504 (Gateway Timeout) or pending?
  - **Time**: How long before timeout?
  - **Response**: Any error message?

### **Contact Support**
Provide:
1. Server logs (check step 4 above)
2. Browser console logs
3. Network tab screenshot
4. Results from `diagnose-performance.sql`
5. Number of classes/students/subjects in the database

## 💡 Prevention

To avoid future timeout issues:

1. **Run diagnostics monthly**
   ```sql
   -- Check table sizes
   SELECT tablename, pg_size_pretty(pg_total_relation_size(tablename::regclass))
   FROM pg_tables
   WHERE schemaname = 'public'
   ORDER BY pg_total_relation_size(tablename::regclass) DESC;
   ```

2. **Monitor query performance**
   - Enable query logging in Supabase
   - Set up alerts for slow queries (>1s)

3. **Archive old data**
   - Move old academic years to archive tables
   - Keep last 2-3 years in active tables

4. **Regular index maintenance**
   - Supabase handles this automatically
   - But verify indexes exist after migrations

## 📝 Quick Reference

### Fastest Fix (90% of cases):
```sql
-- Just run this one command:
CREATE INDEX IF NOT EXISTS idx_tba_teacher_status 
ON teacher_branch_assignments (teacher_id, status)
WHERE status = 'active';
```

### Check if it worked:
Look for faster response in browser console:
```
[Lightweight API] Request completed in 234ms  ✅ (was 30000ms)
```

---

**Updated**: November 2024  
**Version**: 2.0

