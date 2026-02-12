import { test, expect } from '@playwright/test';
import { ApiClient } from '../../helpers/api-client';
import { createTestUser, createCollectionArea, cleanupTestUser } from '../../helpers/seed';
import { login } from '../../helpers/auth';

test.describe('Client Management API', () => {
  let agentUser;
  let apiClient;

  test.beforeAll(async ({ browser }) => {
    // Create Agent user
    agentUser = await createTestUser('agent');
    
    browserContext = await browser.newContext();
    const page = await browserContext.newPage();
    await login(page, agentUser.email, agentUser.password);
    
    apiClient = new ApiClient(browserContext.request);
  });

  test.afterAll(async () => {
    if (agentUser) await cleanupTestUser(agentUser.email);
  });

  test('GET /api/clients - should list clients', async () => {
    const response = await apiClient.get('/api/clients');
    expect(response.data).toBeInstanceOf(Array);
  });

  test('POST /api/clients - should create a new client', async () => {
    // Create area for client
    const area = await createCollectionArea();
    
    const newClient = {
      fullName: 'John Doe Client',
      phone: '1234567890',
      areaId: area.id,
      clientNumber: `C${Date.now()}`, // Unique number
    };

    const response = await apiClient.post('/api/clients', newClient);
    expect(response.data.fullName).toBe(newClient.fullName);
    expect(response.data.areaId).toBe(area.id);
    
    // Cleanup
    // await cleanupTestUser(newClient.email); // Clients don't have email in this simplified flow usually, or we clean by area
  });
});
