export type BridgeElementLocator = {
  descriptor: string;
  tagName: string;
  cssPath: string;
  nthOfTypePath: string;
  textSnippet?: string;
  slideContext?: string;
};

export function describeElement(element: HTMLElement): string {
  const id = element.id ? `#${element.id}` : '';
  const className =
    typeof element.className === 'string' && element.className.trim()
      ? `.${element.className.trim().split(/\s+/).slice(0, 2).join('.')}`
      : '';
  return `${element.tagName.toLowerCase()}${id}${className}`;
}

export function isReviewUiElement(element: HTMLElement): boolean {
  return Boolean(element.closest("[data-aidoc-review='true']"));
}

export function createElementLocator(element: HTMLElement): BridgeElementLocator {
  const tagName = element.tagName.toLowerCase();
  const idHint = element.id ? `#${element.id}` : undefined;
  const classHint = pickStableClassHint(element);
  const textSnippet = pickTextSnippet(element);

  const descriptorParts = [tagName];
  if (idHint) descriptorParts.push(idHint);
  if (classHint) descriptorParts.push(classHint);
  if (textSnippet) descriptorParts.push(`"${textSnippet}"`);

  return {
    descriptor: descriptorParts.join(' '),
    tagName,
    cssPath: buildCssPath(element),
    nthOfTypePath: buildNthOfTypePath(element),
    textSnippet,
    slideContext: getSlideContext(element),
  };
}

export function getHtmlSnippet(element: HTMLElement): string | undefined {
  try {
    const clone = element.cloneNode(true) as HTMLElement;
    clone.querySelectorAll("[data-aidoc-review='true']").forEach((node) => node.remove());
    if (isReviewUiElement(clone)) return undefined;

    let outerHTML = clone.outerHTML;
    outerHTML = outerHTML.replace(/src="data:[^"]+"/g, 'src="[data URL hidden]"');

    const lines = outerHTML.split('\n');
    let snippet = lines.slice(0, 8).join('\n');
    if (snippet.length > 500) {
      snippet = `${snippet.slice(0, 500)}\n... (truncated)`;
    } else if (lines.length > 8) {
      snippet += '\n... (truncated)';
    }
    return snippet;
  } catch {
    return undefined;
  }
}

export function findFirstEditableDescendant(root: HTMLElement): HTMLElement | null {
  const walker = document.createTreeWalker(root, NodeFilter.SHOW_ELEMENT);
  let node = walker.nextNode();
  while (node) {
    const element = node as HTMLElement;
    if (!isReviewUiElement(element) && element !== document.body && element !== document.documentElement) {
      return element;
    }
    node = walker.nextNode();
  }
  return null;
}

export function isMeaningfulElement(element: HTMLElement): boolean {
  if (isReviewUiElement(element)) return false;

  const rect = element.getBoundingClientRect();
  if (rect.width === 0 || rect.height === 0) return false;

  try {
    const style = window.getComputedStyle(element);
    if (style.display === 'none' || style.visibility === 'hidden' || style.opacity === '0') {
      return false;
    }
  } catch {
    // ignore
  }

  const tagName = element.tagName.toLowerCase();
  if (
    ['img', 'video', 'svg', 'canvas', 'button', 'input', 'select', 'textarea', 'a', 'label'].includes(
      tagName,
    )
  ) {
    return true;
  }

  if (/^h[1-6]$/.test(tagName) || ['p', 'li', 'td', 'th'].includes(tagName)) {
    return true;
  }

  for (const child of Array.from(element.childNodes)) {
    if (child.nodeType === Node.TEXT_NODE && child.textContent && child.textContent.trim().length > 0) {
      return true;
    }
  }

  const className = typeof element.className === 'string' ? element.className.toLowerCase() : '';
  if (className.includes('card') || className.includes('btn') || className.includes('item')) {
    return true;
  }

  if (element.isContentEditable) return true;

  return false;
}

export function findMeaningfulDescendant(root: HTMLElement): HTMLElement | null {
  const walker = document.createTreeWalker(root, NodeFilter.SHOW_ELEMENT);
  let node = walker.nextNode();
  while (node) {
    const element = node as HTMLElement;
    if (isMeaningfulElement(element) && element !== document.body && element !== document.documentElement) {
      return element;
    }
    node = walker.nextNode();
  }
  return null;
}

