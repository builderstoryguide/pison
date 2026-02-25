/**
 * Push Notification Service
 * Sends browser push notifications to users with transactions.approve permission
 * when new transactions are pending approval.
 */

import webpush from 'web-push';
import { prisma } from '@/lib/prisma';

const TRANSACTIONS_APPROVE_SLUG = 'transactions.approve';

export class PushNotificationService {
  private initialized = false;

  private ensureInitialized() {
    if (this.initialized) return;

    const publicKey = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY;
    const privateKey = process.env.VAPID_PRIVATE_KEY;

    if (!publicKey || !privateKey) {
      return;
    }

    webpush.setVapidDetails(
      'mailto:support@dcm.local',
      publicKey,
      privateKey
    );
    this.initialized = true;
  }

  /**
   * Get user IDs who have transactions.approve permission
   * (Manager/Administrator roles or roles with explicit permission)
   */
  async getUsersWithApprovePermission(): Promise<string[]> {
    const permission = await prisma.userPermission.findUnique({
      where: { slug: TRANSACTIONS_APPROVE_SLUG },
      select: { id: true },
    });

    if (!permission) return [];

    const roleIdsWithPermission = await prisma.userRolePermission.findMany({
      where: { permissionId: permission.id },
      select: { roleId: true },
    });
    const roleIds = roleIdsWithPermission.map((r) => r.roleId);

    const managerRoles = await prisma.userRole.findMany({
      where: {
        OR: [
          { slug: { contains: 'manager', mode: 'insensitive' } },
          { slug: { contains: 'administrator', mode: 'insensitive' } },
          { name: { contains: 'Manager', mode: 'insensitive' } },
          { name: { contains: 'Administrator', mode: 'insensitive' } },
        ],
      },
      select: { id: true },
    });
    const managerRoleIds = managerRoles.map((r) => r.id);

    const allRoleIds = [...new Set([...roleIds, ...managerRoleIds])];
    if (allRoleIds.length === 0) return [];

    const users = await prisma.user.findMany({
      where: {
        roleId: { in: allRoleIds },
        status: 'ACTIVE',
      },
      select: { id: true },
    });

    return users.map((u) => u.id);
  }

  /**
   * Get push subscriptions for given user IDs
   */
  async getSubscriptionsForUsers(userIds: string[]) {
    if (userIds.length === 0) return [];

    return prisma.pushSubscription.findMany({
      where: { userId: { in: userIds } },
    });
  }

  /**
   * Remove invalid/expired subscription from DB
   */
  private async removeSubscription(id: string) {
    try {
      await prisma.pushSubscription.delete({ where: { id } });
    } catch {
      // Ignore
    }
  }

  /**
   * Send pending transaction notification to all approvers with push subscriptions
   */
  async sendPendingTransactionNotification(count: number, _transactionId?: string) {
    this.ensureInitialized();
    if (!this.initialized) return;

    const userIds = await this.getUsersWithApprovePermission();
    if (userIds.length === 0) return;

    const subscriptions = await this.getSubscriptionsForUsers(userIds);
    if (subscriptions.length === 0) return;

    const payload = JSON.stringify({
      title: 'Pending Transactions',
      body: count === 1
        ? '1 new transaction requires your approval'
        : `${count} new transactions require your approval`,
      url: '/validation/pending',
    });

    await Promise.allSettled(
      subscriptions.map(async (sub) => {
        const pushSubscription = {
          endpoint: sub.endpoint,
          keys: {
            auth: sub.auth,
            p256dh: sub.p256dh,
          },
        };

        try {
          await webpush.sendNotification(pushSubscription, payload);
        } catch (err: unknown) {
          const status = (err as { statusCode?: number })?.statusCode;
          if (status === 410 || status === 404) {
            await this.removeSubscription(sub.id);
          }
          throw err;
        }
      })
    );
  }
}

export const pushNotificationService = new PushNotificationService();
