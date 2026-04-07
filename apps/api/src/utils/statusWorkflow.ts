import type { BugStatus } from '@prisma/client';

const allowedTransitions: Record<BugStatus, BugStatus[]> = {
  OPEN: ['IN_PROGRESS', 'CLOSED'],
  IN_PROGRESS: ['RESOLVED', 'CLOSED'],
  RESOLVED: ['CLOSED', 'OPEN'],
  CLOSED: ['OPEN']
};

export function canTransitionStatus(current: BugStatus, next: BugStatus) {
  if (current === next) {
    return true;
  }

  return allowedTransitions[current].includes(next);
}

export function getAllowedTransitions(current: BugStatus) {
  return [current, ...allowedTransitions[current]];
}
