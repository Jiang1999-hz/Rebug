import { useEffect, useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { UAParser } from 'ua-parser-js';

import { CommentThread } from '../components/CommentThread';
import { SeverityBadge } from '../components/SeverityBadge';
import { StatusBadge } from '../components/StatusBadge';
import { ApiError, createDeveloperComment, fetchBug, updateBugStatus } from '../lib/api';
import { formatBugStatus, formatDateTime } from '../lib/format';
import { canTransitionStatus, bugStatuses, type BugDetailRecord, type BugStatus } from '../lib/types';

export function BugDetailPage() {
  const { id: routeId } = useParams();
  const navigate = useNavigate();
  const [bug, setBug] = useState<BugDetailRecord | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [updatingStatus, setUpdatingStatus] = useState(false);

  useEffect(() => {
    const bugId = routeId ?? '';

    if (!bugId) {
      return;
    }

    let active = true;

    async function loadBug() {
      try {
        setLoading(true);
        setError('');
        const response = await fetchBug(bugId);

        if (active) {
          setBug(response);
        }
      } catch (loadError) {
        if (!active) {
          return;
        }

        if (loadError instanceof ApiError && loadError.status === 401) {
          navigate('/login', { replace: true, state: { from: `/bugs/${bugId}` } });
          return;
        }

        setError(loadError instanceof Error ? loadError.message : 'Unable to load bug details.');
      } finally {
        if (active) {
          setLoading(false);
        }
      }
    }

    void loadBug();

    return () => {
      active = false;
    };
  }, [navigate, routeId]);

  async function handleStatusChange(nextStatus: BugStatus) {
    if (!bug || bug.status === nextStatus) {
      return;
    }

    try {
      setUpdatingStatus(true);
      setError('');
      const updated = await updateBugStatus(bug.id, nextStatus);
      setBug(updated);
    } catch (updateError) {
      setError(updateError instanceof Error ? updateError.message : 'Unable to update status.');
    } finally {
      setUpdatingStatus(false);
    }
  }

  async function handleCommentSubmit(content: string) {
    if (!bug) {
      return;
    }

    const comment = await createDeveloperComment(bug.id, content);
    setBug({
      ...bug,
      comments: [...bug.comments, comment]
    });
  }

  if (loading) {
    return <div className="panel loading-card">Loading bug details...</div>;
  }

  if (error && !bug) {
    return (
      <div className="panel empty-state">
        <h3>Unable to load this bug</h3>
        <p>{error}</p>
        <Link className="secondary-button" to="/bugs">
          Back to bugs
        </Link>
      </div>
    );
  }

  if (!bug) {
    return null;
  }

  const ua = new UAParser(bug.userAgent).getResult();
  const browserLabel = [ua.browser.name, ua.browser.version].filter(Boolean).join(' ') || 'Unknown browser';
  const osLabel = [ua.os.name, ua.os.version].filter(Boolean).join(' ') || 'Unknown OS';

  return (
    <div className="page-stack">
      <div className="page-title-row">
        <div>
          <p className="eyebrow">Bug #{bug.seqId}</p>
          <h2>{bug.title}</h2>
        </div>
        <Link className="ghost-button" to="/bugs">
          Back to bugs
        </Link>
      </div>

      {error ? <p className="form-error panel">{error}</p> : null}

      <div className="detail-grid">
        <section className="panel detail-panel">
          <div className="detail-header">
            <div className="detail-header__badges">
              <StatusBadge status={bug.status} />
              <SeverityBadge severity={bug.severity} />
            </div>
            <label className="status-picker">
              Status
              <select
                value={bug.status}
                disabled={updatingStatus}
                onChange={(event) => handleStatusChange(event.target.value as BugStatus)}
              >
                {bugStatuses.map((status) => (
                  <option disabled={!canTransitionStatus(bug.status, status)} key={status} value={status}>
                    {formatBugStatus(status)}
                  </option>
                ))}
              </select>
            </label>
          </div>

          <div className="content-block">
            <h3>Description</h3>
            <p>{bug.description || 'No additional reproduction details were provided.'}</p>
          </div>

          <div className="content-block">
            <h3>Screenshots</h3>
            {bug.screenshots.length === 0 ? (
              <p className="subtle-text">No screenshots attached.</p>
            ) : (
              <div className="screenshot-grid">
                {bug.screenshots.map((screenshot) => (
                  <a href={screenshot} key={screenshot} rel="noreferrer" target="_blank">
                    <img alt="Bug screenshot" src={screenshot} />
                  </a>
                ))}
              </div>
            )}
          </div>

          <div className="content-block">
            <h3>Metadata</h3>
            <dl className="metadata-list">
              <div>
                <dt>Project</dt>
                <dd>{bug.project.name}</dd>
              </div>
              <div>
                <dt>Page URL</dt>
                <dd>
                  <a href={bug.pageUrl} rel="noreferrer" target="_blank">
                    {bug.pageUrl}
                  </a>
                </dd>
              </div>
              <div>
                <dt>Browser</dt>
                <dd>{browserLabel}</dd>
              </div>
              <div>
                <dt>OS</dt>
                <dd>{osLabel}</dd>
              </div>
              <div>
                <dt>Submitted</dt>
                <dd>{formatDateTime(bug.createdAt)}</dd>
              </div>
              <div>
                <dt>Last updated</dt>
                <dd>{formatDateTime(bug.updatedAt)}</dd>
              </div>
            </dl>
          </div>
        </section>

        <CommentThread comments={bug.comments} onSubmit={handleCommentSubmit} />
      </div>
    </div>
  );
}
