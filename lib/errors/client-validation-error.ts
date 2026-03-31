import type { ValidationError } from '@/lib/services/account-nature-service';

export class ClientCreationValidationError extends Error {
  readonly code = 'CLIENT_ACCOUNT_VALIDATION' as const;

  constructor(public readonly details: ValidationError[]) {
    super(details.map((d) => d.message).join('\n'));
    this.name = 'ClientCreationValidationError';
  }
}

export function isClientCreationValidationError(e: unknown): e is ClientCreationValidationError {
  return e instanceof ClientCreationValidationError;
}
