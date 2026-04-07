import { clearToken, getToken } from './auth';
import type { BugDetailRecord, BugListItem, BugStatus, Comment, ProjectRecord } from './types';

const API_BASE_URL = (import.meta.env.VITE_API_BASE_URL ?? '').replace(/\/$/, '');

type RequestOptions = RequestInit & {
  authenticated?: boolean;
};

type ApiErrorPayload = {
  error?: string;
  code?: string;
};

export class ApiError extends Error {
  status: number;
  code?: string;

  constructor(status: number, message: string, code?: string) {
    super(message);
    this.status = status;
    this.code = code;
  }
}

async function request<T>(path: string, options: RequestOptions = {}) {
  const headers = new Headers(options.headers);
  headers.set('Content-Type', 'application/json');

  if (options.authenticated !== false) {
    const token = getToken();
    if (token) {
      headers.set('Authorization', `Bearer ${token}`);
    }
  }

  const response = await fetch(`${API_BASE_URL}${path}`, {
    ...options,
    headers
  });

  if (!response.ok) {
    let payload: ApiErrorPayload = {};

    try {
      payload = (await response.json()) as ApiErrorPayload;
    } catch {
      payload = {};
    }

    if (response.status === 401) {
      clearToken();
    }

    throw new ApiError(response.status, payload.error ?? 'Request failed.', payload.code);
  }

  return (await response.json()) as T;
}

export async function login(email: string, password: string) {
  return request<{ token: string; developer: { id: string; email: string } }>('/api/auth/login', {
    method: 'POST',
    body: JSON.stringify({ email, password }),
    authenticated: false
  });
}

export async function fetchBugs(params: {
  status?: string;
  severity?: string;
  search?: string;
  page?: number;
  limit?: number;
}) {
  const query = new URLSearchParams();

  if (params.status && params.status !== 'ALL') {
    query.set('status', params.status);
  }

  if (params.severity && params.severity !== 'ALL') {
    query.set('severity', params.severity);
  }

  if (params.search) {
    query.set('search', params.search);
  }

  query.set('page', String(params.page ?? 1));
  query.set('limit', String(params.limit ?? 20));

  return request<{ bugs: BugListItem[]; total: number; page: number; limit: number }>(`/api/bugs?${query.toString()}`);
}

export async function fetchBug(id: string) {
  return request<BugDetailRecord>(`/api/bugs/${id}`);
}

export async function updateBugStatus(id: string, status: BugStatus) {
  return request<BugDetailRecord>(`/api/bugs/${id}/status`, {
    method: 'PATCH',
    body: JSON.stringify({ status })
  });
}

export async function createDeveloperComment(id: string, content: string) {
  return request<Comment>(`/api/bugs/${id}/comments`, {
    method: 'POST',
    body: JSON.stringify({ content })
  });
}

export async function fetchProjects() {
  return request<{ projects: ProjectRecord[] }>('/api/projects');
}

export async function createProject(name: string, allowedOrigins: string[]) {
  return request<ProjectRecord>('/api/projects', {
    method: 'POST',
    body: JSON.stringify({ name, allowedOrigins })
  });
}

export const apiBaseUrl = API_BASE_URL;
