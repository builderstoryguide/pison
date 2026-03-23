/**
 * Account Nature System Seed Data
 * Run with: npx tsx prisma/seed-account-natures.ts
 * Or as part of: npm run seed:microfinance (if integrated)
 */

import { PrismaClient } from '@prisma/client';
import { PrismaPg } from '@prisma/adapter-pg';
import pg from 'pg';
import dotenv from 'dotenv';

dotenv.config();

const pool = new pg.Pool({ connectionString: process.env.DATABASE_URL });
const adapter = new PrismaPg(pool);
const prisma = new PrismaClient({ adapter });

const ACCOUNT_NATURES = [
  {
    code: 'DAILY_COLLECTION',
    name: 'Daily Collection Account',
    description: 'Daily collection with minimum contribution',
    minBalance: 500,
    minOpeningContribution: 500,
    interestRateDefault: null,
    interestRateMin: null,
    interestRateMax: null,
    interestRateNegotiable: false,
    maintenanceFee: null,
    maintenanceFeeType: null,
    transactionFee: null,
    transactionFeeVariable: false,
    openingFee: null,
    isBlocked: false,
    blockedDurationMonths: null,
    minTermMonths: null,
    allowDeposit: true,
    allowWithdrawal: true,
    allowTransfer: true,
    sortOrder: 1,
  },
  {
    code: 'ORDINARY_SAVINGS',
    name: 'Ordinary Savings Account',
    description: 'Standard savings with 4% annual interest',
    minBalance: 10000,
    minOpeningContribution: null,
    interestRateDefault: 0.04,
    interestRateMin: null,
    interestRateMax: null,
    interestRateNegotiable: false,
    maintenanceFee: null,
    maintenanceFeeType: null,
    transactionFee: null,
    transactionFeeVariable: false,
    openingFee: null,
    isBlocked: false,
    blockedDurationMonths: null,
    minTermMonths: null,
    allowDeposit: true,
    allowWithdrawal: true,
    allowTransfer: true,
    sortOrder: 2,
  },
  {
    code: 'BLOCKED_SAVINGS',
    name: 'Blocked Savings Account',
    description: 'Funds blocked for minimum 1 year, 6-10% interest',
    minBalance: 10000,
    minOpeningContribution: null,
    interestRateDefault: null,
    interestRateMin: 0.06,
    interestRateMax: 0.1,
    interestRateNegotiable: false,
    maintenanceFee: 5000,
    maintenanceFeeType: 'INITIAL',
    transactionFee: null,
    transactionFeeVariable: false,
    openingFee: null,
    isBlocked: true,
    blockedDurationMonths: 12,
    minTermMonths: null,
    allowDeposit: true,
    allowWithdrawal: false,
    allowTransfer: false,
    sortOrder: 3,
  },
  {
    code: 'JUNIOR_STUDENT_SAVINGS',
    name: 'Junior/Student Savings Account',
    description: 'For pupils and students, no maintenance fees',
    minBalance: 1000,
    minOpeningContribution: null,
    interestRateDefault: null,
    interestRateMin: null,
    interestRateMax: null,
    interestRateNegotiable: false,
    maintenanceFee: null,
    maintenanceFeeType: null,
    transactionFee: null,
    transactionFeeVariable: false,
    openingFee: 2000,
    isBlocked: false,
    blockedDurationMonths: null,
    minTermMonths: null,
    allowDeposit: true,
    allowWithdrawal: true,
    allowTransfer: true,
    sortOrder: 4,
  },
  {
    code: 'CHEQUE',
    name: 'Cheque Account',
    description: 'Professional account with cheque book',
    minBalance: 10000,
    minOpeningContribution: null,
    interestRateDefault: null,
    interestRateMin: null,
    interestRateMax: null,
    interestRateNegotiable: false,
    maintenanceFee: 1000,
    maintenanceFeeType: 'MONTHLY',
    transactionFee: 100,
    transactionFeeVariable: true,
    openingFee: null,
    isBlocked: false,
    blockedDurationMonths: null,
    minTermMonths: null,
    allowDeposit: true,
    allowWithdrawal: true,
    allowTransfer: true,
    sortOrder: 5,
  },
  {
    code: 'CURRENT',
    name: 'Current Account',
    description: 'Standard current account',
    minBalance: 10000,
    minOpeningContribution: null,
    interestRateDefault: null,
    interestRateMin: null,
    interestRateMax: null,
    interestRateNegotiable: false,
    maintenanceFee: 1000,
    maintenanceFeeType: 'MONTHLY',
    transactionFee: 100,
    transactionFeeVariable: true,
    openingFee: null,
    isBlocked: false,
    blockedDurationMonths: null,
    minTermMonths: null,
    allowDeposit: true,
    allowWithdrawal: true,
    allowTransfer: true,
    sortOrder: 6,
  },
  {
    code: 'CORPORATE_CURRENT',
    name: 'Corporate Current Account',
    description: 'Business current account',
    minBalance: 10000,
    minOpeningContribution: null,
    interestRateDefault: null,
    interestRateMin: null,
    interestRateMax: null,
    interestRateNegotiable: false,
    maintenanceFee: 2000,
    maintenanceFeeType: 'MONTHLY',
    transactionFee: 100,
    transactionFeeVariable: true,
    openingFee: null,
    isBlocked: false,
    blockedDurationMonths: null,
    minTermMonths: null,
    allowDeposit: true,
    allowWithdrawal: true,
    allowTransfer: true,
    sortOrder: 7,
  },
  {
    code: 'ASSOCIATION_CURRENT',
    name: 'Association Current Account',
    description: 'Association account with higher minimum',
    minBalance: 20000,
    minOpeningContribution: null,
    interestRateDefault: null,
    interestRateMin: null,
    interestRateMax: null,
    interestRateNegotiable: false,
    maintenanceFee: 2000,
    maintenanceFeeType: 'MONTHLY',
    transactionFee: 100,
    transactionFeeVariable: true,
    openingFee: null,
    isBlocked: false,
    blockedDurationMonths: null,
    minTermMonths: null,
    allowDeposit: true,
    allowWithdrawal: true,
    allowTransfer: true,
    sortOrder: 8,
  },
  {
    code: 'SALARY_TRANSFER',
    name: 'Salary Transfer Account',
    description: 'For salary deposits',
    minBalance: null,
    minOpeningContribution: null,
    interestRateDefault: null,
    interestRateMin: null,
    interestRateMax: null,
    interestRateNegotiable: false,
    maintenanceFee: 1000,
    maintenanceFeeType: 'MONTHLY',
    transactionFee: null,
    transactionFeeVariable: false,
    openingFee: null,
    isBlocked: false,
    blockedDurationMonths: null,
    minTermMonths: null,
    allowDeposit: true,
    allowWithdrawal: true,
    allowTransfer: true,
    sortOrder: 9,
  },
  {
    code: 'CASH_CERTIFICATE',
    name: 'Cash Certificate',
    description: 'Fixed-term investment, negotiable interest',
    minBalance: null,
    minOpeningContribution: null,
    interestRateDefault: null,
    interestRateMin: null,
    interestRateMax: null,
    interestRateNegotiable: true,
    maintenanceFee: null,
    maintenanceFeeType: null,
    transactionFee: null,
    transactionFeeVariable: false,
    openingFee: null,
    isBlocked: false,
    blockedDurationMonths: null,
    minTermMonths: 6,
    allowDeposit: true,
    allowWithdrawal: false,
    allowTransfer: false,
    sortOrder: 10,
  },
  {
    code: 'FIXED_DEPOSIT',
    name: 'Fixed Deposit',
    description: 'Fixed-term investment, negotiable interest',
    minBalance: null,
    minOpeningContribution: null,
    interestRateDefault: null,
    interestRateMin: null,
    interestRateMax: null,
    interestRateNegotiable: true,
    maintenanceFee: null,
    maintenanceFeeType: null,
    transactionFee: null,
    transactionFeeVariable: false,
    openingFee: null,
    isBlocked: false,
    blockedDurationMonths: null,
    minTermMonths: 6,
    allowDeposit: true,
    allowWithdrawal: false,
    allowTransfer: false,
    sortOrder: 11,
  },
  {
    code: 'GREEN_CREDIT',
    name: 'Green Credit (Microcredit)',
    description: 'Short-term microcredit for daily collection clients',
    minBalance: 0,
    minOpeningContribution: null,
    interestRateDefault: 0.1,
    interestRateMin: null,
    interestRateMax: null,
    interestRateNegotiable: false,
    maintenanceFee: null,
    maintenanceFeeType: null,
    transactionFee: null,
    transactionFeeVariable: false,
    openingFee: null,
    isBlocked: false,
    blockedDurationMonths: null,
    minTermMonths: null,
    allowDeposit: true,
    allowWithdrawal: true,
    allowTransfer: true,
    sortOrder: 12,
  },
];

