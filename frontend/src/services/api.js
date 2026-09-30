/* Authentication and Server API calls */

export async function fetchAuthConfig() {
  try {
    const res = await fetch('/api/auth/config', { credentials: 'include' });
    if (!res.ok) return { signup: true };
    return await res.json();
  } catch {
    return { signup: true };
  }
}

export async function registerUser({ name, email, password }) {
  const res = await fetch('/api/auth/register', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    credentials: 'include',
    body: JSON.stringify({ name, email, password }),
  });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) {
    throw new Error(data.error || 'Failed to create account.');
  }
  return data.user;
}

export async function loginUser({ email, password }) {
  const res = await fetch('/api/auth/login', {
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
    await fetch('/api/auth/logout', {
      method: 'POST',
      credentials: 'include',
    });
  } catch (err) {
    console.error('Logout error:', err);
  }
}

export async function getMe() {
  const res = await fetch('/api/auth/me', {
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
