import { createElementLocator, getHtmlSnippet, queryElementByLocator } from './dom-utils';
import { createOverlay, type ReviewOverlay } from './overlay';
import { getEditableTarget, isLargeContainer } from './selection';

const MESSAGE_SOURCE = 'aidoc-hub-review';

type ParentMessage =
  | {
      source: string;
      type: 'HIGHLIGHT_ANNOTATION';
      payload: { annotationId: string; cssPath: string; nthOfTypePath?: string };
    }
  | { source: string; type: 'CLEAR_HIGHLIGHT'; payload?: undefined }
  | { source: string; type: 'SET_MODE'; payload: { active: boolean } };

declare global {
  interface Window {
    __AIDOC_REVIEW_PARENT_ORIGIN__?: string;
  }
}

function getParentOrigin(): string {
  const configured = window.__AIDOC_REVIEW_PARENT_ORIGIN__;
  if (configured) {
    return configured;
  }
  try {
    if (document.referrer) {
      return new URL(document.referrer).origin;
    }
  } catch {
    // ignore
  }
  return window.location.origin;
}

function isTrustedParentOrigin(origin: string): boolean {
  const expected = getParentOrigin();
  return origin === expected || origin === 'null';
}

function postToParent(message: Record<string, unknown>): void {
  const targetOrigin = getParentOrigin();
  if (window.parent && window.parent !== window) {
    window.parent.postMessage({ source: MESSAGE_SOURCE, ...message }, targetOrigin);
  }
}

function toPayloadLocator(locator: ReturnType<typeof createElementLocator>) {
  return {
    descriptor: locator.descriptor,
    cssPath: locator.cssPath,
    nthOfTypePath: locator.nthOfTypePath,
    slideContext: locator.slideContext,
  };
}

function bootstrap(): void {
  let active = true;
  let overlay: ReviewOverlay | null = null;
  let hoveredElement: HTMLElement | null = null;
  let selectedElement: HTMLElement | null = null;
  let highlightElement: HTMLElement | null = null;

  function ensureOverlay(): ReviewOverlay {
    if (!overlay) {
      overlay = createOverlay();
    }
    return overlay;
  }

  function refreshOutlines(): void {
    const o = ensureOverlay();
    o.updateHover(selectedElement ? null : hoveredElement);
    o.updateSelected(highlightElement ?? selectedElement);
  }

  function handleMouseMove(event: MouseEvent): void {
    if (!active) return;
    const target = getEditableTarget(event.target, selectedElement);
    if (target === hoveredElement) return;
    hoveredElement = target;
    refreshOutlines();
  }

  function handleClick(event: MouseEvent): void {
    if (!active) return;

    // Hold Alt to interact with the page (links, buttons) without selecting.
    if (event.altKey) return;

    const target = getEditableTarget(event.target, selectedElement);
    if (!target) return;

    if (selectedElement === target && isLargeContainer(target)) {
      selectedElement = null;
      highlightElement = null;
      refreshOutlines();
      return;
    }

    event.preventDefault();
    event.stopPropagation();

    selectedElement = target;
    highlightElement = null;

    const locator = createElementLocator(target);
    const htmlSnippet = getHtmlSnippet(target);

    postToParent({
      type: 'ELEMENT_SELECTED',
      payload: {
        locator: toPayloadLocator(locator),
        htmlSnippet,
      },
    });

    refreshOutlines();
  }

  function handleScrollOrResize(): void {
    refreshOutlines();
  }

  function handleParentMessage(event: MessageEvent): void {
    const data = event.data as ParentMessage | undefined;
    if (!data || data.source !== MESSAGE_SOURCE) return;
    if (!isTrustedParentOrigin(event.origin)) return;

    if (data.type === 'SET_MODE') {
      active = data.payload.active;
      if (!active) {
        hoveredElement = null;
        selectedElement = null;
        highlightElement = null;
        refreshOutlines();
      }
      return;
    }

    if (data.type === 'CLEAR_HIGHLIGHT') {
      highlightElement = null;
      refreshOutlines();
      return;
    }

    if (data.type === 'HIGHLIGHT_ANNOTATION') {
      highlightElement = queryElementByLocator(
        data.payload.cssPath,
        data.payload.nthOfTypePath,
      );
      refreshOutlines();
    }
  }

  document.addEventListener('mousemove', handleMouseMove, true);
  document.addEventListener('click', handleClick, true);
  document.addEventListener('scroll', handleScrollOrResize, true);
  window.addEventListener('scroll', handleScrollOrResize, true);
  window.addEventListener('resize', handleScrollOrResize);
  window.addEventListener('message', handleParentMessage);

  ensureOverlay();
  postToParent({ type: 'BRIDGE_READY' });
}

if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', bootstrap);
} else {
  bootstrap();
}
