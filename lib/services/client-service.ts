/**
 * Client Service
 * Handles all business logic for clients
 */

import { prisma } from '@/lib/prisma';
import { Prisma } from '@prisma/client';
import { getCachedCount } from '@/lib/cache';
import { getCachedOrFetch, getCachedOrFetchByKey } from '@/lib/cache/query-cache';
import { LIST_PREFIX_CLIENTS, clientDetailKey } from '@/lib/cache/keys';
import { accountNatureService } from './account-nature-service';
import { ClientCreationValidationError } from '@/lib/errors/client-validation-error';
import {
  capLimit,
  decodeCursor,
  encodeCursor,
  buildCountCacheKey,
} from '@/lib/utils/pagination';
import { getDbNow, transactionNumberDatePrefix } from '@/lib/utils/db-time';

const CLIENT_LIST_TTL = 30;
const CLIENT_DETAIL_TTL = 60;

export interface CreateClientInput {
  fullName: string;
  nationalId?: string;
  phone?: string;
  email?: string;
  address?: string;
  city?: string;
  areaId: string;
  agentId?: string;
  isCommissionExempt?: boolean;
  accountNatureId: string;
  documentChecklist?: Record<string, boolean>;
  openingAmount?: number;
  customInterestRate?: number;
}

export interface UpdateClientInput {
  fullName?: string;
  nationalId?: string;
  phone?: string;
  email?: string;
  address?: string;
  city?: string;
  areaId?: string;
  agentId?: string | null;
  status?: 'ACTIVE' | 'INACTIVE' | 'SUSPENDED' | 'CLOSED';
  isCommissionExempt?: boolean;
  commissionRateOverride?: number | null;
}

export class ClientService {
  /**
   * Generate unique client number
   */
  private async generateClientNumber(): Promise<string> {
    const dateStr = transactionNumberDatePrefix(await getDbNow());
    const random = Math.floor(Math.random() * 1000).toString().padStart(3, '0');
    const clientNumber = `CLT-${dateStr}-${random}`;

    const exists = await prisma.client.findUnique({
      where: { clientNumber },
    });

    if (exists) {
      return this.generateClientNumber();
    }

    return clientNumber;
  }

  /**
   * Generate unique account number
   */
  private async generateAccountNumber(): Promise<string> {
    const dateStr = transactionNumberDatePrefix(await getDbNow());
    const random = Math.floor(Math.random() * 1000).toString().padStart(3, '0');
    const accountNumber = `ACC-CLT-${dateStr}-${random}`;

    const exists = await prisma.financialAccount.findUnique({
      where: { accountNumber },
    });

    if (exists) {
      return this.generateAccountNumber();
    }

    return accountNumber;
  }

  /**
   * Determine if creator requires manager approval (Accountant creates → PENDING; Manager creates → APPROVED)
   */
  private requiresApproval(creatorRoleName: string | undefined): boolean {
    const r = (creatorRoleName || '').toLowerCase();
    return r.includes('accountant') && !r.includes('manager') && !r.includes('administrator');
  }

