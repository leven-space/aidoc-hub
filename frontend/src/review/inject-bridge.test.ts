import assert from 'node:assert/strict';
import { describe, it } from 'node:test';
import { getReviewBridgeScriptUrl, injectReviewBridge } from './inject-bridge.ts';

describe('injectReviewBridge', () => {
  it('injects config and script before closing body', () => {
    const html = '<html><head></head><body><p>Hi</p></body></html>';
    const result = injectReviewBridge(html, 'http://localhost:5173/review-bridge.js', 'http://localhost:5173');
    assert.match(result, /__AIDOC_REVIEW_PARENT_ORIGIN__="http:\/\/localhost:5173"/);
    assert.match(result, /review-bridge\.js/);
    assert.match(result, /<\/body>/);
    assert.ok(result.indexOf('review-bridge.js') < result.indexOf('</body>'));
  });

  it('does not double inject', () => {
    const html = '<html><body></body></html>';
    const once = injectReviewBridge(html, '/review-bridge.js', 'http://localhost:5173');
    const twice = injectReviewBridge(once, '/review-bridge.js', 'http://localhost:5173');
    assert.equal((twice.match(/review-bridge\.js/g) ?? []).length, 1);
  });

  it('appends when body tag is missing', () => {
    const html = '<div>fragment</div>';
    const result = injectReviewBridge(html, '/review-bridge.js', 'http://localhost:5173');
    assert.match(result, /data-aidoc-review-bridge/);
  });
});

describe('getReviewBridgeScriptUrl', () => {
  it('builds absolute script url', () => {
    assert.equal(
      getReviewBridgeScriptUrl('http://localhost:5173'),
      'http://localhost:5173/review-bridge.js',
    );
  });
});
