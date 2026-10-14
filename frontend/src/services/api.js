/* Authentication and Server API calls */

// In production this is set to 'https://api.nilainnresidency.com' via the
// VITE_API_URL variable embedded at build time.  In development it is left
// empty so that relative paths fall through to the Vite dev-server proxy.
const API_BASE = import.meta.env.VITE_API_URL || '';

export async function loginUser({ email, password }) {
  const res = await fetch(`${API_BASE}/api/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    credentials: 'include',
    body: JSON.stringify({ email, password }),
  });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) {
    throw new Error(data.error || 'Invalid email or password.');
  }
  return data.user;
}

export async function logoutUser() {
  try {
    await fetch(`${API_BASE}/api/auth/logout`, {
      method: 'POST',
      credentials: 'include',
    });
  } catch (err) {
    console.error('Logout error:', err);
  }
}

export async function getMe() {
  const res = await fetch(`${API_BASE}/api/auth/me`, {
    cache: 'no-store',
    credentials: 'include',
  });
  if (res.status === 401) {
    return null;
  }
  if (!res.ok) {
    throw new Error('Failed to verify session');
  }
  const data = await res.json();
  return data.user || null;
}

export async function changePassword({ currentPassword, newPassword }) {
  const res = await fetch(`${API_BASE}/api/auth/change-password`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    credentials: 'include',
    body: JSON.stringify({ currentPassword, newPassword }),
  });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) {
    throw new Error(data.error || 'Failed to update password.');
  }
  return data;
}
