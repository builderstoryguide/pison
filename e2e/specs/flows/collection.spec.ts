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
    adminUser = await createTestUser('manager');
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
    // 2. Agent logs in and enters ventilation (collection amounts)
    const agentContext = await browser.newContext();
    const agentPage = await agentContext.newPage();
    await login(agentPage, agentUser.email, agentUser.password);

    await agentPage.goto('/collections/daily');
    await agentPage.waitForLoadState('networkidle');

    // Select collection area
    await agentPage.getByRole('combobox').first().click();
    await agentPage.getByRole('option', { name: area.name }).click();

    // Wait for clients to load, then enter amount for the client
    await agentPage.getByTestId(`collection-row-${client.id}`).waitFor({ state: 'visible' });
    await agentPage.getByTestId(`collection-row-${client.id}`).getByRole('spinbutton').fill('100');

    // Submit collections
    await agentPage.getByRole('button', { name: /submit collections/i }).click();

    await expect(agentPage.getByText(/collections submitted successfully/i)).toBeVisible();
    await logout(agentPage);
    await agentContext.close();

    // 3. Manager logs in and approves pending transaction
    const adminContext = await browser.newContext();
    const adminPage = await adminContext.newPage();
    await login(adminPage, adminUser.email, adminUser.password);

    await adminPage.goto('/validation/pending');
    await adminPage.waitForLoadState('networkidle');

    await expect(adminPage.getByText('100')).toBeVisible();
    await adminPage.getByRole('button', { name: 'Approve' }).first().click();
    await adminPage.getByRole('button', { name: 'Approve' }).last().click(); // Confirm in dialog

    await expect(adminPage.getByText(/transaction approved/i)).toBeVisible();

    // 4. Verify client balance updated
    await adminPage.goto(`/clients/${client.id}`);
    await expect(adminPage.getByText(/balance|solde/i)).toBeVisible();
    await expect(adminPage.getByText('100')).toBeVisible();

    await adminContext.close();
  });
});
