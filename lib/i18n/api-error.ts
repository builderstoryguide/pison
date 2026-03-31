import type { TFunction } from 'i18next';

export type ApiErrorPayload = {
  error?: {
    code?: string;
    message?: string;
  };
};

const CODE_PREFIX = 'errors.codes.';

/**
 * Returns a user-facing message for API JSON error bodies.
 * When `error.code` matches a key under `errors.codes` in i18n messages, that translation is used.
 * Otherwise falls back to `error.message` (often English from the server).
 */
export function getTranslatedApiErrorMessage(
  payload: ApiErrorPayload | null | undefined,
  t: TFunction,
  fallbackKey?: string,
): string {
  const code = payload?.error?.code;
  const message = payload?.error?.message;

  if (code) {
    const key = `${CODE_PREFIX}${code}`;
    const translated = t(key);
    if (translated !== key) {
      return translated;
    }
  }

  if (message && message.trim()) {
    return message;
  }

  if (fallbackKey) {
    return t(fallbackKey);
  }

  return t('common.messages.error');
}
