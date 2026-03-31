import { test, expect } from '@playwright/test';
import { ApiClient } from '../../helpers/api-client';
import {
  createTestUser,
  createCollectionArea,
  getFirstAccountNature,
  cleanupTestUser,
} from '../../helpers/seed';
import { login } from '../../helpers/auth';

test.describe('Commission Rates API', () => {
  let managerUser: Awaited<ReturnType<typeof createTestUser>>;
  let apiClient: ApiClient;
  let testArea: Awaited<ReturnType<typeof createCollectionArea>>;
  let testAccountNature: Awaited<ReturnType<typeof getFirstAccountNature>>;
  let testClientId = '';

  test.beforeAll(async ({ browser }) => {
    managerUser = await createTestUser('manager');
    testArea = await createCollectionArea();
    testAccountNature = await getFirstAccountNature();

    const context = await browser.newContext();
    const page = await context.newPage();
    await login(page, managerUser.email, managerUser.password);
    apiClient = new ApiClient(context.request);

    const createClientResponse = await apiClient.post('/api/clients', {
      fullName: 'Commission Rate E2E Client',
      phone: '699000111',
      areaId: testArea.id,
      accountNatureId: testAccountNature.id,
      documentChecklist: {},
      openingAmount: 0,
    });
    testClientId = createClientResponse?.data?.id;
    expect(testClientId).toBeTruthy();
  });

  test.afterAll(async () => {
    if (managerUser) await cleanupTestUser(managerUser.email);
  });

  test('manager can read and update system commission rate', async () => {
    const getBody = await apiClient.get('/api/user-management/settings/commission-rate');
    expect(getBody.success).toBe(true);
    expect(typeof getBody.data?.commissionRatePercent).toBe('number');

    const putBody = await apiClient.put('/api/user-management/settings/commission-rate', {
      commissionRatePercent: 3.5,
    });
    expect(putBody.success).toBe(true);
    expect(putBody.data?.commissionRatePercent).toBe(3.5);
  });

  test('manager can set and clear per-client commission override', async () => {
    const setBody = await apiClient.put(`/api/clients/${testClientId}`, {
      commissionRatePercent: 4.25,
    });
    expect(setBody.success).toBe(true);

    const getOverrideBody = await apiClient.get(
      `/api/clients/${testClientId}/commission-rate`
    );
    expect(getOverrideBody.success).toBe(true);
    expect(getOverrideBody.data?.commissionRatePercent).toBe(4.25);

    const clearBody = await apiClient.put(`/api/clients/${testClientId}`, {
      commissionRatePercent: null,
    });
    expect(clearBody.success).toBe(true);
  });

  test('manager can list commission clients and update exempt via commission-rate API', async () => {
    const listBody = await apiClient.get(
      '/api/commissions/clients?page=1&pageSize=10&filter=all&search=Commission%20Rate%20E2E'
    );
    expect(listBody.success).toBe(true);
    expect(Array.isArray(listBody.data?.items)).toBe(true);
    const row = listBody.data?.items?.find((c: { id: string }) => c.id === testClientId);
    expect(row).toBeTruthy();

    const exemptBody = await apiClient.put(`/api/clients/${testClientId}/commission-rate`, {
      isCommissionExempt: true,
    });
    expect(exemptBody.success).toBe(true);
    expect(exemptBody.data?.isCommissionExempt).toBe(true);

    const resetExempt = await apiClient.put(`/api/clients/${testClientId}/commission-rate`, {
      isCommissionExempt: false,
    });
    expect(resetExempt.success).toBe(true);
    expect(resetExempt.data?.isCommissionExempt).toBe(false);
  });
});
