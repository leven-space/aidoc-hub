import assert from 'node:assert/strict';
import { describe, it } from 'node:test';
import { buildReviewPrompt, truncateSnippet } from './prompt-builder.ts';
import type { ReviewAnnotation, ReviewContext } from './types.ts';

const baseContext: ReviewContext = {
  workspaceId: 'ws-1',
  repoId: 'repo-1',
  repoName: 'Demo Docs',
  filePath: 'index.html',
  versionLabel: 'v2',
  commitMessage: 'Update hero',
};

const sampleAnnotation: ReviewAnnotation = {
  id: 'ann-1',
  action: 'modify',
  userNote: 'Reduce title size',
  locator: {
    descriptor: 'h1.hero-title',
    cssPath: 'body > main > h1:nth-of-type(1)',
    slideContext: 'Slide 1',
  },
  htmlSnippet: '<h1 class="hero-title">Hello</h1>',
  createdAt: Date.now(),
};

describe('truncateSnippet', () => {
  it('returns undefined for empty input', () => {
    assert.equal(truncateSnippet(undefined), undefined);
  });

  it('truncates long snippets', () => {
    const long = 'x'.repeat(600);
    const result = truncateSnippet(long);
    assert.ok(result);
    assert.match(result, /truncated/);
    assert.ok(result.length <= 520);
  });
});

describe('buildReviewPrompt', () => {
  it('includes repo context and annotation details in Chinese', () => {
    const prompt = buildReviewPrompt([sampleAnnotation], baseContext, 'zh');
    assert.match(prompt, /AI Doc Hub 审阅修改建议/);
    assert.match(prompt, /Demo Docs/);
    assert.match(prompt, /index\.html/);
    assert.match(prompt, /h1\.hero-title/);
    assert.match(prompt, /Reduce title size/);
    assert.match(prompt, /workspaceId=ws-1/);
  });

  it('includes English labels when language is en', () => {
    const prompt = buildReviewPrompt([sampleAnnotation], baseContext, 'en');
    assert.match(prompt, /AI Doc Hub Review Change Request/);
    assert.match(prompt, /Change request: Reduce title size/);
  });

  it('numbers multiple annotations', () => {
    const second: ReviewAnnotation = {
      ...sampleAnnotation,
      id: 'ann-2',
      locator: { descriptor: 'p.lead', cssPath: 'body > p:nth-of-type(1)' },
      userNote: 'Soften spacing',
    };
    const prompt = buildReviewPrompt([sampleAnnotation, second], baseContext, 'en');
    assert.match(prompt, /Note 1/);
    assert.match(prompt, /Note 2/);
  });
});