  /**
   * Create a new client
   * @param creatorRoleName - If 'accountant', client is created with PENDING_APPROVAL; Manager creates as APPROVED
   */
  async createClient(data: CreateClientInput, createdBy: string, creatorRoleName?: string) {
    // Validate area exists
    const area = await prisma.collectionArea.findUnique({
      where: { id: data.areaId },
    });

    if (!area) {
      throw new Error('Collection area not found');
    }

    if (area.status !== 'ACTIVE') {
      throw new Error('Collection area is not active');
    }

    // Validate agent exists, is active, and approved when assigned
    if (data.agentId) {
      const agent = await prisma.agent.findUnique({
        where: { id: data.agentId },
      });
      if (!agent) {
        throw new Error('Agent not found');
      }
      if (agent.status !== 'ACTIVE') {
        throw new Error('Agent is not active');
      }
      if (agent.approvalStatus !== 'APPROVED') {
        throw new Error('Agent account must be approved before assignment');
      }
    }

    // Validate account nature and documents
    const validationErrors = await accountNatureService.validateAccountCreation(
      data.accountNatureId,
      data.documentChecklist ?? {},
      data.openingAmount
    );
    if (validationErrors.length > 0) {
      throw new ClientCreationValidationError(validationErrors);
    }

    const accountNature = await prisma.accountNature.findUnique({
      where: { id: data.accountNatureId },
    });
    if (!accountNature || !accountNature.isActive) {
      throw new Error('Account nature not found or not active');
    }

    const MAX_RETRIES = 3;
    let lastError: unknown;

    for (let attempt = 1; attempt <= MAX_RETRIES; attempt++) {
      try {
        const result = await prisma.$transaction(async (tx) => {
      // Generate client number and account number
      const clientNumber = await this.generateClientNumber();
      const accountNumber = await this.generateAccountNumber();

      // Compute account-specific fields
      const now = await getDbNow(tx);
      let blockedUntil: Date | null = null;
      let maturityDate: Date | null = null;
      if (accountNature.isBlocked && accountNature.blockedDurationMonths) {
        const d = new Date(now);
        d.setMonth(d.getMonth() + accountNature.blockedDurationMonths);
        blockedUntil = d;
      }
      if (accountNature.minTermMonths && accountNature.interestRateNegotiable) {
        const d = new Date(now);
        d.setMonth(d.getMonth() + accountNature.minTermMonths);
        maturityDate = d;
      }

      const initialBalance = data.openingAmount ?? 0;

      // Create financial account
      const account = await tx.financialAccount.create({
        data: {
          accountNumber,
          accountType: 'CLIENT',
          accountNatureId: data.accountNatureId,
          balance: initialBalance,
          availableBalance: initialBalance,
          status: 'ACTIVE',
          blockedUntil,
          maturityDate,
          customInterestRate: data.customInterestRate ?? null,
        },
      });

      const approvalStatus = this.requiresApproval(creatorRoleName) ? 'PENDING_APPROVAL' : 'APPROVED';

      // Create client
      const client = await tx.client.create({
        data: {
          clientNumber,
          fullName: data.fullName,
          nationalId: data.nationalId,
          phone: data.phone,
          email: data.email,
          address: data.address,
          city: data.city,
          areaId: data.areaId,
          agentId: data.agentId,
          accountId: account.id,
          isCommissionExempt: data.isCommissionExempt || false,
          documentChecklist: data.documentChecklist ? (data.documentChecklist as object) : null,
          createdBy,
          updatedBy: createdBy,
          approvalStatus,
        },
      });

      await tx.auditLog.create({
        data: {
          userId: createdBy,
          action: 'CREATE',
          entityType: 'CLIENT',
          entityId: client.id,
          description: `Client created: ${client.clientNumber} - ${data.fullName}`,
        },
      });

      return await tx.client.findUnique({
        where: { id: client.id },
        include: {
          area: true,
          account: true,
        },
      });
    });

        const { invalidateCountCacheForEntity, invalidateClientListCache } = await import('@/lib/cache');
        await Promise.allSettled([
          invalidateCountCacheForEntity('clients'),
          invalidateClientListCache(),
        ]);
        return result;
      } catch (error: unknown) {
        lastError = error;
        const isRetryable =
          error instanceof Prisma.PrismaClientKnownRequestError &&
          error.code === 'P2002' &&
          Array.isArray(error.meta?.target) &&
          (error.meta.target as string[]).some(
            (t) => t === 'clientNumber' || t === 'accountNumber'
          );
        if (!isRetryable || attempt === MAX_RETRIES) {
          throw error;
        }
      }
    }

    throw lastError;
  }

