import React, { useState, useEffect } from 'react';
import { loginUser, registerUser, fetchAuthConfig } from '../services/api.js';

export default function AuthModal({ onLoginSuccess }) {
  const [mode, setMode] = useState('login'); // 'login' | 'register'
  const [allowSignup, setAllowSignup] = useState(true);
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    fetchAuthConfig().then((cfg) => {
      setAllowSignup(cfg.signup !== false);
    });
  }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    const cleanEmail = email.trim();
    const cleanName = name.trim();

    const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (mode === 'register' && !cleanName) {
      setError('Enter your name.');
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
    if (mode === 'register' && password.length < 8) {
      setError('Password must be at least 8 characters.');
      return;
    }

    setLoading(true);
    try {
      let user;
      if (mode === 'register') {
        user = await registerUser({ name: cleanName, email: cleanEmail, password });
      } else {
        user = await loginUser({ email: cleanEmail, password });
      }
      onLoginSuccess(user);
    } catch (err) {
      setError(err.message || 'Something went wrong. Please try again.');
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
          <p>Invoices</p>
        </header>
        <div className="rule" />

        {allowSignup && (
          <div className="auth-tabs" role="tablist">
            <button
              type="button"
              className={mode === 'login' ? 'active' : ''}
              onClick={() => {
                setMode('login');
                setError('');
              }}
            >
              Log in
            </button>
            <button
              type="button"
              className={mode === 'register' ? 'active' : ''}
              onClick={() => {
                setMode('register');
                setError('');
              }}
            >
              Create account
            </button>
          </div>
        )}

        <form className="auth-form" onSubmit={handleSubmit}>
          {mode === 'register' && (
            <div className="field">
              <label htmlFor="f-auth-name">Your name</label>
              <input
                id="f-auth-name"
                value={name}
                onChange={(e) => setName(e.target.value)}
                autoComplete="name"
                placeholder="Full Name"
                autoFocus
              />
            </div>
          )}

          <div className="field">
            <label htmlFor="f-auth-email">Email</label>
            <input
              id="f-auth-email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              autoComplete="email"
              inputMode="email"
              placeholder="user@example.com"
              autoFocus={mode === 'login'}
            />
          </div>

          <div className="field">
            <label htmlFor="f-auth-pass">Password</label>
            <input
              id="f-auth-pass"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              autoComplete={mode === 'register' ? 'new-password' : 'current-password'}
            />
            {mode === 'register' && (
              <span className="hint">At least 8 characters.</span>
            )}
          </div>

          {error && <p className="msg">{error}</p>}

          <button className="auth-submit" type="submit" disabled={loading}>
            {loading
              ? mode === 'register'
                ? 'Creating account…'
                : 'Logging in…'
              : mode === 'register'
              ? 'Create account'
              : 'Log in'}
          </button>
        </form>
      </div>
    </div>
  );
}
