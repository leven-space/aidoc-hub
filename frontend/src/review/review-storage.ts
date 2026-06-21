import type { ReviewAnnotation } from './types';

export function getReviewStorageKey(
  workspaceId: string,
  repoId: string,
  filePath: string,
  versionOid?: string,
): string {
  return `aidoc-review:${workspaceId}:${repoId}:${filePath}:${versionOid ?? 'latest'}`;
}

function isValidAnnotation(value: unknown): value is ReviewAnnotation {
  if (!value || typeof value !== 'object') return false;
  const item = value as Record<string, unknown>;
  if (typeof item.id !== 'string' || typeof item.userNote !== 'string') return false;
  if (item.action !== 'modify') return false;
  const locator = item.locator;
  if (!locator || typeof locator !== 'object') return false;
  const loc = locator as Record<string, unknown>;
  return typeof loc.descriptor === 'string' && typeof loc.cssPath === 'string';
}

export function loadReviewAnnotations(key: string): ReviewAnnotation[] {
  if (typeof sessionStorage === 'undefined') return [];
  try {
    const raw = sessionStorage.getItem(key);
    if (!raw) return [];
    const parsed: unknown = JSON.parse(raw);
    if (!Array.isArray(parsed)) return [];
    return parsed.filter(isValidAnnotation);
  } catch {
    return [];
  }
}

export function saveReviewAnnotations(key: string, annotations: ReviewAnnotation[]): void {
  if (typeof sessionStorage === 'undefined') return;
  try {
    if (annotations.length === 0) {
      sessionStorage.removeItem(key);
      return;
    }
    sessionStorage.setItem(key, JSON.stringify(annotations));
  } catch {
    // ignore quota / private mode errors
  }
}