  /**
   * Update a client
   */
  async updateClient(id: string, data: UpdateClientInput, userId: string) {
    const client = await prisma.client.findUnique({ where: { id } });

    if (!client) {
      throw new Error('Client not found');
    }

    // If changing area, validate new area exists
    if (data.areaId && data.areaId !== client.areaId) {
      const area = await prisma.collectionArea.findUnique({
        where: { id: data.areaId },
      });

      if (!area) {
        throw new Error('Collection area not found');
      }

      if (area.status !== 'ACTIVE') {
        throw new Error('Collection area is not active');
      }
    }

    // If changing agent, validate new agent exists and is active
    if (data.agentId !== undefined && data.agentId !== client.agentId) {
      if (data.agentId) {
        const agent = await prisma.agent.findUnique({
          where: { id: data.agentId },
        });
        if (!agent) {
          throw new Error('Agent not found');
        }
        if (agent.status !== 'ACTIVE') {
          throw new Error('Agent is not active');
        }
      }
    }

    const updated = await prisma.client.update({
      where: { id },
      data: {
        ...data,
        updatedBy: userId,
      },
      include: {
        area: true,
        account: true,
        assignedAgent: {
          select: {
            id: true,
            fullName: true,
            agentCode: true,
          }
        },
      },
    });

    const { invalidateDashboardStats, invalidateCountCacheForEntity, invalidateClientListCache, invalidateClientDetail } = await import('@/lib/cache');
    const ops: Promise<unknown>[] = [
      invalidateCountCacheForEntity('clients'),
      invalidateClientListCache(),
      invalidateClientDetail(id),
    ];
    if (data.status !== undefined) {
      ops.push(invalidateDashboardStats());
    }
    await Promise.allSettled(ops);
    return updated;
  }

  /**
   * Get all clients with optional filters and pagination
   * Supports offset-based (default) and cursor-based pagination.
   */
  async getAllClients(filters?: {
    status?: 'ACTIVE' | 'INACTIVE' | 'SUSPENDED' | 'CLOSED';
    areaId?: string;
    areaIds?: string[]; // For agent: filter by multiple areas
    agentId?: string;
    search?: string; // Search by name, client number, phone, email
    sort?: string;
    dir?: 'asc' | 'desc';
    limit?: number;
    offset?: number;
    cursor?: string;
    select?: Prisma.ClientSelect;
    includePendingApproval?: boolean; // If true, include PENDING_APPROVAL; default excludes them
  }) {
    const where: Prisma.ClientWhereInput = {};

    if (filters?.status) {
      where.status = filters.status;
    }

    // Exclude PENDING_APPROVAL by default (only show approved clients in lists)
    if (filters?.includePendingApproval !== true) {
      where.approvalStatus = 'APPROVED';
    }

    if (filters?.areaId) {
      where.areaId = filters.areaId;
    } else if (filters?.areaIds && filters.areaIds.length > 0) {
      where.areaId = { in: filters.areaIds };
    }

    if (filters?.agentId) {
      where.agentId = filters.agentId;
    }

    if (filters?.search) {
      where.OR = [
        { fullName: { contains: filters.search, mode: 'insensitive' } },
        { clientNumber: { contains: filters.search, mode: 'insensitive' } },
        { phone: { contains: filters.search, mode: 'insensitive' } },
        { email: { contains: filters.search, mode: 'insensitive' } },
      ];
    }

    const useCursor = !!filters?.cursor;
    const decodedCursor = useCursor ? decodeCursor(filters.cursor!) : null;

    let finalWhere: Prisma.ClientWhereInput = where;
    if (useCursor && decodedCursor) {
      finalWhere = {
        AND: [
          where,
          {
            OR: [
              { createdAt: { lt: decodedCursor.createdAt } },
              {
                createdAt: decodedCursor.createdAt,
                id: { lt: decodedCursor.id },
              },
            ],
          },
        ],
      };
    }

    const limit = capLimit(filters?.limit);
    const countCacheKey = buildCountCacheKey('clients', {
      status: filters?.status,
      areaId: filters?.areaId,
      areaIds: filters?.areaIds?.slice().sort(),
      agentId: filters?.agentId,
      search: filters?.search,
      includePendingApproval: filters?.includePendingApproval,
    });

    const defaultInclude = {
      area: { select: { id: true, code: true, name: true } },
      account: { select: { id: true, accountNumber: true, balance: true, availableBalance: true, status: true } },
      assignedAgent: { select: { id: true, fullName: true, agentCode: true } },
    };

    const CLIENT_SORT_FIELDS = ['fullName', 'clientNumber', 'createdAt', 'status'];
    const sortField = filters?.sort && CLIENT_SORT_FIELDS.includes(filters.sort) ? filters.sort : 'createdAt';
    const sortDir = filters?.dir === 'asc' ? 'asc' : 'desc';
    const orderBy = useCursor ? { createdAt: 'desc' as const } : { [sortField]: sortDir };

    const cacheParams = {
      status: filters?.status,
      areaId: filters?.areaId,
      areaIds: filters?.areaIds?.slice().sort(),
      agentId: filters?.agentId,
      search: filters?.search,
      sort: sortField,
      dir: sortDir,
      limit,
      offset: useCursor ? 0 : (filters?.offset ?? 0),
      cursor: filters?.cursor,
      includePendingApproval: filters?.includePendingApproval,
      hasSelect: !!filters?.select,
    };

    const result = await getCachedOrFetch(LIST_PREFIX_CLIENTS, cacheParams, CLIENT_LIST_TTL, async () => {
      const [rows, count] = await Promise.all([
        prisma.client.findMany({
          where: finalWhere,
          ...(filters?.select
            ? { select: { ...filters.select, id: true, createdAt: true } }
            : { include: defaultInclude }),
          orderBy,
          take: limit,
          skip: useCursor ? 0 : (filters?.offset ?? 0),
        }),
        getCachedCount(countCacheKey, () => prisma.client.count({ where })),
      ]);
      return { rows, count };
    });

    const clients = result.rows;
    const total = result.count;

    const last = clients[clients.length - 1];
    const nextCursor =
      useCursor && last && clients.length === limit
        ? encodeCursor(last.createdAt, last.id)
        : null;

    return {
      clients,
      total,
      nextCursor,
      hasMore: !!nextCursor,
    };
  }

