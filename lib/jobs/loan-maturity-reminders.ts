import { prisma } from '@/lib/prisma';
import { sendEmail } from '@/services/send-email';

const LOAN_APPROVE_PERMISSION = 'loans.approve';

function utcTodayStart(now: Date) {
  return new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate()));
}

function addUtcDays(d: Date, days: number) {
  const x = new Date(d);
  x.setUTCDate(x.getUTCDate() + days);
  return x;
}

type LoanRow = {
  loanNumber: string;
  clientName: string;
  remainingBalance: string;
  maturityDate: Date;
};

function formatReminderLines(loans: LoanRow[]): string {
  return loans
    .map((loan) => {
      const dueDate = loan.maturityDate.toISOString().slice(0, 10);
      return `- ${loan.loanNumber} | ${loan.clientName} | Remaining: ${loan.remainingBalance} XAF | Due: ${dueDate}`;
    })
    .join('\n');
}

async function fetchLoansInMaturityWindow(from: Date, to: Date) {
  return prisma.loan.findMany({
    where: {
      status: { in: ['DISBURSED', 'ACTIVE'] },
      maturityDate: { gte: from, lte: to },
      remainingBalance: { gt: 0 },
    },
    select: {
      loanNumber: true,
      remainingBalance: true,
      maturityDate: true,
      client: { select: { fullName: true } },
    },
    orderBy: [{ maturityDate: 'asc' }, { loanNumber: 'asc' }],
  });
}

function normalize(
  loans: Awaited<ReturnType<typeof fetchLoansInMaturityWindow>>,
  fallback: Date
): LoanRow[] {
  return loans.map((loan) => ({
    loanNumber: loan.loanNumber,
    clientName: loan.client.fullName,
    remainingBalance: loan.remainingBalance.toFixed(2),
    maturityDate: loan.maturityDate ?? fallback,
  }));
}

/**
 * Daily job: email loan approvers with unpaid loans in 1d / 2–7d / 8–14d windows; optional web push digest.
 */
export async function sendLoanMaturityReminders(): Promise<{
  recipients: number;
  totalLoans: number;
  urgentCount: number;
}> {
  const now = new Date();
  const todayStartUtc = utcTodayStart(now);
  const day1End = addUtcDays(todayStartUtc, 1);
  const day7End = addUtcDays(todayStartUtc, 7);
  const day14End = addUtcDays(todayStartUtc, 14);
  const day2Start = addUtcDays(todayStartUtc, 2);
  const day8Start = addUtcDays(todayStartUtc, 8);

  const [within1Day, within2to7, within8to14, managerRecipients] = await Promise.all([
    fetchLoansInMaturityWindow(todayStartUtc, day1End),
    fetchLoansInMaturityWindow(day2Start, day7End),
    fetchLoansInMaturityWindow(day8Start, day14End),
    prisma.user.findMany({
      where: {
        status: 'ACTIVE',
        role: {
          permissions: {
            some: {
              permission: { slug: LOAN_APPROVE_PERMISSION },
            },
          },
        },
      },
      select: { email: true, name: true },
    }),
  ]);

  const n1 = normalize(within1Day, todayStartUtc);
  const n2 = normalize(within2to7, todayStartUtc);
  const n3 = normalize(within8to14, todayStartUtc);
  const totalLoans = n1.length + n2.length + n3.length;

  if (totalLoans === 0 || managerRecipients.length === 0) {
    return { recipients: managerRecipients.length, totalLoans, urgentCount: n1.length };
  }

  const blocks: string[] = [];
  if (n1.length > 0) {
    blocks.push(
      'Due within 1 day (urgent):\n' + formatReminderLines(n1),
      ''
    );
  }
  if (n2.length > 0) {
    blocks.push('Due in 2–7 days:\n' + formatReminderLines(n2), '');
  }
  if (n3.length > 0) {
    blocks.push('Due in 8–14 days:\n' + formatReminderLines(n3), '');
  }

  const details = blocks.join('\n').trim();
  const subject = `Loan repayment reminder: ${totalLoans} unpaid loan(s) approaching maturity`;

  await Promise.all(
    managerRecipients.map(async (recipient) => {
      const displayName = recipient.name || 'Manager';
      await sendEmail({
        to: recipient.email,
        subject,
        text: [
          `Hello ${displayName},`,
          '',
          'The following unpaid loans have approaching maturity dates:',
          '',
          details,
          '',
          'Please review and follow up as needed.',
        ].join('\n'),
        html: [
          '<div style="font-family: Arial, sans-serif; line-height: 1.5; color: #1f2937;">',
          `<p>Hello ${displayName},</p>`,
          '<p>The following unpaid loans have approaching maturity dates:</p>',
          '<pre style="background: #f9fafb; border: 1px solid #e5e7eb; padding: 12px; border-radius: 6px; white-space: pre-wrap;">',
          details,
          '</pre>',
          '<p>Please review and follow up as needed.</p>',
          '</div>',
        ].join(''),
      });
    })
  );

  try {
    const { pushNotificationService } = await import('@/lib/services/push-notification-service');
    await pushNotificationService.sendLoanMaturityDigest(totalLoans, n1.length);
  } catch (e) {
    console.error('[Loan reminders] push failed:', e);
  }

  return { recipients: managerRecipients.length, totalLoans, urgentCount: n1.length };
}
