export type Severity = 'CRITICAL' | 'HIGH' | 'MEDIUM' | 'LOW';
export type BugStatus = 'OPEN' | 'IN_PROGRESS' | 'RESOLVED' | 'CLOSED';
export type AuthorType = 'CLIENT' | 'DEVELOPER';

export type BugListItem = {
  id: string;
  seqId: number;
  title: string;
  severity: Severity;
  status: BugStatus;
  pageUrl: string;
  createdAt: string;
  updatedAt: string;
  projectId: string;
  project: {
    id: string;
    name: string;
  };
  _count: {
    comments: number;
  };
};

export type Comment = {
  id: string;
  content: string;
  author: AuthorType;
  createdAt: string;
};

export type BugDetailRecord = {
  id: string;
  seqId: number;
  title: string;
  description: string;
  severity: Severity;
  status: BugStatus;
  screenshots: string[];
  pageUrl: string;
  userAgent: string;
  projectId: string;
  createdAt: string;
  updatedAt: string;
  project: {
    id: string;
    name: string;
  };
  comments: Comment[];
};

export type ProjectRecord = {
  id: string;
  name: string;
  apiKey: string;
  allowedOrigins: string[];
  bugCount: number;
  createdAt: string;
};

export const bugStatuses: BugStatus[] = ['OPEN', 'IN_PROGRESS', 'RESOLVED', 'CLOSED'];
export const severities: Severity[] = ['CRITICAL', 'HIGH', 'MEDIUM', 'LOW'];

export const allowedStatusTransitions: Record<BugStatus, BugStatus[]> = {
  OPEN: ['IN_PROGRESS', 'CLOSED'],
  IN_PROGRESS: ['RESOLVED', 'CLOSED'],
  RESOLVED: ['OPEN', 'CLOSED'],
  CLOSED: ['OPEN']
};

export function canTransitionStatus(current: BugStatus, next: BugStatus) {
  return current === next || allowedStatusTransitions[current].includes(next);
}
