import i18n from '../i18n';

export function getApiErrorMessage(err: unknown, fallbackKey = 'common.requestFailed'): string {
  if (err instanceof Error && err.message) {
    return err.message;
  }
  return i18n.t(fallbackKey);
}
