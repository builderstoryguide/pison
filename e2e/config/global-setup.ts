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

  // Ensure we are using the test database
  if (!process.env.DATABASE_URL?.includes('dcm_db_test')) {
     console.warn('WARNING: Not using test database! URL:', process.env.DATABASE_URL);
  }

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
    
    // Login as default manager user (from seed data)
    await page.goto('/signin');
    await page.getByLabel('Email').fill('admin@dcm.local');
    await page.getByLabel('Password').fill('admin123');
    await page.getByRole('button', { name: 'Sign in' }).click();
    
    // Wait for successful login (redirects to dashboard)
    await page.waitForURL(/dashboard/, { timeout: 10000 });
    
    // Save authenticated state
    await context.storageState({ path: authFile });
    
    await browser.close();
    console.log(`✅ Authenticated session saved to ${authFile}`);
    
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
