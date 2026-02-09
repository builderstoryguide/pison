/**
 * Microfinance System Seed Data
 * Run with: npx tsx prisma/seed-microfinance.ts
 */

import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcrypt';

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Seeding microfinance data...\n');

  try {
    // 1. Create User Roles (if they don't exist)
    console.log('1. Creating user roles...');
    const adminRole = await prisma.userRole.upsert({
      where: { slug: 'administrator' },
      update: {},
      create: {
        slug: 'administrator',
        name: 'Administrator',
        description: 'Full system access with transaction approval authority',
        isProtected: true,
      },
    });

    const accountantRole = await prisma.userRole.upsert({
      where: { slug: 'accountant' },
      update: {},
      create: {
        slug: 'accountant',
        name: 'Accountant',
        description: 'Financial operations and client management',
        isProtected: true,
      },
    });

    const agentRole = await prisma.userRole.upsert({
      where: { slug: 'agent' },
      update: {},
      create: {
        slug: 'agent',
        name: 'Collection Agent',
        description: 'Daily collection operations within assigned areas',
        isProtected: true,
      },
    });

    console.log('   ✅ User roles created\n');

    // 2. Create Admin User
    console.log('2. Creating admin user...');
    const adminPassword = await bcrypt.hash('admin123', 12);
    const adminUser = await prisma.user.upsert({
      where: { email: 'admin@dcm.local' },
      update: {},
      create: {
        email: 'admin@dcm.local',
        name: 'System Administrator',
        password: adminPassword,
        roleId: adminRole.id,
        status: 'ACTIVE',
        emailVerifiedAt: new Date(),
      },
    });
    console.log('   ✅ Admin user created\n');

    // 3. Create Accountant User
    console.log('3. Creating accountant user...');
    const accountantPassword = await bcrypt.hash('accountant123', 12);
    const accountantUser = await prisma.user.upsert({
      where: { email: 'accountant@dcm.local' },
      update: {},
      create: {
        email: 'accountant@dcm.local',
        name: 'Accountant User',
        password: accountantPassword,
        roleId: accountantRole.id,
        status: 'ACTIVE',
        emailVerifiedAt: new Date(),
      },
    });
    console.log('   ✅ Accountant user created\n');

    // 4. Create Collection Areas (Zones)
    console.log('4. Creating collection areas...');
    const area1 = await prisma.collectionArea.upsert({
      where: { code: 'ZONE-A' },
      update: {},
      create: {
        code: 'ZONE-A',
        name: 'Zone A - Central District',
        description: 'Central business district collection area',
        city: 'Yaounde',
        region: 'Centre',
        status: 'ACTIVE',
        createdBy: adminUser.id,
        updatedBy: adminUser.id,
      },
    });

    const area2 = await prisma.collectionArea.upsert({
      where: { code: 'ZONE-B' },
      update: {},
      create: {
        code: 'ZONE-B',
        name: 'Zone B - Northern Suburbs',
        description: 'Northern suburbs collection area',
        city: 'Yaounde',
        region: 'Centre',
        status: 'ACTIVE',
        createdBy: adminUser.id,
        updatedBy: adminUser.id,
      },
    });

    const area3 = await prisma.collectionArea.upsert({
      where: { code: 'ZONE-C' },
      update: {},
      create: {
        code: 'ZONE-C',
        name: 'Zone C - Southern Suburbs',
        description: 'Southern suburbs collection area',
        city: 'Yaounde',
        region: 'Centre',
        status: 'ACTIVE',
        createdBy: adminUser.id,
        updatedBy: adminUser.id,
      },
    });
    console.log('   ✅ Collection areas created\n');

    // 5. Create Agent Users and Agents
    console.log('5. Creating agent users and agents...');
    const agent1Password = await bcrypt.hash('agent123', 12);
    const agent1User = await prisma.user.upsert({
      where: { email: 'agent1@dcm.local' },
      update: {},
      create: {
        email: 'agent1@dcm.local',
        name: 'Marie Martin',
        password: agent1Password,
        roleId: agentRole.id,
        status: 'ACTIVE',
        emailVerifiedAt: new Date(),
      },
    });

    // Create agent account
    const agent1AccountNumber = `ACC-AGT-${new Date().toISOString().slice(0, 10).replace(/-/g, '')}-001`;
    const agent1Account = await prisma.financialAccount.upsert({
      where: { accountNumber: agent1AccountNumber },
      update: {},
      create: {
        accountNumber: agent1AccountNumber,
        accountType: 'AGENT',
        balance: 0,
        availableBalance: 0,
        status: 'ACTIVE',
      },
    });

    const agent1 = await prisma.agent.upsert({
      where: { agentCode: 'AGT-20260208-001' },
      update: {},
      create: {
        agentCode: 'AGT-20260208-001',
        userId: agent1User.id,
        fullName: 'Marie Martin',
        phone: '+237 612 345 678',
        email: 'agent1@dcm.local',
        accountId: agent1Account.id,
        status: 'ACTIVE',
        hireDate: new Date('2024-01-15'),
        createdBy: adminUser.id,
        updatedBy: adminUser.id,
      },
    });

    // Assign areas to agent
    await prisma.agentAreaAssignment.upsert({
      where: {
        agentId_areaId: {
          agentId: agent1.id,
          areaId: area1.id,
        },
      },
      update: {},
      create: {
        agentId: agent1.id,
        areaId: area1.id,
        isPrimary: true,
        assignedBy: adminUser.id,
      },
    });

    await prisma.agentAreaAssignment.upsert({
      where: {
        agentId_areaId: {
          agentId: agent1.id,
          areaId: area2.id,
        },
      },
      update: {},
      create: {
        agentId: agent1.id,
        areaId: area2.id,
        isPrimary: false,
        assignedBy: adminUser.id,
      },
    });

    console.log('   ✅ Agent 1 created and assigned to zones\n');

    // 6. Create Sample Clients
    console.log('6. Creating sample clients...');
    const clients = [
      {
        fullName: 'Jean Dupont',
        nationalId: '1234567890123',
        phone: '+237 677 123 456',
        email: 'jean.dupont@example.com',
        address: '123 Main Street',
        city: 'Yaounde',
        areaId: area1.id,
        isCommissionExempt: false,
      },
      {
        fullName: 'Sophie Laurent',
        nationalId: '1234567890124',
        phone: '+237 677 123 457',
        email: 'sophie.laurent@example.com',
        address: '456 Oak Avenue',
        city: 'Yaounde',
        areaId: area1.id,
        isCommissionExempt: false,
      },
      {
        fullName: 'Paul Bernard',
        nationalId: '1234567890125',
        phone: '+237 677 123 458',
        email: 'paul.bernard@example.com',
        address: '789 Pine Road',
        city: 'Yaounde',
        areaId: area2.id,
        isCommissionExempt: true, // Commission exempt
      },
      {
        fullName: 'Marie Dubois',
        nationalId: '1234567890126',
        phone: '+237 677 123 459',
        email: 'marie.dubois@example.com',
        address: '321 Elm Street',
        city: 'Yaounde',
        areaId: area2.id,
        isCommissionExempt: false,
      },
      {
        fullName: 'Pierre Moreau',
        nationalId: '1234567890127',
        phone: '+237 677 123 460',
        email: 'pierre.moreau@example.com',
        address: '654 Maple Drive',
        city: 'Yaounde',
        areaId: area3.id,
        isCommissionExempt: false,
      },
    ];

    let clientIndex = 1;
    for (const clientData of clients) {
      const dateStr = new Date().toISOString().slice(0, 10).replace(/-/g, '');
      const accountNumber = `ACC-CLT-${dateStr}-${clientIndex.toString().padStart(3, '0')}`;
      const clientNumber = `CLT-${dateStr}-${clientIndex.toString().padStart(3, '0')}`;

      // Create account
      const account = await prisma.financialAccount.upsert({
        where: { accountNumber },
        update: {},
        create: {
          accountNumber,
          accountType: 'CLIENT',
          balance: 0,
          availableBalance: 0,
          status: 'ACTIVE',
        },
      });

      // Create client
      await prisma.client.upsert({
        where: { clientNumber },
        update: {},
        create: {
          clientNumber,
          fullName: clientData.fullName,
          nationalId: clientData.nationalId,
          phone: clientData.phone,
          email: clientData.email,
          address: clientData.address,
          city: clientData.city,
          areaId: clientData.areaId,
          accountId: account.id,
          isCommissionExempt: clientData.isCommissionExempt,
          createdBy: accountantUser.id,
          updatedBy: accountantUser.id,
        },
      });
      clientIndex++;
    }
    console.log('   ✅ Sample clients created\n');

    // 7. Open today's session
    console.log('7. Opening today\'s session...');
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    await prisma.dailySession.upsert({
      where: { sessionDate: today },
      update: {},
      create: {
        sessionDate: today,
        status: 'OPEN',
        openedBy: adminUser.id,
      },
    });
    console.log('   ✅ Today\'s session opened\n');

    console.log('✅ Seed data created successfully!\n');
    console.log('📋 Login Credentials:');
    console.log('   Admin:      admin@dcm.local / admin123');
    console.log('   Accountant: accountant@dcm.local / accountant123');
    console.log('   Agent:      agent1@dcm.local / agent123');
  } catch (error) {
    console.error('❌ Error seeding data:', error);
    throw error;
  }
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
