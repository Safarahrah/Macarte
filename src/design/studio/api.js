// src/design/studio/api.js
import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';

let csrfToken = null;

export async function getCsrf(force = false) {
  if (csrfToken && !force) return csrfToken;
  const res = await fetch('/api/csrf-token', { credentials: 'include' });
  const json = await res.json();
  csrfToken = json.csrfToken;
  return csrfToken;
}

export async function api(method, url, body) {
  const headers = {};
  if (body !== undefined) headers['Content-Type'] = 'application/json';
  if (method !== 'GET') headers['X-CSRF-Token'] = await getCsrf();
  let res = await fetch(url, { method, headers, credentials: 'include', body: body !== undefined ? JSON.stringify(body) : undefined });
  if (res.status === 403 && method !== 'GET') {
    headers['X-CSRF-Token'] = await getCsrf(true);
    res = await fetch(url, { method, headers, credentials: 'include', body: body !== undefined ? JSON.stringify(body) : undefined });
  }
  const json = await res.json().catch(() => ({}));
  if (!res.ok) {
    const err = new Error(json.error || `Erreur ${res.status}`);
    err.status = res.status;
    throw err;
  }
  return json;
}

export async function uploadImage(file) {
  const fd = new FormData();
  fd.append('file', file);
  const res = await fetch('/api/designs/uploads', {
    method: 'POST',
    credentials: 'include',
    headers: { 'X-CSRF-Token': await getCsrf() },
    body: fd
  });
  const json = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(json.error || 'Envoi impossible');
  return json;
}

/** Loads the current user; redirects to /login when not authenticated. */
export function useSession() {
  const navigate = useNavigate();
  const [session, setSession] = useState({ user: null, loading: true });
  useEffect(() => {
    let cancelled = false;
    fetch('/api/auth/me', { credentials: 'include' })
      .then(async (res) => {
        if (cancelled) return;
        if (!res.ok) { navigate('/login', { replace: true }); return; }
        setSession({ user: await res.json(), loading: false });
        getCsrf().catch(() => {});
      })
      .catch(() => { if (!cancelled) navigate('/login', { replace: true }); });
    return () => { cancelled = true; };
  }, [navigate]);
  return session;
}

export function formatDate(value) {
  if (!value) return '';
  const d = new Date(String(value).includes('T') ? value : `${String(value).replace(' ', 'T')}Z`);
  return Number.isNaN(d.getTime()) ? '' : d.toLocaleDateString('fr-FR', { day: 'numeric', month: 'short', year: 'numeric' });
}
