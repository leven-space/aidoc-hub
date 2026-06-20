import type { Response } from 'express';

/**
 * User-uploaded HTML previews run inside a sandboxed iframe.
 * Helmet's default CSP blocks inline scripts, event handlers, and CDN assets.
 */
export function applyPreviewResponseHeaders(res: Response) {
  res.removeHeader('Content-Security-Policy');
  res.removeHeader('Cross-Origin-Embedder-Policy');
  res.removeHeader('Cross-Origin-Resource-Policy');
}
