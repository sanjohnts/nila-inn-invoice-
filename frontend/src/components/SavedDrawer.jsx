import React, { useState, useMemo } from 'react';
import { money, totals, dateLong, iso, STATUS } from '../utils/calculations.js';

export default function SavedDrawer({
  isOpen,
  onClose,
  invoices,
  onOpenInvoice,
  onDuplicateInvoice,
  onDeleteInvoice,
}) {
  const [search, setSearch] = useState('');
  const [deleteConfirmId, setDeleteConfirmId] = useState(null);

  const monthCurrent = useMemo(() => iso(new Date()).slice(0, 7), []);

  const { mTotal, dueTotal } = useMemo(() => {
    let mTotal = 0;
    let due = 0;
    invoices.forEach((x) => {
      const t = totals(x);
      if ((x.date || '').slice(0, 7) === monthCurrent) {
        mTotal += t.grand;
      }
      due += Math.max(0, t.bal);
    });
    return { mTotal, dueTotal: due };
  }, [invoices, monthCurrent]);

  const filteredInvoices = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return invoices;
    return invoices.filter((x) => {
      const combined = [x.number, x.guest?.name, x.guest?.phone]
        .join(' ')
        .toLowerCase();
      return combined.includes(q);
    });
  }, [invoices, search]);

  if (!isOpen) return null;

  return (
    <div
      className="scrim"
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div className="drawer" role="dialog" aria-modal="true" aria-labelledby="savedTitle">
        <header>
          <h2 id="savedTitle">Saved invoices</h2>
          <button className="close" type="button" onClick={onClose} aria-label="Close">
            ✕
          </button>
        </header>

        <div className="body">
          {/* Summary stats */}
          <div className="summary">
            <div>
              <small>Invoices</small>
              <b className="num">{invoices.length}</b>
            </div>
            <div>
              <small>This month</small>
              <b className="num">{money(mTotal)}</b>
            </div>
            <div>
              <small>Balance due</small>
              <b className="num">{money(dueTotal)}</b>
            </div>
          </div>

          {/* Search box */}
          <input
            className="search"
            type="search"
            placeholder="Search guest, number or phone"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            autoFocus
          />

          {/* Invoices List */}
          <div className="saved">
            {filteredInvoices.length > 0 ? (
              filteredInvoices.map((x) => {
                const t = totals(x);
                const isConfirmingDelete = deleteConfirmId === x.id;
                return (
                  <div className="card" key={x.id}>
                    <div>
                      <div className="t">
                        {x.guest?.name || 'Guest'}
                        <span className={`badge ${t.status}`}>{STATUS[t.status]}</span>
                      </div>
                      <div className="s num">
                        {x.number} · {dateLong(x.stay?.inDate)} to {dateLong(x.stay?.outDate)}
                      </div>
                    </div>
                    <div className="amt num">{money(t.grand)}</div>
                    <div className="ops">
                      <button
                        className="plain"
                        type="button"
                        onClick={() => {
                          onOpenInvoice(x);
                          onClose();
                        }}
                      >
                        Open
                      </button>
                      <button
                        className="plain"
                        type="button"
                        onClick={() => {
                          onDuplicateInvoice(x);
                          onClose();
                        }}
                      >
                        Copy as new
                      </button>
                      <button
                        className="plain danger"
                        type="button"
                        onClick={() => {
                          if (isConfirmingDelete) {
                            onDeleteInvoice(x.id);
                            setDeleteConfirmId(null);
                          } else {
                            setDeleteConfirmId(x.id);
                          }
                        }}
                      >
                        {isConfirmingDelete ? 'Tap again to delete' : 'Delete'}
                      </button>
                    </div>
                  </div>
                );
              })
            ) : (
              <div className="empty">
                {invoices.length
                  ? 'No invoices match that search.'
                  : 'No saved invoices yet. Fill in an invoice and press Save.'}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
