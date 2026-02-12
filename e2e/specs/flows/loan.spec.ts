import { test, expect } from '@playwright/test';
import { ApiClient } from '../../helpers/api-client';
import { createTestUser, createClient, createCollectionArea, cleanupTestUser } from '../../helpers/seed';
import { login } from '../../helpers/auth';

test.describe('Loan Lifecycle API', () => {
  let adminUser;
  let client;
  let apiClient;
  let loanId;

  test.beforeAll(async ({ browser }) => {
    adminUser = await createTestUser('manager');
    const area = await createCollectionArea();
    client = await createClient(area.id, adminUser.id);
    
    // Login to get token
    const context = await browser.newContext();
    const page = await context.newPage();
    await login(page, adminUser.email, adminUser.password);
    apiClient = new ApiClient(context.request);
  });

  test.afterAll(async () => {
    if (adminUser) await cleanupTestUser(adminUser.email);
  });

  test('should create a loan application', async () => {
    const loanData = {
      clientId: client.id,
      amount: 5000,
      interestRate: 0.15, // 15%
      purpose: 'Business expansion',
    };

    const response = await apiClient.post('/api/loans', loanData);
    expect(response.data.id).toBeDefined();
    expect(response.data.status).toBe('PENDING');
    expect(response.data.amount).toBe(5000);
    loanId = response.data.id;
  });

  test('should approve the loan', async () => {
    const response = await apiClient.put(`/api/loans/${loanId}/approve`, {
      approved: true,
      notes: 'Approved by admin',
    });
    expect(response.data.status).toBe('APPROVED');
  });

  test('should disburse the loan', async () => {
    // Disbursement might happen on approval or separate step
    // Assuming separate endpoint or checking status if auto-disbursed
    // If separate:
    const response = await apiClient.post(`/api/loans/${loanId}/disburse`, {});
    expect(response.data.status).toBe('ACTIVE');
    
    // Check balance
    const accountRes = await apiClient.get(`/api/accounts/${client.accountId}`);
    expect(accountRes.data.balance).toBeGreaterThanOrEqual(5000);
  });

  test('should repay the loan', async () => {
    const repayment = {
      amount: 1000,
      loanId: loanId,
    };
    
    const response = await apiClient.post(`/api/loans/${loanId}/repayments`, repayment);
    expect(response.data.remainingBalance).toBeLessThan(5000 * 1.15); // Principal + Interest - Repayment
  });
});
