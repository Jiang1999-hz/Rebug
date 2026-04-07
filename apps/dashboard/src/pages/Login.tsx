import { useEffect, useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';

import { login } from '../lib/api';
import { isAuthenticated, setToken } from '../lib/auth';

export function LoginPage() {
  const navigate = useNavigate();
  const location = useLocation();
  const [email, setEmail] = useState('dev@example.com');
  const [password, setPassword] = useState('ChangeMe123!');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    if (isAuthenticated()) {
      navigate('/bugs', { replace: true });
    }
  }, [navigate]);

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();

    try {
      setSubmitting(true);
      setError('');
      const response = await login(email, password);
      setToken(response.token);

      const redirectTo =
        typeof location.state === 'object' && location.state && 'from' in location.state
          ? String((location.state as { from?: string }).from ?? '/bugs')
          : '/bugs';

      navigate(redirectTo, { replace: true });
    } catch (loginError) {
      setError(loginError instanceof Error ? loginError.message : 'Unable to sign in.');
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="login-page">
      <section className="login-card">
        <p className="eyebrow">Minimal work item flow</p>
        <h1>Bug Feedback Dashboard</h1>
        <p className="login-copy">
          Sign in with a developer account to review incoming bugs, update statuses, and reply to clients.
        </p>
        <form className="stack-form" onSubmit={handleSubmit}>
          <label htmlFor="login-email">Email</label>
          <input id="login-email" type="email" value={email} onChange={(event) => setEmail(event.target.value)} />

          <label htmlFor="login-password">Password</label>
          <input
            id="login-password"
            type="password"
            value={password}
            onChange={(event) => setPassword(event.target.value)}
          />

          {error ? <p className="form-error">{error}</p> : null}

          <button className="primary-button primary-button--large" disabled={submitting} type="submit">
            {submitting ? 'Signing in...' : 'Log in'}
          </button>
        </form>
      </section>
    </div>
  );
}
