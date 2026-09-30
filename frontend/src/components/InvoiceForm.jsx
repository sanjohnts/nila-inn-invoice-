import React from 'react';
import { money, totals, addDays } from '../utils/calculations.js';

export default function InvoiceForm({
  invoice,
  onChange,
  onAddItem,
  onUpdateItem,
  onRemoveItem,
  onQuickAdd,
  onMarkFullPaid,
  validationError,
  setValidationError,
}) {
  const t = totals(invoice);

  const handleFieldChange = (path, value) => {
    if (validationError) setValidationError('');
    const keys = path.split('.');
    const updated = JSON.parse(JSON.stringify(invoice));
    let cur = updated;
    for (let i = 0; i < keys.length - 1; i++) {
      cur = cur[keys[i]];
    }
    cur[keys[keys.length - 1]] = value;

    // Auto-advance check-out date if check-in >= check-out
    if (path === 'stay.inDate' && updated.stay.outDate && updated.stay.outDate <= value) {
      updated.stay.outDate = addDays(value, 1);
    }

    onChange(updated);
  };

  return (
    <form className="editor" id="form" autoComplete="off" onSubmit={(e) => e.preventDefault()}>
      {/* Invoice Details */}
      <section className="group">
        <h2>Invoice</h2>
        <div className="row">
          <div className="field">
            <label htmlFor="f-number">Invoice number</label>
            <input
              id="f-number"
              value={invoice.number || ''}
              onChange={(e) => handleFieldChange('number', e.target.value)}
            />
          </div>
          <div className="field">
            <label htmlFor="f-date">Invoice date</label>
            <input
              id="f-date"
              type="date"
              value={invoice.date || ''}
              onChange={(e) => handleFieldChange('date', e.target.value)}
            />
          </div>
        </div>
      </section>

      {/* Guest Details */}
      <section className="group">
        <h2>Guest</h2>
        <div className={`field req ${validationError && !invoice.guest.name?.trim() ? 'error' : ''}`}>
          <label htmlFor="f-gname">Guest name</label>
          <input
            id="f-gname"
            value={invoice.guest.name || ''}
            placeholder="Full name"
            onChange={(e) => handleFieldChange('guest.name', e.target.value)}
          />
        </div>
        <div className="row">
          <div className="field">
            <label htmlFor="f-gphone">Phone / WhatsApp</label>
            <input
              id="f-gphone"
              inputMode="tel"
              placeholder="10-digit mobile"
              value={invoice.guest.phone || ''}
              onChange={(e) => handleFieldChange('guest.phone', e.target.value)}
            />
          </div>
          <div className="field">
            <label htmlFor="f-gcount">Guests</label>
            <input
              id="f-gcount"
              type="number"
              min="1"
              step="1"
              value={invoice.guest.count ?? 1}
              onChange={(e) => handleFieldChange('guest.count', e.target.value === '' ? '' : +e.target.value)}
            />
          </div>
        </div>
        <div className="field">
          <label htmlFor="f-gaddr">Address</label>
          <textarea
            id="f-gaddr"
            rows="2"
            placeholder="Town, district, state"
            value={invoice.guest.address || ''}
            onChange={(e) => handleFieldChange('guest.address', e.target.value)}
          />
        </div>
      </section>

      {/* Stay Details */}
      <section className="group">
        <h2>Stay</h2>
        <div className="field">
          <label htmlFor="f-room">Room</label>
          <input
            id="f-room"
            value={invoice.stay.room || ''}
            onChange={(e) => handleFieldChange('stay.room', e.target.value)}
          />
        </div>
        <div className="row">
          <div className="field">
            <label htmlFor="f-in">Check-in</label>
            <input
              id="f-in"
              type="date"
              value={invoice.stay.inDate || ''}
              onChange={(e) => handleFieldChange('stay.inDate', e.target.value)}
            />
          </div>
          <div className="field">
            <label htmlFor="f-intime">Time <span className="hint">(optional)</span></label>
            <input
              id="f-intime"
              type="time"
              value={invoice.stay.inTime || ''}
              onChange={(e) => handleFieldChange('stay.inTime', e.target.value)}
            />
          </div>
        </div>
        <div className="row">
          <div className="field">
            <label htmlFor="f-out">Check-out</label>
            <input
              id="f-out"
              type="date"
              value={invoice.stay.outDate || ''}
              onChange={(e) => handleFieldChange('stay.outDate', e.target.value)}
            />
          </div>
          <div className="field">
            <label htmlFor="f-outtime">Time <span className="hint">(optional)</span></label>
            <input
              id="f-outtime"
              type="time"
              value={invoice.stay.outTime || ''}
              onChange={(e) => handleFieldChange('stay.outTime', e.target.value)}
            />
          </div>
        </div>
        <div className={`field req ${validationError && !(+invoice.stay.rate > 0) ? 'error' : ''}`}>
          <label htmlFor="f-rate">Rate per night (₹)</label>
          <input
            id="f-rate"
            type="number"
            min="0"
            step="1"
            inputMode="decimal"
            placeholder="e.g. 1500"
            value={invoice.stay.rate ?? ''}
            onChange={(e) => handleFieldChange('stay.rate', e.target.value === '' ? '' : +e.target.value)}
          />
        </div>
        <div className="calc">
          <span>{t.n} {t.n > 1 ? 'nights' : 'night'} × {money(invoice.stay.rate)}</span>
          <b className="num">{money(t.room)}</b>
        </div>
      </section>

      {/* Extra Charges */}
      <section className="group">
        <h2>
          Extra charges{' '}
          <button type="button" className="chip" onClick={() => onAddItem('')}>
            + Add line
          </button>
        </h2>
        {invoice.extras && invoice.extras.length > 0 && (
          <div className="item-head">
            <span>Description</span>
            <span>Qty</span>
            <span>Rate ₹</span>
            <span></span>
          </div>
        )}
        <div className="items">
          {invoice.extras && invoice.extras.map((x, i) => (
            <div className="item" key={i}>
              <input
                value={x.d || ''}
                placeholder="Description"
                aria-label="Description"
                onChange={(e) => onUpdateItem(i, 'd', e.target.value)}
              />
              <input
                type="number"
                min="0"
                step="1"
                value={x.q ?? 1}
                aria-label="Quantity"
                onChange={(e) => onUpdateItem(i, 'q', e.target.value === '' ? '' : +e.target.value)}
              />
              <input
                type="number"
                min="0"
                step="1"
                placeholder="0"
                value={x.r ?? ''}
                aria-label="Rate"
                onChange={(e) => onUpdateItem(i, 'r', e.target.value === '' ? '' : +e.target.value)}
              />
              <button
                type="button"
                className="x"
                aria-label="Remove line"
                onClick={() => onRemoveItem(i)}
              >
                ✕
              </button>
            </div>
          ))}
        </div>
        <div className="chips">
          <button type="button" className="chip" onClick={() => onQuickAdd('Extra bed')}>
            + Extra bed
          </button>
          <button type="button" className="chip" onClick={() => onQuickAdd('Laundry')}>
            + Laundry
          </button>
          <button type="button" className="chip" onClick={() => onQuickAdd('Early check-in')}>
            + Early check-in
          </button>
          <button type="button" className="chip" onClick={() => onQuickAdd('Late check-out')}>
            + Late check-out
          </button>
        </div>
        <div className="field">
          <label htmlFor="f-disc">Discount (₹)</label>
          <input
            id="f-disc"
            type="number"
            min="0"
            step="1"
            inputMode="decimal"
            placeholder="0"
            value={invoice.discount ?? ''}
            onChange={(e) => handleFieldChange('discount', e.target.value === '' ? '' : +e.target.value)}
          />
        </div>
      </section>

      {/* GST */}
      <section className="group">
        <h2>GST</h2>
        <label className="switch">
          <input
            type="checkbox"
            id="f-gst"
            checked={!!invoice.gst?.on}
            onChange={(e) => handleFieldChange('gst.on', e.target.checked)}
          />
          Add GST to this invoice
        </label>
        {invoice.gst?.on && (
          <div id="gstBox">
            <div className="row">
              <div className="field">
                <label htmlFor="f-gstmode">GST rate</label>
                <select
                  id="f-gstmode"
                  value={invoice.gst?.mode || 'auto'}
                  onChange={(e) => handleFieldChange('gst.mode', e.target.value)}
                >
                  <option value="auto">Auto from room rate</option>
                  <option value="0">0% (exempt)</option>
                  <option value="5">5%</option>
                  <option value="18">18%</option>
                </select>
              </div>
              <div className="field">
                <label>Applied</label>
                <input
                  id="c-gstrate"
                  disabled
                  value={`${t.rate}%${invoice.gst?.mode === 'auto' ? ' (auto)' : ''}`}
                />
              </div>
            </div>
          </div>
        )}
        <p className="note" id="gstNote">
          Charge GST only if Nila Inn is GST-registered. Rooms under ₹1,000 a night are exempt; up to ₹7,500 a night it is 5% (from 22 Sep 2025). Add your GSTIN in Settings so it prints on the invoice.
        </p>
      </section>

      {/* Payment */}
      <section className="group">
        <h2>Payment</h2>
        <div className="row">
          <div className="field">
            <label htmlFor="f-adv">Amount paid (₹)</label>
            <input
              id="f-adv"
              type="number"
              min="0"
              step="1"
              inputMode="decimal"
              placeholder="0"
              value={invoice.pay?.advance ?? ''}
              onChange={(e) => handleFieldChange('pay.advance', e.target.value === '' ? '' : +e.target.value)}
            />
          </div>
          <div className="field">
            <label htmlFor="f-mode">Paid by</label>
            <select
              id="f-mode"
              value={invoice.pay?.mode || 'Cash'}
              onChange={(e) => handleFieldChange('pay.mode', e.target.value)}
            >
              <option>Cash</option>
              <option>UPI</option>
              <option>Card</option>
              <option>Bank transfer</option>
            </select>
          </div>
        </div>
        <button
          type="button"
          className="chip"
          style={{ alignSelf: 'flex-start' }}
          onClick={onMarkFullPaid}
        >
          Mark fully paid
        </button>
        <div className="calc">
          <span>Balance due</span>
          <b className="num">{money(Math.max(0, t.bal))}</b>
        </div>
      </section>

      {/* Notes */}
      <section className="group">
        <h2>Notes on invoice</h2>
        <div className="field">
          <textarea
            id="f-notes"
            rows="3"
            aria-label="Notes on invoice"
            value={invoice.notes || ''}
            onChange={(e) => handleFieldChange('notes', e.target.value)}
          />
        </div>
      </section>

      {validationError && (
        <p className="msg" role="status">
          {validationError}
        </p>
      )}
    </form>
  );
}
