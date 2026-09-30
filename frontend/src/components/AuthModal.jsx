import React, { useState } from 'react';
import { loginUser } from '../services/api.js';

export default function AuthModal({ onLoginSuccess }) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    const cleanEmail = email.trim();
    const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

    if (!cleanEmail) {
      setError('Enter your email address.');
      return;
    }
    if (!EMAIL_REGEX.test(cleanEmail)) {
      setError('Enter a valid email address.');
      return;
    }
    if (!password) {
      setError('Enter your password.');
      return;
    }

    setLoading(true);
    try {
      const user = await loginUser({ email: cleanEmail, password });
      onLoginSuccess(user);
    } catch (err) {
      setError(err.message || 'Invalid email or password.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="auth-overlay">
      <div className="auth-card">
        <header className="auth-head">
          <img src="/images/emblem.jpg" alt="Emblem" />
          <h1>Nila Inn Residency</h1>
          <p>Invoice System — Log in</p>
        </header>
        <div className="rule" />

        <form className="auth-form" onSubmit={handleSubmit}>
          <div className="field">
            <label htmlFor="f-auth-email">Email</label>
            <input
              id="f-auth-email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              autoComplete="email"
              inputMode="email"
              autoFocus
            />
          </div>

          <div className="field">
            <label htmlFor="f-auth-pass">Password</label>
            <div className="auth-password-control">
              <input
                id="f-auth-pass"
                type={showPassword ? 'text' : 'password'}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                autoComplete="current-password"
              />
              <button
                className="auth-password-toggle"
                type="button"
                aria-label={showPassword ? 'Hide password' : 'Show password'}
                aria-pressed={showPassword}
                onClick={() => setShowPassword((visible) => !visible)}
              >
                <svg viewBox="0 0 24 24" aria-hidden="true" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
                  {showPassword ? (
                    <>
                      <path d="M3 3l18 18" />
                      <path d="M10.6 10.6a2 2 0 002.8 2.8" />
                      <path d="M9.9 5.2A10.8 10.8 0 0112 5c5 0 8.5 4.4 9.5 6.2a1.6 1.6 0 010 1.6 12.7 12.7 0 01-3.1 3.5" />
                      <path d="M6.2 6.2a13.4 13.4 0 00-3.7 5 1.6 1.6 0 000 1.6C3.5 14.6 7 19 12 19a10 10 0 004-.8" />
                    </>
                  ) : (
                    <>
                      <path d="M2.5 12s3.4-7 9.5-7 9.5 7 9.5 7-3.4 7-9.5 7-9.5-7-9.5-7z" />
                      <circle cx="12" cy="12" r="3" />
                    </>
                  )}
                </svg>
              </button>
            </div>
          </div>

          {error && <p className="msg">{error}</p>}

          <button className="auth-submit" type="submit" disabled={loading}>
            {loading ? 'Logging in…' : 'Log in'}
          </button>
        </form>
      </div>
    </div>
  );
}