const DOCUMENT_TYPES = [
  { code: 'NATIONAL_ID', name: 'Valid National ID' },
  { code: 'PASSPORT_PHOTOS', name: '2 Passport Photos' },
  { code: 'LOCATION_MAP', name: 'Location Map' },
  { code: 'TAXPAYER_NUI', name: 'Taxpayer ID (NUI)' },
  { code: 'PROOF_OF_SCHOOLING', name: 'Proof of Schooling' },
  { code: 'STUDENT_CARD', name: 'Student Card' },
  { code: 'ACCOUNT_AGREEMENT', name: 'Signed Account Agreement' },
  { code: 'COMPANY_STATUTES', name: 'Company Statutes' },
  { code: 'BUSINESS_REGISTRATION', name: 'Business Registration Certificate' },
  { code: 'SIGNATORIES_IDS', name: 'Valid IDs of Signatories' },
  { code: 'ASSOCIATION_STATUTES', name: 'Association Statutes' },
  { code: 'GENERAL_ASSEMBLY_MINUTES', name: 'General Assembly Minutes' },
  { code: 'LAST_PAYSLIPS', name: 'Last 3 Payslips' },
];

async function main() {
  console.log('🌱 Seeding account nature system...\n');

  // 1. Seed Document Types
  console.log('1. Creating document types...');
  const docTypeIds: Record<string, string> = {};
  for (const dt of DOCUMENT_TYPES) {
    const created = await prisma.documentType.upsert({
      where: { code: dt.code },
      update: { name: dt.name },
      create: dt,
    });
    docTypeIds[dt.code] = created.id;
  }
  console.log(`   ✅ ${DOCUMENT_TYPES.length} document types created\n`);

  // 2. Seed Account Natures
  console.log('2. Creating account natures...');
  const natureIds: Record<string, string> = {};
  for (const an of ACCOUNT_NATURES) {
    const created = await prisma.accountNature.upsert({
      where: { code: an.code },
      update: {
        name: an.name,
        description: an.description,
        minBalance: an.minBalance,
        minOpeningContribution: an.minOpeningContribution,
        interestRateDefault: an.interestRateDefault,
        interestRateMin: an.interestRateMin,
        interestRateMax: an.interestRateMax,
        interestRateNegotiable: an.interestRateNegotiable,
        maintenanceFee: an.maintenanceFee,
        maintenanceFeeType: an.maintenanceFeeType,
        transactionFee: an.transactionFee,
        transactionFeeVariable: an.transactionFeeVariable,
        openingFee: an.openingFee,
        isBlocked: an.isBlocked,
        blockedDurationMonths: an.blockedDurationMonths,
        minTermMonths: an.minTermMonths,
        allowDeposit: an.allowDeposit,
        allowWithdrawal: an.allowWithdrawal,
        allowTransfer: an.allowTransfer,
        sortOrder: an.sortOrder,
      },
      create: an as any,
    });
    natureIds[an.code] = created.id;
  }
  console.log(`   ✅ ${ACCOUNT_NATURES.length} account natures created\n`);

  // 3. Seed AccountNatureDocument (required docs per nature)
  console.log('3. Creating account nature document requirements...');
  const docRequirements: Array<{ natureCode: string; docCodes: string[] }> = [
    { natureCode: 'DAILY_COLLECTION', docCodes: ['NATIONAL_ID'] },
    { natureCode: 'ORDINARY_SAVINGS', docCodes: ['NATIONAL_ID', 'PASSPORT_PHOTOS', 'LOCATION_MAP', 'TAXPAYER_NUI'] },
    { natureCode: 'BLOCKED_SAVINGS', docCodes: ['NATIONAL_ID', 'PASSPORT_PHOTOS', 'LOCATION_MAP', 'TAXPAYER_NUI', 'ACCOUNT_AGREEMENT'] },
    { natureCode: 'JUNIOR_STUDENT_SAVINGS', docCodes: ['NATIONAL_ID', 'STUDENT_CARD', 'PASSPORT_PHOTOS', 'PROOF_OF_SCHOOLING'] },
    { natureCode: 'CHEQUE', docCodes: ['NATIONAL_ID', 'PASSPORT_PHOTOS', 'LOCATION_MAP', 'TAXPAYER_NUI'] },
    { natureCode: 'CURRENT', docCodes: ['NATIONAL_ID', 'PASSPORT_PHOTOS', 'LOCATION_MAP', 'TAXPAYER_NUI'] },
    { natureCode: 'CORPORATE_CURRENT', docCodes: ['COMPANY_STATUTES', 'BUSINESS_REGISTRATION', 'SIGNATORIES_IDS'] },
    { natureCode: 'ASSOCIATION_CURRENT', docCodes: ['ASSOCIATION_STATUTES', 'GENERAL_ASSEMBLY_MINUTES', 'SIGNATORIES_IDS', 'PASSPORT_PHOTOS', 'LOCATION_MAP', 'TAXPAYER_NUI'] },
    { natureCode: 'SALARY_TRANSFER', docCodes: ['NATIONAL_ID', 'PASSPORT_PHOTOS', 'LOCATION_MAP', 'TAXPAYER_NUI', 'LAST_PAYSLIPS'] },
    { natureCode: 'CASH_CERTIFICATE', docCodes: [] },
    { natureCode: 'FIXED_DEPOSIT', docCodes: [] },
    { natureCode: 'GREEN_CREDIT', docCodes: ['NATIONAL_ID'] },
  ];

  for (const req of docRequirements) {
    const natureId = natureIds[req.natureCode];
    for (const docCode of req.docCodes) {
      const docTypeId = docTypeIds[docCode];
      if (natureId && docTypeId) {
        await prisma.accountNatureDocument.upsert({
          where: {
            accountNatureId_documentTypeId: { accountNatureId: natureId, documentTypeId: docTypeId },
          },
          update: {},
          create: {
            accountNatureId: natureId,
            documentTypeId: docTypeId,
            isRequired: true,
          },
        });
      }
    }
  }
  console.log('   ✅ Document requirements created\n');

  // 4. Seed Loan Product (Green Credit)
  console.log('4. Creating loan product (Green Credit)...');
  await prisma.loanProduct.upsert({
    where: { code: 'GREEN_CREDIT' },
    update: {},
    create: {
      code: 'GREEN_CREDIT',
      name: 'Green Credit (Microcredit)',
      maxAmount: 200000,
      maxDurationDays: 30,
      interestRate: 0.1,
      minDailyCollectionMonths: 1,
      isActive: true,
    },
  });
  console.log('   ✅ Green Credit loan product created\n');

  console.log('✅ Account nature system seed completed!\n');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
