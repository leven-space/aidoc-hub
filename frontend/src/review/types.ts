export type ReviewAction = 'modify';

export type ElementLocator = {
  descriptor: string;
  cssPath: string;
  nthOfTypePath?: string;
  slideContext?: string;
};

export type ReviewAnnotation = {
  id: string;
  action: ReviewAction;
  userNote: string;
  locator: ElementLocator;
  htmlSnippet?: string;
  createdAt: number;
};

export type ReviewContext = {
  workspaceId: string;
  repoId: string;
  repoName: string;
  filePath: string;
  versionOid?: string;
  versionLabel?: string;
  commitMessage?: string;
};

export type PendingSelection = {
  locator: ElementLocator;
  htmlSnippet?: string;
};
