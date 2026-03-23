
import { config } from 'dotenv';
config(); // Load environment variables from .env

import { prisma } from '../lib/prisma';

async function main() {
  console.log('Testing database connection...');
  const start = Date.now();
  try {
    // Try a simple query
    const count = await prisma.user.count();
    const duration = Date.now() - start;
    console.log(`Successfully connected! User count: ${count}`);
    console.log(`Connection and query took ${duration}ms`);
    process.exitCode = 0;
  } catch (e) {
    const duration = Date.now() - start;
    console.error(`Connection failed after ${duration}ms`);
    console.error(e);
    process.exitCode = 1;
    return;
  } finally {
    await prisma.$disconnect();
  }
}

main().catch((err) => {
  console.error(err);
  process.exitCode = 1;
});
