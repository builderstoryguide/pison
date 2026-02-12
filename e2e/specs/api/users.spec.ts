import { test, expect } from '@playwright/test';
import { ApiClient } from '../../helpers/api-client';
import { createTestUser, cleanupTestUser } from '../../helpers/seed';
import { login } from '../../helpers/auth';

test.describe('User Management API', () => {
  let adminUser;
  let apiClient;
  let browserContext;

  test.beforeAll(async ({ browser }) => {
    // Create Admin user
    adminUser = await createTestUser('manager');
    
    // Login to get session
    browserContext = await browser.newContext();
    const page = await browserContext.newPage();
    await login(page, adminUser.email, adminUser.password);
    
    // Create API client with authenticated context
    apiClient = new ApiClient(browserContext.request);
    
    // Verify session
    const session = await apiClient.get('/api/auth/session');
    expect(session.user).toBeDefined();
  });

  test.afterAll(async () => {
    // Close browser context to release resources
    if (browserContext) await browserContext.close();
    if (adminUser) await cleanupTestUser(adminUser.email);
  });

  test('GET /api/user-management/users - should list users', async () => {
    const response = await apiClient.get('/api/user-management/users');
    expect(response.data).toBeInstanceOf(Array);
    expect(response.data.length).toBeGreaterThan(0);
  });

  test('POST /api/user-management/users - should create a new user', async () => {
    const newUser = {
      name: 'Test User API',
      email: `api-test-${Date.now()}@example.com`,
      roleId: 'agent-role-id', // Need a valid role ID, maybe fetch it first
      status: 'ACTIVE',
    };
    
    // Fetch roles first to get ID
    const roles = await apiClient.get('/api/user-management/roles');
    
    // Validate roles response before accessing
    expect(roles).toBeDefined();
    expect(roles.data).toBeDefined();
    expect(roles.data).toBeInstanceOf(Array);
    expect(roles.data.length).toBeGreaterThan(0);
    
    newUser.roleId = roles.data[0].id; // Use first available role

    const response = await apiClient.post('/api/user-management/users', newUser);
    expect(response.data.email).toBe(newUser.email);
    
    // Cleanup created user
    await cleanupTestUser(newUser.email);
  });
});
