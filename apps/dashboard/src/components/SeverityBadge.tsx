import { formatBugStatus } from '../lib/format';
import type { Severity } from '../lib/types';

type SeverityBadgeProps = {
  severity: Severity;
};

export function SeverityBadge({ severity }: SeverityBadgeProps) {
  return <span className={`badge badge--severity badge--${severity.toLowerCase()}`}>{formatBugStatus(severity)}</span>;
}
