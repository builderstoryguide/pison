import { test, expect } from '@playwright/test';
import { createTestUser, cleanupTestUser, unlockTestUser } from '../../helpers/seed';
import { login, logout } from '../../helpers/auth';

test.describe('Authentication', () => {
  let user;

  test.beforeAll(async () => {
    // Create a test user (Agent role usually)
    user = await createTestUser('agent');
  });

  test.afterAll(async () => {
    if (user) await cleanupTestUser(user.email);
  });

  test('should allow valid login', async ({ page }) => {
    await login(page, user.email, user.password);
    await expect(page).toHaveURL(/dashboard/);
    
    // Check if user menu shows correct name
    await expect(page.getByRole('button', { name: user.name })).toBeVisible();
  });

  test('should reject invalid password', async ({ page }) => {
    await page.goto('/signin');
    await page.getByLabel('Email').fill(user.email);
    await page.getByLabel('Password').fill('wrongpassword');
    await page.getByRole('button', { name: 'Sign in' }).click();
    
    await expect(page.getByText('Invalid email or password')).toBeVisible();
  });

  test('should reject locked account (simulate via API or manual lock)', async ({ page }) => {
    try {
      // This test requires setting failedLoginAttempts or lockedUntil in DB
      // We can simulate this by failing login 5 times
      for (let i = 0; i < 5; i++) {
          await page.goto('/signin');
          await page.getByLabel('Email').fill(user.email);
          await page.getByLabel('Password').fill('wrongpassword');
          await page.getByRole('button', { name: 'Sign in' }).click();
          await expect(page.getByText('Invalid email or password')).toBeVisible();
      }
      
      // 6th attempt should show locked message
      await page.goto('/signin');
      await page.getByLabel('Email').fill(user.email);
      await page.getByLabel('Password').fill('wrongpassword');
      await page.getByRole('button', { name: 'Sign in' }).click();
      await expect(page.getByText(/Account is temporarily locked/)).toBeVisible();
    } finally {
      // Always unlock the user to ensure clean state for other tests
      await unlockTestUser(user.email);
    }
  });
});
