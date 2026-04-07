import { formatBugStatus } from '../lib/format';
import type { BugStatus } from '../lib/types';

type StatusBadgeProps = {
  status: BugStatus;
};

export function StatusBadge({ status }: StatusBadgeProps) {
  return <span className={`badge badge--status badge--${status.toLowerCase().replace('_', '-')}`}>{formatBugStatus(status)}</span>;
}
