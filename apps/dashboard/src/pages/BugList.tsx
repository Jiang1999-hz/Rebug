import { useEffect, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';

import { BugTable } from '../components/BugTable';
import { ApiError, fetchBugs, updateBugStatus } from '../lib/api';
import { formatBugStatus } from '../lib/format';
import { bugStatuses, severities, type BugListItem, type BugStatus } from '../lib/types';

export function BugListPage() {
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [bugs, setBugs] = useState<BugListItem[]>([]);
  const [total, setTotal] = useState(0);
  const [updatingBugId, setUpdatingBugId] = useState<string | null>(null);
  const [searchDraft, setSearchDraft] = useState(searchParams.get('search') ?? '');

  const status = searchParams.get('status') ?? 'ALL';
  const severity = searchParams.get('severity') ?? 'ALL';
  const page = Number(searchParams.get('page') ?? 1);

  useEffect(() => {
    setSearchDraft(searchParams.get('search') ?? '');
  }, [searchParams]);

  useEffect(() => {
    let active = true;

    async function loadBugs() {
      try {
        setLoading(true);
        setError('');
        const response = await fetchBugs({
          status,
          severity,
          search: searchParams.get('search') ?? '',
          page
        });

        if (!active) {
          return;
        }

        setBugs(response.bugs);
        setTotal(response.total);
      } catch (loadError) {
        if (!active) {
          return;
        }

        if (loadError instanceof ApiError && loadError.status === 401) {
          navigate('/login', { replace: true, state: { from: '/bugs' } });
          return;
        }

        setError(loadError instanceof Error ? loadError.message : 'Unable to load bugs.');
      } finally {
        if (active) {
          setLoading(false);
        }
      }
    }

    void loadBugs();

    return () => {
      active = false;
    };
  }, [navigate, page, searchParams, severity, status]);

  async function handleStatusChange(bug: BugListItem, nextStatus: BugStatus) {
    if (bug.status === nextStatus) {
      return;
    }

    try {
      setUpdatingBugId(bug.id);
      const updatedBug = await updateBugStatus(bug.id, nextStatus);
      setBugs((current) =>
        current.map((item) => (item.id === bug.id ? { ...item, status: updatedBug.status, updatedAt: updatedBug.updatedAt } : item))
      );
    } catch (updateError) {
      setError(updateError instanceof Error ? updateError.message : 'Unable to update status.');
    } finally {
      setUpdatingBugId(null);
    }
  }

  function updateFilters(next: { status?: string; severity?: string; search?: string; page?: number }) {
    const params = new URLSearchParams(searchParams);

    if (next.status) {
      params.set('status', next.status);
    }

    if (next.severity) {
      params.set('severity', next.severity);
    }

    if (typeof next.search === 'string') {
      if (next.search) {
        params.set('search', next.search);
      } else {
        params.delete('search');
      }
    }

    params.set('page', String(next.page ?? 1));
    setSearchParams(params);
  }

  const totalPages = Math.max(1, Math.ceil(total / 20));

  return (
    <div className="page-stack">
      <section className="panel">
        <div className="panel-heading">
          <div>
            <p className="eyebrow">Bug queue</p>
            <h2>All submitted bugs</h2>
          </div>
          <p className="headline-stat">{total} total</p>
        </div>

        <form
          className="filter-grid"
          onSubmit={(event) => {
            event.preventDefault();
            updateFilters({ search: searchDraft, page: 1 });
          }}
        >
          <label>
            Status
            <select value={status} onChange={(event) => updateFilters({ status: event.target.value, page: 1 })}>
              <option value="ALL">All</option>
              {bugStatuses.map((value) => (
                <option key={value} value={value}>
                  {formatBugStatus(value)}
                </option>
              ))}
            </select>
          </label>

          <label>
            Severity
            <select value={severity} onChange={(event) => updateFilters({ severity: event.target.value, page: 1 })}>
              <option value="ALL">All</option>
              {severities.map((value) => (
                <option key={value} value={value}>
                  {formatBugStatus(value)}
                </option>
              ))}
            </select>
          </label>

          <label className="search-field">
            Search title
            <input
              placeholder="Search bug titles"
              type="search"
              value={searchDraft}
              onChange={(event) => setSearchDraft(event.target.value)}
            />
          </label>

          <button className="secondary-button" type="submit">
            Apply
          </button>
        </form>
      </section>

      {error ? <p className="form-error panel">{error}</p> : null}

      {loading ? (
        <div className="panel loading-card">Loading bugs...</div>
      ) : (
        <>
          <BugTable bugs={bugs} onStatusChange={handleStatusChange} updatingBugId={updatingBugId} />
          <div className="pagination-row">
            <button className="ghost-button" disabled={page <= 1} onClick={() => updateFilters({ page: page - 1 })} type="button">
              Previous
            </button>
            <span>
              Page {page} of {totalPages}
            </span>
            <button
              className="ghost-button"
              disabled={page >= totalPages}
              onClick={() => updateFilters({ page: page + 1 })}
              type="button"
            >
              Next
            </button>
          </div>
        </>
      )}
    </div>
  );
}
