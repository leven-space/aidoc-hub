export type FeatureCategory = 'core' | 'collaboration' | 'ai' | 'admin';

export interface FeatureDef {
  id: string;
  category: FeatureCategory;
  /** i18n: features.{id}.title / features.{id}.desc */
  introducedIn: string;
  tourId?: string;
  /** 引导仅在该路由下可用 */
  routePattern?: RegExp;
  badge?: 'new';
}

export const FEATURES: FeatureDef[] = [
  {
    id: 'workspace',
    category: 'core',
    introducedIn: '1.0.0',
    tourId: 'onboarding',
  },
  {
    id: 'html-preview',
    category: 'core',
    introducedIn: '1.0.0',
  },
  {
    id: 'review',
    category: 'core',
    introducedIn: '1.0.0',
    tourId: 'review',
    routePattern: /\/review$/,
    badge: 'new',
  },
  {
    id: 'version-history',
    category: 'core',
    introducedIn: '1.0.0',
  },
  {
    id: 'upload',
    category: 'core',
    introducedIn: '1.0.0',
  },
  {
    id: 'share',
    category: 'collaboration',
    introducedIn: '1.0.0',
  },
  {
    id: 'search',
    category: 'collaboration',
    introducedIn: '1.0.0',
    tourId: 'onboarding',
  },
  {
    id: 'recycle',
    category: 'collaboration',
    introducedIn: '1.0.0',
  },
  {
    id: 'mcp',
    category: 'ai',
    introducedIn: '1.0.0',
    tourId: 'onboarding',
  },
  {
    id: 'token',
    category: 'ai',
    introducedIn: '1.0.0',
    tourId: 'onboarding',
  },
  {
    id: 'audit',
    category: 'admin',
    introducedIn: '1.0.0',
  },
];

export const FEATURE_CATEGORIES: FeatureCategory[] = [
  'core',
  'collaboration',
  'ai',
  'admin',
];
