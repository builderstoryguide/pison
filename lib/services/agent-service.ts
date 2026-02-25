/**
 * Agent Service
 * Handles all business logic for collection agents
 */

import { prisma } from '@/lib/prisma';
import { Prisma } from '@prisma/client';
import { capLimit } from '@/lib/utils/pagination';
import { getCachedOrFetch, getCachedOrFetchByKey } from '@/lib/cache/query-cache';
import { LIST_PREFIX_AGENTS, agentDetailKey, agentByUserKey } from '@/lib/cache/keys';

const AGENT_LIST_TTL = 60;
const AGENT_DETAIL_TTL = 60;

export interface CreateAgentInput {
  userId: string;
  fullName: string;
  nationalId?: string;
  phone?: string;
  email?: string;
  address?: string;
  hireDate?: Date;
  areaIds?: string[]; // Collection areas to assign
}

export interface UpdateAgentInput {
  fullName?: string;
  nationalId?: string;
  phone?: string;
  email?: string;
  address?: string;
  status?: 'ACTIVE' | 'INACTIVE' | 'SUSPENDED';
  areaIds?: string[]; // Collection areas to assign
}

export class AgentService {
  /**
   * Generate unique agent code
   */
  private async generateAgentCode(): Promise<string> {
    const date = new Date();
    const dateStr = date.toISOString().slice(0, 10).replace(/-/g, '');
    const random = Math.floor(Math.random() * 1000).toString().padStart(3, '0');
    const code = `AGT-${dateStr}-${random}`;

    // Check if code exists
    const exists = await prisma.agent.findUnique({ where: { agentCode: code } });
    if (exists) {
      return this.generateAgentCode(); // Recursive call if exists
    }

    return code;
  }

  /**
   * Create agent account
   */
  private async createAgentAccount(_agentId: string): Promise<string> {
    const accountNumber = await this.generateAccountNumber('AGENT');
    const account = await prisma.financialAccount.create({
      data: {
        accountNumber,
        accountType: 'AGENT',
        balance: 0,
        availableBalance: 0,
        status: 'ACTIVE',
      },
    });
    return account.id;
  }

