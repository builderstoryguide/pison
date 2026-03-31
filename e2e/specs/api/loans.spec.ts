import { test, expect } from '@playwright/test';
import { ApiClient } from '../../helpers/api-client';
import {
  createTestUser,
  createClient,
  createCollectionArea,
  cleanupTestUser,
  openDailySession,
} from '../../helpers/seed';

test.describe('Loans API', () => {
  let managerUser: Awaited<ReturnType<typeof createTestUser>>;
  let apiClient: ApiClient;
  let client: Awaited<ReturnType<typeof createClient>>;

  test.beforeAll(async ({ request }) => {
    managerUser = await createTestUser('manager');
    await openDailySession(managerUser.id);

    const area = await createCollectionArea();
    client = await createClient(area.id, managerUser.id);
    apiClient = new ApiClient(request);
  });

  test.afterAll(async () => {
    if (managerUser) await cleanupTestUser(managerUser.email);
  });

  test('POST /api/loans - should persist selected maturity date', async () => {
    const expectedMaturityDate = '2027-06-15T00:00:00.000Z';

    const response = await apiClient.post('/api/loans', {
      accountId: client.accountId,
      clientId: client.id,
      principalAmount: 50000,
      interestRate: 0.15,
      purpose: 'Working capital',
      maturityDate: expectedMaturityDate,
    });

    expect(response.success).toBe(true);
    expect(response.data).toBeDefined();
    expect(response.data.id).toBeDefined();
    expect(new Date(response.data.maturityDate).toISOString()).toBe(expectedMaturityDate);
  });
});
