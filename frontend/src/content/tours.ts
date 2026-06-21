import type { TourProps } from 'antd';

type TourPlacement = NonNullable<TourProps['steps']>[number]['placement'];

export interface TourStepDef {
  titleKey: string;
  descriptionKey: string;
  targetSelector: string;
  placement?: TourPlacement;
}

export interface TourDef {
  id: string;
  /** 若设置，Tour 仅在该路由下启动 */
  routePattern?: RegExp;
  /** 写入 localStorage 的完成标记后缀；不设则每次可重复查看 */
  storageKey?: string;
  steps: TourStepDef[];
}

export const TOURS: Record<string, TourDef> = {
  onboarding: {
    id: 'onboarding',
    storageKey: 'onboarding',
    steps: [
      {
        titleKey: 'tour.workspaceTitle',
        descriptionKey: 'tour.workspaceDesc',
        targetSelector: '[data-tour="nav-workspaces"]',
      },
      {
        titleKey: 'tour.searchTitle',
        descriptionKey: 'tour.searchDesc',
        targetSelector: '[data-tour="global-search"]',
      },
      {
        titleKey: 'tour.tokenTitle',
        descriptionKey: 'tour.tokenDesc',
        targetSelector: '[data-tour="nav-tokens"]',
      },
      {
        titleKey: 'tour.mcpTitle',
        descriptionKey: 'tour.mcpDesc',
        targetSelector: '[data-tour="nav-mcp"]',
      },
      {
        titleKey: 'tour.helpTitle',
        descriptionKey: 'tour.helpDesc',
        targetSelector: '[data-tour="help-button"]',
      },
    ],
  },
  review: {
    id: 'review',
    routePattern: /\/review$/,
    steps: [
      {
        titleKey: 'featureTour.review.previewTitle',
        descriptionKey: 'featureTour.review.previewDesc',
        targetSelector: '[data-tour="review-preview"]',
        placement: 'left',
      },
      {
        titleKey: 'featureTour.review.annotationsTitle',
        descriptionKey: 'featureTour.review.annotationsDesc',
        targetSelector: '[data-tour="review-annotations"]',
        placement: 'right',
      },
      {
        titleKey: 'featureTour.review.copyTitle',
        descriptionKey: 'featureTour.review.copyDesc',
        targetSelector: '[data-tour="review-copy"]',
        placement: 'bottom',
      },
    ],
  },
};

export const START_TOUR_EVENT = 'aidoc-hub:start-tour';

export function startFeatureTour(tourId: string) {
  window.dispatchEvent(
    new CustomEvent(START_TOUR_EVENT, { detail: { tourId } }),
  );
}
