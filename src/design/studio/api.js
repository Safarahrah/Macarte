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

/**
 * Export a design project via server-side endpoint (protected by payment).
 * @param {string} apiUrl - API endpoint (e.g., '/api/designs')
 * @param {string} id - Project ID
 * @param {Object} options - Export options
 * @returns {Promise<Blob>}
 */
export async function exportDesignViaServer(apiUrl, id, options) {
  const headers = { 'Content-Type': 'application/json', 'X-CSRF-Token': await getCsrf() };
  const body = JSON.stringify(options);

  let res = await fetch(`${apiUrl}/${id}/export`, {
    method: 'POST',
    headers,
    credentials: 'include',
    body
  });

  if (res.status === 403 && options.format !== 'GET') {
    headers['X-CSRF-Token'] = await getCsrf(true);
    res = await fetch(`${apiUrl}/${id}/export`, {
      method: 'POST',
      headers,
      credentials: 'include',
      body
    });
  }

  if (res.status === 402) {
    const err = new Error('Payment required');
    err.status = 402;
    err.needsPayment = true;
    throw err;
  }

  if (!res.ok) {
    const json = await res.json().catch(() => ({}));
    const err = new Error(json.error || `Erreur ${res.status}`);
    err.status = res.status;
    throw err;
  }

  return await res.blob();
}

/**
 * Create a Stripe checkout session for a design project.
 * @param {string} apiUrl - API endpoint (e.g., '/api/designs')
 * @param {string} id - Project ID
 * @returns {Promise<{url: string}>}
 */
export async function createDesignCheckout(apiUrl, id) {
  const headers = { 'Content-Type': 'application/json', 'X-CSRF-Token': await getCsrf() };

  let res = await fetch(`${apiUrl}/${id}/checkout`, {
    method: 'POST',
    headers,
    credentials: 'include'
  });

  if (res.status === 403) {
    headers['X-CSRF-Token'] = await getCsrf(true);
    res = await fetch(`${apiUrl}/${id}/checkout`, {
      method: 'POST',
      headers,
      credentials: 'include'
    });
  }

  const json = await res.json().catch(() => ({}));
  if (!res.ok) {
    const err = new Error(json.error || 'Erreur lors de la création du paiement');
    err.status = res.status;
    throw err;
  }

  return json;
}
