/**
 * Requires seeded DB: npm run db:test:push && npm run seed:microfinance
 * Uses admin@dcm.local / admin123 for login.
 */
import { test, expect } from '@playwright/test';
import { login } from '../../helpers/auth';

test.describe('User dropdown menu', () => {
  test('My Account submenu does not contain My Profile', async ({ page }) => {
    await login(page, 'admin@dcm.local', 'admin123');
    await page.goto('/');
    // Open user dropdown
    await page.getByTestId('user-menu-trigger').click();
    // Open My Account submenu (hover to expand)
    await page.getByRole('menuitem', { name: /my account/i }).hover();
    // Assert My Profile is not present
    await expect(page.getByRole('menuitem', { name: /my profile/i })).toHaveCount(0);
  });
});
