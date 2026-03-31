import { test, expect } from '@playwright/test';

/**
 * Requires seeded manager (e.g. admin@dcm.local) with operating account.
 * Run: npm run db:test:push && npm run seed:microfinance
 */
test.describe('Treasury API', () => {
  test.use({ storageState: 'e2e/.auth/user.json' });

  test('POST /api/treasury/issue returns success', async ({ request }) => {
    const response = await request.post('/api/treasury/issue', {
      data: {
        amount: 50,
        description: 'Playwright treasury issuance',
      },
    });

    expect(response.ok()).toBeTruthy();
    const body = await response.json();
    expect(body.success).toBe(true);
    expect(body.data?.type).toBe('TREASURY_ISSUANCE');
    expect(body.data?.status).toBe('COMPLETED');
  });
});
