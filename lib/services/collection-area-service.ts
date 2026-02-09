/**
 * Collection Area Service
 * Handles all business logic for collection areas (zones)
 */

import { prisma } from '@/lib/prisma';
import { Prisma } from '@prisma/client';

export interface CreateAreaInput {
  code: string;
  name: string;
  description?: string;
  city?: string;
  region?: string;
}

export interface UpdateAreaInput {
  name?: string;
  description?: string;
  city?: string;
  region?: string;
  status?: 'ACTIVE' | 'INACTIVE';
}

export class CollectionAreaService {
  /**
   * Create a new collection area
   */
  async createArea(data: CreateAreaInput, userId: string) {
    // Check if code already exists
    const existing = await prisma.collectionArea.findUnique({
      where: { code: data.code },
    });

    if (existing) {
      throw new Error(`Collection area with code "${data.code}" already exists`);
    }

    return await prisma.collectionArea.create({
      data: {
        ...data,
        createdBy: userId,
        updatedBy: userId,
      },
    });
  }

  /**
   * Update an existing collection area
   */
  async updateArea(id: string, data: UpdateAreaInput, userId: string) {
    const area = await prisma.collectionArea.findUnique({ where: { id } });

    if (!area) {
      throw new Error('Collection area not found');
    }

    return await prisma.collectionArea.update({
      where: { id },
      data: {
        ...data,
        updatedBy: userId,
      },
    });
  }

  /**
   * Get all collection areas with optional filters
   */
  async getAllAreas(filters?: {
    status?: 'ACTIVE' | 'INACTIVE';
    city?: string;
    region?: string;
  }) {
    const where: Prisma.CollectionAreaWhereInput = {};

    if (filters?.status) {
      where.status = filters.status;
    }
    if (filters?.city) {
      where.city = filters.city;
    }
    if (filters?.region) {
      where.region = filters.region;
    }

    return await prisma.collectionArea.findMany({
      where,
      orderBy: { createdAt: 'desc' },
      include: {
        _count: {
          select: {
            clients: true,
            agentAssignments: true,
            transactions: true,
          },
        },
      },
    });
  }

  /**
   * Get a single collection area by ID
   */
  async getAreaById(id: string) {
    return await prisma.collectionArea.findUnique({
      where: { id },
      include: {
        clients: {
          select: {
            id: true,
            clientNumber: true,
            fullName: true,
            status: true,
          },
        },
        agentAssignments: {
          include: {
            agent: {
              select: {
                id: true,
                agentCode: true,
                fullName: true,
                status: true,
              },
            },
          },
        },
        _count: {
          select: {
            clients: true,
            agentAssignments: true,
            transactions: true,
          },
        },
      },
    });
  }

  /**
   * Get area by code
   */
  async getAreaByCode(code: string) {
    return await prisma.collectionArea.findUnique({
      where: { code },
    });
  }

  /**
   * Deactivate a collection area
   */
  async deactivateArea(id: string, userId: string) {
    return await this.updateArea(id, { status: 'INACTIVE' }, userId);
  }

  /**
   * Activate a collection area
   */
  async activateArea(id: string, userId: string) {
    return await this.updateArea(id, { status: 'ACTIVE' }, userId);
  }
}

export const collectionAreaService = new CollectionAreaService();
