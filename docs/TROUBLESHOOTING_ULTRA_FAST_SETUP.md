# 🔧 Troubleshooting Ultra-Fast Teacher Assignments Setup

## Common Issues and Solutions

### ❌ Error: CREATE INDEX CONCURRENTLY cannot run inside a transaction block

**Problem**: This error occurs when trying to run the SQL script via Supabase's RPC function, which executes SQL inside a transaction block.

**Solution**: 
1. ✅ **Fixed in the main script** - Removed `CONCURRENTLY` from the main setup script
2. 🔧 **For production optimization** - Run the concurrent indexes separately

**Steps to fix**:

1. **Run the main setup script** (this should work now):
   ```bash
   node scripts/setup-ultra-fast-teacher-assignments.js
   ```

2. **For maximum performance, also run concurrent indexes**:
   - Go to your Supabase SQL Editor
   - Copy and paste the contents of `scripts/create-concurrent-indexes.sql`
   - Execute it directly (not via RPC)

### ❌ Error: Function get_teacher_assignments_optimized does not exist

**Problem**: The database function wasn't created properly.

**Solution**:
1. Check if the main SQL script ran successfully
2. Verify the function exists:
   ```sql
   SELECT proname FROM pg_proc WHERE proname = 'get_teacher_assignments_optimized';
   ```

### ❌ Error: Materialized view teacher_assignments_cache does not exist

**Problem**: The materialized view wasn't created.

**Solution**:
1. Check if the main SQL script ran completely
2. Verify the view exists:
   ```sql
   SELECT schemaname, matviewname FROM pg_matviews WHERE matviewname = 'teacher_assignments_cache';
   ```

### ❌ API returns 500 error

**Problem**: The API endpoint can't connect to the database or functions don't exist.

**Solution**:
1. **Check database connection**:
   ```typescript
   const supabase = await createClient()
   if (!supabase) {
     console.error('Database connection failed')
   }
   ```

2. **Test the function directly**:
   ```sql
   SELECT * FROM get_teacher_assignments_optimized('your-teacher-id'::uuid);
   ```

3. **Check environment variables**:
   ```env
   NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
   SUPABASE_SERVICE_ROLE_KEY=your_service_key
   ```

### ❌ Slow response times (> 200ms)

**Problem**: The system is falling back to database queries instead of using cache.

**Solution**:
1. **Check if materialized view has data**:
   ```sql
   SELECT COUNT(*) FROM teacher_assignments_cache;
   ```

2. **Refresh the materialized view**:
   ```sql
   SELECT refresh_teacher_assignments_cache();
   ```

3. **Check if concurrent indexes were created**:
   ```sql
   SELECT indexname FROM pg_indexes WHERE indexname LIKE '%concurrent%';
   ```

### ❌ Cache not working (always shows cache miss)

**Problem**: The in-memory cache isn't being used.

**Solution**:
1. **Check cache parameters**:
   ```typescript
   const useCache = searchParams.get('cache') !== 'false'
   ```

2. **Verify cache key generation**:
   ```typescript
   const cacheKey = generateUltraFastCacheKey(teacherId, academicYear, term)
   console.log('Cache key:', cacheKey)
   ```

3. **Check cache TTL**:
   ```typescript
   const ULTRA_FAST_TTL = 30 * 1000 // 30 seconds
   ```

## 🔍 Debugging Steps

### 1. Verify Setup Completion

Run this query to check if all components are installed:

```sql
-- Check if function exists
SELECT 'Function exists' as status, proname as name 
FROM pg_proc 
WHERE proname = 'get_teacher_assignments_optimized'

UNION ALL

-- Check if materialized view exists
SELECT 'Materialized view exists' as status, matviewname as name
FROM pg_matviews 
WHERE matviewname = 'teacher_assignments_cache'

UNION ALL

-- Check if indexes exist
SELECT 'Index exists' as status, indexname as name
FROM pg_indexes 
WHERE indexname LIKE '%optimized%'
LIMIT 5;
```

### 2. Test API Endpoint

```bash
# Test the ultra-fast endpoint
curl -w "Response time: %{time_total}s\n" \
  "http://localhost:3000/api/teachers/assignments/ultra-fast?teacherId=YOUR_TEACHER_ID"

# Expected output should show < 0.05s for cached responses
```

### 3. Check Performance Metrics

The API response includes performance metrics:

```json
{
  "performance": {
    "totalTimeMs": 23,
    "queryTimeMs": 15,
    "cacheHit": true,
    "source": "ultra_fast_cache"
  }
}
```

**Good performance indicators**:
- `totalTimeMs` < 50ms
- `cacheHit: true` for most requests
- `source: "ultra_fast_cache"` or `"materialized_view"`

### 4. Monitor Cache Statistics

```typescript
// Get cache stats
const response = await fetch('/api/teachers/assignments/ultra-fast', {
  method: 'POST',
  body: JSON.stringify({ action: 'cache_stats' })
})
const stats = await response.json()
console.log('Cache stats:', stats)
```

## 🚀 Performance Optimization Tips

### 1. Enable Concurrent Indexes

For production environments, always run the concurrent indexes:

```sql
-- Run this in Supabase SQL Editor (not via RPC)
-- File: scripts/create-concurrent-indexes.sql
```

### 2. Monitor Materialized View

```sql
-- Check when cache was last refreshed
SELECT 
  schemaname,
  matviewname,
  definition
FROM pg_matviews 
WHERE matviewname = 'teacher_assignments_cache';

-- Manually refresh if needed
SELECT refresh_teacher_assignments_cache();
```

### 3. Optimize Cache TTL

Adjust cache TTL based on your data update frequency:

```typescript
// For frequently changing data
const ULTRA_FAST_TTL = 10 * 1000 // 10 seconds

// For stable data
const ULTRA_FAST_TTL = 5 * 60 * 1000 // 5 minutes
```

## 📞 Getting Help

If you're still experiencing issues:

1. **Check the logs** for detailed error messages
2. **Run the verification queries** above
3. **Test with a simple teacher ID** that you know exists
4. **Check Supabase dashboard** for any database errors
5. **Verify environment variables** are set correctly

## 🎯 Expected Performance

After successful setup, you should see:

- **Ultra-fast cache hits**: < 5ms
- **Materialized view hits**: < 20ms  
- **Database fallback**: < 200ms
- **Cache hit ratio**: > 90%

If you're not seeing these performance levels, check the troubleshooting steps above.
