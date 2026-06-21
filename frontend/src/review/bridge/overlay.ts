const STYLE_ID = 'aidoc-review-style';
const ROOT_ID = 'aidoc-review-overlay-root';

export type ReviewOverlay = {
  root: HTMLDivElement;
  hoverOutline: HTMLDivElement;
  selectOutline: HTMLDivElement;
  destroy: () => void;
  updateHover: (target: HTMLElement | null) => void;
  updateSelected: (target: HTMLElement | null) => void;
};

export function createOverlay(): ReviewOverlay {
  injectBaseStyles();

  const root = document.createElement('div');
  root.id = ROOT_ID;
  root.dataset.aidocReview = 'true';

  const hoverOutline = document.createElement('div');
  hoverOutline.className = 'aidoc-review-outline aidoc-review-outline--hover';
  hoverOutline.dataset.aidocReview = 'true';

  const selectOutline = document.createElement('div');
  selectOutline.className = 'aidoc-review-outline aidoc-review-outline--selected';
  selectOutline.dataset.aidocReview = 'true';

  root.append(hoverOutline, selectOutline);
  document.documentElement.append(root);

  return {
    root,
    hoverOutline,
    selectOutline,
    destroy: () => {
      root.remove();
      document.getElementById(STYLE_ID)?.remove();
    },
    updateHover: (target) => updateOutline(hoverOutline, target),
    updateSelected: (target) => updateOutline(selectOutline, target),
  };
}

function updateOutline(outline: HTMLDivElement, target: HTMLElement | null): void {
  if (!target) {
    outline.style.display = 'none';
    return;
  }

  const rect = target.getBoundingClientRect();
  outline.style.display = 'block';
  outline.style.left = `${rect.left}px`;
  outline.style.top = `${rect.top}px`;
  outline.style.width = `${rect.width}px`;
  outline.style.height = `${rect.height}px`;
}

function injectBaseStyles(): void {
  if (document.getElementById(STYLE_ID)) {
    return;
  }

  const style = document.createElement('style');
  style.id = STYLE_ID;
  style.dataset.aidocReview = 'true';
  style.textContent = `
    #${ROOT_ID} {
      position: fixed;
      inset: 0;
      z-index: 2147483646;
      pointer-events: none;
    }

    .aidoc-review-outline {
      position: fixed;
      display: none;
      border-radius: 4px;
      pointer-events: none;
      box-sizing: border-box;
    }

    .aidoc-review-outline--hover {
      border: 2px dashed #1677ff;
      background: rgba(22, 119, 255, 0.06);
    }

    .aidoc-review-outline--selected {
      border: 2px solid #1677ff;
      box-shadow: 0 0 0 3px rgba(22, 119, 255, 0.2);
    }
  `;
  document.documentElement.append(style);
}
