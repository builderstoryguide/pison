import 'dotenv/config';
import { prisma } from '../lib/prisma';

const ALLOWED_AGENT_PERMISSIONS = [
  'dashboard.view',
  'clients.view',
  'collection_areas.view',
  'collections.create',
  'transactions.view',
] as const;

async function main() {
  const roleByNameOrSlug = await prisma.userRole.findMany({
    where: {
      OR: [
        { slug: { contains: 'agent', mode: 'insensitive' } },
        { slug: { contains: 'collector', mode: 'insensitive' } },
        { name: { contains: 'agent', mode: 'insensitive' } },
        { name: { contains: 'collector', mode: 'insensitive' } },
      ],
    },
    select: { id: true, slug: true, name: true },
  });

  const rolesFromAgentUsers = await prisma.agent.findMany({
    select: {
      user: {
        select: {
          role: { select: { id: true, slug: true, name: true } },
        },
      },
    },
  });

  const roleMap = new Map<string, { id: string; slug: string; name: string }>();
  for (const role of roleByNameOrSlug) {
    roleMap.set(role.id, role);
  }
  for (const row of rolesFromAgentUsers) {
    if (row.user?.role?.id) {
      roleMap.set(row.user.role.id, row.user.role);
    }
  }

  if (roleMap.size === 0) {
    const heuristicRoles = await prisma.userRole.findMany({
      where: {
        permissions: {
          some: { permission: { slug: 'collections.create' } },
        },
        AND: [
          { permissions: { some: { permission: { slug: 'transactions.view' } } } },
          { permissions: { none: { permission: { slug: 'transactions.create' } } } },
          { permissions: { none: { permission: { slug: 'loans.create' } } } },
          { permissions: { none: { permission: { slug: 'roles.manage' } } } },
          { permissions: { none: { permission: { slug: 'users.manage' } } } },
        ],
      },
      select: { id: true, slug: true, name: true },
    });

    for (const role of heuristicRoles) {
      roleMap.set(role.id, role);
    }
  }

  const agentRoles = Array.from(roleMap.values());
  if (agentRoles.length === 0) {
    throw new Error('No Agent/Collector-like role was found (including roles assigned to Agent records)');
  }

  const allowedPermissions = await prisma.userPermission.findMany({
    where: { slug: { in: [...ALLOWED_AGENT_PERMISSIONS] } },
    select: { id: true, slug: true },
  });

  const allowedPermissionIds = allowedPermissions.map((p) => p.id);
  if (allowedPermissionIds.length === 0) {
    throw new Error('No allowed Agent permissions were found in the database');
  }

  for (const agentRole of agentRoles) {
    const deleteResult = await prisma.userRolePermission.deleteMany({
      where: {
        roleId: agentRole.id,
        permissionId: { notIn: allowedPermissionIds },
      },
    });

    const finalPermissions = await prisma.userRolePermission.findMany({
      where: { roleId: agentRole.id },
      include: { permission: { select: { slug: true } } },
      orderBy: { assignedAt: 'asc' },
    });

    console.log('Agent role synchronized:', agentRole.name ?? agentRole.slug);
    console.log('Removed permission mappings:', deleteResult.count);
    console.log(
      'Current Agent permissions:',
      finalPermissions
        .map((rp) => rp.permission?.slug)
        .filter(Boolean)
        .join(', ')
    );
  }
  console.log(
    'IMPORTANT: ask all agent users to sign out and sign back in so JWT permissions are refreshed.'
  );
}

main()
  .catch((error) => {
    console.error('Failed to sync Agent role permissions:', error);
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