  /**
   * Generate unique account number
   */
  private async generateAccountNumber(type: 'CLIENT' | 'AGENT' | 'SYSTEM'): Promise<string> {
    const date = new Date();
    const dateStr = date.toISOString().slice(0, 10).replace(/-/g, '');
    const random = Math.floor(Math.random() * 1000).toString().padStart(3, '0');
    const prefix = type === 'CLIENT' ? 'CLT' : type === 'AGENT' ? 'AGT' : 'SYS';
    const accountNumber = `ACC-${prefix}-${dateStr}-${random}`;

    const exists = await prisma.financialAccount.findUnique({
      where: { accountNumber },
    });

    if (exists) {
      return this.generateAccountNumber(type);
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
   * Create a new agent
   * @param creatorRoleName - If 'accountant', agent is created with PENDING_APPROVAL; Manager creates as APPROVED
   */
  async createAgent(data: CreateAgentInput, createdBy: string, creatorRoleName?: string) {
    // Check if user already has an agent record
    const existingAgent = await prisma.agent.findUnique({
      where: { userId: data.userId },
    });

    if (existingAgent) {
      throw new Error('User already has an agent record');
    }

    return await prisma.$transaction(async (tx) => {
      // Generate agent code
      const agentCode = await this.generateAgentCode();

      // Create agent account
      const accountId = await this.createAgentAccount('');

      const approvalStatus = this.requiresApproval(creatorRoleName) ? 'PENDING_APPROVAL' : 'APPROVED';

      // Create agent
      const agent = await tx.agent.create({
        data: {
          agentCode,
          userId: data.userId,
          fullName: data.fullName,
          nationalId: data.nationalId,
          phone: data.phone,
          email: data.email,
          address: data.address,
          accountId,
          hireDate: data.hireDate,
          createdBy,
          updatedBy: createdBy,
          approvalStatus,
        },
      });

      // Assign areas if provided
      if (data.areaIds && data.areaIds.length > 0) {
        await tx.agentAreaAssignment.createMany({
          data: data.areaIds.map((areaId, index) => ({
            agentId: agent.id,
            areaId,
            isPrimary: index === 0, // First area is primary
            assignedBy: createdBy,
          })),
        });
      }

      await tx.auditLog.create({
        data: {
          userId: createdBy,
          action: 'CREATE',
          entityType: 'AGENT',
          entityId: agent.id,
          description: `Agent created: ${agentCode} - ${data.fullName}`,
        },
      });

      return await tx.agent.findUnique({
        where: { id: agent.id },
        include: {
          user: {
            select: {
              id: true,
              email: true,
              name: true,
            },
          },
          account: true,
          areaAssignments: {
            include: {
              area: true,
            },
          },
        },
      });
    });
  }

  /**
   * Update an agent
   * If areaIds are provided, updates both agent data and area assignments in a single transaction
   */
  async updateAgent(id: string, data: UpdateAgentInput, userId: string) {
    const agent = await prisma.agent.findUnique({ where: { id } });

    if (!agent) {
      throw new Error('Agent not found');
    }

    // Extract areaIds from data to handle separately
    const { areaIds, ...agentData } = data;

    // If areaIds are provided, use a transaction to update both agent and areas
    if (areaIds !== undefined) {
      const updated = await prisma.$transaction(async (tx) => {
        // Update agent data
        await tx.agent.update({
          where: { id },
          data: {
            ...agentData,
            updatedBy: userId,
          },
        });

        // Remove existing area assignments
        await tx.agentAreaAssignment.deleteMany({
          where: { agentId: id },
        });

        // Create new area assignments if areaIds array is not empty
        if (areaIds.length > 0) {
          await tx.agentAreaAssignment.createMany({
            data: areaIds.map((areaId, index) => ({
              agentId: id,
              areaId,
              isPrimary: index === 0,
              assignedBy: userId,
            })),
          });
        }

        // Return the complete updated agent with all relations
        return await tx.agent.findUnique({
          where: { id },
          include: {
            user: {
              select: {
                id: true,
                email: true,
                name: true,
              },
            },
            account: true,
            areaAssignments: {
              include: {
                area: true,
              },
            },
          },
        });
      });
      if (agentData.status !== undefined && updated) {
        const { invalidateDashboardStats } = await import('@/lib/cache');
        await invalidateDashboardStats(updated.user?.id);
      }
      return updated;
    }

    // If no areaIds, just update agent data (no transaction needed)
    const updated = await prisma.agent.update({
      where: { id },
      data: {
        ...agentData,
        updatedBy: userId,
      },
      include: {
        user: {
          select: {
            id: true,
            email: true,
            name: true,
          },
        },
        account: true,
        areaAssignments: {
          include: {
            area: true,
          },
        },
      },
    });

    if (agentData.status !== undefined) {
      const { invalidateDashboardStats } = await import('@/lib/cache');
      await invalidateDashboardStats(updated.user?.id);
    }
    return updated;
  }

  /**
   * Get all agents
   */
  async getAllAgents(filters?: {
    status?: 'ACTIVE' | 'INACTIVE' | 'SUSPENDED';
    areaId?: string;
    sort?: string;
    dir?: 'asc' | 'desc';
    limit?: number;
    offset?: number;
    select?: Prisma.AgentSelect;
    includePendingApproval?: boolean;
  }) {
    const where: Prisma.AgentWhereInput = {};

    if (filters?.status) {
      where.status = filters.status;
    }

    // Exclude PENDING_APPROVAL by default
    if (filters?.includePendingApproval !== true) {
      where.approvalStatus = 'APPROVED';
    }

    if (filters?.areaId) {
      where.areaAssignments = {
        some: {
          areaId: filters.areaId,
        },
      };
    }

    const defaultSelect: Prisma.AgentSelect = {
      id: true,
      agentCode: true,
      fullName: true,
      status: true,
      user: {
        select: { id: true, email: true, name: true },
      },
      account: {
        select: {
          id: true,
          accountNumber: true,
          balance: true,
          availableBalance: true,
          status: true,
        },
      },
      areaAssignments: {
        select: {
          area: {
            select: { id: true, code: true, name: true },
          },
        },
      },
    };

    const AGENT_SORT_FIELDS = ['fullName', 'agentCode', 'createdAt', 'status'];
    const sortField = filters?.sort && AGENT_SORT_FIELDS.includes(filters.sort) ? filters.sort : 'createdAt';
    const sortDir = filters?.dir === 'asc' ? 'asc' : 'desc';

    const cacheParams = {
      status: filters?.status,
      areaId: filters?.areaId,
      sort: sortField,
      dir: sortDir,
      limit: capLimit(filters?.limit),
      offset: filters?.offset ?? 0,
      includePendingApproval: filters?.includePendingApproval,
      hasSelect: !!filters?.select,
    };

    return getCachedOrFetch(LIST_PREFIX_AGENTS, cacheParams, AGENT_LIST_TTL, () =>
      prisma.agent.findMany({
        where,
        select: filters?.select
          ? { ...filters.select, id: true }
          : defaultSelect,
        orderBy: { [sortField]: sortDir },
        take: capLimit(filters?.limit),
        skip: filters?.offset ?? 0,
      }),
    );
  }

  /**
   * Get agent by ID
   */
  async getAgentById(id: string) {
    return getCachedOrFetchByKey(agentDetailKey(id), AGENT_DETAIL_TTL, () =>
      prisma.agent.findUnique({
        where: { id },
        include: {
          user: {
            select: {
              id: true,
              email: true,
              name: true,
              role: true,
            },
          },
          account: true,
          areaAssignments: {
            include: {
              area: true,
            },
          },
          _count: {
            select: {
              transactions: true,
              areaAssignments: true,
            },
          },
        },
      }),
    );
  }

  /**
   * Get agent by user ID
   */
  async getAgentByUserId(userId: string) {
    return getCachedOrFetchByKey(agentByUserKey(userId), AGENT_DETAIL_TTL, () =>
      prisma.agent.findUnique({
        where: { userId },
        include: {
          user: true,
          account: true,
          areaAssignments: {
            include: {
              area: true,
            },
          },
        },
      }),
    );
  }

  /**
   * Assign areas to agent
   */
  async assignAreas(agentId: string, areaIds: string[], assignedBy: string) {
    const agent = await prisma.agent.findUnique({ where: { id: agentId } });

    if (!agent) {
      throw new Error('Agent not found');
    }

    return await prisma.$transaction(async (tx) => {
      // Remove existing assignments
      await tx.agentAreaAssignment.deleteMany({
        where: { agentId },
      });

      // Create new assignments
      if (areaIds.length > 0) {
        await tx.agentAreaAssignment.createMany({
          data: areaIds.map((areaId, index) => ({
            agentId,
            areaId,
            isPrimary: index === 0,
            assignedBy,
          })),
        });
      }

      return await tx.agent.findUnique({
        where: { id: agentId },
        include: {
          areaAssignments: {
            include: {
              area: true,
            },
          },
        },
      });
    });
  }

  /**
   * Get agent's assigned areas
   */
  async getAgentAreas(agentId: string) {
    const assignments = await prisma.agentAreaAssignment.findMany({
      where: { agentId },
      include: {
        area: true,
      },
    });

    return assignments.map((a) => a.area);
  }

  /**
   * Validate agent has access to area
   */
  async validateAgentAreaAccess(agentId: string, areaId: string): Promise<boolean> {
    const assignment = await prisma.agentAreaAssignment.findUnique({
      where: {
        agentId_areaId: {
          agentId,
          areaId,
        },
      },
    });

    return !!assignment;
  }

  /**
   * Refill agent account (deposit to agent's operational account)
   */
  async refillAgentAccount(agentId: string, amount: number, userId: string) {
    if (amount <= 0) {
      throw new Error('Amount must be positive');
    }

    const agent = await prisma.agent.findUnique({
      where: { id: agentId },
      include: { account: true },
    });

    if (!agent) {
      throw new Error('Agent not found');
    }

    if (agent.account.status !== 'ACTIVE') {
      throw new Error('Agent account is not active');
    }

    if (agent.approvalStatus !== 'APPROVED') {
      throw new Error('Agent account must be approved before refill');
    }

    // This will create a transaction that needs approval
    // The actual balance update happens when transaction is approved
    const transaction = await prisma.transaction.create({
      data: {
        transactionNumber: await this.generateTransactionNumber(),
        accountId: agent.accountId,
        type: 'DEPOSIT',
        amount,
        balanceBefore: agent.account.balance,
        balanceAfter: agent.account.balance + amount, // Will be updated on approval
        status: 'PENDING_APPROVAL',
        description: `Account refill for agent ${agent.agentCode}`,
        createdBy: userId,
      },
    });

    await prisma.auditLog.create({
      data: {
        userId,
        action: 'REFILL',
        entityType: 'AGENT',
        entityId: agentId,
        transactionId: transaction.id,
        description: `Agent account refill: ${amount} for agent ${agent.agentCode}`,
      },
    });

    return transaction;
  }

  /**
   * Get agents pending manager approval (Accountant-created)
   */
  async getPendingAgents() {
    return await prisma.agent.findMany({
      where: { approvalStatus: 'PENDING_APPROVAL' },
      include: {
        user: { select: { id: true, name: true, email: true } },
        account: { select: { id: true, accountNumber: true, balance: true, availableBalance: true } },
        areaAssignments: { include: { area: true } },
        creator: { select: { id: true, name: true, email: true } },
      },
      orderBy: { createdAt: 'desc' },
    });
  }

  /**
   * Approve a pending agent (Manager only)
   */
  async approveAgent(id: string, approvedBy: string) {
    const agent = await prisma.agent.findUnique({
      where: { id },
      include: { account: true },
    });

    if (!agent) {
      throw new Error('Agent not found');
    }

    if (agent.approvalStatus !== 'PENDING_APPROVAL') {
      throw new Error(`Agent is not pending approval (status: ${agent.approvalStatus})`);
    }

    return await prisma.$transaction(async (tx) => {
      const updated = await tx.agent.update({
        where: { id },
        data: {
          approvalStatus: 'APPROVED',
          approvedBy,
          approvedAt: new Date(),
          updatedBy: approvedBy,
        },
        include: {
          user: { select: { id: true, email: true, name: true } },
          account: true,
          areaAssignments: { include: { area: true } },
        },
      });

      await tx.auditLog.create({
        data: {
          userId: approvedBy,
          action: 'APPROVE',
          entityType: 'AGENT',
          entityId: agent.id,
          description: `Agent approved: ${agent.agentCode} - ${agent.fullName}`,
        },
      });

      return updated;
    });
  }

  /**
   * Reject a pending agent (Manager only)
   */
  async rejectAgent(id: string, rejectedBy: string, reason?: string) {
    const agent = await prisma.agent.findUnique({
      where: { id },
      include: { account: true },
    });

    if (!agent) {
      throw new Error('Agent not found');
    }

    if (agent.approvalStatus !== 'PENDING_APPROVAL') {
      throw new Error(`Agent is not pending approval (status: ${agent.approvalStatus})`);
    }

    return await prisma.$transaction(async (tx) => {
      // Close the financial account
      await tx.financialAccount.update({
        where: { id: agent.accountId },
        data: { status: 'CLOSED', closedAt: new Date() },
      });

      const updated = await tx.agent.update({
        where: { id },
        data: {
          approvalStatus: 'REJECTED',
          approvedBy: rejectedBy,
          approvedAt: new Date(),
          updatedBy: rejectedBy,
          status: 'INACTIVE',
        },
        include: {
          user: { select: { id: true, email: true, name: true } },
          account: true,
          areaAssignments: { include: { area: true } },
        },
      });

      await tx.auditLog.create({
        data: {
          userId: rejectedBy,
          action: 'REJECT',
          entityType: 'AGENT',
          entityId: agent.id,
          description: `Agent rejected: ${agent.agentCode} - ${agent.fullName}${reason ? ` - ${reason}` : ''}`,
        },
      });

      return updated;
    });
  }

  /**
   * Generate unique transaction number
   */
  private async generateTransactionNumber(): Promise<string> {
    const date = new Date();
    const dateStr = date.toISOString().slice(0, 10).replace(/-/g, '');
    const random = Math.floor(Math.random() * 10000).toString().padStart(4, '0');
    const transactionNumber = `TXN-${dateStr}-${random}`;

    const exists = await prisma.transaction.findUnique({
      where: { transactionNumber },
    });

    if (exists) {
      return this.generateTransactionNumber();
    }

    return transactionNumber;
  }
}

export const agentService = new AgentService();
