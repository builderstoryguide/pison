import { test, expect } from '@playwright/test';
import { ApiClient } from '../../helpers/api-client';
import {
  createTestUser,
  createCollectionArea,
  getFirstAccountNature,
  cleanupTestUser,
} from '../../helpers/seed';
import { login } from '../../helpers/auth';
import { PrismaClient } from '@prisma/client';

test.describe('Client Management API', () => {
  let managerUser: Awaited<ReturnType<typeof createTestUser>>;
  let apiClient: ApiClient;
  let testArea: Awaited<ReturnType<typeof createCollectionArea>>;
  let testAccountNature: Awaited<ReturnType<typeof getFirstAccountNature>>;

  test.beforeAll(async ({ browser }) => {
    managerUser = await createTestUser('manager');
    testArea = await createCollectionArea();
    testAccountNature = await getFirstAccountNature();

    const context = await browser.newContext();
    const page = await context.newPage();
    await login(page, managerUser.email, managerUser.password);
    apiClient = new ApiClient(context.request);
  });

  test.afterAll(async () => {
    if (managerUser) await cleanupTestUser(managerUser.email);
  });

  test('GET /api/clients - should list clients', async () => {
    const response = await apiClient.get('/api/clients');
    expect(response.data).toBeInstanceOf(Array);
  });

  test('POST /api/clients - should create a new client and persist to database', async () => {
    const documentChecklist: Record<string, boolean> = {};

    const prisma = new PrismaClient();
    const natureWithDocs = await prisma.accountNature.findUnique({
      where: { id: testAccountNature.id },
      include: {
        requiredDocuments: {
          where: { isRequired: true },
          include: { documentType: true },
        },
      },
    });
    await prisma.$disconnect();

    if (natureWithDocs?.requiredDocuments?.length) {
      for (const rd of natureWithDocs.requiredDocuments) {
        documentChecklist[rd.documentType.code] = true;
      }
    }

    const minOpening = testAccountNature.minOpeningContribution
      ? Number(testAccountNature.minOpeningContribution)
      : testAccountNature.minBalance
        ? Number(testAccountNature.minBalance)
        : 0;

    const newClient = {
      fullName: 'John Doe Client',
      phone: '1234567890',
      areaId: testArea.id,
      accountNatureId: testAccountNature.id,
      documentChecklist,
      openingAmount: minOpening,
    };

    const response = await apiClient.post('/api/clients', newClient);

    expect(response.success).toBe(true);
    expect(response.data).toBeDefined();
    expect(response.data.fullName).toBe(newClient.fullName);
    expect(response.data.areaId).toBe(testArea.id);
    expect(response.data.clientNumber).toBeDefined();
    expect(response.data.id).toBeDefined();
    expect(response.data.account).toBeDefined();
    expect(response.data.account.accountNumber).toBeDefined();
  });
});
