/**
 * Appended to transaction description when operator confirms below-minimum withdrawal/transfer.
 */
export const MIN_BALANCE_ACK_MARKER = '[Minimum balance rule acknowledged by operator]';

/**
 * Structured errors for transaction creation (API can map to HTTP status + JSON code).
 */
export class MinBalanceViolationError extends Error {
  readonly code = 'MIN_BALANCE_WARNING' as const;

  constructor(
    message: string,
    public readonly details: { minBalance: number; projectedBalance: number }
  ) {
    super(message);
    this.name = 'MinBalanceViolationError';
  }
}

export function isMinBalanceViolationError(e: unknown): e is MinBalanceViolationError {
  return e instanceof MinBalanceViolationError;
}
