import { NavLink, Outlet, useNavigate } from 'react-router-dom';

import { clearToken } from '../lib/auth';

export function AppShell() {
  const navigate = useNavigate();

  return (
    <div className="app-shell">
      <header className="topbar">
        <div>
          <p className="eyebrow">Bug Feedback System</p>
          <h1>Developer Workspace</h1>
        </div>
        <div className="topbar__actions">
          <nav className="nav-tabs" aria-label="Primary">
            <NavLink className="nav-tab" to="/bugs">
              Bugs
            </NavLink>
            <NavLink className="nav-tab" to="/projects">
              Projects
            </NavLink>
          </nav>
          <button
            className="ghost-button"
            type="button"
            onClick={() => {
              clearToken();
              navigate('/login');
            }}
          >
            Log out
          </button>
        </div>
      </header>
      <main className="page-shell">
        <Outlet />
      </main>
    </div>
  );
}
