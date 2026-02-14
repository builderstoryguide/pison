/**
 * Client Service
 * Handles all business logic for clients
 */

import { prisma } from '@/lib/prisma';
import { Prisma } from '@prisma/client';

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
}

export class ClientService {
  /**
   * Generate unique client number
   */
  private async generateClientNumber(): Promise<string> {
    const date = new Date();
    const dateStr = date.toISOString().slice(0, 10).replace(/-/g, '');
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
    const date = new Date();
    const dateStr = date.toISOString().slice(0, 10).replace(/-/g, '');
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
   * Create a new client
   */
  async createClient(data: CreateClientInput, createdBy: string) {
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

    return await prisma.$transaction(async (tx) => {
      // Generate client number and account number
      const clientNumber = await this.generateClientNumber();
      const accountNumber = await this.generateAccountNumber();

      // Create financial account
      const account = await tx.financialAccount.create({
        data: {
          accountNumber,
          accountType: 'CLIENT',
          balance: 0,
          availableBalance: 0,
          status: 'ACTIVE',
        },
      });

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
          createdBy,
          updatedBy: createdBy,
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

    return await prisma.client.update({
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
  }

  /**
   * Get all clients with optional filters
   */
  async getAllClients(filters?: {
    status?: 'ACTIVE' | 'INACTIVE' | 'SUSPENDED' | 'CLOSED';
    areaId?: string;
    agentId?: string;
    search?: string; // Search by name, client number, phone, email
  }) {
    const where: Prisma.ClientWhereInput = {};

    if (filters?.status) {
      where.status = filters.status;
    }

    if (filters?.areaId) {
      where.areaId = filters.areaId;
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

    return await prisma.client.findMany({
      where,
      include: {
        area: {
          select: {
            id: true,
            code: true,
            name: true,
          },
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
        assignedAgent: {
          select: {
            id: true,
            fullName: true,
            agentCode: true,
          }
        },
        _count: {
          select: {
            transactions: true,
            loans: true,
          },
        },
      },
      orderBy: { createdAt: 'desc' },
    });
  }

  /**
   * Get client by ID
   */
  async getClientById(id: string) {
    return await prisma.client.findUnique({
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
    });
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
  async getClientsByArea(areaId: string) {
    return await prisma.client.findMany({
      where: {
        areaId,
        status: 'ACTIVE',
      },
      include: {
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
          }
        },
      },
      orderBy: { fullName: 'asc' },
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
          closedAt: new Date(),
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
