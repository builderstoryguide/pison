import { Page, expect } from '@playwright/test';

export async function login(
  page: Page,
  identifier: string = 'admin@example.com',
  password: string = 'password',
) {
  await page.goto('/signin');
  await page.locator('input[name="identifier"]').fill(identifier);
  await page.locator('input[name="password"]').fill(password);
  await page.locator('button[type="submit"]').click();
  // Successful auth should navigate away from the sign-in page.
  await expect(page).not.toHaveURL(/\/signin/);
}

export async function logout(page: Page) {
  await page.getByRole('button', { name: 'User menu' }).click();
  await page.getByRole('menuitem', { name: 'Sign out' }).click();
  await expect(page).toHaveURL(/signin/);
}
