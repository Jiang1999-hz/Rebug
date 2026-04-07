const tokenStorageKey = 'bug-feedback-token';

export function getToken() {
  return window.localStorage.getItem(tokenStorageKey);
}

export function setToken(token: string) {
  window.localStorage.setItem(tokenStorageKey, token);
}

export function clearToken() {
  window.localStorage.removeItem(tokenStorageKey);
}

export function isAuthenticated() {
  return Boolean(getToken());
}
