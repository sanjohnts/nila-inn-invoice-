import React from 'react';

export default function Header({
  savedCount,
  onNew,
  onOpenSaved,
  onOpenSettings,
  onWhatsApp,
  onSave,
  onPrint,
  activeView,
  setActiveView,
}) {
  return (
    <div className="topwrap">
      <header className="bar">
        <div className="brand">
          <img src="/images/emblem.jpg" alt="Nila Inn Logo" />
          <b>Nila Inn</b>
          <span>Invoices</span>
        </div>
        <div className="actions">
          <button className="btn" onClick={onNew} type="button" aria-label="New invoice">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
              <path d="M12 5v14M5 12h14" />
            </svg>
            <span className="lbl">New</span>
          </button>
          <button className="btn" onClick={onOpenSaved} type="button" aria-label="Saved invoices">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M4 6h16M4 12h16M4 18h10" />
            </svg>
            <span className="lbl">Saved</span> <span className="count">{savedCount}</span>
          </button>
          <button className="btn" onClick={onOpenSettings} type="button" aria-label="Settings">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <circle cx="12" cy="12" r="3" />
              <path d="M19.4 15a1.7 1.7 0 00.3 1.8l.1.1a2 2 0 11-2.8 2.8l-.1-.1a1.7 1.7 0 00-1.8-.3 1.7 1.7 0 00-1 1.5V21a2 2 0 11-4 0v-.1a1.7 1.7 0 00-1.1-1.5 1.7 1.7 0 00-1.8.3l-.1.1a2 2 0 11-2.8-2.8l.1-.1a1.7 1.7 0 00.3-1.8 1.7 1.7 0 00-1.5-1H3a2 2 0 110-4h.1a1.7 1.7 0 001.5-1.1 1.7 1.7 0 00-.3-1.8l-.1-.1a2 2 0 112.8-2.8l.1.1a1.7 1.7 0 001.8.3H9a1.7 1.7 0 001-1.5V3a2 2 0 114 0v.1a1.7 1.7 0 001 1.5 1.7 1.7 0 001.8-.3l.1-.1a2 2 0 112.8 2.8l-.1.1a1.7 1.7 0 00-.3 1.8V9a1.7 1.7 0 001.5 1H21a2 2 0 110 4h-.1a1.7 1.7 0 00-1.5 1z" />
            </svg>
            <span className="lbl">Settings</span>
          </button>
          <button className="btn" onClick={onWhatsApp} type="button" aria-label="Send on WhatsApp">
            <svg viewBox="0 0 24 24" fill="currentColor">
              <path d="M12 2a10 10 0 00-8.6 15.1L2 22l5-1.3A10 10 0 1012 2zm0 18.2a8.2 8.2 0 01-4.2-1.2l-.3-.2-3 .8.8-2.9-.2-.3A8.2 8.2 0 1112 20.2zm4.5-6.1c-.2-.1-1.5-.7-1.7-.8s-.4-.1-.6.1-.6.8-.8 1-.3.2-.5.1a6.7 6.7 0 01-3.3-2.9c-.2-.4.2-.4.7-1.3a.4.4 0 000-.4l-.8-1.8c-.2-.5-.4-.4-.6-.4h-.5a1 1 0 00-.7.3 3 3 0 00-.9 2.2 5.2 5.2 0 001.1 2.8 11.9 11.9 0 004.6 4c1.7.7 2.4.8 3.2.7a2.8 2.8 0 001.8-1.3 2.3 2.3 0 00.2-1.3c-.1-.1-.3-.2-.5-.3z" />
            </svg>
            <span className="lbl">WhatsApp</span>
          </button>
          <button className="btn keep" onClick={onSave} type="button">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M5 12l5 5L20 7" />
            </svg>
            <span className="lbl">Save</span>
          </button>
          <button className="btn gold keep" onClick={onPrint} type="button">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M6 9V3h12v6M6 18H4a1 1 0 01-1-1v-6a2 2 0 012-2h14a2 2 0 012 2v6a1 1 0 01-1 1h-2M6 14h12v7H6z" />
            </svg>
            <span className="lbl">Print / PDF</span>
            <span className="lbl-m">Print</span>
          </button>
        </div>
      </header>

      <div className="tabs" role="tablist">
        <button
          type="button"
          role="tab"
          className={activeView === 'edit' ? 'active' : ''}
          aria-selected={activeView === 'edit'}
          onClick={() => setActiveView('edit')}
        >
          Edit
        </button>
        <button
          type="button"
          role="tab"
          className={activeView === 'preview' ? 'active' : ''}
          aria-selected={activeView === 'preview'}
          onClick={() => setActiveView('preview')}
        >
          Preview
        </button>
      </div>
    </div>
  );
}
