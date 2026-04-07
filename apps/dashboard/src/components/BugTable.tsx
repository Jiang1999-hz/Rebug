import { Link } from 'react-router-dom';

import { formatRelativeDate, formatBugStatus, truncateUrl } from '../lib/format';
import { canTransitionStatus, type BugListItem, type BugStatus } from '../lib/types';
import { SeverityBadge } from './SeverityBadge';
import { StatusBadge } from './StatusBadge';

type BugTableProps = {
  bugs: BugListItem[];
  updatingBugId?: string | null;
  onStatusChange: (bug: BugListItem, status: BugStatus) => void;
};

export function BugTable({ bugs, updatingBugId, onStatusChange }: BugTableProps) {
  if (bugs.length === 0) {
    return (
      <div className="empty-state panel">
        <h3>No bugs found</h3>
        <p>Try changing the filters or wait for new widget submissions.</p>
      </div>
    );
  }

  return (
    <div className="panel table-panel">
      <table className="bug-table">
        <thead>
          <tr>
            <th>ID</th>
            <th>Title</th>
            <th>Severity</th>
            <th>Status</th>
            <th>Page URL</th>
            <th>Created</th>
          </tr>
        </thead>
        <tbody>
          {bugs.map((bug) => (
            <tr key={bug.id}>
              <td className="mono">#{bug.seqId}</td>
              <td>
                <Link className="title-link" to={`/bugs/${bug.id}`}>
                  {bug.title}
                </Link>
                <p className="subtle-text">{bug.project.name}</p>
              </td>
              <td>
                <SeverityBadge severity={bug.severity} />
              </td>
              <td>
                <div className="status-cell">
                  <StatusBadge status={bug.status} />
                  <label className="sr-only" htmlFor={`status-${bug.id}`}>
                    Update bug status
                  </label>
                  <select
                    id={`status-${bug.id}`}
                    className="inline-select"
                    value={bug.status}
                    disabled={updatingBugId === bug.id}
                    onChange={(event) => onStatusChange(bug, event.target.value as BugStatus)}
                  >
                    <option disabled={!canTransitionStatus(bug.status, 'OPEN')} value="OPEN">
                      {formatBugStatus('OPEN')}
                    </option>
                    <option disabled={!canTransitionStatus(bug.status, 'IN_PROGRESS')} value="IN_PROGRESS">
                      {formatBugStatus('IN_PROGRESS')}
                    </option>
                    <option disabled={!canTransitionStatus(bug.status, 'RESOLVED')} value="RESOLVED">
                      {formatBugStatus('RESOLVED')}
                    </option>
                    <option disabled={!canTransitionStatus(bug.status, 'CLOSED')} value="CLOSED">
                      {formatBugStatus('CLOSED')}
                    </option>
                  </select>
                </div>
              </td>
              <td>
                <a className="url-link" href={bug.pageUrl} rel="noreferrer" target="_blank" title={bug.pageUrl}>
                  {truncateUrl(bug.pageUrl)}
                </a>
              </td>
              <td>{formatRelativeDate(bug.createdAt)}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