  /**
   * Get client by ID
   */
  async getClientById(id: string) {
    return getCachedOrFetchByKey(clientDetailKey(id), CLIENT_DETAIL_TTL, () =>
      prisma.client.findUnique({
        where: { id },
        include: {
          area: true,
          account: true,
          assignedAgent: {
            select: {
              id: true,
              fullName: true,
              agentCode: true,
            }
          },
          loans: {
            where: {
              status: {
                in: ['APPROVED', 'DISBURSED', 'ACTIVE'],
              },
            },
          },
          _count: {
            select: {
              transactions: true,
              loans: true,
              commissions: true,
            },
          },
        },
      }),
    );
  }

  /**
   * Get client by client number
   */
  async getClientByNumber(clientNumber: string) {
    return await prisma.client.findUnique({
      where: { clientNumber },
      include: {
        area: true,
        account: true,
        assignedAgent: {
          select: {
            id: true,
            fullName: true,
            agentCode: true,
          }
        },
      },
    });
  }

  /**
   * Get clients by area (for agents)
   */
  async getClientsByArea(areaId: string, filters?: { limit?: number; offset?: number }) {
    return await prisma.client.findMany({
      where: {
        areaId,
        status: 'ACTIVE',
        approvalStatus: 'APPROVED',
      },
      select: {
        id: true,
        clientNumber: true,
        fullName: true,
        phone: true,
        email: true,
        status: true,
        account: {
          select: {
            balance: true,
            availableBalance: true,
          },
        },
        assignedAgent: {
          select: {
            id: true,
            fullName: true,
            agentCode: true,
          },
        },
      },
      orderBy: { fullName: 'asc' },
      take: capLimit(filters?.limit),
      skip: filters?.offset ?? 0,
    });
  }

