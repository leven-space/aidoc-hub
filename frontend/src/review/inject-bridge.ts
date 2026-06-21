const BRIDGE_SCRIPT_MARKER = 'data-aidoc-review-bridge';

/**
 * Injects the review bridge script into HTML before </body>.
 * Uses an absolute script URL so srcDoc iframes can load it from the app origin.
 */
export function injectReviewBridge(
  html: string,
  bridgeScriptUrl: string,
  parentOrigin: string,
): string {
  const safeOrigin = parentOrigin.replace(/"/g, '\\"');
  const configScript = `<script>window.__AIDOC_REVIEW_PARENT_ORIGIN__="${safeOrigin}";</script>`;
  const scriptTag = `<script src="${bridgeScriptUrl}" ${BRIDGE_SCRIPT_MARKER}="true"></script>`;
  const injection = `${configScript}\n${scriptTag}`;

  if (html.includes(BRIDGE_SCRIPT_MARKER)) {
    return html;
  }

  const bodyClose = /<\/body>/i;
  if (bodyClose.test(html)) {
    return html.replace(bodyClose, `${injection}\n</body>`);
  }

  const htmlClose = /<\/html>/i;
  if (htmlClose.test(html)) {
    return html.replace(htmlClose, `${injection}\n</html>`);
  }

  return `${html}\n${injection}`;
}

export function getReviewBridgeScriptUrl(origin: string): string {
  const base = origin.replace(/\/$/, '');
  return `${base}/review-bridge.js`;
}
