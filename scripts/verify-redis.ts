import 'dotenv/config';
import { redisSet, redisGet, redisDel, isRedisAvailable } from '../lib/cache/redis';

async function verifyRedis() {
  console.log('Starting Redis verification...');

  // 1. Check if Redis is configured
  if (!process.env.REDIS_URL) {
    console.warn('⚠️ REDIS_URL is not set in environment variables.');
    console.warn('Redis is optional, so this might be intended.');
    return;
  }

  // 2. Check availability
  // Note: isRedisAvailable might return true even if not connected yet, 
  // but it checks if the client *can* be initialized.
  if (!isRedisAvailable()) { 
      // This actually calls getRedis(), which tries to connect. 
      // If it returns null, it failed.
      console.error('❌ Failed to initialize Redis client.');
      return; 
  }

  const testKey = 'test:verification:key';
  const testValue = { message: 'Hello Redis', timestamp: Date.now() };

  // 3. Test Set
  console.log(`Attempting to SET key: ${testKey}`);
  const setSuccess = await redisSet(testKey, testValue, 60); // 60s TTL
  if (!setSuccess) {
    console.error('❌ Failed to SET value in Redis.');
    process.exit(1);
  }
  console.log('✅ SET successful.');

  // 4. Test Get
  console.log(`Attempting to GET key: ${testKey}`);
  const getValue = await redisGet<typeof testValue>(testKey);
  
  if (!getValue) {
    console.error('❌ Failed to GET value from Redis (came back null).');
    process.exit(1);
  }

  console.log('Retrieved value:', getValue);

  if (getValue.message === testValue.message) {
    console.log('✅ GET successful and data matches.');
  } else {
    console.error('❌ Data mismatch.');
    console.error('Expected:', testValue);
    console.error('Got:', getValue);
    process.exit(1);
  }

  // 5. Test Delete
  console.log(`Attempting to DEL key: ${testKey}`);
  const delSuccess = await redisDel(testKey);
  if (!delSuccess) {
    console.error('❌ Failed to DEL key.');
    process.exit(1);
  }
  console.log('✅ DEL successful.');

  console.log('🎉 Redis verification completed successfully!');
  process.exit(0);
}

verifyRedis().catch(err => {
  console.error('❌ Unhandled error:', err);
  process.exit(1);
});
