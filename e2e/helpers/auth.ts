import { Page, expect } from '@playwright/test';

export async function login(page: Page, email: string = 'admin@example.com', password: string = 'password') {
  await page.goto('/signin');
  await page.getByLabel('Email').fill(email);
  await page.getByLabel('Password').fill(password);
  await page.getByRole('button', { name: 'Sign in' }).click();
  // Wait for navigation to dashboard or home
  await expect(page).toHaveURL(/dashboard/);
}

export async function logout(page: Page) {
  await page.getByRole('button', { name: 'User menu' }).click();
  await page.getByRole('menuitem', { name: 'Sign out' }).click();
  await expect(page).toHaveURL(/signin/);
}
