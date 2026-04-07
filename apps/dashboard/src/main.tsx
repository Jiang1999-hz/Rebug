import React from 'react';
import ReactDOM from 'react-dom/client';
import { BrowserRouter, Navigate, Outlet, Route, Routes, useLocation } from 'react-router-dom';

import { AppShell } from './components/AppShell';
import { isAuthenticated } from './lib/auth';
import { BugDetailPage } from './pages/BugDetail';
import { BugListPage } from './pages/BugList';
import { LoginPage } from './pages/Login';
import { ProjectsPage } from './pages/Projects';
import './styles.css';

function RequireAuth() {
  const location = useLocation();

  if (!isAuthenticated()) {
    return <Navigate replace state={{ from: location.pathname }} to="/login" />;
  }

  return <Outlet />;
}

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <BrowserRouter>
      <Routes>
        <Route element={<LoginPage />} path="/login" />
        <Route element={<RequireAuth />}>
          <Route element={<AppShell />}>
            <Route element={<Navigate replace to="/bugs" />} index />
            <Route element={<BugListPage />} path="/bugs" />
            <Route element={<BugDetailPage />} path="/bugs/:id" />
            <Route element={<ProjectsPage />} path="/projects" />
          </Route>
        </Route>
        <Route element={<Navigate replace to="/bugs" />} path="*" />
      </Routes>
    </BrowserRouter>
  </React.StrictMode>
);
