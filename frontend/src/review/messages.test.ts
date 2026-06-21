import assert from 'node:assert/strict';
import { describe, it } from 'node:test';
import {
  REVIEW_MESSAGE_SOURCE,
  ReviewMessageType,
  isTrustedReviewOrigin,
  parseBridgeToShellMessage,
} from './messages.ts';
import {
  getReviewStorageKey,
  loadReviewAnnotations,
  saveReviewAnnotations,
} from './review-storage.ts';
import type { ReviewAnnotation } from './types.ts';

describe('isTrustedReviewOrigin', () => {
  it('accepts matching origin and null', () => {
    assert.equal(isTrustedReviewOrigin('http://localhost:5173', 'http://localhost:5173'), true);
    assert.equal(isTrustedReviewOrigin('null', 'http://localhost:5173'), true);
    assert.equal(isTrustedReviewOrigin('http://evil.test', 'http://localhost:5173'), false);
  });
});

describe('parseBridgeToShellMessage', () => {
  it('parses BRIDGE_READY', () => {
    const msg = parseBridgeToShellMessage({
      source: REVIEW_MESSAGE_SOURCE,
      type: ReviewMessageType.BRIDGE_READY,
    });
    assert.equal(msg?.type, ReviewMessageType.BRIDGE_READY);
  });

  it('rejects ELEMENT_SELECTED without valid locator', () => {
    assert.equal(
      parseBridgeToShellMessage({
        source: REVIEW_MESSAGE_SOURCE,
        type: ReviewMessageType.ELEMENT_SELECTED,
        payload: {},
      }),
      null,
    );
  });

  it('parses ELEMENT_SELECTED with locator', () => {
    const msg = parseBridgeToShellMessage({
      source: REVIEW_MESSAGE_SOURCE,
      type: ReviewMessageType.ELEMENT_SELECTED,
      payload: {
        locator: { descriptor: 'h1', cssPath: 'body > h1' },
        htmlSnippet: '<h1>Hi</h1>',
      },
    });
    assert.equal(msg?.type, ReviewMessageType.ELEMENT_SELECTED);
    if (msg?.type === ReviewMessageType.ELEMENT_SELECTED) {
      assert.equal(msg.payload.locator.descriptor, 'h1');
    }
  });
});

describe('review-storage', () => {
  const key = getReviewStorageKey('ws', 'repo', 'index.html', 'oid-1');
  const sample: ReviewAnnotation[] = [
    {
      id: 'ann-1',
      action: 'modify',
      userNote: 'test',
      locator: { descriptor: 'h1', cssPath: 'body > h1' },
      createdAt: 1,
    },
  ];

  it('round-trips annotations in sessionStorage', () => {
    if (typeof sessionStorage === 'undefined') {
      return;
    }
    saveReviewAnnotations(key, sample);
    const loaded = loadReviewAnnotations(key);
    assert.equal(loaded.length, 1);
    assert.equal(loaded[0]?.userNote, 'test');
    saveReviewAnnotations(key, []);
    assert.equal(loadReviewAnnotations(key).length, 0);
  });
});
