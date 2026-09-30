/* Authentication and Server API calls */

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

export async function changePassword({ currentPassword, newPassword }) {
  const res = await fetch('/api/auth/change-password', {
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
