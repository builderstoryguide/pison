import { test, expect } from '@playwright/test';
import { createTestUser, createCollectionArea, createClient, createAgent, assignAgentToArea, cleanupTestUser } from '../../helpers/seed';
import { login, logout } from '../../helpers/auth';

test.describe('Daily Collection Flow', () => {
  let adminUser: any;
  let agentUser: any;
  let agent: any;
  let area: any;
  let client: any;

  test.beforeAll(async () => {
    // 1. Setup Data
    adminUser = await createTestUser('administrator');
    agentUser = await createTestUser('agent');
    area = await createCollectionArea();
    
    // Create agent entity for the agent user
    agent = await createAgent(agentUser.id, agentUser.name || agentUser.email, adminUser.id);
    
    // Assign agent to area
    await assignAgentToArea(agent.id, area.id, adminUser.id);
    
    // Create client in area
    client = await createClient(area.id, adminUser.id);
  });

  test.afterAll(async () => {
    // Cleanup
    if (adminUser) await cleanupTestUser(adminUser.email);
    if (agentUser) await cleanupTestUser(agentUser.email);
    // Area and client cleanup handled by DB reset or cascade
  });

  test('should process a collection transaction end-to-end', async ({ browser }) => {
    // 2. Agent logs in and posts collection
    const agentContext = await browser.newContext();
    const agentPage = await agentContext.newPage();
    await login(agentPage, agentUser.email, agentUser.password);
    
    await agentPage.goto('/dashboard/agent/collections/new');
    // Fill form
    await agentPage.getByLabel('Client').fill(client.clientNumber); // Search by number
    await agentPage.getByText(client.fullName).click(); // Select client
    await agentPage.getByLabel('Amount').fill('100');
    await agentPage.getByRole('button', { name: 'Submit' }).click();
    
    await expect(agentPage.getByText('Transaction created successfully')).toBeVisible();
    await logout(agentPage);
    await agentContext.close();

    // 3. Admin logs in and approves
    const adminContext = await browser.newContext();
    const adminPage = await adminContext.newPage();
    await login(adminPage, adminUser.email, adminUser.password);
    
    await adminPage.goto('/dashboard/admin/transactions/pending');
    await expect(adminPage.getByText('100.00')).toBeVisible(); // Check amount
    await adminPage.getByRole('button', { name: 'Approve' }).first().click();
    
    await expect(adminPage.getByText('Transaction approved')).toBeVisible();

    // 4. Verify Balance
    await adminPage.goto(`/dashboard/clients/${client.id}`);
    await expect(adminPage.getByText('Balance')).toBeVisible();
    await expect(adminPage.getByText('100.00')).toBeVisible(); // Assuming start 0 + 100
    
    await adminContext.close();
  });
});
