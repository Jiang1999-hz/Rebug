import { describe, expect, it } from 'vitest';

import { canTransitionStatus, getAllowedTransitions } from '../src/utils/statusWorkflow.js';

describe('status workflow', () => {
  it('allows the configured forward transitions', () => {
    expect(canTransitionStatus('OPEN', 'IN_PROGRESS')).toBe(true);
    expect(canTransitionStatus('IN_PROGRESS', 'RESOLVED')).toBe(true);
    expect(canTransitionStatus('RESOLVED', 'OPEN')).toBe(true);
    expect(canTransitionStatus('CLOSED', 'OPEN')).toBe(true);
  });

  it('blocks invalid jumps', () => {
    expect(canTransitionStatus('OPEN', 'RESOLVED')).toBe(false);
    expect(canTransitionStatus('IN_PROGRESS', 'OPEN')).toBe(false);
    expect(canTransitionStatus('CLOSED', 'RESOLVED')).toBe(false);
  });

  it('includes the current status in the allowed options helper', () => {
    expect(getAllowedTransitions('OPEN')).toEqual(['OPEN', 'IN_PROGRESS', 'CLOSED']);
  });
});
