import { chromium, FullConfig } from '@playwright/test';
import { PrismaClient } from '@prisma/client';
import { PrismaPg } from '@prisma/adapter-pg';
import pg from 'pg';
import fs from 'fs';
import path from 'path';

// eslint-disable-next-line @typescript-eslint/no-unused-vars
async function globalSetup(_config: FullConfig) {
  // console.log('Global Setup - DATABASE_URL:', process.env.DATABASE_URL);
  
  if (!process.env.DATABASE_URL) {
     throw new Error('DATABASE_URL is missing. Please run with `dotenv -e .env.test --`');
  }

  // Using dev database for tests (shared with running server)

  // Create Prisma Client instance using driver adapter pattern (Prisma v7+)
  const pool = new pg.Pool({ connectionString: process.env.DATABASE_URL });
  const adapter = new PrismaPg(pool);
  const prisma = new PrismaClient({ adapter });
  
  try {
    // 1. Clean up database (optional, depending on strategy)
    // For now, we assume a clean state or we clean up specific tables
    // await prisma.transaction.deleteMany();
    // await prisma.loan.deleteMany();
    // await prisma.account.deleteMany();
    // await prisma.client.deleteMany();
    // await prisma.user.deleteMany({ where: { email: { contains: 'test' } } });
    
    // 2. Seed Master Data if needed
    // This assumes roles and permissions are already there or handled by seed script
    
    // 3. Create authenticated session for tests
    console.log('Creating authenticated session...');
    const authDir = path.join(process.cwd(), 'e2e', '.auth');
    const authFile = path.join(authDir, 'user.json');
    
    // Create .auth directory if it doesn't exist
    if (!fs.existsSync(authDir)) {
      fs.mkdirSync(authDir, { recursive: true });
    }
    
    // Launch browser and login as manager to create auth state
    const baseURL = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000';
    const browser = await chromium.launch();
    const context = await browser.newContext({ baseURL });
    const page = await context.newPage();
    
    try {
      // Login as default manager user (from seed data)
      await page.goto('/signin');
      await page.locator('input[name="identifier"]').fill('admin@dcm.local');
      await page.locator('input[name="password"]').fill('admin123');
      await page.locator('button[type="submit"]').click();

      // Successful auth should navigate away from the sign-in page.
      await page.waitForURL((url) => !url.pathname.includes('/signin'), { timeout: 15000 });

      await context.storageState({ path: authFile });
      console.log(`✅ Authenticated session saved to ${authFile}`);
    } catch (loginError) {
      console.warn(
        '⚠️ Global setup login failed. Ensure test DB is seeded: npm run db:test:push && npm run seed:microfinance'
      );
      // Save empty storage state so Playwright proceeds; tests that create their own users (e.g. collection) will still run
      await context.storageState({ path: authFile });
    }

    await browser.close();
    
    console.log('Global setup completed.');
  } catch (error) {
    console.error('Global setup failed:', error);
    throw error;
  } finally {
    await prisma.$disconnect();
    await pool.end().catch((err) => {
      console.error('Error closing database pool:', err);
    });
  }
}

export default globalSetup;
