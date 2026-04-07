import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';

import { ApiError, createProject, fetchProjects } from '../lib/api';
import { formatDateTime, maskApiKey } from '../lib/format';
import type { ProjectRecord } from '../lib/types';

export function ProjectsPage() {
  const navigate = useNavigate();
  const [projects, setProjects] = useState<ProjectRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [modalOpen, setModalOpen] = useState(false);
  const [creating, setCreating] = useState(false);
  const [name, setName] = useState('');
  const [allowedOrigins, setAllowedOrigins] = useState('');
  const [newlyCreatedKey, setNewlyCreatedKey] = useState('');

  useEffect(() => {
    let active = true;

    async function loadProjects() {
      try {
        setLoading(true);
        setError('');
        const response = await fetchProjects();

        if (active) {
          setProjects(response.projects);
        }
      } catch (loadError) {
        if (!active) {
          return;
        }

        if (loadError instanceof ApiError && loadError.status === 401) {
          navigate('/login', { replace: true, state: { from: '/projects' } });
          return;
        }

        setError(loadError instanceof Error ? loadError.message : 'Unable to load projects.');
      } finally {
        if (active) {
          setLoading(false);
        }
      }
    }

    void loadProjects();

    return () => {
      active = false;
    };
  }, [navigate]);

  async function handleCreateProject(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();

    try {
      setCreating(true);
      setError('');

      const origins = allowedOrigins
        .split(',')
        .map((value) => value.trim())
        .filter(Boolean);

      const project = await createProject(name.trim(), origins);
      setProjects((current) => [{ ...project, bugCount: 0 }, ...current]);
      setNewlyCreatedKey(project.apiKey);
      setModalOpen(false);
      setName('');
      setAllowedOrigins('');
    } catch (createError) {
      setError(createError instanceof Error ? createError.message : 'Unable to create project.');
    } finally {
      setCreating(false);
    }
  }

  async function copyValue(value: string) {
    await navigator.clipboard.writeText(value);
  }

  return (
    <div className="page-stack">
      <section className="panel">
        <div className="panel-heading">
          <div>
            <p className="eyebrow">Project registry</p>
            <h2>Projects and API keys</h2>
          </div>
          <button className="primary-button" type="button" onClick={() => setModalOpen(true)}>
            Create project
          </button>
        </div>

        <p className="subtle-text">
          Each project gets a unique widget API key. Store the full key once at creation time and embed it on the client site.
        </p>

        {newlyCreatedKey ? (
          <div className="flash-card">
            <div>
              <strong>New API key</strong>
              <p className="mono">{newlyCreatedKey}</p>
            </div>
            <button className="secondary-button" type="button" onClick={() => copyValue(newlyCreatedKey)}>
              Copy key
            </button>
          </div>
        ) : null}
      </section>

      {error ? <p className="form-error panel">{error}</p> : null}

      {loading ? (
        <div className="panel loading-card">Loading projects...</div>
      ) : (
        <div className="project-grid">
          {projects.map((project) => (
            <article className="panel project-card" key={project.id}>
              <div className="project-card__header">
                <div>
                  <h3>{project.name}</h3>
                  <p className="subtle-text">{project.bugCount} bug reports</p>
                </div>
                <button className="ghost-button" type="button" onClick={() => copyValue(project.apiKey)}>
                  Copy key
                </button>
              </div>

              <dl className="metadata-list">
                <div>
                  <dt>Masked key</dt>
                  <dd className="mono">{maskApiKey(project.apiKey)}</dd>
                </div>
                <div>
                  <dt>Allowed origins</dt>
                  <dd>{project.allowedOrigins.length ? project.allowedOrigins.join(', ') : 'Any origin'}</dd>
                </div>
                <div>
                  <dt>Created</dt>
                  <dd>{formatDateTime(project.createdAt)}</dd>
                </div>
              </dl>
            </article>
          ))}
        </div>
      )}

      {modalOpen ? (
        <div className="modal-backdrop" role="presentation" onClick={() => setModalOpen(false)}>
          <div className="modal-card" role="dialog" aria-modal="true" onClick={(event) => event.stopPropagation()}>
            <div className="panel-heading">
              <div>
                <p className="eyebrow">New project</p>
                <h2>Create project</h2>
              </div>
            </div>

            <form className="stack-form" onSubmit={handleCreateProject}>
              <label htmlFor="project-name">Project name</label>
              <input id="project-name" required value={name} onChange={(event) => setName(event.target.value)} />

              <label htmlFor="allowed-origins">Allowed origins</label>
              <textarea
                id="allowed-origins"
                placeholder="https://client-site.com, https://staging.client-site.com"
                rows={3}
                value={allowedOrigins}
                onChange={(event) => setAllowedOrigins(event.target.value)}
              />

              <div className="button-row">
                <button className="ghost-button" type="button" onClick={() => setModalOpen(false)}>
                  Cancel
                </button>
                <button className="primary-button" disabled={creating} type="submit">
                  {creating ? 'Creating...' : 'Create project'}
                </button>
              </div>
            </form>
          </div>
        </div>
      ) : null}
    </div>
  );
}
