import { test, expect } from '@playwright/test';
import { createTestUser, cleanupTestUser, unlockTestUser } from '../../helpers/seed';
import { login } from '../../helpers/auth';

test.describe('Authentication', () => {
  let user: Awaited<ReturnType<typeof createTestUser>>;

  test('should show Email/Username label on signin form', async ({ page }) => {
    await page.goto('/signin');
    await expect(page.getByLabel(/Email\/Username/)).toBeVisible();
  });

  test.beforeAll(async () => {
    // Create a test user (Agent role usually)
    user = await createTestUser('agent');
  });

  test.afterAll(async () => {
    if (user) await cleanupTestUser(user.email);
  });

  test('should allow valid login with email', async ({ page }) => {
    await login(page, user.email, user.password);
    await expect(page).not.toHaveURL(/\/signin/);
    
    // Check if user menu shows correct name
    await expect(page.getByRole('button', { name: user.name })).toBeVisible();
  });

  test('should allow valid login with username', async ({ page }) => {
    expect(user.username).toBeTruthy();
    await login(page, user.username!, user.password);
    await expect(page).not.toHaveURL(/\/signin/);
    await expect(page.getByRole('button', { name: user.name })).toBeVisible();
  });

  test('should reject invalid password', async ({ page }) => {
    await page.goto('/signin');
    await page.locator('input[name="identifier"]').fill(user.email);
    await page.locator('input[name="password"]').fill('wrongpassword');
    await page.locator('button[type="submit"]').click();
    
    await expect(
      page.getByText(/Invalid (email|username\/email) or password\./),
    ).toBeVisible();
  });

  test('should reject locked account (simulate via API or manual lock)', async ({ page }) => {
    try {
      // This test requires setting failedLoginAttempts or lockedUntil in DB
      // We can simulate this by failing login 5 times
      for (let i = 0; i < 5; i++) {
          await page.goto('/signin');
          await page.locator('input[name="identifier"]').fill(user.email);
          await page.locator('input[name="password"]').fill('wrongpassword');
          await page.locator('button[type="submit"]').click();
          await expect(
            page.getByText(/Invalid (email|username\/email) or password\./),
          ).toBeVisible();
      }
      
      // 6th attempt should show locked message
      await page.goto('/signin');
      await page.locator('input[name="identifier"]').fill(user.email);
      await page.locator('input[name="password"]').fill('wrongpassword');
      await page.locator('button[type="submit"]').click();
      await expect(page.getByText(/Account is temporarily locked/)).toBeVisible();
    } finally {
      // Always unlock the user to ensure clean state for other tests
      await unlockTestUser(user.email);
    }
  });
});