export function getSlideContext(element: HTMLElement): string | undefined {
  const container = element.closest(
    'section, .slide, .page, [data-slide], [data-page], [aria-roledescription="slide"]',
  );
  if (!container || !(container instanceof HTMLElement)) {
    return undefined;
  }

  const dataSlide = container.getAttribute('data-slide');
  const dataPage = container.getAttribute('data-page');
  const ariaLabel = container.getAttribute('aria-label');
  const id = container.id;

  if (dataSlide) return `Slide ${dataSlide}`;
  if (dataPage) return `Page ${dataPage}`;
  if (ariaLabel) return ariaLabel;
  if (id) return `Slide #${id}`;

  const firstHeading = container.querySelector('h1, h2, h3');
  if (firstHeading && firstHeading.textContent?.trim()) {
    const headingText = firstHeading.textContent.trim();
    return `Slide "${headingText.length > 30 ? `${headingText.slice(0, 27)}...` : headingText}"`;
  }

  return describeElement(container);
}

export function queryElementByLocator(cssPath: string, nthOfTypePath?: string): HTMLElement | null {
  const candidates = [cssPath, nthOfTypePath].filter(
    (path): path is string => Boolean(path),
  );
  for (const path of candidates) {
    try {
      const el = document.querySelector(path);
      if (el instanceof HTMLElement) return el;
    } catch {
      // invalid selector
    }
  }
  return null;
}

/** @deprecated Use queryElementByLocator */
export function queryElementByCssPath(cssPath: string): HTMLElement | null {
  return queryElementByLocator(cssPath);
}

function pickTextSnippet(element: HTMLElement): string | undefined {
  const raw = (element.textContent ?? '').replace(/\s+/g, ' ').trim();
  if (!raw) return undefined;
  return raw.length > 80 ? `${raw.slice(0, 77)}...` : raw;
}

function pickStableClassHint(element: HTMLElement): string | undefined {
  const className = typeof element.className === 'string' ? element.className : '';
  const classes = className
    .split(/\s+/)
    .map((value) => value.trim())
    .filter(Boolean);

  for (const candidate of classes) {
    if (!isLikelyStableToken(candidate)) continue;
    return `.${candidate}`;
  }

  const fallback = classes[0];
  if (fallback && fallback.length <= 32) {
    return `.${fallback}`;
  }

  return undefined;
}

function isLikelyStableToken(value: string): boolean {
  if (value.length > 32) return false;
  if (looksLikeHash(value)) return false;
  if (/^\d+$/.test(value)) return false;
  return true;
}

function looksLikeHash(value: string): boolean {
  if (value.length >= 16 && /^[a-f0-9]+$/i.test(value)) return true;
  if (value.length >= 22 && /^[a-z0-9_-]+$/i.test(value)) return true;
  return false;
}

function buildCssPath(element: HTMLElement): string {
  const parts: string[] = [];
  let current: HTMLElement | null = element;
  while (current && current.tagName.toLowerCase() !== 'html') {
    if (current.id) {
      parts.push(`#${cssEscape(current.id)}`);
      break;
    }
    parts.push(simpleSelector(current));
    current = current.parentElement;
  }
  return parts.reverse().join(' > ') || simpleSelector(element);
}

function buildNthOfTypePath(element: HTMLElement): string {
  const parts: string[] = [];
  let current: HTMLElement | null = element;
  while (current && current.tagName.toLowerCase() !== 'html') {
    const tag = current.tagName.toLowerCase();
    parts.push(`${tag}:nth-of-type(${nthOfTypeIndex(current)})`);
    current = current.parentElement;
  }
  return parts.reverse().join(' > ');
}

function simpleSelector(element: HTMLElement): string {
  return `${element.tagName.toLowerCase()}:nth-of-type(${nthOfTypeIndex(element)})`;
}

function nthOfTypeIndex(element: HTMLElement): number {
  const parent = element.parentElement;
  if (!parent) return 1;
  const tag = element.tagName;
  const siblings = Array.from(parent.children).filter(
    (child) => (child as HTMLElement).tagName === tag,
  );
  const index = siblings.indexOf(element) + 1;
  return index > 0 ? index : 1;
}

function cssEscape(value: string): string {
  return value.replace(/([!"#$%&'()*+,./:;<=>?@[\\\]^`{|}~\s])/g, '\\$1');
}
