import React, { useState, useRef } from 'react';
import { iso } from '../utils/calculations.js';
import { changePassword } from '../services/api.js';

export default function SettingsDrawer({
  isOpen,
  onClose,
  settings,
  onUpdateSettings,
  user,
  onLogout,
  invoices,
  onImportBackup,
  onToast,
}) {
  const fileInputRef = useRef(null);

  // Password state
  const [showPasswordForm, setShowPasswordForm] = useState(false);
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [passLoading, setPassLoading] = useState(false);
  const [passError, setPassError] = useState('');
  const [passSuccess, setPassSuccess] = useState('');

  if (!isOpen) return null;

  const handleChange = (key, value) => {
    onUpdateSettings({ ...settings, [key]: value });
  };

  const handleExport = () => {
    const backupData = {
      app: 'nila-invoices',
      version: 1,
      exported: new Date().toISOString(),
      settings,
      invoices,
    };
    const blob = new Blob([JSON.stringify(backupData, null, 2)], {
      type: 'application/json',
    });
    const a = document.createElement('a');
    a.href = URL.createObjectURL(blob);
    a.download = `nila-invoices-backup-${iso(new Date())}.json`;
    document.body.appendChild(a);
    a.click();
    setTimeout(() => {
      URL.revokeObjectURL(a.href);
      a.remove();
    }, 500);
    onToast('Backup downloaded');
  };

  const handleFileChange = (e) => {
    const file = e.target.files[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = () => {
      try {
        const data = JSON.parse(reader.result);
        if (!data || !Array.isArray(data.invoices)) {
          throw new Error('Invalid format');
        }
        onImportBackup(data);
      } catch (err) {
        console.error(err);
        onToast('That file is not a valid Nila Inn invoice backup');
      }
    };
    reader.readAsText(file);
    e.target.value = '';
  };

  const handlePasswordSubmit = async (e) => {
    e.preventDefault();
    setPassError('');
    setPassSuccess('');

    if (!currentPassword) {
      setPassError('Enter your current password.');
      return;
    }
    if (!newPassword) {
      setPassError('Enter a new password.');
      return;
    }
    if (newPassword.length < 8) {
      setPassError('New password must be at least 8 characters.');
      return;
    }
    if (newPassword !== confirmPassword) {
      setPassError('New passwords do not match.');
      return;
    }

    setPassLoading(true);
    try {
      await changePassword({ currentPassword, newPassword });
      setPassSuccess('Password updated successfully!');
      setCurrentPassword('');
      setNewPassword('');
      setConfirmPassword('');
      onToast('Password changed successfully');
      setTimeout(() => {
        setPassSuccess('');
        setShowPasswordForm(false);
      }, 1500);
    } catch (err) {
      setPassError(err.message || 'Failed to update password.');
    } finally {
      setPassLoading(false);
    }
  };

  return (
    <div
      className="scrim"
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div className="drawer" role="dialog" aria-modal="true" aria-labelledby="setTitle">
        <header>
          <h2 id="setTitle">Settings</h2>
          <button className="close" type="button" onClick={onClose} aria-label="Close">
            ✕
          </button>
        </header>

        <div className="body">
          {/* Account */}
          <section className="group">
            <h2>Account</h2>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '10px', flexWrap: 'wrap' }}>
              <div style={{ minWidth: 0 }}>
                <b>{user?.name || 'Signed in'}</b>
                <div style={{ fontSize: '0.8rem', color: 'var(--muted)', overflowWrap: 'anywhere' }}>
                  {user?.email || 'Authenticated user'}
                </div>
              </div>
              <div style={{ display: 'flex', gap: '8px' }}>
                <button
                  type="button"
                  className="plain"
                  onClick={() => {
                    setShowPasswordForm((prev) => !prev);
                    setPassError('');
                    setPassSuccess('');
                  }}
                >
                  {showPasswordForm ? 'Cancel' : 'Change password'}
                </button>
                <button type="button" className="plain danger" onClick={onLogout}>
                  Log out
                </button>
              </div>
            </div>

            {/* Change Password Form */}
            {showPasswordForm && (
              <form
                onSubmit={handlePasswordSubmit}
                style={{
                  marginTop: '12px',
                  paddingTop: '12px',
                  borderTop: '1px solid var(--line-2)',
                  display: 'flex',
                  flexDirection: 'column',
                  gap: '10px',
                }}
              >
                <div className="field">
                  <label htmlFor="f-cur-pass">Current password</label>
                  <input
                    id="f-cur-pass"
                    type="password"
                    value={currentPassword}
                    onChange={(e) => setCurrentPassword(e.target.value)}
                    placeholder="Enter current password"
                    autoComplete="current-password"
                  />
                </div>

                <div className="row">
                  <div className="field">
                    <label htmlFor="f-new-pass">New password</label>
                    <input
                      id="f-new-pass"
                      type="password"
                      value={newPassword}
                      onChange={(e) => setNewPassword(e.target.value)}
                      placeholder="Min 8 characters"
                      autoComplete="new-password"
                    />
                  </div>
                  <div className="field">
                    <label htmlFor="f-conf-pass">Confirm new password</label>
                    <input
                      id="f-conf-pass"
                      type="password"
                      value={confirmPassword}
                      onChange={(e) => setConfirmPassword(e.target.value)}
                      placeholder="Re-type new password"
                      autoComplete="new-password"
                    />
                  </div>
                </div>

                {passError && <p className="msg" style={{ margin: 0 }}>{passError}</p>}
                {passSuccess && (
                  <p style={{ margin: 0, color: 'var(--ok)', fontSize: '0.82rem', fontWeight: 500 }}>
                    {passSuccess}
                  </p>
                )}

                <button
                  type="submit"
                  className="plain solid"
                  style={{ alignSelf: 'flex-start' }}
                  disabled={passLoading}
                >
                  {passLoading ? 'Updating…' : 'Update password'}
                </button>
              </form>
            )}
          </section>

          {/* Business Details */}
          <section className="group">
            <h2>Business on the invoice</h2>
            <div className="field">
              <label htmlFor="s-name">Name</label>
              <input
                id="s-name"
                value={settings.name || ''}
                onChange={(e) => handleChange('name', e.target.value)}
              />
            </div>
            <div className="field">
              <label htmlFor="s-tag">Tagline</label>
              <input
                id="s-tag"
                value={settings.tagline || ''}
                onChange={(e) => handleChange('tagline', e.target.value)}
              />
            </div>
            <div className="field">
              <label htmlFor="s-addr">Address</label>
              <textarea
                id="s-addr"
                rows="4"
                value={settings.address || ''}
                onChange={(e) => handleChange('address', e.target.value)}
              />
            </div>
            <div className="field">
              <label htmlFor="s-phones">Phones</label>
              <input
                id="s-phones"
                value={settings.phones || ''}
                onChange={(e) => handleChange('phones', e.target.value)}
              />
            </div>
            <div className="field">
              <label htmlFor="s-gstin">
                GSTIN <span className="hint">(leave empty if not registered)</span>
              </label>
              <input
                id="s-gstin"
                placeholder="15-character GSTIN"
                value={settings.gstin || ''}
                onChange={(e) => handleChange('gstin', e.target.value)}
              />
            </div>
          </section>

          {/* Numbering & Defaults */}
          <section className="group">
            <h2>Numbering &amp; defaults</h2>
            <div className="row">
              <div className="field">
                <label htmlFor="s-prefix">Invoice prefix</label>
                <input
                  id="s-prefix"
                  value={settings.prefix || ''}
                  onChange={(e) => handleChange('prefix', e.target.value)}
                />
              </div>
              <div className="field">
                <label htmlFor="s-next">Next number</label>
                <input
                  id="s-next"
                  type="number"
                  min="1"
                  step="1"
                  value={settings.next ?? 1}
                  onChange={(e) => handleChange('next', e.target.value === '' ? 1 : +e.target.value)}
                />
              </div>
            </div>
            <div className="row">
              <div className="field">
                <label htmlFor="s-room">Default room</label>
                <input
                  id="s-room"
                  value={settings.room || ''}
                  onChange={(e) => handleChange('room', e.target.value)}
                />
              </div>
              <div className="field">
                <label htmlFor="s-rate">Default rate (₹)</label>
                <input
                  id="s-rate"
                  type="number"
                  min="0"
                  step="1"
                  placeholder="Optional"
                  value={settings.rate ?? ''}
                  onChange={(e) => handleChange('rate', e.target.value === '' ? '' : +e.target.value)}
                />
              </div>
            </div>
            <div className="field">
              <label htmlFor="s-notes">Default notes on invoice</label>
              <textarea
                id="s-notes"
                rows="2"
                value={settings.notes || ''}
                onChange={(e) => handleChange('notes', e.target.value)}
              />
            </div>
          </section>

          {/* Backup & Restore */}
          <section className="group">
            <h2>Backup &amp; restore</h2>
            <p className="hint">
              Download your invoices and settings to a JSON file, or restore from a previous backup.
            </p>
            <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
              <button type="button" className="plain" onClick={handleExport}>
                Download backup
              </button>
              <button
                type="button"
                className="plain"
                onClick={() => fileInputRef.current?.click()}
              >
                Restore from file
              </button>
              <input
                type="file"
                ref={fileInputRef}
                accept="application/json"
                style={{ display: 'none' }}
                onChange={handleFileChange}
              />
            </div>
          </section>
        </div>
      </div>
    </div>
  );
}
