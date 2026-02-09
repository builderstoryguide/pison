/**
 * Agent Service
 * Handles all business logic for collection agents
 */

import { prisma } from '@/lib/prisma';
import { Prisma } from '@prisma/client';

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
  private async createAgentAccount(agentId: string): Promise<string> {
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
   * Create a new agent
   */
  async createAgent(data: CreateAgentInput, createdBy: string) {
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
   */
  async updateAgent(id: string, data: UpdateAgentInput, userId: string) {
    const agent = await prisma.agent.findUnique({ where: { id } });

    if (!agent) {
      throw new Error('Agent not found');
    }

    return await prisma.agent.update({
      where: { id },
      data: {
        ...data,
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
  }

  /**
   * Get all agents
   */
  async getAllAgents(filters?: {
    status?: 'ACTIVE' | 'INACTIVE' | 'SUSPENDED';
    areaId?: string;
  }) {
    const where: Prisma.AgentWhereInput = {};

    if (filters?.status) {
      where.status = filters.status;
    }

    if (filters?.areaId) {
      where.areaAssignments = {
        some: {
          areaId: filters.areaId,
        },
      };
    }

    return await prisma.agent.findMany({
      where,
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
      orderBy: { createdAt: 'desc' },
    });
  }

  /**
   * Get agent by ID
   */
  async getAgentById(id: string) {
    return await prisma.agent.findUnique({
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
    });
  }

  /**
   * Get agent by user ID
   */
  async getAgentByUserId(userId: string) {
    return await prisma.agent.findUnique({
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
    });
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

    // This will create a transaction that needs approval
    // The actual balance update happens when transaction is approved
    return await prisma.transaction.create({
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