  /**
   * Get clients pending manager approval (Accountant-created)
   */
  async getPendingClients() {
    return await prisma.client.findMany({
      where: { approvalStatus: 'PENDING_APPROVAL' },
      include: {
        area: { select: { id: true, code: true, name: true } },
        account: { select: { id: true, accountNumber: true, balance: true, availableBalance: true } },
        creator: { select: { id: true, name: true, email: true } },
      },
      orderBy: { createdAt: 'desc' },
    });
  }

  /**
   * Approve a pending client (Manager only)
   */
  async approveClient(id: string, approvedBy: string) {
    const client = await prisma.client.findUnique({
      where: { id },
      include: { account: true },
    });

    if (!client) {
      throw new Error('Client not found');
    }

    if (client.approvalStatus !== 'PENDING_APPROVAL') {
      throw new Error(`Client is not pending approval (status: ${client.approvalStatus})`);
    }

    return await prisma.$transaction(async (tx) => {
      const approvedAt = await getDbNow(tx);
      const updated = await tx.client.update({
        where: { id },
        data: {
          approvalStatus: 'APPROVED',
          approvedBy,
          approvedAt,
          updatedBy: approvedBy,
        },
        include: {
          area: true,
          account: true,
        },
      });

      await tx.auditLog.create({
        data: {
          userId: approvedBy,
          action: 'APPROVE',
          entityType: 'CLIENT',
          entityId: client.id,
          description: `Client approved: ${client.clientNumber} - ${client.fullName}`,
        },
      });

      return updated;
    });
  }

  /**
   * Reject a pending client (Manager only)
   */
  async rejectClient(id: string, rejectedBy: string, reason?: string) {
    const client = await prisma.client.findUnique({
      where: { id },
      include: { account: true },
    });

    if (!client) {
      throw new Error('Client not found');
    }

    if (client.approvalStatus !== 'PENDING_APPROVAL') {
      throw new Error(`Client is not pending approval (status: ${client.approvalStatus})`);
    }

    return await prisma.$transaction(async (tx) => {
      const rejectedAt = await getDbNow(tx);
      // Close the financial account since we're rejecting the client
      await tx.financialAccount.update({
        where: { id: client.accountId },
        data: { status: 'CLOSED', closedAt: rejectedAt },
      });

      const updated = await tx.client.update({
        where: { id },
        data: {
          approvalStatus: 'REJECTED',
          approvedBy: rejectedBy,
          approvedAt: rejectedAt,
          updatedBy: rejectedBy,
          status: 'CLOSED',
        },
        include: {
          area: true,
          account: true,
        },
      });

      await tx.auditLog.create({
        data: {
          userId: rejectedBy,
          action: 'REJECT',
          entityType: 'CLIENT',
          entityId: client.id,
          description: `Client rejected: ${client.clientNumber} - ${client.fullName}${reason ? ` - ${reason}` : ''}`,
        },
      });

      return updated;
    });
  }

  /**
   * Deactivate a client
   */
  async deactivateClient(id: string, userId: string) {
    return await this.updateClient(id, { status: 'INACTIVE' }, userId);
  }

  /**
   * Close a client account
   */
  async closeClientAccount(id: string, userId: string) {
    const client = await prisma.client.findUnique({
      where: { id },
      include: { account: true },
    });

    if (!client) {
      throw new Error('Client not found');
    }

    if (client.account.balance !== 0) {
      throw new Error('Cannot close account with non-zero balance');
    }

    return await prisma.$transaction(async (tx) => {
      const closedAt = await getDbNow(tx);
      // Update client status
      await tx.client.update({
        where: { id },
        data: {
          status: 'CLOSED',
          updatedBy: userId,
        },
      });

      // Close account
      await tx.financialAccount.update({
        where: { id: client.accountId },
        data: {
          status: 'CLOSED',
          closedAt,
        },
      });

      return await tx.client.findUnique({
        where: { id },
        include: {
          account: true,
        },
      });
    });
  }
}

export const clientService = new ClientService();
