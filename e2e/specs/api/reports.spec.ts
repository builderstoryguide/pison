import { test, expect } from '@playwright/test';
import { ApiClient } from '../../helpers/api-client';
import { createTestUser, createClient, createCollectionArea, cleanupTestUser } from '../../helpers/seed';
import { login } from '../../helpers/auth';

test.describe('Reports API', () => {
  let accountantUser;
  let client;
  let area;
  let apiClient;

  test.beforeAll(async ({ browser }) => {
    accountantUser = await createTestUser('accountant');
    area = await createCollectionArea();
    client = await createClient(area.id, accountantUser.id);
    
    // Login
    const context = await browser.newContext();
    const page = await context.newPage();
    await login(page, accountantUser.email, accountantUser.password);
    apiClient = new ApiClient(context.request);
    
    // Create some transactions first
    const transaction = {
      clientId: client.id,
      amount: 500,
      type: 'COLLECTION',
      areaId: area.id,
    };
    await apiClient.post('/api/transactions', transaction);
  });

  test.afterAll(async () => {
    if (accountantUser) await cleanupTestUser(accountantUser.email);
  });

  test('GET /api/reports/daily-collection - should return report data', async () => {
    const today = new Date().toISOString().split('T')[0];
    const response = await apiClient.get(`/api/reports/daily-collection?date=${today}&areaId=${area.id}`);
    
    expect(response.data).toBeDefined();
    expect(response.data.totalCollected).toBeGreaterThanOrEqual(500);
    expect(response.data.transactions).toHaveLength(1);
    expect(response.data.transactions[0].clientId).toBe(client.id);
  });

  test('GET /api/reports/client-statement - should return statement', async () => {
    const response = await apiClient.get(`/api/reports/client-statement?clientId=${client.id}`);
    
    expect(response.data).toBeDefined();
    expect(response.data.balance).toBeGreaterThanOrEqual(0); // Assuming 500 deposit
    expect(response.data.transactions).toHaveLength(1);
  });
});
