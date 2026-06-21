import type { ElementLocator } from './types';

export const REVIEW_MESSAGE_SOURCE = 'aidoc-hub-review' as const;

export const ReviewMessageType = {
  BRIDGE_READY: 'BRIDGE_READY',
  ELEMENT_SELECTED: 'ELEMENT_SELECTED',
  HIGHLIGHT_ANNOTATION: 'HIGHLIGHT_ANNOTATION',
  CLEAR_HIGHLIGHT: 'CLEAR_HIGHLIGHT',
  SET_MODE: 'SET_MODE',
} as const;

export type BridgeReadyMessage = {
  source: typeof REVIEW_MESSAGE_SOURCE;
  type: typeof ReviewMessageType.BRIDGE_READY;
};

export type ElementSelectedMessage = {
  source: typeof REVIEW_MESSAGE_SOURCE;
  type: typeof ReviewMessageType.ELEMENT_SELECTED;
  payload: {
    locator: ElementLocator;
    htmlSnippet?: string;
  };
};

export type HighlightAnnotationMessage = {
  source: typeof REVIEW_MESSAGE_SOURCE;
  type: typeof ReviewMessageType.HIGHLIGHT_ANNOTATION;
  payload: {
    annotationId: string;
    cssPath: string;
    nthOfTypePath?: string;
  };
};

export type ClearHighlightMessage = {
  source: typeof REVIEW_MESSAGE_SOURCE;
  type: typeof ReviewMessageType.CLEAR_HIGHLIGHT;
};

export type SetModeMessage = {
  source: typeof REVIEW_MESSAGE_SOURCE;
  type: typeof ReviewMessageType.SET_MODE;
  payload: {
    active: boolean;
  };
};

export type ShellToBridgeMessage =
  | HighlightAnnotationMessage
  | ClearHighlightMessage
  | SetModeMessage;

export type BridgeToShellMessage = BridgeReadyMessage | ElementSelectedMessage;

export type ReviewMessage = ShellToBridgeMessage | BridgeToShellMessage;

export function isTrustedReviewOrigin(origin: string, expectedOrigin: string): boolean {
  // srcDoc iframes may report origin as "null" in some browsers.
  return origin === expectedOrigin || origin === 'null';
}

function isElementLocator(value: unknown): value is ElementLocator {
  if (!value || typeof value !== 'object') return false;
  const loc = value as Record<string, unknown>;
  return typeof loc.descriptor === 'string' && typeof loc.cssPath === 'string';
}

export function parseBridgeToShellMessage(data: unknown): BridgeToShellMessage | null {
  if (!data || typeof data !== 'object') return null;
  const msg = data as Record<string, unknown>;
  if (msg.source !== REVIEW_MESSAGE_SOURCE || typeof msg.type !== 'string') return null;

  if (msg.type === ReviewMessageType.BRIDGE_READY) {
    return { source: REVIEW_MESSAGE_SOURCE, type: ReviewMessageType.BRIDGE_READY };
  }

  if (msg.type === ReviewMessageType.ELEMENT_SELECTED) {
    const payload = msg.payload;
    if (!payload || typeof payload !== 'object') return null;
    const p = payload as Record<string, unknown>;
    if (!isElementLocator(p.locator)) return null;
    return {
      source: REVIEW_MESSAGE_SOURCE,
      type: ReviewMessageType.ELEMENT_SELECTED,
      payload: {
        locator: p.locator,
        htmlSnippet: typeof p.htmlSnippet === 'string' ? p.htmlSnippet : undefined,
      },
    };
  }

  return null;
}

/** @deprecated Use parseBridgeToShellMessage for inbound iframe messages */
export function isReviewMessage(data: unknown): data is ReviewMessage {
  return parseBridgeToShellMessage(data) !== null;
}

export function postToBridge(
  iframe: HTMLIFrameElement | null,
  message: ShellToBridgeMessage,
  targetOrigin: string,
): void {
  iframe?.contentWindow?.postMessage(message, targetOrigin);
}
