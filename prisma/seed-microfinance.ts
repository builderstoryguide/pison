/**
 * Microfinance System Seed Data
 * Run with: npx tsx prisma/seed-microfinance.ts
 */

import { PrismaClient } from '@prisma/client';
import { PrismaPg } from '@prisma/adapter-pg';
import pg from 'pg';
import bcrypt from 'bcrypt';
import dotenv from 'dotenv';

dotenv.config();

// Initialize Prisma Client with Adapter (same as lib/prisma.ts)
const pool = new pg.Pool({ connectionString: process.env.DATABASE_URL });
const adapter = new PrismaPg(pool);
const prisma = new PrismaClient({ adapter });

async function main() {
  console.log('🌱 Seeding microfinance data...\n');

  try {
    // 1. Create User Roles (if they don't exist)
    console.log('1. Creating user roles...');
    const managerRole = await prisma.userRole.upsert({
      where: { slug: 'manager' },
      update: {},
      create: {
        slug: 'manager',
        name: 'Manager',
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

    // 2. Create Microfinance Permissions and assign to roles
    console.log('2. Creating microfinance permissions...');
    const microfinancePermissions = [
      { slug: 'dashboard.view', name: 'View Dashboard', description: 'Access and view the dashboard' },
      { slug: 'clients.view', name: 'View Clients', description: 'View client list and details' },
      { slug: 'clients.create', name: 'Create Clients', description: 'Create new clients' },
      { slug: 'clients.edit', name: 'Edit Clients', description: 'Edit client details' },
      { slug: 'clients.delete', name: 'Deactivate Clients', description: 'Deactivate client accounts' },
      { slug: 'agents.view', name: 'View Agents', description: 'View agent list and details' },
      { slug: 'agents.create', name: 'Create Agents', description: 'Create new agents' },
      { slug: 'agents.edit', name: 'Edit Agents', description: 'Edit agent details' },
      { slug: 'collection_areas.view', name: 'View Collection Areas', description: 'View collection zones' },
      { slug: 'collection_areas.manage', name: 'Manage Collection Areas', description: 'Create, edit, and deactivate collection zones' },
      { slug: 'collections.create', name: 'Enter Collections', description: 'Enter daily collection amounts (ventilation)' },
      { slug: 'transactions.view', name: 'View Transactions', description: 'View transaction history' },
      { slug: 'transactions.create', name: 'Create Transactions', description: 'Create deposit and withdrawal transactions for client accounts' },
      { slug: 'transactions.approve', name: 'Approve Transactions', description: 'Approve pending transactions' },
      { slug: 'loans.view', name: 'View Loans', description: 'View loan list and details' },
      { slug: 'loans.create', name: 'Create Loans', description: 'Create loan requests' },
      { slug: 'loans.repayment', name: 'Record Loan Repayments', description: 'Record loan repayment transactions' },
      { slug: 'loans.approve', name: 'Approve Loans', description: 'Approve or reject loan requests' },
      { slug: 'reports.view', name: 'View Reports', description: 'View financial and operational reports' },
      { slug: 'reports.export', name: 'Export Reports', description: 'Export reports to file' },
      { slug: 'session.manage', name: 'Manage Session', description: 'Open and close daily session' },
      { slug: 'day_closure.manage', name: 'Manage Day Closure', description: 'Close accounting day' },
      { slug: 'users.manage', name: 'Manage Users', description: 'Create, edit, and manage user accounts' },
      { slug: 'roles.manage', name: 'Manage Roles', description: 'Assign permissions to roles' },
      { slug: 'settings.manage', name: 'Manage Settings', description: 'Configure system settings' },
    ];

    const createdPermissions: Record<string, string> = {};
    for (const perm of microfinancePermissions) {
      const p = await prisma.userPermission.upsert({
        where: { slug: perm.slug },
        update: {},
        create: {
          slug: perm.slug,
          name: perm.name,
          description: perm.description,
        },
      });
      createdPermissions[perm.slug] = p.id;
    }
    console.log(`   ✅ ${microfinancePermissions.length} permissions created\n`);

    // Assign permissions to roles (Manager can later modify via Roles UI)
    console.log('3. Assigning default permissions to roles...');

    // Manager: full access
    const allPermissionIds = Object.values(createdPermissions);
    for (const permId of allPermissionIds) {
      await prisma.userRolePermission.upsert({
        where: {
          roleId_permissionId: { roleId: managerRole.id, permissionId: permId },
        },
        update: {},
        create: { roleId: managerRole.id, permissionId: permId },
      });
    }

    // Accountant: clients, agents, collections, transactions, loans (no approve), reports
    const accountantPermSlugs = [
      'dashboard.view', 'clients.view', 'clients.create', 'clients.edit',
      'agents.view', 'agents.create', 'agents.edit', 'collection_areas.view',
      'collections.create', 'transactions.view', 'transactions.create', 'loans.view', 'loans.create', 'loans.repayment',
      'reports.view', 'reports.export',
    ];
    for (const slug of accountantPermSlugs) {
      const permId = createdPermissions[slug];
      if (permId) {
        await prisma.userRolePermission.upsert({
          where: {
            roleId_permissionId: { roleId: accountantRole.id, permissionId: permId },
          },
          update: {},
          create: { roleId: accountantRole.id, permissionId: permId },
        });
      }
    }

    // Agent: limited to collections and assigned clients
    const agentPermSlugs = [
      'dashboard.view', 'clients.view', 'collection_areas.view',
      'collections.create', 'transactions.view', 'loans.view', 'loans.repayment', 'reports.view',
    ];
    for (const slug of agentPermSlugs) {
      const permId = createdPermissions[slug];
      if (permId) {
        await prisma.userRolePermission.upsert({
          where: {
            roleId_permissionId: { roleId: agentRole.id, permissionId: permId },
          },
          update: {},
          create: { roleId: agentRole.id, permissionId: permId },
        });
      }
    }
    console.log('   ✅ Default permissions assigned to roles\n');

    // 4. Create Manager User
    console.log('4. Creating manager user...');
    const managerPassword = await bcrypt.hash('admin123', 12);
    const managerUser = await prisma.user.upsert({
      where: { email: 'admin@dcm.local' },
      update: {},
      create: {
        email: 'admin@dcm.local',
        name: 'System Manager',
        password: managerPassword,
        roleId: managerRole.id,
        status: 'ACTIVE',
        emailVerifiedAt: new Date(),
      },
    });
    console.log('   ✅ Manager user created\n');

    // 5. Create Accountant User
    console.log('5. Creating accountant user...');
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

    // 6. Create Collection Areas (Zones)
    console.log('6. Creating collection areas...');
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
        createdBy: managerUser.id,
        updatedBy: managerUser.id,
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
        createdBy: managerUser.id,
        updatedBy: managerUser.id,
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
        createdBy: managerUser.id,
        updatedBy: managerUser.id,
      },
    });
    console.log('   ✅ Collection areas created\n');

    // 7. Create Agent Users and Agents
    console.log('7. Creating agent users and agents...');
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
        createdBy: managerUser.id,
        updatedBy: managerUser.id,
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
        assignedBy: managerUser.id,
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
        assignedBy: managerUser.id,
      },
    });

    console.log('   ✅ Agent 1 created and assigned to zones\n');

    // 8. Create Sample Clients
    console.log('8. Creating sample clients...');
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

    // 9. Open today's session
    console.log('9. Opening today\'s session...');
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    await prisma.dailySession.upsert({
      where: { sessionDate: today },
      update: {},
      create: {
        sessionDate: today,
        status: 'OPEN',
        openedBy: managerUser.id,
      },
    });
    console.log('   ✅ Today\'s session opened\n');

    console.log('✅ Seed data created successfully!\n');
    console.log('📋 Login Credentials:');
    console.log('   Manager:    admin@dcm.local / admin123');
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
