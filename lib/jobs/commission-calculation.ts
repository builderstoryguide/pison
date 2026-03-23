import { commissionService } from '@/lib/services';

/**
 * Job: Calculate monthly commissions
 * Should be scheduled to run at the end of each month
 * @param period - Format: "YYYY-MM"
 * @param triggeredBy - User ID of who triggered it (or system ID)
 */
export async function calculateMonthlyCommissions(period: string, triggeredBy: string = 'SYSTEM'): Promise<void> {
  console.log(`Starting commission calculation for period ${period}...`);
  try {
    const commissions = await commissionService.createCommissionsForPeriod(period, triggeredBy);
    console.log(`Successfully processed ${commissions.length} commissions for ${period}.`);
  } catch (error) {
    console.error(`Error calculating commissions for ${period}:`, error);
    throw error;
  }
}
