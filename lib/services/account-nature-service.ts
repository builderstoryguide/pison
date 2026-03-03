/**
 * Account Nature Service
 * Handles account nature config, validation, and fee lookups
 */

import { prisma } from '@/lib/prisma';

const DEFAULT_TRANSACTION_FEE_VARIABLE = 100; // XAF - default when transactionFeeVariable is true

export interface AccountNatureWithDocuments {
  id: string;
  code: string;
  name: string;
  description: string | null;
  minBalance: unknown;
  minOpeningContribution: unknown;
  interestRateDefault: unknown;
  interestRateMin: unknown;
  interestRateMax: unknown;
  interestRateNegotiable: boolean;
  maintenanceFee: unknown;
  maintenanceFeeType: string | null;
  transactionFee: unknown;
  transactionFeeVariable: boolean;
  openingFee: unknown;
  isBlocked: boolean;
  blockedDurationMonths: number | null;
  minTermMonths: number | null;
  allowDeposit: boolean;
  allowWithdrawal: boolean;
  allowTransfer: boolean;
  requiredDocuments: Array<{ documentType: { code: string; name: string } }>;
}

export interface ValidationError {
  field: string;
  message: string;
}

export class AccountNatureService {
  /**
   * Get all active account natures for dropdown
   */
  async getAllActive() {
    return prisma.accountNature.findMany({
      where: { isActive: true },
      orderBy: { sortOrder: 'asc' },
      select: {
        id: true,
        code: true,
        name: true,
        minBalance: true,
        minOpeningContribution: true,
        interestRateNegotiable: true,
        minTermMonths: true,
        isBlocked: true,
        blockedDurationMonths: true,
      },
    });
  }

  /**
   * Get account nature by ID with required documents
   */
  async getById(id: string): Promise<AccountNatureWithDocuments | null> {
    const nature = await prisma.accountNature.findUnique({
      where: { id },
      include: {
        requiredDocuments: {
          where: { isRequired: true },
          include: {
            documentType: { select: { code: true, name: true } },
          },
        },
      },
    });

    if (!nature) return null;

    return {
      ...nature,
      requiredDocuments: nature.requiredDocuments.map((rd) => ({
        documentType: rd.documentType,
      })),
    };
  }

  /**
   * Get account nature by code
   */
  async getByCode(code: string) {
    return prisma.accountNature.findUnique({
      where: { code, isActive: true },
      include: {
        requiredDocuments: {
          where: { isRequired: true },
          include: {
            documentType: { select: { code: true, name: true } },
          },
        },
      },
    });
  }

  /**
   * Validate account creation: documents and opening amount
   */
  async validateAccountCreation(
    natureId: string,
    documentsProvided: Record<string, boolean>,
    openingAmount?: number
  ): Promise<ValidationError[]> {
    const errors: ValidationError[] = [];
    const nature = await this.getById(natureId);

    if (!nature) {
      errors.push({ field: 'accountNatureId', message: 'Account nature not found' });
      return errors;
    }

    if (!nature.isActive) {
      errors.push({ field: 'accountNatureId', message: 'Account nature is not active' });
      return errors;
    }

    // Check required documents
    for (const rd of nature.requiredDocuments) {
      const docCode = rd.documentType.code;
      if (!documentsProvided[docCode]) {
        errors.push({
          field: `documentChecklist.${docCode}`,
          message: `${rd.documentType.name} is required`,
        });
      }
    }

    // Check opening amount
    const minOpening = nature.minOpeningContribution
      ? nature.minOpeningContribution.toNumber()
      : null;
    const minBalance = nature.minBalance ? nature.minBalance.toNumber() : null;
    const minRequired = minOpening ?? minBalance ?? 0;

    if (minRequired > 0) {
      if (openingAmount === undefined || openingAmount === null) {
        errors.push({
          field: 'openingAmount',
          message: `Minimum opening amount of ${minRequired} XAF is required`,
        });
      } else if (openingAmount < minRequired) {
        errors.push({
          field: 'openingAmount',
          message: `Opening amount must be at least ${minRequired} XAF`,
        });
      }
    }

    // For negotiable interest (Cash Certificate, Fixed Deposit), customInterestRate should be provided at creation
    // Validation of that happens in client form - we don't enforce it here as it could be set later

    return errors;
  }

  /**
   * Get transaction fee for withdrawal (XAF amount)
   */
  async getTransactionFee(natureId: string): Promise<number> {
    const nature = await prisma.accountNature.findUnique({
      where: { id: natureId },
    });

    if (!nature) return 0;

    if (nature.transactionFee && nature.transactionFee.toNumber() > 0) {
      return nature.transactionFee.toNumber();
    }

    if (nature.transactionFeeVariable) {
      return DEFAULT_TRANSACTION_FEE_VARIABLE;
    }

    return 0;
  }

  /**
   * Get minimum balance for account nature
   */
  async getMinBalance(natureId: string): Promise<number | null> {
    const nature = await prisma.accountNature.findUnique({
      where: { id: natureId },
    });

    if (!nature || !nature.minBalance) return null;
    return nature.minBalance.toNumber();
  }

  /**
   * Check if operation is allowed for account nature
   */
  async isOperationAllowed(
    natureId: string,
    operation: 'DEPOSIT' | 'WITHDRAWAL' | 'TRANSFER'
  ): Promise<boolean> {
    const nature = await prisma.accountNature.findUnique({
      where: { id: natureId },
    });

    if (!nature) return false;

    switch (operation) {
      case 'DEPOSIT':
        return nature.allowDeposit;
      case 'WITHDRAWAL':
        return nature.allowWithdrawal;
      case 'TRANSFER':
        return nature.allowTransfer;
      default:
        return false;
    }
  }
}

export const accountNatureService = new AccountNatureService();
