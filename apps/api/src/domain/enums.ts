export const severityValues = ['CRITICAL', 'HIGH', 'MEDIUM', 'LOW'] as const;
export type Severity = (typeof severityValues)[number];

export const bugStatusValues = ['OPEN', 'IN_PROGRESS', 'RESOLVED', 'CLOSED'] as const;
export type BugStatus = (typeof bugStatusValues)[number];

export const authorTypeValues = ['CLIENT', 'DEVELOPER'] as const;
export type AuthorType = (typeof authorTypeValues)[number];
